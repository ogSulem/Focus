"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksService = void 0;
const common_1 = require("@nestjs/common");
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const events_service_1 = require("../events/events.service");
let TasksService = class TasksService {
    prisma;
    eventsService;
    constructor(prisma, eventsService) {
        this.prisma = prisma;
        this.eventsService = eventsService;
    }
    findAll(userId, filter = {}) {
        const where = { userId };
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
        const PRIORITY_SORT_MAP = {
            HIGH: 'asc',
            MEDIUM: 'asc',
            LOW: 'asc',
        };
        void PRIORITY_SORT_MAP;
        const dir = filter.order ?? 'desc';
        let orderBy;
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
    async getUniqueTags(userId) {
        const tasks = await this.prisma.task.findMany({
            where: { userId },
            select: { tags: true },
        });
        const tagSet = new Set();
        tasks.forEach((t) => t.tags.forEach((tag) => tagSet.add(tag)));
        return [...tagSet].sort();
    }
    async getStats(userId) {
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
        const overdueCount = tasks.filter((t) => t.deadline && t.deadline < now && t.status !== 'DONE').length;
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
    async findOne(userId, taskId) {
        const task = await this.prisma.task.findFirst({
            where: { id: taskId, userId },
        });
        if (!task) {
            throw new common_1.NotFoundException('Task not found');
        }
        return task;
    }
    async create(userId, dto) {
        const task = await this.prisma.task.create({
            data: {
                userId,
                title: dto.title,
                description: dto.description,
                priority: dto.priority,
                status: dto.status,
                deadline: dto.deadline ? new Date(dto.deadline) : undefined,
                completedAt: dto.status === client_1.TaskStatus.DONE ? new Date() : undefined,
                tags: dto.tags ?? [],
                subtasks: (dto.subtasks ??
                    []),
            },
        });
        await this.eventsService.track(userId, client_1.UserEventType.TASK_CREATED, {
            entityId: task.id,
            payload: {
                priority: task.priority,
                status: task.status,
                hasDeadline: Boolean(task.deadline),
            },
        });
        if (task.status === client_1.TaskStatus.DONE) {
            await this.eventsService.track(userId, client_1.UserEventType.TASK_COMPLETED, {
                entityId: task.id,
                payload: {
                    source: 'create',
                },
            });
        }
        return task;
    }
    async update(userId, taskId, dto) {
        const existing = await this.prisma.task.findFirst({
            where: { id: taskId, userId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Task not found');
        }
        const nextStatus = dto.status ?? existing.status;
        const updatedTask = await this.prisma.task.update({
            where: { id: taskId },
            data: {
                ...dto,
                deadline: dto.deadline ? new Date(dto.deadline) : dto.deadline,
                completedAt: nextStatus === client_1.TaskStatus.DONE
                    ? (existing.completedAt ?? new Date())
                    : dto.status && dto.status !== client_1.TaskStatus.DONE
                        ? null
                        : existing.completedAt,
                tags: dto.tags !== undefined ? dto.tags : undefined,
                subtasks: dto.subtasks !== undefined
                    ? dto.subtasks
                    : undefined,
            },
        });
        const statusChanged = existing.status !== updatedTask.status;
        await this.eventsService.track(userId, client_1.UserEventType.TASK_UPDATED, {
            entityId: updatedTask.id,
            payload: {
                fromStatus: existing.status,
                toStatus: updatedTask.status,
                priority: updatedTask.priority,
            },
        });
        if (statusChanged) {
            await this.eventsService.track(userId, client_1.UserEventType.TASK_STATUS_CHANGED, {
                entityId: updatedTask.id,
                payload: {
                    fromStatus: existing.status,
                    toStatus: updatedTask.status,
                },
            });
        }
        if (existing.status !== client_1.TaskStatus.DONE &&
            updatedTask.status === client_1.TaskStatus.DONE) {
            await this.eventsService.track(userId, client_1.UserEventType.TASK_COMPLETED, {
                entityId: updatedTask.id,
                payload: {
                    source: 'update',
                },
            });
        }
        return updatedTask;
    }
    async remove(userId, taskId) {
        const existing = await this.prisma.task.findFirst({
            where: { id: taskId, userId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Task not found');
        }
        await this.prisma.task.delete({ where: { id: taskId } });
        await this.eventsService.track(userId, client_1.UserEventType.TASK_DELETED, {
            entityId: taskId,
            payload: {
                previousStatus: existing.status,
            },
        });
        return { success: true };
    }
    async duplicate(userId, taskId) {
        const existing = await this.prisma.task.findFirst({
            where: { id: taskId, userId },
        });
        if (!existing) {
            throw new common_1.NotFoundException('Task not found');
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
        await this.eventsService.track(userId, client_1.UserEventType.TASK_CREATED, {
            entityId: duplicated.id,
            payload: {
                source: 'duplicate',
                fromTaskId: existing.id,
            },
        });
        return duplicated;
    }
    async findUpcoming(userId, days = 7) {
        const now = new Date();
        const future = new Date(now.getTime() + days * 86_400_000);
        const tasks = await this.prisma.task.findMany({
            where: {
                userId,
                status: { not: client_1.TaskStatus.DONE },
                deadline: { lte: future },
            },
            orderBy: { deadline: 'asc' },
        });
        return tasks.map((t) => {
            const deadlineMs = t.deadline ? t.deadline.getTime() : null;
            const daysLeft = deadlineMs !== null
                ? Math.ceil((deadlineMs - now.getTime()) / 86_400_000)
                : null;
            return { ...t, daysLeft };
        });
    }
    async bulkUpdate(userId, dto) {
        const tasks = await this.prisma.task.findMany({
            where: { id: { in: dto.ids }, userId },
            select: { id: true },
        });
        const ownedIds = tasks.map((t) => t.id);
        if (dto.delete) {
            await this.prisma.task.deleteMany({
                where: { id: { in: ownedIds } },
            });
            await Promise.all(ownedIds.map((id) => this.eventsService.track(userId, client_1.UserEventType.TASK_DELETED, {
                entityId: id,
                payload: { source: 'bulk' },
            })));
            return { affected: ownedIds.length, action: 'deleted' };
        }
        if (dto.status) {
            const now = new Date();
            await this.prisma.task.updateMany({
                where: { id: { in: ownedIds } },
                data: {
                    status: dto.status,
                    completedAt: dto.status === client_1.TaskStatus.DONE ? now : null,
                },
            });
            if (dto.status === client_1.TaskStatus.DONE) {
                await Promise.all(ownedIds.map((id) => this.eventsService.track(userId, client_1.UserEventType.TASK_COMPLETED, {
                    entityId: id,
                    payload: { source: 'bulk' },
                })));
            }
            await Promise.all(ownedIds.map((id) => this.eventsService.track(userId, client_1.UserEventType.TASK_STATUS_CHANGED, {
                entityId: id,
                payload: { source: 'bulk', toStatus: dto.status },
            })));
            return {
                affected: ownedIds.length,
                action: 'status_updated',
                status: dto.status,
            };
        }
        return { affected: 0, action: 'noop' };
    }
};
exports.TasksService = TasksService;
exports.TasksService = TasksService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        events_service_1.EventsService])
], TasksService);
//# sourceMappingURL=tasks.service.js.map