import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  type RequestUser,
} from '../../common/decorators/current-user.decorator';
import { CasesService } from './cases.service';
import {
  CreateCaseSchema,
  UpdateCaseSchema,
  CreateCaseInput,
  UpdateCaseInput,
} from './dto/case.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('Cases')
@Controller('cases')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class CasesController {
  constructor(private casesService: CasesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a case' })
  async create(
    // The pipe goes on the parameter, not the method: `@UsePipes` applies to
    // every parameter of the handler, so it also ran the body schema against
    // the `@CurrentUser()` object and rejected every request.
    @Body(new ZodValidationPipe(CreateCaseSchema)) dto: CreateCaseInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.casesService.create(dto, user.id);
  }

  @Get()
  @ApiOperation({
    summary: 'List cases the caller may see (all of them for an admin)',
  })
  async findAll(
    @CurrentUser() user: RequestUser,
    @Query('status') status?: string,
  ) {
    return this.casesService.findAll(user, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a case by id' })
  @ApiResponse({ status: 403, description: 'Not your case' })
  async findOne(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.casesService.findOne(id, user);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a case' })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateCaseSchema)) dto: UpdateCaseInput,
    @CurrentUser() user: RequestUser,
  ) {
    return this.casesService.update(id, dto, user);
  }

  /**
   * Admin only. Deleting a case cascades through its evidence, chain of
   * custody and timeline — in a forensics platform that is destruction of the
   * record, and it used to be available to anyone with an account.
   */
  @Roles('ADMIN')
  @Delete(':id')
  @ApiOperation({
    summary: 'Delete a case and everything under it (admin only)',
  })
  async delete(@Param('id') id: string, @CurrentUser() user: RequestUser) {
    return this.casesService.delete(id, user);
  }
}
