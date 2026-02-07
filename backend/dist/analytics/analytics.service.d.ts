import { PrismaService } from '../prisma/prisma.service';
export declare class AnalyticsService {
    private prisma;
    constructor(prisma: PrismaService);
    getAdminStats(): Promise<{
        totalUsers: number;
        totalJobs: number;
        failedJobs: number;
        popularTools: (import(".prisma/client").Prisma.PickEnumerable<import(".prisma/client").Prisma.UsageGroupByOutputType, "toolName"[]> & {
            _count: {
                toolName: number;
            };
        })[];
        recentActivity: ({
            user: {
                name: string | null;
                email: string;
            };
        } & {
            toolName: string;
            userId: string;
            id: string;
            status: string;
            meta: import("@prisma/client/runtime/library").JsonValue | null;
            createdAt: Date;
        })[];
    }>;
}
