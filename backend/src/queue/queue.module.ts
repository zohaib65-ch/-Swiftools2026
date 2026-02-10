import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { FileProcessor } from './file.processor';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UserModule } from '../user/user.module';
import { ImageService } from '../tools/image.service';
import { PdfService } from '../tools/pdf.service';

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        const url = configService.get('REDIS_URL');
        if (url) {
          return { connection: url };
        }
        return {
          connection: {
            host: configService.get('REDIS_HOST') || 'localhost',
            port: configService.get('REDIS_PORT') || 6379,
          },
        };
      },
      inject: [ConfigService],
    }),
    BullModule.registerQueue({
      name: 'file-processing',
    }),
    UserModule,
  ],
  providers: [FileProcessor, ImageService, PdfService],
  exports: [BullModule],
})
export class QueueModule { }
