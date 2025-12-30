import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, UsePipes } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CasesService } from './cases.service';
import { CreateCaseSchema, UpdateCaseSchema, CreateCaseInput, UpdateCaseInput } from './dto/case.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('Cases')
@Controller('cases')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CasesController {
  constructor(private casesService: CasesService) {}

  @Post()
  @ApiOperation({ summary: 'Create new case' })
  @UsePipes(new ZodValidationPipe(CreateCaseSchema))
  async create(@Body() dto: CreateCaseInput, @Req() req) {
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
  @UsePipes(new ZodValidationPipe(UpdateCaseSchema))
  async update(@Param('id') id: string, @Body() dto: UpdateCaseInput) {
    return this.casesService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete case' })
  async delete(@Param('id') id: string) {
    return this.casesService.delete(id);
  }
}