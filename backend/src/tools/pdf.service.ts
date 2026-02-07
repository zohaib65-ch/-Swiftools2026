import { Injectable, BadRequestException } from '@nestjs/common';
import { PDFDocument, degrees } from 'pdf-lib';
import * as path from 'path';
import * as fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import AdmZip from 'adm-zip';

@Injectable()
export class PdfService {

  async process(jobData: any): Promise<string> {
    const { tool, filePath, options } = jobData;

    if (!fs.existsSync(filePath)) {
      throw new Error(`File not found: ${filePath}`);
    }

    // For tools that expect multiple files, ToolsService might need update to handle multiple uploads
    // Or we handle single file sequentially?
    // Let's assume for now this handles single file operations like compress, split, rotate.
    // Merge/ImageToPDF requires multiple files logic which is more complex in Queue.

    const inputBuffer = fs.readFileSync(filePath);
    const pdfDoc = await PDFDocument.load(inputBuffer);

    let outputBuffer: Uint8Array;
    let outputExt = 'pdf';

    try {
      switch (tool) {
        case 'pdf-compressor':
          // simple re-save often compresses if object streams enabled? 
          // pdf-lib doesn't have strong compression. 
          // We can remove unused objects? 
          // Actually pdf-lib default save is not super compressed.
          // But let's assume standard save for now.
          outputBuffer = await pdfDoc.save({ useObjectStreams: false });
          break;

        case 'pdf-rotator':
          // options: { rotation: 90 | 180 ... }
          const rotation = Number(options.rotation) || 0;
          const pages = pdfDoc.getPages();
          pages.forEach(page => {
            const currentRotation = page.getRotation().angle;
            page.setRotation(degrees((currentRotation + rotation) % 360));
          });
          outputBuffer = await pdfDoc.save();
          break;

        case 'pdf-splitter':
          // Return zip of split pages
          return await this.splitPdf(pdfDoc, filePath);

        case 'pdf-metadata-remover':
          pdfDoc.setTitle('');
          pdfDoc.setAuthor('');
          pdfDoc.setSubject('');
          pdfDoc.setKeywords([]);
          pdfDoc.setProducer('');
          pdfDoc.setCreator('');
          outputBuffer = await pdfDoc.save();
          break;

        default:
          throw new BadRequestException(`Unknown PDF tool: ${tool}`);
      }

      const outputFileName = `processed-${uuidv4()}.${outputExt}`;
      const outputFilePath = path.join(path.dirname(filePath), outputFileName);
      fs.writeFileSync(outputFilePath, outputBuffer);

      return outputFilePath;

    } catch (error) {
      console.error(`PDF processing failed: ${error.message}`);
      throw error;
    }
  }

  private async splitPdf(pdfDoc: PDFDocument, originalPath: string): Promise<string> {
    const zip = new AdmZip();
    const count = pdfDoc.getPageCount();

    for (let i = 0; i < count; i++) {
      const newDoc = await PDFDocument.create();
      const [copiedPage] = await newDoc.copyPages(pdfDoc, [i]);
      newDoc.addPage(copiedPage);
      const pdfBytes = await newDoc.save();
      zip.addFile(`page-${i + 1}.pdf`, Buffer.from(pdfBytes));
    }

    const outputFileName = `split-${uuidv4()}.zip`;
    const outputFilePath = path.join(path.dirname(originalPath), outputFileName);
    zip.writeZip(outputFilePath);

    return outputFilePath;
  }
}
