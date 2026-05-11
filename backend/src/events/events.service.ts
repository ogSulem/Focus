import { Injectable } from '@nestjs/common';
import { Prisma, TaskStatus, UserEventType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

export interface EventTimelineItem {
  id: string;
  type: UserEventType;
  entityId: string | null;
  score: number | null;
  payload: unknown;
  createdAt: string;
}

export interface ExperimentMetrics {
  completedTasks: number;
  completionRate: number;
  overdueOpenTasks: number;
  habitCompletions: number;
  focusMinutes: number;
}

export interface ExperimentReport {
  before: ExperimentMetrics;
  after: ExperimentMetrics;
  delta: {
    completedTasks: number;
    completionRate: number;
    overdueOpenTasks: number;
    habitCompletions: number;
    focusMinutes: number;
  };
}

@Injectable()
export class EventsService {
  constructor(private readonly prisma: PrismaService) {}

  async track(
    userId: string,
    type: UserEventType,
    params: {
      entityId?: string;
      score?: number;
      payload?: Record<string, unknown>;
    } = {},
  ): Promise<void> {
    await this.prisma.userEvent.create({
      data: {
        userId,
        type,
        entityId: params.entityId,
        score: params.score,
        payload: (params.payload ?? {}) as Prisma.InputJsonValue,
      },
    });
  }

  async timeline(userId: string, limit = 40): Promise<EventTimelineItem[]> {
    const events = await this.prisma.userEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: Math.min(Math.max(limit, 1), 200),
    });

    return events.map((event) => ({
      id: event.id,
      type: event.type,
      entityId: event.entityId,
      score: event.score,
      payload: event.payload,
      createdAt: event.createdAt.toISOString(),
    }));
  }

  async getExperimentReport(userId: string): Promise<ExperimentReport> {
    const now = new Date();
    const split = new Date(now);
    split.setDate(now.getDate() - 7);
    split.setHours(0, 0, 0, 0);

    const beforeStart = new Date(split);
    beforeStart.setDate(split.getDate() - 7);

    const [before, after] = await Promise.all([
      this.collectMetrics(userId, beforeStart, split),
      this.collectMetrics(userId, split, now),
    ]);

    return {
      before,
      after,
      delta: {
        completedTasks: after.completedTasks - before.completedTasks,
        completionRate: round1(after.completionRate - before.completionRate),
        overdueOpenTasks: after.overdueOpenTasks - before.overdueOpenTasks,
        habitCompletions: after.habitCompletions - before.habitCompletions,
        focusMinutes: after.focusMinutes - before.focusMinutes,
      },
    };
  }

  private async collectMetrics(
    userId: string,
    start: Date,
    end: Date,
  ): Promise<ExperimentMetrics> {
    const [completedTasks, createdTasks, overdueOpenTasks, habits, sessions] =
      await Promise.all([
        this.prisma.task.count({
          where: {
            userId,
            status: TaskStatus.DONE,
            completedAt: { gte: start, lt: end },
          },
        }),
        this.prisma.task.count({
          where: {
            userId,
            createdAt: { gte: start, lt: end },
          },
        }),
        this.prisma.task.count({
          where: {
            userId,
            status: { not: TaskStatus.DONE },
            createdAt: { lt: end },
            deadline: { lt: end },
          },
        }),
        this.prisma.habit.findMany({
          where: { userId },
          select: { completedDays: true },
        }),
        this.prisma.focusSession.findMany({
          where: {
            userId,
            completedAt: { gte: start, lt: end },
            phase: 'focus',
          },
          select: { durationMin: true },
        }),
      ]);

    const startStr = start.toISOString().slice(0, 10);
    const endStr = end.toISOString().slice(0, 10);

    const habitCompletions = habits.reduce((acc, habit) => {
      const days = Array.isArray(habit.completedDays)
        ? (habit.completedDays as unknown[]).filter(
            (day): day is string => typeof day === 'string',
          )
        : [];
      return acc + days.filter((day) => day >= startStr && day < endStr).length;
    }, 0);

    const focusMinutes = sessions.reduce(
      (acc, session) => acc + session.durationMin,
      0,
    );
    const completionRate =
      createdTasks > 0 ? round1((completedTasks / createdTasks) * 100) : 0;

    return {
      completedTasks,
      completionRate,
      overdueOpenTasks,
      habitCompletions,
      focusMinutes,
    };
  }
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}
