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
exports.ImageService = void 0;
const common_1 = require("@nestjs/common");
const sharp_1 = __importDefault(require("sharp"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const uuid_1 = require("uuid");
const adm_zip_1 = __importDefault(require("adm-zip"));
let ImageService = class ImageService {
    async process(jobData) {
        const { tool, filePath, options } = jobData;
        if (!fs.existsSync(filePath)) {
            throw new Error(`File not found: ${filePath}`);
        }
        const inputBuffer = fs.readFileSync(filePath);
        let pipeline = (0, sharp_1.default)(inputBuffer);
        let outputBuffer;
        let outputExt = path.extname(filePath).slice(1);
        try {
            switch (tool) {
                case 'image-converter':
                    if (!options.toFormat)
                        throw new common_1.BadRequestException('Target format required');
                    outputExt = options.toFormat;
                    pipeline = pipeline.toFormat(options.toFormat);
                    outputBuffer = await pipeline.toBuffer();
                    break;
                case 'image-compressor': {
                    const quality = Number(options.quality) || 70;
                    const metadata = await pipeline.metadata();
                    const format = metadata.format;
                    if (format === 'jpeg' || format === 'jpg')
                        pipeline = pipeline.jpeg({ quality });
                    else if (format === 'png')
                        pipeline = pipeline.png({ quality });
                    else if (format === 'webp')
                        pipeline = pipeline.webp({ quality });
                    outputBuffer = await pipeline.toBuffer();
                    break;
                }
                case 'image-resizer':
                case 'bulk-image-resizer': {
                    const resizeOpts = {};
                    if (options.width)
                        resizeOpts.width = Number(options.width);
                    if (options.height)
                        resizeOpts.height = Number(options.height);
                    if (options.width && options.height)
                        resizeOpts.fit = 'fill';
                    outputBuffer = await pipeline.resize(resizeOpts).toBuffer();
                    break;
                }
                case 'image-cropper':
                case 'social-media-image-cropper':
                    if (options.width && options.height && options.left !== undefined && options.top !== undefined) {
                        outputBuffer = await pipeline.extract({
                            left: Number(options.left),
                            top: Number(options.top),
                            width: Number(options.width),
                            height: Number(options.height)
                        }).toBuffer();
                    }
                    else {
                        outputBuffer = await pipeline.toBuffer();
                    }
                    break;
                case 'image-blur-pixelate': {
                    const blurAmount = Number(options.blur) || 5;
                    outputBuffer = await pipeline.blur(blurAmount).toBuffer();
                    break;
                }
                case 'image-watermark':
                    throw new Error("Watermarking not yet fully implemented in backend");
                    break;
                case 'exif-metadata-remover':
                    outputBuffer = await pipeline.withMetadata({}).toBuffer();
                    outputBuffer = await pipeline.toBuffer();
                    break;
                case 'favicon-generator':
                    return await this.generateFavicons(inputBuffer, filePath);
                default:
                    throw new common_1.BadRequestException(`Unknown tool: ${tool}`);
            }
            if (!outputBuffer)
                outputBuffer = await pipeline.toBuffer();
            const outputFileName = `processed-${(0, uuid_1.v4)()}.${outputExt}`;
            const outputFilePath = path.join(path.dirname(filePath), outputFileName);
            fs.writeFileSync(outputFilePath, outputBuffer);
            return outputFilePath;
        }
        catch (error) {
            console.error(`Image processing failed: ${error.message}`);
            throw error;
        }
    }
    async generateFavicons(buffer, originalPath) {
        const sizes = [16, 32, 48, 64, 128, 256];
        const zip = new adm_zip_1.default();
        for (const size of sizes) {
            const resized = await (0, sharp_1.default)(buffer).resize(size, size).png().toBuffer();
            zip.addFile(`favicon-${size}x${size}.png`, resized);
        }
        const outputFileName = `favicons-${(0, uuid_1.v4)()}.zip`;
        const outputFilePath = path.join(path.dirname(originalPath), outputFileName);
        zip.writeZip(outputFilePath);
        return outputFilePath;
    }
};
exports.ImageService = ImageService;
exports.ImageService = ImageService = __decorate([
    (0, common_1.Injectable)()
], ImageService);
//# sourceMappingURL=image.service.js.map