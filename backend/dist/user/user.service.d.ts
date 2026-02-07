import { PrismaService } from '../prisma/prisma.service';
export declare class UserService {
    private prisma;
    private readonly logger;
    constructor(prisma: PrismaService);
    user(userWhereUniqueInput: any): Promise<any>;
    createUser(data: any): Promise<any>;
    updateUser(params: {
        where: any;
        data: any;
    }): Promise<any>;
    deductCredits(userId: string, amount?: number): Promise<any>;
    upgradePlan(userId: string, plan: 'FREE' | 'PREMIUM' | 'PRO'): Promise<any>;
    createUsage(data: {
        userId: string;
        toolName: string;
        status: string;
        meta?: any;
    }): Promise<any>;
    updateUsage(id: string, status: string, resultUrl?: string): Promise<any>;
    getUsageStats(userId: string): Promise<{
        credits: any;
        plan: any;
        totalUsage: any;
        usageByTool: any;
    }>;
    getUsageHistory(userId: string, limit?: number, offset?: number): Promise<any>;
    handleDailyCreditReset(): Promise<void>;
}
