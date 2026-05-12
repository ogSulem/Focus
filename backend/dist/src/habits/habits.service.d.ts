import { PrismaService } from '../prisma/prisma.service';
import { CreateHabitDto } from './dto/create-habit.dto';
import { TrackHabitDto } from './dto/track-habit.dto';
import { UpdateHabitDto } from './dto/update-habit.dto';
import { EventsService } from '../events/events.service';
export declare class HabitsService {
    private readonly prisma;
    private readonly eventsService;
    constructor(prisma: PrismaService, eventsService: EventsService);
    findAll(userId: string): any;
    create(userId: string, dto: CreateHabitDto): Promise<any>;
    update(userId: string, habitId: string, dto: UpdateHabitDto): Promise<any>;
    track(userId: string, habitId: string, dto: TrackHabitDto): Promise<any>;
    untrack(userId: string, habitId: string, dto: TrackHabitDto): Promise<any>;
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
