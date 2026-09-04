import { Body, Controller, Get, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import {
  CurrentUser,
  type RequestUser,
} from '../../common/decorators/current-user.decorator';
import { UsersService } from './users.service';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  ChangePasswordSchema,
  UpdateProfileSchema,
  type ChangePasswordInput,
  type UpdateProfileInput,
} from '../auth/dto/auth.dto';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: 'The signed-in account' })
  async getMe(@CurrentUser() user: RequestUser) {
    return this.usersService.findOne(user.id);
  }

  /**
   * The directory of accounts is an admin view. It was open to every
   * authenticated user, which handed anyone with an account the email address
   * of every analyst on the platform.
   */
  @Roles('ADMIN')
  @Get()
  @ApiOperation({ summary: 'List accounts (admin only)' })
  async findAll() {
    return this.usersService.findAll();
  }

  @Put('me')
  @ApiOperation({ summary: 'Update your own profile' })
  async updateProfile(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(UpdateProfileSchema)) body: UpdateProfileInput,
  ) {
    return this.usersService.updateProfile(user.id, body);
  }

  /**
   * The body used to be an untyped object that nothing validated, so an empty
   * string was an acceptable new password.
   */
  @Put('me/password')
  @ApiOperation({ summary: 'Change your own password' })
  async changePassword(
    @CurrentUser() user: RequestUser,
    @Body(new ZodValidationPipe(ChangePasswordSchema))
    body: ChangePasswordInput,
  ) {
    return this.usersService.changePassword(
      user.id,
      body.currentPassword,
      body.newPassword,
    );
  }
}
