import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req, UseInterceptors, UploadedFile, Res } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiConsumes } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { EvidenceService } from './evidence.service';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { Response, Request } from 'express';
import { existsSync, mkdirSync } from 'fs';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

const uploadsDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

const storage = diskStorage({
  destination: uploadsDir,
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

@ApiTags('Evidence')
@Controller('evidence')
@ApiBearerAuth()
export class EvidenceController {
  constructor(
    private evidenceService: EvidenceService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create evidence with file upload' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('file', { storage }))
  async create(
    @UploadedFile() file: Express.Multer.File,
    @Body() body: any,
    @Req() req,
  ) {
    const dto = {
      name: body.name,
      type: body.type,
      description: body.description || undefined,
      caseId: body.caseId,
      iotDeviceType: body.iotDeviceType || undefined,
      metadata: body.metadata ? JSON.parse(body.metadata) : undefined,
    };
    return this.evidenceService.create(dto, req.user.id, file);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get all evidence' })
  async findAll(@Query('caseId') caseId?: string) {
    return this.evidenceService.findAll(caseId);
  }

  @Get(':id/file')
  @ApiOperation({ summary: 'Download evidence file' })
  async downloadFile(
    @Param('id') id: string,
    @Query('token') token: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Verify auth via query token or Authorization header
    const authToken = token || (req.headers.authorization?.replace('Bearer ', ''));
    if (!authToken) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    try {
      this.jwtService.verify(authToken, {
        secret: this.configService.get('JWT_SECRET'),
      });
    } catch {
      return res.status(401).json({ message: 'Invalid token' });
    }

    const evidence = await this.evidenceService.findOne(id);

    if (!evidence.filePath || !existsSync(evidence.filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    return res.sendFile(evidence.filePath);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get evidence by ID' })
  async findOne(@Param('id') id: string) {
    return this.evidenceService.findOne(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete evidence' })
  async delete(@Param('id') id: string) {
    return this.evidenceService.delete(id);
  }
}
