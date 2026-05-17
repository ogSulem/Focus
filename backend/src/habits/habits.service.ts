import { Injectable, NotFoundException } from '@nestjs/common';
import { Habit, UserEventType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateHabitDto } from './dto/create-habit.dto';
import { TrackHabitDto } from './dto/track-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { EventsService } from '../events/events.service';

@Injectable()
export class HabitsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  findAll(userId: string) {
    return this.prisma.habit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async create(userId: string, dto: CreateHabitDto) {
    const habit = await this.prisma.habit.create({
      data: {
        userId,
        name: dto.name,
      },
    });

    await this.eventsService.track(userId, UserEventType.HABIT_CREATED, {
      entityId: habit.id,
      payload: { name: habit.name },
    });

    return habit;
  }

  async update(userId: string, habitId: string, dto: UpdateHabitDto) {
    await this.ensureOwnership(userId, habitId);

    return this.prisma.habit.update({
      where: { id: habitId },
      data: dto,
    });
  }

  async track(userId: string, habitId: string, dto: TrackHabitDto) {
    const habit = await this.ensureOwnership(userId, habitId);

    const normalizedDate = dto.date.slice(0, 10);
    const completedDays = this.extractDays(habit).includes(normalizedDate)
      ? this.extractDays(habit)
      : [...this.extractDays(habit), normalizedDate].sort();

    const streak = this.calculateStreak(completedDays);

    const updated = await this.prisma.habit.update({
      where: { id: habitId },
      data: {
        completedDays,
        streak,
      },
    });

    await this.eventsService.track(userId, UserEventType.HABIT_TRACKED, {
      entityId: updated.id,
      score: updated.streak,
      payload: {
        date: normalizedDate,
        streak: updated.streak,
      },
    });

    return updated;
  }

  async untrack(userId: string, habitId: string, dto: TrackHabitDto) {
    const habit = await this.ensureOwnership(userId, habitId);

    const normalizedDate = dto.date.slice(0, 10);
    const completedDays = this.extractDays(habit).filter(
      (d) => d !== normalizedDate,
    );
    const streak = this.calculateStreak(completedDays);

    const updated = await this.prisma.habit.update({
      where: { id: habitId },
      data: { completedDays, streak },
    });

    await this.eventsService.track(userId, UserEventType.HABIT_UNTRACKED, {
      entityId: updated.id,
      score: updated.streak,
      payload: {
        date: normalizedDate,
        streak: updated.streak,
      },
    });

    return updated;
  }

  async getStats(userId: string): Promise<HabitStats[]> {
    const habits = await this.prisma.habit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });

    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);

    return habits.map((h) => {
      const days = this.extractDays(h);
      const totalDays = days.length;

      // Longest ever streak
      let longestStreak = 0;
      let current = 0;
      const sortedDays = [...days].sort();
      for (let i = 0; i < sortedDays.length; i++) {
        if (i === 0) {
          current = 1;
        } else {
          const prev = new Date(sortedDays[i - 1]);
          const curr = new Date(sortedDays[i]);
          const diff = (curr.getTime() - prev.getTime()) / 86_400_000;
          current = diff === 1 ? current + 1 : 1;
        }
        longestStreak = Math.max(longestStreak, current);
      }

      // Completion rate last 30 days
      const thirtyDaysAgo = new Date(today);
      thirtyDaysAgo.setDate(today.getDate() - 29);
      const last30Dates = new Set(
        Array.from({ length: 30 }, (_, i) => {
          const d = new Date(thirtyDaysAgo);
          d.setDate(thirtyDaysAgo.getDate() + i);
          return d.toISOString().slice(0, 10);
        }),
      );
      const completedLast30 = days.filter((d) => last30Dates.has(d)).length;
      const completionRate30d = Math.round((completedLast30 / 30) * 100);

      // Completion rate last 7 days
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(today.getDate() - 6);
      const last7Dates = new Set(
        Array.from({ length: 7 }, (_, i) => {
          const d = new Date(sevenDaysAgo);
          d.setDate(sevenDaysAgo.getDate() + i);
          return d.toISOString().slice(0, 10);
        }),
      );
      const completedLast7 = days.filter((d) => last7Dates.has(d)).length;

      return {
        id: h.id,
        name: h.name,
        streak: h.streak,
        longestStreak,
        totalDays,
        completionRate30d,
        completedLast7,
        completedToday: days.includes(todayStr),
      };
    });
  }

  async remove(userId: string, habitId: string) {
    await this.ensureOwnership(userId, habitId);
    await this.prisma.habit.delete({ where: { id: habitId } });
    await this.eventsService.track(userId, UserEventType.HABIT_DELETED, {
      entityId: habitId,
    });
    return { success: true };
  }

  private async ensureOwnership(
    userId: string,
    habitId: string,
  ): Promise<Habit> {
    const habit = await this.prisma.habit.findFirst({
      where: { id: habitId, userId },
    });
    if (!habit) {
      throw new NotFoundException('Habit not found');
    }

    return habit;
  }

  private extractDays(habit: Habit): string[] {
    if (!Array.isArray(habit.completedDays)) {
      return [];
    }

    return habit.completedDays.filter(
      (day): day is string => typeof day === 'string',
    );
  }

  private calculateStreak(days: string[]): number {
    if (days.length === 0) {
      return 0;
    }

    const sorted = [...days].sort();
    const lastDay = sorted[sorted.length - 1];

    // Streak is only active if last completed day is today or yesterday
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    const todayStr = today.toISOString().slice(0, 10);
    const yesterdayStr = yesterday.toISOString().slice(0, 10);

    if (lastDay !== todayStr && lastDay !== yesterdayStr) {
      return 0;
    }

    let streak = 1;
    for (let index = sorted.length - 1; index > 0; index -= 1) {
      const current = new Date(sorted[index]);
      const previous = new Date(sorted[index - 1]);
      const diff = (current.getTime() - previous.getTime()) / 86_400_000;
      if (diff === 1) {
        streak += 1;
      } else {
        break;
      }
    }

    return streak;
  }
}

export interface HabitStats {
  id: string;
  name: string;
  streak: number;
  longestStreak: number;
  totalDays: number;
  completionRate30d: number;
  completedLast7: number;
  completedToday: boolean;
}
