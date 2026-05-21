import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { EmailTokenService } from '../email-verification/email-token.service';
import { CredentialsService } from './credentials.service';
import { ConfigService } from '@nestjs/config';

describe('CredentialsService', () => {
  const prisma = {
    user: { findUnique: jest.fn(), create: jest.fn(), delete: jest.fn() },
  } as unknown as PrismaService;
  const email = { send: jest.fn() } as unknown as EmailService;
  const tokens = { issue: jest.fn() } as unknown as EmailTokenService;
  const cfg = {
    getOrThrow: () => 'https://porttion.app',
  } as unknown as ConfigService;
  const service = new CredentialsService(prisma, email, tokens, cfg);

  beforeEach(() => jest.clearAllMocks());

  describe('signup', () => {
    it('cria usuário, gera token VERIFY 24h e envia email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        name: 'A',
      });
      (tokens.issue as jest.Mock).mockResolvedValue('rawtoken');
      (email.send as jest.Mock).mockResolvedValue(undefined);

      await service.signup({
        email: 'a@b.com',
        name: 'A',
        password: 'senha12345',
      });

      const created = (prisma.user.create as jest.Mock).mock.calls[0][0].data;
      expect(created.email).toBe('a@b.com');
      expect(created.passwordHash).not.toBe('senha12345');
      expect(await bcrypt.compare('senha12345', created.passwordHash)).toBe(
        true,
      );
      expect(tokens.issue).toHaveBeenCalledWith({
        userId: 'u1',
        kind: 'VERIFY',
        ttlMinutes: 60 * 24,
      });
      expect(email.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'a@b.com',
          subject: expect.stringMatching(/Confirme/),
          html: expect.stringContaining(
            'https://porttion.app/verify-email/rawtoken',
          ),
        }),
      );
    });

    it('rejeita email duplicado com 409', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1' });
      await expect(
        service.signup({ email: 'a@b.com', name: 'A', password: 'senha12345' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('faz rollback do user se o envio do email falhar', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        name: 'A',
      });
      (tokens.issue as jest.Mock).mockResolvedValue('rawtoken');
      (email.send as jest.Mock).mockRejectedValue(
        new Error('Email send failed: domain not verified'),
      );
      (prisma.user.delete as jest.Mock).mockResolvedValue({});

      await expect(
        service.signup({ email: 'a@b.com', name: 'A', password: 'senha12345' }),
      ).rejects.toThrow(/Email send failed/);

      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
    });

    it('faz rollback do user se a emissão do token falhar', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        name: 'A',
      });
      (tokens.issue as jest.Mock).mockRejectedValue(
        new Error('DB unavailable'),
      );
      (prisma.user.delete as jest.Mock).mockResolvedValue({});

      await expect(
        service.signup({ email: 'a@b.com', name: 'A', password: 'senha12345' }),
      ).rejects.toThrow(/DB unavailable/);

      expect(prisma.user.delete).toHaveBeenCalledWith({ where: { id: 'u1' } });
      expect(email.send).not.toHaveBeenCalled();
    });
  });

  describe('validate', () => {
    it('retorna user quando email/senha conferem e email verificado', async () => {
      const hash = await bcrypt.hash('senha12345', 10);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        name: 'A',
        avatar: null,
        passwordHash: hash,
        emailVerifiedAt: new Date(),
      });
      const res = await service.validate({
        email: 'a@b.com',
        password: 'senha12345',
      });
      expect(res).toEqual({
        id: 'u1',
        email: 'a@b.com',
        name: 'A',
        avatar: null,
      });
    });

    it('rejeita 401 se usuário não existe', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(
        service.validate({ email: 'x@x.com', password: 'qualquer' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejeita 401 se senha errada', async () => {
      const hash = await bcrypt.hash('senha12345', 10);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        passwordHash: hash,
        emailVerifiedAt: new Date(),
      });
      await expect(
        service.validate({ email: 'a@b.com', password: 'errada' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejeita 401 com mensagem "email não verificado" se emailVerifiedAt é null', async () => {
      const hash = await bcrypt.hash('senha12345', 10);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        passwordHash: hash,
        emailVerifiedAt: null,
      });
      await expect(
        service.validate({ email: 'a@b.com', password: 'senha12345' }),
      ).rejects.toThrow(/não verificado/i);
    });

    it('rejeita 401 se passwordHash é null (conta criada por OAuth)', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        passwordHash: null,
        emailVerifiedAt: new Date(),
      });
      await expect(
        service.validate({ email: 'a@b.com', password: 'qualquer' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
