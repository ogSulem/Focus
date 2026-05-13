import { TasksService } from '../tasks/tasks.service';
export declare class TelegramService {
    private readonly tasksService;
    constructor(tasksService: TasksService);
    processCommand(userId: string, text: string): Promise<{
        message: string;
        task: {
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
        };
        tasks?: undefined;
    } | {
        message: string;
        tasks: {
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
        }[];
        task?: undefined;
    } | {
        message: string;
        task?: undefined;
        tasks?: undefined;
    }>;
}
