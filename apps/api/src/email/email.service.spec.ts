import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

const sendMock = jest.fn();
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send: sendMock } })),
}));

describe('EmailService', () => {
  let service: EmailService;
  const cfg = {
    getOrThrow: (k: string) =>
      ({ RESEND_API_KEY: 're_x', EMAIL_FROM: 'no-reply@porttion.app' })[
        k
      ] as string,
  } as unknown as ConfigService;

  beforeEach(() => {
    sendMock.mockReset();
    sendMock.mockResolvedValue({ data: { id: 'mock' }, error: null });
    service = new EmailService(cfg);
  });

  it('envia email com from, to, subject e html', async () => {
    await service.send({
      to: 'u@x.com',
      subject: 'Confirmar',
      html: '<p>oi</p>',
    });
    expect(sendMock).toHaveBeenCalledWith({
      from: 'no-reply@porttion.app',
      to: 'u@x.com',
      subject: 'Confirmar',
      html: '<p>oi</p>',
    });
  });

  it('lança erro se Resend devolver error', async () => {
    sendMock.mockResolvedValue({
      data: null,
      error: { message: 'invalid api key' },
    });
    await expect(
      service.send({ to: 'u@x.com', subject: 's', html: '<p/>' }),
    ).rejects.toThrow(/invalid api key/);
  });
});
