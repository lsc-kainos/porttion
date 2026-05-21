import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly client: Resend;
  private readonly from: string;

  constructor(cfg: ConfigService) {
    this.client = new Resend(cfg.getOrThrow<string>('RESEND_API_KEY'));
    this.from = cfg.getOrThrow<string>('EMAIL_FROM');
  }

  async send({ to, subject, html }: SendEmailInput): Promise<void> {
    const { error } = await this.client.emails.send({
      from: this.from,
      to,
      subject,
      html,
    });
    if (error) {
      // Não logar `error.message` direto — pode conter PII (ex.: email do destinatário).
      const safeName =
        (error as { name?: string })?.name ?? 'UnknownResendError';
      this.logger.error(`Resend error: ${safeName}`);
      throw new Error(`Email send failed: ${error.message}`);
    }
  }
}
