import { Module } from '@nestjs/common';
import { ToolsController } from './tools.controller';
import { ToolsService } from './tools.service';
import { QueueModule } from '../queue/queue.module';
import { UserModule } from '../user/user.module';

@Module({
  imports: [QueueModule, UserModule],
  controllers: [ToolsController],
  providers: [ToolsService],
})
export class ToolsModule { }
