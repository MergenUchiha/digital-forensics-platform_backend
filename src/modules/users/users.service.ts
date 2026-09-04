import {
  Injectable,
  ConflictException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { BCRYPT_ROUNDS } from '../auth/auth.service';
import { I18nService } from 'nestjs-i18n';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private readonly i18n: I18nService,
  ) {}

  async create(data: {
    email: string;
    password: string;
    name: string;
    role?: string;
  }) {
    // The password arriving here is already hashed by AuthService.
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictException(
        this.i18n.t('common.errors.user_already_exists'),
      );
    }

    return this.prisma.user.create({
      data: {
        ...data,
        role: data.role || 'ANALYST',
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException(this.i18n.t('common.errors.user_not_found'));
    }

    return user;
  }

  async findByEmail(email: string) {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async updateProfile(userId: string, data: { name: string }) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: {
        name: data.name,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });

    return user;
  }

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException(this.i18n.t('common.errors.user_not_found'));
    }

    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new UnauthorizedException(
        this.i18n.t('common.errors.current_password_incorrect'),
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        password: hashedPassword,
      },
    });

    return { message: this.i18n.t('common.success.password_updated') };
  }
}
