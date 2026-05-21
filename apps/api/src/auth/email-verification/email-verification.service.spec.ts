import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { EmailTokenService } from './email-token.service';
import { EmailVerificationService } from './email-verification.service';
import { ConfigService } from '@nestjs/config';

describe('EmailVerificationService', () => {
  const prisma = {
    user: { update: jest.fn(), findUnique: jest.fn() },
  } as unknown as PrismaService;
  const email = { send: jest.fn() } as unknown as EmailService;
  const tokens = {
    issue: jest.fn(),
    consume: jest.fn(),
  } as unknown as EmailTokenService;
  const cfg = {
    getOrThrow: () => 'https://porttion.app',
  } as unknown as ConfigService;
  const service = new EmailVerificationService(prisma, email, tokens, cfg);

  beforeEach(() => jest.clearAllMocks());

  it('verify(): consome token VERIFY e marca emailVerifiedAt', async () => {
    (tokens.consume as jest.Mock).mockResolvedValue({ userId: 'u1' });
    (prisma.user.update as jest.Mock).mockResolvedValue({});
    await service.verify({ token: 'x'.repeat(64) });
    expect(tokens.consume).toHaveBeenCalledWith({
      token: 'x'.repeat(64),
      kind: 'VERIFY',
    });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { emailVerifiedAt: expect.any(Date) },
    });
  });

  it('forgotPassword(): se email não existe, retorna silenciosamente (anti-enum)', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    await service.forgotPassword({ email: 'fantasma@x.com' });
    expect(email.send).not.toHaveBeenCalled();
    expect(tokens.issue).not.toHaveBeenCalled();
  });

  it('forgotPassword(): se email existe, emite RESET 30min e envia email', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      name: 'A',
    });
    (tokens.issue as jest.Mock).mockResolvedValue('rawtoken');
    await service.forgotPassword({ email: 'a@b.com' });
    expect(tokens.issue).toHaveBeenCalledWith({
      userId: 'u1',
      kind: 'RESET',
      ttlMinutes: 30,
    });
    expect(email.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'a@b.com',
        html: expect.stringContaining(
          'https://porttion.app/reset-password/rawtoken',
        ),
      }),
    );
  });

  it('resetPassword(): consome token RESET e atualiza hash', async () => {
    (tokens.consume as jest.Mock).mockResolvedValue({ userId: 'u1' });
    (prisma.user.update as jest.Mock).mockResolvedValue({});
    await service.resetPassword({
      token: 'x'.repeat(64),
      newPassword: 'novasenha123',
    });
    expect(tokens.consume).toHaveBeenCalledWith({
      token: 'x'.repeat(64),
      kind: 'RESET',
    });
    const updArg = (prisma.user.update as jest.Mock).mock.calls[0][0];
    expect(updArg.where).toEqual({ id: 'u1' });
    expect(await bcrypt.compare('novasenha123', updArg.data.passwordHash)).toBe(
      true,
    );
  });
});
