import { UserService } from './user.service';
export declare class UserController {
    private userService;
    constructor(userService: UserService);
    updateProfile(req: any, body: {
        name?: string;
    }): Promise<any>;
    upgradePlan(req: any, body: {
        plan: 'FREE' | 'PREMIUM' | 'PRO';
    }): Promise<any>;
    getStats(req: any): Promise<{
        credits: any;
        plan: any;
        totalUsage: any;
        usageByTool: any;
    }>;
    getHistory(req: any, limit: string, offset: string): Promise<any>;
}
