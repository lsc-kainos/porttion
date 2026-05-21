import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailModule } from '../../email/email.module';
import { EmailVerificationModule } from '../email-verification/email-verification.module';
import { CredentialsService } from './credentials.service';
import { InternalCredentialsController } from './internal-credentials.controller';

@Module({
  imports: [
    PrismaModule,
    EmailModule,
    forwardRef(() => EmailVerificationModule),
  ],
  controllers: [InternalCredentialsController],
  providers: [CredentialsService],
  exports: [CredentialsService],
})
export class CredentialsModule {}
