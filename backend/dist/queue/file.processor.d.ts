import { WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { UserService } from '../user/user.service';
import { ImageService } from '../tools/image.service';
import { PdfService } from '../tools/pdf.service';
export declare class FileProcessor extends WorkerHost {
    private userService;
    private imageService;
    private pdfService;
    constructor(userService: UserService, imageService: ImageService, pdfService: PdfService);
    process(job: Job<any, any, string>): Promise<any>;
}
