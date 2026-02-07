import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { AuthGuard } from '@nestjs/passport';
import { AdminGuard } from '../auth/admin.guard';

@Controller('analytics')
@UseGuards(AuthGuard('jwt'))
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) { }

  @Get('stats')  // Changed to /analytics/stats
  @UseGuards(AdminGuard)
  async getAdminStats() {
    return this.analyticsService.getAdminStats();
  }
}
