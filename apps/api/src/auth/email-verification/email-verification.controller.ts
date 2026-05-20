import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../decorators/public.decorator';
import { CredentialsService } from '../credentials/credentials.service';
import { SignupDto } from '../credentials/dto/signup.dto';
import { EmailVerificationService } from './email-verification.service';
import { VerifyDto } from './dto/verify.dto';
import { ForgotDto } from './dto/forgot.dto';
import { ResetDto } from './dto/reset.dto';

@Controller('api/v1/auth')
@Public()
@Throttle({ 'auth-email': { limit: 5, ttl: 15 * 60_000 } })
export class AuthController {
  constructor(
    private readonly credentials: CredentialsService,
    private readonly verification: EmailVerificationService,
  ) {}

  @Post('signup')
  @HttpCode(202)
  async signup(@Body() body: SignupDto): Promise<{ ok: true }> {
    await this.credentials.signup(body);
    return { ok: true };
  }

  @Post('verify')
  @HttpCode(200)
  async verify(@Body() body: VerifyDto): Promise<{ ok: true }> {
    await this.verification.verify(body);
    return { ok: true };
  }

  @Post('forgot-password')
  @HttpCode(202)
  async forgot(@Body() body: ForgotDto): Promise<{ ok: true }> {
    await this.verification.forgotPassword(body);
    return { ok: true };
  }

  @Post('reset-password')
  @HttpCode(200)
  async reset(@Body() body: ResetDto): Promise<{ ok: true }> {
    await this.verification.resetPassword(body);
    return { ok: true };
  }
}
