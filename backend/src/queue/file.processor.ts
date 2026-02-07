import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { UserService } from '../user/user.service';
import { ImageService } from '../tools/image.service';
import { PdfService } from '../tools/pdf.service';
import * as path from 'path';

@Processor('file-processing')
export class FileProcessor extends WorkerHost {
  constructor(
    private userService: UserService,
    private imageService: ImageService,
    private pdfService: PdfService
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const { tool, userId, usageId, filePath, options } = job.data;
    console.log(`Processing job ${job.id} for tool ${tool}`);

    try {
      // Update status to processing
      if (usageId) {
        await this.userService.updateUsage(usageId, 'processing');
      }

      let outputFilePath: string;

      // Route to correct service
      if (tool.startsWith('image-') || tool === 'favicon-generator' || tool === 'watermark-adder' || tool === 'exif-metadata-remover') {
        outputFilePath = await this.imageService.process(job.data);
      } else if (tool.startsWith('pdf-') || tool === 'image-to-pdf') {
        outputFilePath = await this.pdfService.process(job.data);
      } else {
        throw new Error(`Unknown tool type: ${tool}`);
      }

      // Construct Result URL
      // Assuming backend is serving 'uploads' folder statically
      const fileName = path.basename(outputFilePath);
      const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
      const resultUrl = `${backendUrl}/uploads/${fileName}`;

      // Update status to completed
      if (usageId) {
        await this.userService.updateUsage(usageId, 'completed', resultUrl);
      }

      return { status: 'completed', resultUrl };

    } catch (error) {
      console.error(`Job ${job.id} failed:`, error);

      // Update status to failed
      if (usageId) {
        await this.userService.updateUsage(usageId, 'failed');
      }

      throw error;
    }
  }
}
