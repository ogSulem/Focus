import { Injectable, NotFoundException } from '@nestjs/common';
import { TaskPriority, TaskStatus, UserEventType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { EventsService } from '../events/events.service';

export interface TaskStats {
  total: number;
  todo: number;
  inProgress: number;
  done: number;
  highPriority: number;
  mediumPriority: number;
  lowPriority: number;
  overdueCount: number;
  completionRate: number;
}

export type SortBy = 'createdAt' | 'deadline' | 'priority' | 'title';
export type Order = 'asc' | 'desc';

export interface TaskFilter {
  status?: TaskStatus;
  priority?: TaskPriority;
  search?: string;
  sortBy?: SortBy;
  order?: Order;
  tags?: string[];
}

export interface BulkUpdateDto {
  ids: string[];
  status?: TaskStatus;
  delete?: boolean;
}

@Injectable()
export class TasksService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  findAll(userId: string, filter: TaskFilter = {}) {
    const where: Record<string, unknown> = { userId };

    if (filter.status) {
      where['status'] = filter.status;
    }
    if (filter.priority) {
      where['priority'] = filter.priority;
    }
    if (filter.search) {
      where['OR'] = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
      ];
    }
    if (filter.tags && filter.tags.length > 0) {
      where['tags'] = { hasSome: filter.tags };
    }

    const PRIORITY_SORT_MAP: Record<string, string> = {
      HIGH: 'asc',
      MEDIUM: 'asc',
      LOW: 'asc',
    };
    void PRIORITY_SORT_MAP; // suppress unused
    const dir = filter.order ?? 'desc';
    // Build orderBy as a plain object array to avoid generic parameter issues

    let orderBy: any[];
    switch (filter.sortBy) {
      case 'deadline':
        orderBy = [
          { deadline: { sort: dir, nulls: 'last' } },
          { createdAt: 'desc' },
        ];
        break;
      case 'priority':
        orderBy = [
          { priority: dir === 'asc' ? 'desc' : 'asc' },
          { createdAt: 'desc' },
        ];
        break;
      case 'title':
        orderBy = [{ title: dir }, { createdAt: 'desc' }];
        break;
      case 'createdAt':
      default:
        orderBy = [{ createdAt: dir }];
        break;
    }

    return this.prisma.task.findMany({ where, orderBy });
  }

  async getUniqueTags(userId: string): Promise<string[]> {
    const tasks = await this.prisma.task.findMany({
      where: { userId },
      select: { tags: true },
    });
    const tagSet = new Set<string>();
    tasks.forEach((t) => t.tags.forEach((tag) => tagSet.add(tag)));
    return [...tagSet].sort();
  }

  async getStats(userId: string): Promise<TaskStats> {
    const tasks = await this.prisma.task.findMany({
      where: { userId },
      select: { status: true, priority: true, deadline: true },
    });

    const now = new Date();
    const total = tasks.length;
    const todo = tasks.filter((t) => t.status === 'TODO').length;
    const inProgress = tasks.filter((t) => t.status === 'IN_PROGRESS').length;
    const done = tasks.filter((t) => t.status === 'DONE').length;
    const highPriority = tasks.filter((t) => t.priority === 'HIGH').length;
    const mediumPriority = tasks.filter((t) => t.priority === 'MEDIUM').length;
    const lowPriority = tasks.filter((t) => t.priority === 'LOW').length;
    const overdueCount = tasks.filter(
      (t) => t.deadline && t.deadline < now && t.status !== 'DONE',
    ).length;
    const completionRate = total > 0 ? Math.round((done / total) * 100) : 0;

    return {
      total,
      todo,
      inProgress,
      done,
      highPriority,
      mediumPriority,
      lowPriority,
      overdueCount,
      completionRate,
    };
  }

  async findOne(userId: string, taskId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, userId },
    });
    if (!task) {
      throw new NotFoundException('Task not found');
    }
    return task;
  }

  async create(userId: string, dto: CreateTaskDto) {
    const task = await this.prisma.task.create({
      data: {
        userId,
        title: dto.title,
        description: dto.description,
        priority: dto.priority,
        status: dto.status,
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
        completedAt: dto.status === TaskStatus.DONE ? new Date() : undefined,
        tags: dto.tags ?? [],
        subtasks: (dto.subtasks ??
          []) as unknown as import('@prisma/client').Prisma.InputJsonValue,
      },
    });

    await this.eventsService.track(userId, UserEventType.TASK_CREATED, {
      entityId: task.id,
      payload: {
        priority: task.priority,
        status: task.status,
        hasDeadline: Boolean(task.deadline),
      },
    });

    if (task.status === TaskStatus.DONE) {
      await this.eventsService.track(userId, UserEventType.TASK_COMPLETED, {
        entityId: task.id,
        payload: {
          source: 'create',
        },
      });
    }

    return task;
  }

  async update(userId: string, taskId: string, dto: UpdateTaskDto) {
    const existing = await this.prisma.task.findFirst({
      where: { id: taskId, userId },
    });
    if (!existing) {
      throw new NotFoundException('Task not found');
    }

    const nextStatus = dto.status ?? existing.status;

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...dto,
        deadline: dto.deadline ? new Date(dto.deadline) : dto.deadline,
        completedAt:
          nextStatus === TaskStatus.DONE
            ? (existing.completedAt ?? new Date())
            : dto.status && dto.status !== TaskStatus.DONE
              ? null
              : existing.completedAt,
        tags: dto.tags !== undefined ? dto.tags : undefined,
        subtasks:
          dto.subtasks !== undefined
            ? (dto.subtasks as unknown as import('@prisma/client').Prisma.InputJsonValue)
            : undefined,
      },
    });

    const statusChanged = existing.status !== updatedTask.status;
    await this.eventsService.track(userId, UserEventType.TASK_UPDATED, {
      entityId: updatedTask.id,
      payload: {
        fromStatus: existing.status,
        toStatus: updatedTask.status,
        priority: updatedTask.priority,
      },
    });

    if (statusChanged) {
      await this.eventsService.track(
        userId,
        UserEventType.TASK_STATUS_CHANGED,
        {
          entityId: updatedTask.id,
          payload: {
            fromStatus: existing.status,
            toStatus: updatedTask.status,
          },
        },
      );
    }

    if (
      existing.status !== TaskStatus.DONE &&
      updatedTask.status === TaskStatus.DONE
    ) {
      await this.eventsService.track(userId, UserEventType.TASK_COMPLETED, {
        entityId: updatedTask.id,
        payload: {
          source: 'update',
        },
      });
    }

    return updatedTask;
  }

  async remove(userId: string, taskId: string) {
    const existing = await this.prisma.task.findFirst({
      where: { id: taskId, userId },
    });
    if (!existing) {
      throw new NotFoundException('Task not found');
    }

    await this.prisma.task.delete({ where: { id: taskId } });
    await this.eventsService.track(userId, UserEventType.TASK_DELETED, {
      entityId: taskId,
      payload: {
        previousStatus: existing.status,
      },
    });
    return { success: true };
  }

  async duplicate(userId: string, taskId: string) {
    const existing = await this.prisma.task.findFirst({
      where: { id: taskId, userId },
    });
    if (!existing) {
      throw new NotFoundException('Task not found');
    }

    const duplicated = await this.prisma.task.create({
      data: {
        userId,
        title: `${existing.title} (копия)`,
        description: existing.description,
        priority: existing.priority,
        status: 'TODO',
        deadline: existing.deadline,
        tags: existing.tags,
        subtasks: [],
      },
    });

    await this.eventsService.track(userId, UserEventType.TASK_CREATED, {
      entityId: duplicated.id,
      payload: {
        source: 'duplicate',
        fromTaskId: existing.id,
      },
    });

    return duplicated;
  }

  async findUpcoming(userId: string, days = 7) {
    const now = new Date();
    const future = new Date(now.getTime() + days * 86_400_000);

    const tasks = await this.prisma.task.findMany({
      where: {
        userId,
        status: { not: TaskStatus.DONE },
        deadline: { lte: future },
      },
      orderBy: { deadline: 'asc' },
    });

    return tasks.map((t) => {
      const deadlineMs = t.deadline ? t.deadline.getTime() : null;
      const daysLeft =
        deadlineMs !== null
          ? Math.ceil((deadlineMs - now.getTime()) / 86_400_000)
          : null;
      return { ...t, daysLeft };
    });
  }

  async bulkUpdate(userId: string, dto: BulkUpdateDto) {
    // Verify all tasks belong to this user
    const tasks = await this.prisma.task.findMany({
      where: { id: { in: dto.ids }, userId },
      select: { id: true },
    });
    const ownedIds = tasks.map((t) => t.id);

    if (dto.delete) {
      await this.prisma.task.deleteMany({
        where: { id: { in: ownedIds } },
      });
      await Promise.all(
        ownedIds.map((id) =>
          this.eventsService.track(userId, UserEventType.TASK_DELETED, {
            entityId: id,
            payload: { source: 'bulk' },
          }),
        ),
      );
      return { affected: ownedIds.length, action: 'deleted' };
    }

    if (dto.status) {
      const now = new Date();
      await this.prisma.task.updateMany({
        where: { id: { in: ownedIds } },
        data: {
          status: dto.status,
          completedAt: dto.status === TaskStatus.DONE ? now : null,
        },
      });
      if (dto.status === TaskStatus.DONE) {
        await Promise.all(
          ownedIds.map((id) =>
            this.eventsService.track(userId, UserEventType.TASK_COMPLETED, {
              entityId: id,
              payload: { source: 'bulk' },
            }),
          ),
        );
      }
      await Promise.all(
        ownedIds.map((id) =>
          this.eventsService.track(userId, UserEventType.TASK_STATUS_CHANGED, {
            entityId: id,
            payload: { source: 'bulk', toStatus: dto.status },
          }),
        ),
      );
      return {
        affected: ownedIds.length,
        action: 'status_updated',
        status: dto.status,
      };
    }

    return { affected: 0, action: 'noop' };
  }
}
