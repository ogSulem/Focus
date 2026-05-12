import { TaskPriority, TaskStatus } from '@prisma/client';
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
export declare class TasksService {
    private readonly prisma;
    private readonly eventsService;
    constructor(prisma: PrismaService, eventsService: EventsService);
    findAll(userId: string, filter?: TaskFilter): any;
    getUniqueTags(userId: string): Promise<string[]>;
    getStats(userId: string): Promise<TaskStats>;
    findOne(userId: string, taskId: string): Promise<any>;
    create(userId: string, dto: CreateTaskDto): Promise<any>;
    update(userId: string, taskId: string, dto: UpdateTaskDto): Promise<any>;
    remove(userId: string, taskId: string): Promise<{
        success: boolean;
    }>;
    duplicate(userId: string, taskId: string): Promise<any>;
    findUpcoming(userId: string, days?: number): Promise<any>;
    bulkUpdate(userId: string, dto: BulkUpdateDto): Promise<{
        affected: any;
        action: string;
        status?: undefined;
    } | {
        affected: any;
        action: string;
        status: any;
    }>;
}
