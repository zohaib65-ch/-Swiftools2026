import { Controller, Patch, Body, UseGuards, Request, Get, Post, Query } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('users')
export class UserController {
  constructor(private userService: UserService) { }

  @UseGuards(AuthGuard('jwt'))
  @Patch('me')
  async updateProfile(@Request() req, @Body() body: { name?: string }) {
    return this.userService.updateUser({
      where: { id: req.user.userId },
      data: { name: body.name },
    });
  }

  @UseGuards(AuthGuard('jwt'))
  @Post('upgrade')
  async upgradePlan(@Request() req, @Body() body: { plan: 'FREE' | 'PREMIUM' | 'PRO' }) {
    return this.userService.upgradePlan(req.user.userId, body.plan);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me/stats')
  async getStats(@Request() req) {
    return this.userService.getUsageStats(req.user.userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('me/history')
  async getHistory(@Request() req, @Query('limit') limit: string, @Query('offset') offset: string) {
    return this.userService.getUsageHistory(req.user.userId, Number(limit) || 20, Number(offset) || 0);
  }
}
