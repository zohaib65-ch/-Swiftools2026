import { ToolsService } from './tools.service';
export declare class ToolsController {
    private readonly toolsService;
    constructor(toolsService: ToolsService);
    uploadFile(file: Express.Multer.File, body: any, req: any): Promise<{
        jobId: string | undefined;
        usageId: any;
        status: string;
        fileName: string;
    }>;
    getStatus(id: string): Promise<{
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
