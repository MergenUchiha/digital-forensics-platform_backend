import { Controller, Get, Post, Delete, Body, Param, Query, UseGuards, Req, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from 'nestjs-zod';
import { EvidenceService } from './evidence.service';
import { CreateEvidenceDto } from './dto/evidence.dto';

@ApiTags('Evidence')
@Controller('evidence')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@UsePipes(ZodValidationPipe)
export class EvidenceController {
  constructor(private evidenceService: EvidenceService) {}

  @Post()
  @ApiOperation({ summary: 'Create evidence' })
  async create(@Body() dto: CreateEvidenceDto, @Req() req) {
    return this.evidenceService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all evidence' })
  async findAll(@Query('caseId') caseId?: string) {
    return this.evidenceService.findAll(caseId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get evidence by ID' })
  async findOne(@Param('id') id: string) {
    return this.evidenceService.findOne(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete evidence' })
  async delete(@Param('id') id: string) {
    return this.evidenceService.delete(id);
  }
}