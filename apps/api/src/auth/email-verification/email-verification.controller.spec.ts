import { Test } from '@nestjs/testing';
import { CredentialsService } from '../credentials/credentials.service';
import { EmailVerificationService } from './email-verification.service';
import { AuthController } from './email-verification.controller';
import { ConfigService } from '@nestjs/config';

describe('AuthController', () => {
  let controller: AuthController;
  const credentials = { signup: jest.fn() } as unknown as CredentialsService;
  const verification = {
    verify: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  } as unknown as EmailVerificationService;

  beforeEach(async () => {
    const mod = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: CredentialsService, useValue: credentials },
        { provide: EmailVerificationService, useValue: verification },
        { provide: ConfigService, useValue: { get: jest.fn() } },
      ],
    }).compile();
    controller = mod.get(AuthController);
    jest.clearAllMocks();
  });

  it('POST /auth/signup', async () => {
    await controller.signup({
      email: 'a@b.com',
      name: 'A',
      password: 'senha12345',
    });
    expect(credentials.signup).toHaveBeenCalledWith({
      email: 'a@b.com',
      name: 'A',
      password: 'senha12345',
    });
  });

  it('POST /auth/verify', async () => {
    await controller.verify({ token: 'x'.repeat(64) });
    expect(verification.verify).toHaveBeenCalledWith({ token: 'x'.repeat(64) });
  });

  it('POST /auth/forgot-password', async () => {
    await controller.forgot({ email: 'a@b.com' });
    expect(verification.forgotPassword).toHaveBeenCalledWith({
      email: 'a@b.com',
    });
  });

  it('POST /auth/reset-password', async () => {
    await controller.reset({
      token: 'x'.repeat(64),
      newPassword: 'novasenha123',
    });
    expect(verification.resetPassword).toHaveBeenCalledWith({
      token: 'x'.repeat(64),
      newPassword: 'novasenha123',
    });
  });
});
