import { Injectable, BadRequestException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';

export type EmailTokenKind = 'VERIFY' | 'RESET';

@Injectable()
export class EmailTokenService {
  constructor(private readonly prisma: PrismaService) {}

  async issue(params: {
    userId: string;
    kind: EmailTokenKind;
    ttlMinutes: number;
  }): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await this.prisma.emailToken.create({
      data: {
        userId: params.userId,
        kind: params.kind,
        tokenHash,
        expiresAt: new Date(Date.now() + params.ttlMinutes * 60_000),
      },
    });
    return token;
  }

  async consume(params: {
    token: string;
    kind: EmailTokenKind;
  }): Promise<{ userId: string }> {
    const tokenHash = createHash('sha256').update(params.token).digest('hex');
    const record = await this.prisma.emailToken.findUnique({
      where: { tokenHash },
    });
    if (!record || record.kind !== params.kind || record.usedAt) {
      throw new BadRequestException('Token inválido.');
    }
    if (record.expiresAt < new Date()) {
      throw new BadRequestException('Token expirado.');
    }
    await this.prisma.emailToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
    return { userId: record.userId };
  }
}
