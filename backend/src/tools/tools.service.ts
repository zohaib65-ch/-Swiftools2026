import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UserService } from '../user/user.service';

@Injectable()
export class ToolsService {
  constructor(
    @InjectQueue('file-processing') private fileQueue: Queue,
    private userService: UserService
  ) { }

  async processFile(tool: string, file: Express.Multer.File, userId: string, options: any = {}) {
    // 0. Deduct Credits First (Prevent abuse)
    try {
      await this.userService.deductCredits(userId, 1);
    } catch (e) {
      throw new BadRequestException(e.message || 'Failed to deduct credits');
    }

    // 1. Ensure uploads directory exists
    const uploadsDir = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }

    // 2. Save file to disk
    const fileName = `${uuidv4()}-${file.originalname}`;
    const filePath = path.join(uploadsDir, fileName);

    if (file.buffer) {
      fs.writeFileSync(filePath, file.buffer);
    }

    // 3. Create Usage Record FIRST
    const usage = await this.userService.createUsage({
      userId,
      toolName: tool,
      status: 'queued',
      meta: { options }
    });

    // 4. Queue the job
    const job = await this.fileQueue.add('process', {
      tool,
      filePath,
      originalName: file.originalname,
      mimeType: file.mimetype,
      userId,
      usageId: usage.id, // Pass usage ID to job
      ...options
    });

    // 5. Update Usage with Job ID
    await this.userService.updateUsage(usage.id, 'queued', undefined); // Just ensuring status, maybe update meta?
    // Actually we can't easily update meta without overwriting or merging. 
    // Let's just assume linkage is via usageId in Job.
    // Or if we need jobId in usage, we should add it.
    // But usage table schema is not fully known. Let's skip jobId in usage for now or put it in resultUrl temp? No.

    return { jobId: job.id, usageId: usage.id, status: 'queued', fileName };
  }

  async getJobStatus(jobId: string) {
    const job = await this.fileQueue.getJob(jobId);
    if (!job) {
      return { status: 'not_found' };
    }
    const state = await job.getState();
    const result = job.returnvalue;
    const progress = job.progress;
    return {
      id: job.id,
      status: state,
      progress,
      result
    };
  }
}
