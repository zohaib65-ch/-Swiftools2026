"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PdfService = void 0;
const common_1 = require("@nestjs/common");
const pdf_lib_1 = require("pdf-lib");
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const uuid_1 = require("uuid");
const adm_zip_1 = __importDefault(require("adm-zip"));
let PdfService = class PdfService {
    async process(jobData) {
        const { tool, filePath, options } = jobData;
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        const inputBuffer = fs.readFileSync(filePath);
        const pdfDoc = await pdf_lib_1.PDFDocument.load(inputBuffer);
        let outputBuffer;
        let outputExt = 'pdf';
        try {
            switch (tool) {
                case 'pdf-compressor':
                    outputBuffer = await pdfDoc.save({ useObjectStreams: false });
                    break;
                case 'pdf-rotator':
                    const rotation = Number(options.rotation) || 0;
                    const pages = pdfDoc.getPages();
                    pages.forEach(page => {
                        const currentRotation = page.getRotation().angle;
                        page.setRotation((0, pdf_lib_1.degrees)((currentRotation + rotation) % 360));
                    });
                    outputBuffer = await pdfDoc.save();
                    break;
                case 'pdf-splitter':
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
                    throw new common_1.BadRequestException(`Unknown PDF tool: ${tool}`);
            }
            const outputFileName = `processed-${(0, uuid_1.v4)()}.${outputExt}`;
            const outputFilePath = path.join(path.dirname(filePath), outputFileName);
            fs.writeFileSync(outputFilePath, outputBuffer);
            return outputFilePath;
        }
        catch (error) {
            console.error(`PDF processing failed: ${error.message}`);
            throw error;
        }
    }
    async splitPdf(pdfDoc, originalPath) {
        const zip = new adm_zip_1.default();
        const count = pdfDoc.getPageCount();
        for (let i = 0; i < count; i++) {
            const newDoc = await pdf_lib_1.PDFDocument.create();
            const [copiedPage] = await newDoc.copyPages(pdfDoc, [i]);
            newDoc.addPage(copiedPage);
            const pdfBytes = await newDoc.save();
            zip.addFile(`page-${i + 1}.pdf`, Buffer.from(pdfBytes));
        }
        const outputFileName = `split-${(0, uuid_1.v4)()}.zip`;
        const outputFilePath = path.join(path.dirname(originalPath), outputFileName);
        zip.writeZip(outputFilePath);
        return outputFilePath;
    }
};
exports.PdfService = PdfService;
exports.PdfService = PdfService = __decorate([
    (0, common_1.Injectable)()
], PdfService);
//# sourceMappingURL=pdf.service.js.map