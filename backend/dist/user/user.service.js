"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var UserService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const schedule_1 = require("@nestjs/schedule");
let UserService = UserService_1 = class UserService {
    prisma;
    logger = new common_1.Logger(UserService_1.name);
    constructor(prisma) {
        this.prisma = prisma;
    }
    async user(userWhereUniqueInput) {
        return this.prisma.user.findUnique({
            where: userWhereUniqueInput,
        });
    }
    async createUser(data) {
        return this.prisma.user.create({
            data,
        });
    }
    async updateUser(params) {
        const { where, data } = params;
        return this.prisma.user.update({
            data,
            where,
        });
    }
    async deductCredits(userId, amount = 1) {
        const user = await this.user({ id: userId });
        if (!user)
            throw new common_1.BadRequestException('User not found');
        if (user.plan === 'PRO')
            return user;
        if (user.role === 'ADMIN')
            return user;
        if (user.credits < amount) {
            throw new common_1.BadRequestException('Insufficient credits');
        }
        return this.updateUser({
            where: { id: userId },
            data: { credits: user.credits - amount }
        });
    }
    async upgradePlan(userId, plan) {
        const creditsMap = {
            'FREE': 10,
            'PREMIUM': 50,
            'PRO': 1000000
        };
        return this.updateUser({
            where: { id: userId },
            data: {
                plan,
                credits: creditsMap[plan]
            }
        });
    }
    async createUsage(data) {
        return this.prisma.usage.create({
            data: {
                userId: data.userId,
                toolName: data.toolName,
                status: data.status,
                meta: data.meta || {},
            },
        });
    }
    async updateUsage(id, status, resultUrl) {
        return this.prisma.usage.update({
            where: { id },
            data: {
                status,
                resultUrl,
            },
        });
    }
    async getUsageStats(userId) {
        const user = await this.user({ id: userId });
        const totalUsage = await this.prisma.usage.count({
            where: { userId },
        });
        const usageByTool = await this.prisma.usage.groupBy({
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
    async getUsageHistory(userId, limit = 20, offset = 0) {
        return this.prisma.usage.findMany({
            where: { userId },
            orderBy: { createdAt: 'desc' },
            take: limit,
            skip: offset,
        });
    }
    async handleDailyCreditReset() {
        this.logger.debug('Running daily credit reset...');
        const freeUpdate = await this.prisma.user.updateMany({
            where: { plan: 'FREE' },
            data: { credits: 10 },
        });
        const premiumUpdate = await this.prisma.user.updateMany({
            where: { plan: 'PREMIUM' },
            data: { credits: 50 },
        });
        this.logger.debug(`Reset credits for ${freeUpdate.count} FREE users and ${premiumUpdate.count} PREMIUM users.`);
    }
};
exports.UserService = UserService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_DAY_AT_MIDNIGHT),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], UserService.prototype, "handleDailyCreditReset", null);
exports.UserService = UserService = UserService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], UserService);
//# sourceMappingURL=user.service.js.map