import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateUserSchema,
  LoginSchema,
  type CreateUserInput,
  type LoginInput,
} from './dto/auth.dto';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Exchange credentials for a JWT' })
  @ApiResponse({ status: 401, description: 'Invalid credentials' })
  @UsePipes(new ZodValidationPipe(LoginSchema))
  async login(@Body() dto: LoginInput) {
    return this.authService.login(dto);
  }

  /**
   * Replaces the former public `POST /auth/register`, which handed anyone who
   * asked an account that could read every case and every piece of evidence in
   * the system. The first account comes from `npm run prisma:seed`.
   */
  @Roles('ADMIN')
  @Post('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create an account (admin only)' })
  @ApiResponse({ status: 409, description: 'Email already registered' })
  @UsePipes(new ZodValidationPipe(CreateUserSchema))
  async createUser(@Body() dto: CreateUserInput) {
    return this.authService.createUser(dto);
  }

  @Roles('ADMIN')
  @Get('users')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List accounts (admin only)' })
  async listUsers() {
    return this.usersService.findAll();
  }
}
