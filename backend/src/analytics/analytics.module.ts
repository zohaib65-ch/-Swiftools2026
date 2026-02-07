import { Module } from '@nestjs/common';
import { AnalyticsController } from './analytics.controller';
import { AnalyticsService } from './analytics.service';
import { UserModule } from '../user/user.module';
import { PrismaModule } from '../prisma/prisma.module';
import { AdminGuard } from '../auth/admin.guard';

@Module({
  imports: [UserModule, PrismaModule],
  controllers: [AnalyticsController],
  providers: [AnalyticsService, AdminGuard],
})
export class AnalyticsModule { }
