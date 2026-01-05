import { Controller, Get, Put, Body, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { UsersService } from './users.service';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('me')
  async getMe(@Req() req) {
    return this.usersService.findOne(req.user.id);
  }

  @Get()
  async findAll() {
    return this.usersService.findAll();
  }

  @Put('me')
  async updateProfile(@Req() req, @Body() body: { name?: string }) {
    console.log('Updating profile for user:', req.user.id, body);
    return this.usersService.updateProfile(req.user.id, body);
  }

  @Put('me/password')
  async changePassword(
    @Req() req,
    @Body() body: { currentPassword: string; newPassword: string }
  ) {
    console.log('Changing password for user:', req.user.id);
    return this.usersService.changePassword(
      req.user.id,
      body.currentPassword,
      body.newPassword
    );
  }
}