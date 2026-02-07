import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
// import { User, Prisma } from '@prisma/client';

@Injectable()
export class UserService {
  private readonly logger = new Logger(UserService.name);

  constructor(private prisma: PrismaService) { }

  async user(
    userWhereUniqueInput: any,
  ): Promise<any> {
    return (this.prisma as any).user.findUnique({
      where: userWhereUniqueInput,
    });
  }

  async createUser(data: any): Promise<any> {
    return (this.prisma as any).user.create({
      data,
    });
  }

  async updateUser(params: {
    where: any;
    data: any;
  }): Promise<any> {
    const { where, data } = params;
    return (this.prisma as any).user.update({
      data,
      where,
    });
  }

  async deductCredits(userId: string, amount: number = 1) {
    const user = await this.user({ id: userId });
    if (!user) throw new BadRequestException('User not found');

    if (user.plan === 'PRO') return user; // Unlimited
    if (user.role === 'ADMIN') return user; // Unlimited

    if (user.credits < amount) {
      throw new BadRequestException('Insufficient credits');
    }

    return this.updateUser({
      where: { id: userId },
      data: { credits: user.credits - amount }
    });
  }

  async upgradePlan(userId: string, plan: 'FREE' | 'PREMIUM' | 'PRO') {
    const creditsMap = {
      'FREE': 10,
      'PREMIUM': 50,
      'PRO': 1000000 // Unlimited essentially
    };

    return this.updateUser({
      where: { id: userId },
      data: {
        plan,
        credits: creditsMap[plan]
      }
    });
  }

  async createUsage(data: { userId: string; toolName: string; status: string; meta?: any }) {
    return (this.prisma as any).usage.create({
      data: {
        userId: data.userId,
        toolName: data.toolName,
        status: data.status,
        meta: data.meta || {},
      },
    });
  }

  async updateUsage(id: string, status: string, resultUrl?: string) {
    return (this.prisma as any).usage.update({
      where: { id },
      data: {
        status,
        resultUrl,
      },
    });
  }

  async getUsageStats(userId: string) {
    const user = await this.user({ id: userId });
    const totalUsage = await (this.prisma as any).usage.count({
      where: { userId },
    });

    // Group by tool
    const usageByTool = await (this.prisma as any).usage.groupBy({
      by: ['toolName'],
      where: { userId },
      _count: {
        toolName: true,
      },
    });

    return {
      credits: user?.credits || 0,
      plan: user?.plan || 'FREE',
      totalUsage,
      usageByTool,
    };
  }

  async getUsageHistory(userId: string, limit: number = 20, offset: number = 0) {
    return (this.prisma as any).usage.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
    });
  }

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleDailyCreditReset() {
    this.logger.debug('Running daily credit reset...');

    // Reset FREE plan users to 10 credits
    const freeUpdate = await (this.prisma as any).user.updateMany({
      where: { plan: 'FREE' },
      data: { credits: 10 },
    });

    // Reset PREMIUM plan users to 50 credits
    const premiumUpdate = await (this.prisma as any).user.updateMany({
      where: { plan: 'PREMIUM' },
      data: { credits: 50 },
    });

    this.logger.debug(`Reset credits for ${freeUpdate.count} FREE users and ${premiumUpdate.count} PREMIUM users.`);
  }
}
