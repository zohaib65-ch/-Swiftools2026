import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) { }

  async getAdminStats() {
    const totalUsers = await this.prisma.user.count();
    const totalJobs = await this.prisma.usage.count();
    const failedJobs = await this.prisma.usage.count({
      where: { status: 'failed' },
    });

    // Most popular tools
    const popularTools = await this.prisma.usage.groupBy({
      by: ['toolName'],
      _count: {
        toolName: true,
      },
      orderBy: {
        _count: {
          toolName: 'desc',
        },
      },
      take: 5,
    });

    const recentActivity = await this.prisma.usage.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { email: true, name: true },
        },
      },
    });

    return {
      totalUsers,
      totalJobs,
      failedJobs,
      popularTools,
      recentActivity,
    };
  }
}
