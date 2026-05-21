import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { CredentialsService } from './credentials.service';
import { InternalCredentialsController } from './internal-credentials.controller';

describe('InternalCredentialsController', () => {
  let controller: InternalCredentialsController;
  const service = {
    signup: jest.fn(),
    validate: jest.fn(),
  } as unknown as CredentialsService;
  const configService = { get: jest.fn() } as unknown as ConfigService;

  beforeEach(async () => {
    const mod = await Test.createTestingModule({
      controllers: [InternalCredentialsController],
      providers: [
        { provide: CredentialsService, useValue: service },
        { provide: ConfigService, useValue: configService },
      ],
    }).compile();
    controller = mod.get(InternalCredentialsController);
    jest.clearAllMocks();
  });

  it('POST /internal/auth/validate delega ao service', async () => {
    (service.validate as jest.Mock).mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      name: 'A',
      avatar: null,
    });
    const res = await controller.validate({ email: 'a@b.com', password: 'p' });
    expect(service.validate).toHaveBeenCalledWith({
      email: 'a@b.com',
      password: 'p',
    });
    expect(res).toEqual({
      id: 'u1',
      email: 'a@b.com',
      name: 'A',
      avatar: null,
    });
  });
});
