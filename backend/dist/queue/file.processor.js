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
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileProcessor = void 0;
const bullmq_1 = require("@nestjs/bullmq");
const user_service_1 = require("../user/user.service");
const image_service_1 = require("../tools/image.service");
const pdf_service_1 = require("../tools/pdf.service");
const path = __importStar(require("path"));
let FileProcessor = class FileProcessor extends bullmq_1.WorkerHost {
    userService;
    imageService;
    pdfService;
    constructor(userService, imageService, pdfService) {
        super();
        this.userService = userService;
        this.imageService = imageService;
        this.pdfService = pdfService;
    }
    async process(job) {
        const { tool, userId, usageId, filePath, options } = job.data;
        console.log(`Processing job ${job.id} for tool ${tool}`);
        try {
            if (usageId) {
                await this.userService.updateUsage(usageId, 'processing');
            }
            let outputFilePath;
            if (tool.startsWith('image-') || tool === 'favicon-generator' || tool === 'watermark-adder' || tool === 'exif-metadata-remover') {
                outputFilePath = await this.imageService.process(job.data);
            }
            else if (tool.startsWith('pdf-') || tool === 'image-to-pdf') {
                outputFilePath = await this.pdfService.process(job.data);
            }
            else {
                throw new Error(`Unknown tool type: ${tool}`);
            }
            const fileName = path.basename(outputFilePath);
            const backendUrl = process.env.BACKEND_URL || 'http://localhost:5000';
            const resultUrl = `${backendUrl}/uploads/${fileName}`;
            if (usageId) {
                await this.userService.updateUsage(usageId, 'completed', resultUrl);
            }
            return { status: 'completed', resultUrl };
        }
        catch (error) {
            console.error(`Job ${job.id} failed:`, error);
            if (usageId) {
                await this.userService.updateUsage(usageId, 'failed');
            }
            throw error;
        }
    }
};
exports.FileProcessor = FileProcessor;
exports.FileProcessor = FileProcessor = __decorate([
    (0, bullmq_1.Processor)('file-processing'),
    __metadata("design:paramtypes", [user_service_1.UserService,
        image_service_1.ImageService,
        pdf_service_1.PdfService])
], FileProcessor);
//# sourceMappingURL=file.processor.js.map