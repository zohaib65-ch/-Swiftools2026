import { Controller, Post, UseInterceptors, UploadedFile, Body, UseGuards, Request, Get, Param } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ToolsService } from './tools.service';
import { AuthGuard } from '@nestjs/passport';
import { UsageGuard } from '../common/guards/usage.guard';

@Controller('tools')
export class ToolsController {
  constructor(private readonly toolsService: ToolsService) { }

  @Post('process')
  @UseGuards(AuthGuard('jwt'), UsageGuard)
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(@UploadedFile() file: Express.Multer.File, @Body() body: any, @Request() req) {
    const { tool, ...options } = body;
    return this.toolsService.processFile(tool, file, req.user.userId, options);
  }

  @Get('status/:id')
  @UseGuards(AuthGuard('jwt'))
  async getStatus(@Param('id') id: string) {
    return this.toolsService.getJobStatus(id);
  }
}
