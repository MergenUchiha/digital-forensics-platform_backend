import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { ZodValidationPipe } from 'nestjs-zod';
import { CasesService } from './cases.service';
import { CreateCaseDto, UpdateCaseDto } from './dto/case.dto';

@ApiTags('Cases')
@Controller('cases')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@UsePipes(ZodValidationPipe)
export class CasesController {
  constructor(private casesService: CasesService) {}

  @Post()
  @ApiOperation({ summary: 'Create new case' })
  async create(@Body() dto: CreateCaseDto, @Req() req) {
    return this.casesService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all cases' })
  async findAll(@Query('status') status?: string) {
    return this.casesService.findAll(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get case by ID' })
  async findOne(@Param('id') id: string) {
    return this.casesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update case' })
  async update(@Param('id') id: string, @Body() dto: UpdateCaseDto) {
    return this.casesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete case' })
  async delete(@Param('id') id: string) {
    return this.casesService.delete(id);
  }
}