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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ToolsService = void 0;
const common_1 = require("@nestjs/common");
const bullmq_1 = require("@nestjs/bullmq");
const bullmq_2 = require("bullmq");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const uuid_1 = require("uuid");
const user_service_1 = require("../user/user.service");
let ToolsService = class ToolsService {
    fileQueue;
    userService;
    constructor(fileQueue, userService) {
        this.fileQueue = fileQueue;
        this.userService = userService;
    }
    async processFile(tool, file, userId, options = {}) {
        try {
            await this.userService.deductCredits(userId, 1);
        }
        catch (e) {
            throw new common_1.BadRequestException(e.message || 'Failed to deduct credits');
        }
        const uploadsDir = path.join(process.cwd(), 'uploads');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir);
        }
        const fileName = `${(0, uuid_1.v4)()}-${file.originalname}`;
        const filePath = path.join(uploadsDir, fileName);
        if (file.buffer) {
            fs.writeFileSync(filePath, file.buffer);
        }
        const usage = await this.userService.createUsage({
            userId,
            toolName: tool,
            status: 'queued',
            meta: { options }
        });
        const job = await this.fileQueue.add('process', {
            tool,
            filePath,
            originalName: file.originalname,
            mimeType: file.mimetype,
            userId,
            usageId: usage.id,
            ...options
        });
        await this.userService.updateUsage(usage.id, 'queued', undefined);
        return { jobId: job.id, usageId: usage.id, status: 'queued', fileName };
    }
    async getJobStatus(jobId) {
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
};
exports.ToolsService = ToolsService;
exports.ToolsService = ToolsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, bullmq_1.InjectQueue)('file-processing')),
    __metadata("design:paramtypes", [bullmq_2.Queue,
        user_service_1.UserService])
], ToolsService);
//# sourceMappingURL=tools.service.js.map