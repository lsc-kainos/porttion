import { PrismaService } from '../../prisma/prisma.service';
import { EmailTokenService } from './email-token.service';

describe('EmailTokenService', () => {
  const prisma = {
    emailToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  } as unknown as PrismaService;
  const service = new EmailTokenService(prisma);

  beforeEach(() => jest.clearAllMocks());

  it('issue() gera token de 32 bytes hex e persiste apenas o hash', async () => {
    (prisma.emailToken.create as jest.Mock).mockResolvedValue({});
    const token = await service.issue({
      userId: 'u1',
      kind: 'VERIFY',
      ttlMinutes: 60,
    });
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    const arg = (prisma.emailToken.create as jest.Mock).mock.calls[0][0].data;
    expect(arg.userId).toBe('u1');
    expect(arg.kind).toBe('VERIFY');
    expect(arg.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(arg.tokenHash).not.toBe(token);
    expect(arg.expiresAt).toBeInstanceOf(Date);
  });

  it('consume() valida hash, expiração e marca usedAt', async () => {
    const token = 'a'.repeat(64);
    const tokenHash = require('node:crypto')
      .createHash('sha256')
      .update(token)
      .digest('hex');
    (prisma.emailToken.findUnique as jest.Mock).mockResolvedValue({
      id: 't1',
      userId: 'u1',
      kind: 'VERIFY',
      tokenHash,
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
    });
    (prisma.emailToken.update as jest.Mock).mockResolvedValue({});
    const res = await service.consume({ token, kind: 'VERIFY' });
    expect(res.userId).toBe('u1');
    expect(prisma.emailToken.update).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: { usedAt: expect.any(Date) },
    });
  });

  it('consume() rejeita token usado', async () => {
    (prisma.emailToken.findUnique as jest.Mock).mockResolvedValue({
      id: 't1',
      kind: 'VERIFY',
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: new Date(),
    });
    await expect(
      service.consume({ token: 'x'.repeat(64), kind: 'VERIFY' }),
    ).rejects.toThrow(/inválido/);
  });

  it('consume() rejeita expirado', async () => {
    (prisma.emailToken.findUnique as jest.Mock).mockResolvedValue({
      id: 't1',
      kind: 'VERIFY',
      expiresAt: new Date(Date.now() - 1000),
      usedAt: null,
    });
    await expect(
      service.consume({ token: 'x'.repeat(64), kind: 'VERIFY' }),
    ).rejects.toThrow(/expirado/);
  });

  it('consume() rejeita kind divergente', async () => {
    (prisma.emailToken.findUnique as jest.Mock).mockResolvedValue({
      id: 't1',
      kind: 'RESET',
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
    });
    await expect(
      service.consume({ token: 'x'.repeat(64), kind: 'VERIFY' }),
    ).rejects.toThrow(/inválido/);
  });
});
