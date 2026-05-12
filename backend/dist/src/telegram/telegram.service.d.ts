import { TasksService } from '../tasks/tasks.service';
export declare class TelegramService {
    private readonly tasksService;
    constructor(tasksService: TasksService);
    processCommand(userId: string, text: string): Promise<{
        message: string;
        task: any;
        tasks?: undefined;
    } | {
        message: any;
        tasks: any;
        task?: undefined;
    } | {
        message: string;
        task?: undefined;
        tasks?: undefined;
    }>;
}
