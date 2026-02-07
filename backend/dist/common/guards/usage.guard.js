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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsageGuard = void 0;
const common_1 = require("@nestjs/common");
const user_service_1 = require("../../user/user.service");
let UsageGuard = class UsageGuard {
    userService;
    constructor(userService) {
        this.userService = userService;
    }
    async canActivate(context) {
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        if (!user || !user.userId) {
            return false;
        }
        const dbUser = await this.userService.user({ id: user.userId });
        if (!dbUser) {
            throw new common_1.ForbiddenException('User not found');
        }
        if (dbUser.role === 'ADMIN' || dbUser.plan === 'PRO') {
            return true;
        }
        if (dbUser.credits <= 0) {
            throw new common_1.ForbiddenException('Insufficient credits. Please upgrade your plan.');
        }
        return true;
    }
};
exports.UsageGuard = UsageGuard;
exports.UsageGuard = UsageGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [user_service_1.UserService])
], UsageGuard);
//# sourceMappingURL=usage.guard.js.map