import { Queue } from 'bullmq';
import { UserService } from '../user/user.service';
export declare class ToolsService {
    private fileQueue;
    private userService;
    constructor(fileQueue: Queue, userService: UserService);
    processFile(tool: string, file: Express.Multer.File, userId: string, options?: any): Promise<{
        jobId: string | undefined;
        usageId: any;
        status: string;
        fileName: string;
    }>;
    getJobStatus(jobId: string): Promise<{
        status: string;
        id?: undefined;
        progress?: undefined;
        result?: undefined;
    } | {
        id: string | undefined;
        status: import("bullmq").JobState | "unknown";
        progress: import("bullmq").JobProgress;
        result: any;
    }>;
}
