import { Injectable } from '@nestjs/common';
import { UserEventType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateFocusSessionDto } from './dto/create-focus-session.dto';
import { EventsService } from '../events/events.service';

@Injectable()
export class FocusSessionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventsService: EventsService,
  ) {}

  findAll(userId: string, limit = 50) {
    return this.prisma.focusSession.findMany({
      where: { userId },
      orderBy: { completedAt: 'desc' },
      take: limit,
    });
  }

  async create(userId: string, dto: CreateFocusSessionDto) {
    const session = await this.prisma.focusSession.create({
      data: {
        userId,
        phase: dto.phase ?? 'focus',
        taskTitle: dto.taskTitle,
        durationMin: dto.durationMin ?? 25,
      },
    });

    if (session.phase === 'focus') {
      await this.eventsService.track(userId, UserEventType.FOCUS_SESSION_COMPLETED, {
        entityId: session.id,
        score: session.durationMin,
        payload: {
          durationMin: session.durationMin,
          taskTitle: session.taskTitle,
        },
      });
    }

    return session;
  }

  async getStats(userId: string) {
    const sessions = await this.prisma.focusSession.findMany({
      where: { userId, phase: 'focus' },
      select: { durationMin: true, completedAt: true },
    });
    const totalSessions = sessions.length;
    const totalMinutes = sessions.reduce((acc, s) => acc + s.durationMin, 0);
    const todayStr = new Date().toISOString().slice(0, 10);
    const todaySessions = sessions.filter(
      (s) => s.completedAt.toISOString().slice(0, 10) === todayStr,
    );
    return {
      totalSessions,
      totalMinutes,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      todaySessions: todaySessions.length,
      todayMinutes: todaySessions.reduce((acc, s) => acc + s.durationMin, 0),
    };
  }
}
