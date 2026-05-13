import { PrismaService } from '../prisma/prisma.service';
import { CreateHabitDto } from './dto/create-habit.dto';
import { TrackHabitDto } from './dto/track-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { EventsService } from '../events/events.service';
export declare class HabitsService {
    private readonly prisma;
    private readonly eventsService;
    constructor(prisma: PrismaService, eventsService: EventsService);
    findAll(userId: string): import("@prisma/client").Prisma.PrismaPromise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        streak: number;
        completedDays: import("@prisma/client/runtime/library").JsonValue;
    }[]>;
    create(userId: string, dto: CreateHabitDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        streak: number;
        completedDays: import("@prisma/client/runtime/library").JsonValue;
    }>;
    update(userId: string, habitId: string, dto: UpdateHabitDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        streak: number;
        completedDays: import("@prisma/client/runtime/library").JsonValue;
    }>;
    track(userId: string, habitId: string, dto: TrackHabitDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        streak: number;
        completedDays: import("@prisma/client/runtime/library").JsonValue;
    }>;
    untrack(userId: string, habitId: string, dto: TrackHabitDto): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        userId: string;
        streak: number;
        completedDays: import("@prisma/client/runtime/library").JsonValue;
    }>;
    getStats(userId: string): Promise<HabitStats[]>;
    remove(userId: string, habitId: string): Promise<{
        success: boolean;
    }>;
    private ensureOwnership;
    private extractDays;
    private calculateStreak;
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
