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
    findAll(userId: string, filter?: TaskFilter): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        priority: import("@prisma/client").$Enums.TaskPriority;
        status: import("@prisma/client").$Enums.TaskStatus;
        deadline: Date | null;
        completedAt: Date | null;
        tags: string[];
        subtasks: import("@prisma/client/runtime/library").JsonValue;
        userId: string;
    }[]>;
    getUniqueTags(userId: string): Promise<string[]>;
    getStats(userId: string): Promise<TaskStats>;
    findOne(userId: string, taskId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        priority: import("@prisma/client").$Enums.TaskPriority;
        status: import("@prisma/client").$Enums.TaskStatus;
        deadline: Date | null;
        completedAt: Date | null;
        tags: string[];
        subtasks: import("@prisma/client/runtime/library").JsonValue;
        userId: string;
    }>;
    create(userId: string, dto: CreateTaskDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        priority: import("@prisma/client").$Enums.TaskPriority;
        status: import("@prisma/client").$Enums.TaskStatus;
        deadline: Date | null;
        completedAt: Date | null;
        tags: string[];
        subtasks: import("@prisma/client/runtime/library").JsonValue;
        userId: string;
    }>;
    update(userId: string, taskId: string, dto: UpdateTaskDto): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        priority: import("@prisma/client").$Enums.TaskPriority;
        status: import("@prisma/client").$Enums.TaskStatus;
        deadline: Date | null;
        completedAt: Date | null;
        tags: string[];
        subtasks: import("@prisma/client/runtime/library").JsonValue;
        userId: string;
    }>;
    remove(userId: string, taskId: string): Promise<{
        success: boolean;
    }>;
    duplicate(userId: string, taskId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        priority: import("@prisma/client").$Enums.TaskPriority;
        status: import("@prisma/client").$Enums.TaskStatus;
        deadline: Date | null;
        completedAt: Date | null;
        tags: string[];
        subtasks: import("@prisma/client/runtime/library").JsonValue;
        userId: string;
    }>;
    findUpcoming(userId: string, days?: number): Promise<{
        daysLeft: number | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        title: string;
        description: string | null;
        priority: import("@prisma/client").$Enums.TaskPriority;
        status: import("@prisma/client").$Enums.TaskStatus;
        deadline: Date | null;
        completedAt: Date | null;
        tags: string[];
        subtasks: import("@prisma/client/runtime/library").JsonValue;
        userId: string;
    }[]>;
    bulkUpdate(userId: string, dto: BulkUpdateDto): Promise<{
        affected: number;
        action: string;
        status?: undefined;
    } | {
        affected: number;
        action: string;
        status: "TODO" | "IN_PROGRESS" | "DONE";
    }>;
}
