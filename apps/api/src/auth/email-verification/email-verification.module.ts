import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailModule } from '../../email/email.module';
import { EmailTokenService } from './email-token.service';
import { EmailVerificationService } from './email-verification.service';
import { AuthController } from './email-verification.controller';
import { CredentialsModule } from '../credentials/credentials.module';

@Module({
  imports: [PrismaModule, EmailModule, forwardRef(() => CredentialsModule)],
  controllers: [AuthController],
  providers: [EmailTokenService, EmailVerificationService],
  exports: [EmailTokenService, EmailVerificationService],
})
export class EmailVerificationModule {}
