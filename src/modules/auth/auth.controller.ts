import { Controller, Post, Body, UsePipes } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { RegisterSchema, LoginSchema, RegisterInput, LoginInput } from './dto/auth.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register new user' })
  @UsePipes(new ZodValidationPipe(RegisterSchema))
  async register(@Body() dto: RegisterInput) {
    return this.authService.register(dto);
  }

  @Post('login')
  @ApiOperation({ summary: 'Login user' })
  @UsePipes(new ZodValidationPipe(LoginSchema))
  async login(@Body() dto: LoginInput) {
    return this.authService.login(dto);
  }
}