import {
  Injectable,
  ConflictException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { EmailTokenService } from '../email-verification/email-token.service';
import { verifyEmailHtml } from '../../email/templates/verify-email.html';

const BCRYPT_ROUNDS = 10;
const VERIFY_TTL_MIN = 60 * 24;

export interface SignupInput {
  email: string;
  name: string;
  password: string;
}

export interface ValidateInput {
  email: string;
  password: string;
}

export interface ValidatedUser {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
}

@Injectable()
export class CredentialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly tokens: EmailTokenService,
    private readonly cfg: ConfigService,
  ) {}

  async signup(input: SignupInput): Promise<void> {
    const existing = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (existing) {
      throw new ConflictException('Email já está em uso.');
    }
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
      },
    });
    // Se o envio do email falhar, removemos o user recém-criado para
    // não deixar conta órfã sem verificação. Cascade no EmailToken faz
    // o cleanup do token automaticamente.
    try {
      const token = await this.tokens.issue({
        userId: user.id,
        kind: 'VERIFY',
        ttlMinutes: VERIFY_TTL_MIN,
      });
      const appUrl = this.cfg.getOrThrow<string>('APP_URL');
      await this.email.send({
        to: user.email,
        subject: 'Confirme seu email no Porttion',
        html: verifyEmailHtml({
          name: user.name,
          verifyUrl: `${appUrl}/verify-email/${token}`,
        }),
      });
    } catch (err) {
      await this.prisma.user
        .delete({ where: { id: user.id } })
        .catch(() => undefined);
      throw err;
    }
  }

  async validate(input: ValidateInput): Promise<ValidatedUser> {
    const user = await this.prisma.user.findUnique({
      where: { email: input.email },
    });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }
    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }
    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException('Email não verificado.');
    }
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      avatar: user.avatar,
    };
  }
}
