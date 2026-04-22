import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards, Req, UsePipes, BadRequestException } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CasesService } from './cases.service';
import { CreateCaseSchema, UpdateCaseSchema, CreateCaseInput, UpdateCaseInput } from './dto/case.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import { I18nService } from 'nestjs-i18n';

@ApiTags('Cases')
@Controller('cases')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CasesController {
  constructor(
    private casesService: CasesService,
    private readonly i18n: I18nService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create new case' })
  @UsePipes(new ZodValidationPipe(CreateCaseSchema))
  async create(@Body() dto: CreateCaseInput, @Req() req) {
    console.log('📝 Creating case:', dto);
    return this.casesService.create(dto, req.user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all cases' })
  async findAll(@Query('status') status?: string) {
    console.log('📋 Getting all cases with status:', status);
    return this.casesService.findAll(status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get case by ID' })
  async findOne(@Param('id') id: string) {
    console.log('🔍 Getting case:', id);
    return this.casesService.findOne(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update case' })
  async update(@Param('id') id: string, @Body() dto: any) {
    console.log('✏️ Updating case:', id);
    console.log('📦 Update data received:', JSON.stringify(dto, null, 2));
    
    try {
      // Валидация с помощью Zod
      const validatedData = UpdateCaseSchema.parse(dto);
      console.log('✅ Validated data:', JSON.stringify(validatedData, null, 2));
      
      return await this.casesService.update(id, validatedData);
    } catch (error) {
      console.error('❌ Validation error:', error);
      
      if (error.name === 'ZodError') {
        throw new BadRequestException({
          message: this.i18n.t('common.errors.validation_failed'),
          errors: error.errors.map((e: any) => ({
            field: e.path.join('.'),
            message: e.message,
          })),
        });
      }
      
      throw error;
    }
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete case' })
  async delete(@Param('id') id: string) {
    console.log('🗑️ Deleting case:', id);
    return this.casesService.delete(id);
  }
}