import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { EmailTokenService } from './email-token.service';
import { resetPasswordHtml } from '../../email/templates/reset-password.html';

const RESET_TTL_MIN = 30;
const BCRYPT_ROUNDS = 10;

@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly tokens: EmailTokenService,
    private readonly cfg: ConfigService,
  ) {}

  async verify(params: { token: string }): Promise<void> {
    const { userId } = await this.tokens.consume({
      token: params.token,
      kind: 'VERIFY',
    });
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
    });
  }

  async forgotPassword(params: { email: string }): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email: params.email },
    });
    if (!user) {
      // anti-enumeração: não revela se email existe
      return;
    }
    const token = await this.tokens.issue({
      userId: user.id,
      kind: 'RESET',
      ttlMinutes: RESET_TTL_MIN,
    });
    const appUrl = this.cfg.getOrThrow<string>('APP_URL');
    await this.email.send({
      to: user.email,
      subject: 'Redefinir sua senha no Porttion',
      html: resetPasswordHtml({
        name: user.name,
        resetUrl: `${appUrl}/reset-password/${token}`,
      }),
    });
  }

  async resetPassword(params: {
    token: string;
    newPassword: string;
  }): Promise<void> {
    const { userId } = await this.tokens.consume({
      token: params.token,
      kind: 'RESET',
    });
    const passwordHash = await bcrypt.hash(params.newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }
}
