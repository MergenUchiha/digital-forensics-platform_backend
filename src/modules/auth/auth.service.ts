import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { UsersService } from '../users/users.service';
import { CreateUserInput, LoginInput } from './dto/auth.dto';
import { I18nService } from 'nestjs-i18n';

export const BCRYPT_ROUNDS = 12;

/**
 * A bcrypt hash of a random value, computed once at startup, so comparing
 * against an unknown email costs the same as a known one and the response
 * time does not reveal which addresses are registered.
 */
const DUMMY_HASH = bcrypt.hashSync(
  randomBytes(32).toString('hex'),
  BCRYPT_ROUNDS,
);

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private readonly i18n: I18nService,
  ) {}

  async login(input: LoginInput) {
    const user = await this.usersService.findByEmail(input.email);
    const passwordMatches = await bcrypt.compare(
      input.password,
      user?.password ?? DUMMY_HASH,
    );

    if (!user || !passwordMatches) {
      throw new UnauthorizedException(
        this.i18n.t('common.errors.invalid_credentials'),
      );
    }

    return {
      token: this.generateToken(user.id, user.email),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }

  /** Admin only — see AuthController. Registration is not public. */
  async createUser(input: CreateUserInput) {
    return this.usersService.create({
      ...input,
      password: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
    });
  }

  private generateToken(userId: string, email: string): string {
    return this.jwtService.sign({ sub: userId, email });
  }

  async validateUser(userId: string) {
    return this.usersService.findOne(userId);
  }
}
