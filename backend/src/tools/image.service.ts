import { Injectable, BadRequestException } from '@nestjs/common';
import sharp from 'sharp';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import AdmZip from 'adm-zip';

@Injectable()
export class ImageService {

  async process(jobData: any): Promise<string> {
    const { tool, filePath, options } = jobData;

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    const inputBuffer = fs.readFileSync(filePath);
    let pipeline = sharp(inputBuffer);
    let outputBuffer: Buffer;
    let outputExt = path.extname(filePath).slice(1); // default to original ext

    try {
      switch (tool) {
        case 'image-converter':
          // options: { toFormat: 'png' | 'jpg' | 'webp' }
          if (!options.toFormat) throw new BadRequestException('Target format required');
          outputExt = options.toFormat;
          pipeline = pipeline.toFormat(options.toFormat);
          outputBuffer = await pipeline.toBuffer();
          break;

        case 'image-compressor': {
          // options: { quality: 70 }
          const quality = Number(options.quality) || 70;
          // sharp automatically compresses based on format if we just toBuffer() with no options? 
          // No, we need to specify format options.
          const metadata = await pipeline.metadata();
          const format = metadata.format;
          if (format === 'jpeg' || format === 'jpg') pipeline = pipeline.jpeg({ quality });
          else if (format === 'png') pipeline = pipeline.png({ quality });
          else if (format === 'webp') pipeline = pipeline.webp({ quality });
          outputBuffer = await pipeline.toBuffer();
          break;
        }

        case 'image-resizer':
        case 'bulk-image-resizer': {
          // options: { width: 100, height: 100 }
          const resizeOpts: any = {};
          if (options.width) resizeOpts.width = Number(options.width);
          if (options.height) resizeOpts.height = Number(options.height);
          if (options.width && options.height) resizeOpts.fit = 'fill';
          outputBuffer = await pipeline.resize(resizeOpts).toBuffer();
          break;
        }

        case 'image-cropper':
        case 'social-media-image-cropper':
          // Usually cropping is done client side and we just get the cropped image uploads.
          // If we receive the full image + crop params:
          // options: { left, top, width, height }
          if (options.width && options.height && options.left !== undefined && options.top !== undefined) {
            outputBuffer = await pipeline.extract({
              left: Number(options.left),
              top: Number(options.top),
              width: Number(options.width),
              height: Number(options.height)
            }).toBuffer();
          } else {
            // If client already accepted cropped blob, we assume input is already cropped? 
            // Logic in frontend sends `finalFile`. If `finalFile` is already cropped, then `image-cropper` here is just a pass-through or converter.
            // But if we want to move logic to backend, the frontend should send original + coords.
            // For now, let's assume if coords are missing, it's a pass-through (or frontend sent cropped).
            outputBuffer = await pipeline.toBuffer();
          }
          break;

        case 'image-blur-pixelate': {
          // options: { blur: 5 }
          const blurAmount = Number(options.blur) || 5;
          // sharp blur parameter is standard deviation (0.3 to 1000)
          // If user sends 5, it's valid.
          outputBuffer = await pipeline.blur(blurAmount).toBuffer();
          break;
        }

        case 'image-watermark':
          // options: { watermarkType: 'text'|'logo', waterMarkText, position }
          // This is complex for text specific rendering without canvas/SVG.
          // Sharp can composite SVG.
          // TODO: Implement full watermark logic. For now, simple stub.
          throw new Error("Watermarking not yet fully implemented in backend");
          break;

        case 'exif-metadata-remover':
          outputBuffer = await pipeline.withMetadata({}).toBuffer(); // strip metadata? No, that KEEPS it.
          // To strip, we just process it without .withMetadata().
          // By default sharp strips metadata unless .withMetadata() is called.
          // So just re-saving it strips it.
          outputBuffer = await pipeline.toBuffer();
          break;

        case 'favicon-generator':
          // Return zip path
          return await this.generateFavicons(inputBuffer, filePath);

        default:
          throw new BadRequestException(`Unknown tool: ${tool}`);
      }

      // Save output
      if (!outputBuffer) outputBuffer = await pipeline.toBuffer();

      const outputFileName = `processed-${uuidv4()}.${outputExt}`;
      const outputFilePath = path.join(path.dirname(filePath), outputFileName);
      fs.writeFileSync(outputFilePath, outputBuffer);

      return outputFilePath;

    } catch (error) {
      console.error(`Image processing failed: ${error.message}`);
      throw error;
    }
  }

  private async generateFavicons(buffer: Buffer, originalPath: string): Promise<string> {
    // Generate standard sizes
    const sizes = [16, 32, 48, 64, 128, 256]; // ico usually needs these, or we just emit pngs
    const zip = new AdmZip();

    // We can generate a simple set of PNGs for now.
    // Ideally use `favicons` package if installed, but `sharp` is faster for basic sizing.

    for (const size of sizes) {
      const resized = await sharp(buffer).resize(size, size).png().toBuffer();
      zip.addFile(`favicon-${size}x${size}.png`, resized);
    }

    // Also an ico? sharp doesn't output ico directly easily.
    // For MVP, just returning PNGs in ZIP.

    const outputFileName = `favicons-${uuidv4()}.zip`;
    const outputFilePath = path.join(path.dirname(originalPath), outputFileName);
    zip.writeZip(outputFilePath);

    return outputFilePath;
  }
}
