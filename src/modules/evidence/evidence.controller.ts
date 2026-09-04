import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiConsumes,
  ApiResponse,
} from '@nestjs/swagger';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import type { Response } from 'express';
import { existsSync, mkdirSync } from 'fs';
import { ConfigService } from '@nestjs/config';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  type RequestUser,
} from '../../common/decorators/current-user.decorator';
import { EvidenceService } from './evidence.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateEvidenceSchema,
  type CreateEvidenceInput,
} from './dto/evidence.dto';

const uploadsDir = join(process.cwd(), 'uploads');
if (!existsSync(uploadsDir)) {
  mkdirSync(uploadsDir, { recursive: true });
}

/**
 * Extensions the browser will render in place. An uploaded `.html` or `.svg`
 * served back with a matching Content-Type executes in the API's own origin,
 * so the stored name never keeps one of these — the original is preserved in
 * the `name` column and in the download filename instead.
 */
const RENDERABLE_EXTENSIONS = new Set([
  '.html',
  '.htm',
  '.xhtml',
  '.svg',
  '.xml',
  '.mhtml',
  '.js',
  '.mjs',
]);

const storage = diskStorage({
  destination: uploadsDir,
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = extname(file.originalname).toLowerCase();
    const safeExt =
      /^\.[a-z0-9]{1,10}$/.test(ext) && !RENDERABLE_EXTENSIONS.has(ext)
        ? ext
        : '.bin';
    cb(null, `${unique}${safeExt}`);
  },
});

@ApiTags('Evidence')
@Controller('evidence')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class EvidenceController {
  constructor(
    private evidenceService: EvidenceService,
    private configService: ConfigService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create evidence, optionally with a file' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      storage,
      // Unbounded before: one request could fill the disk, and the hash was
      // computed by reading the whole file into memory at once.
      limits: {
        fileSize: Number(process.env.MAX_UPLOAD_MB ?? 100) * 1024 * 1024,
        files: 1,
      },
    }),
  )
  async create(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: Record<string, string>,
    @CurrentUser() user: RequestUser,
  ) {
    const dto = new ZodValidationPipe(CreateEvidenceSchema).transform({
      name: body.name,
      type: body.type,
      description: body.description || undefined,
      caseId: body.caseId,
      iotDeviceType: body.iotDeviceType || undefined,
      metadata: parseMetadata(body.metadata),
    }) as CreateEvidenceInput;

    return this.evidenceService.create(dto, user, file);
  }

  @Get()
  @ApiOperation({ summary: 'List evidence from cases the caller may see' })
  async findAll(
    @CurrentUser() user: RequestUser,
    @Query('caseId') caseId?: string,
  ) {
    return this.evidenceService.findAll(user, caseId);
  }

  /**
   * The token is read from the Authorization header only. It used to be
   * accepted as `?token=`, which puts a bearer token in proxy logs, browser
   * history and any Referer the page sends onward.
   */
  @Get(':id/file')
  @ApiOperation({ summary: 'Download the evidence file' })
  @ApiResponse({ status: 404, description: 'No file stored for this evidence' })
  async downloadFile(
    @Param('id') id: string,
    @CurrentUser() user: RequestUser,
    @Res() res: Response,
  ) {
    const { path, filename } = await this.evidenceService.resolveFile(id, user);

    // Never let the browser render an artefact in this origin.
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Content-Security-Policy', "default-src 'none'; sandbox");

    return res.download(path, filename);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get evidence by id' })
  async findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.evidenceService.findOne(id, user);
  }

  @Roles('ADMIN')
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete evidence and its stored file (admin only)',
  })
  async delete(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.evidenceService.delete(id, user);
  }
}

function parseMetadata(raw: string | undefined): unknown {
  if (!raw) return undefined;
  try {
    return JSON.parse(raw);
  } catch {
    // Unguarded `JSON.parse` here turned a typo in a form field into a 500.
    throw new BadRequestException('metadata must be valid JSON');
  }
}
