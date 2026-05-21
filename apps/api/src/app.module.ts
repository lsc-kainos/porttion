import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { BullModule } from '@nestjs/bullmq';
import { ThrottlerModule } from '@nestjs/throttler';
import { validateEnv } from './config/env.schema';
import { AuthModule } from './auth/auth.module';
import { HealthModule } from './health/health.module';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { StorageModule } from './storage/storage.module';
import { QueueModule } from './queue/queue.module';
import { BullBoardAdminModule } from './queue/bull-board.module';
import { MetricsModule } from './admin/metrics/metrics.module';
import { AiRuntimeModule } from './ai-runtime/ai-runtime.module';
import { EmailModule } from './email/email.module';
import { CredentialsModule } from './auth/credentials/credentials.module';
import { EmailVerificationModule } from './auth/email-verification/email-verification.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './auth/guards/roles.guard';
import { UserScopedThrottlerGuard } from './auth/guards/user-scoped-throttler.guard';
import { LoggerInterceptor } from './common/interceptors/logger.interceptor';
import { MarketModule } from './market/market.module';
import { WalletsModule } from './wallets/wallets.module';
import { PositionsModule } from './positions/positions.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        connection: { url: cfg.getOrThrow<string>('REDIS_URL') },
      }),
    }),
    ThrottlerModule.forRoot([
      // Limites generosos: propósito é cortar abuso de API, não constranger
      // uso real. Ajuste por feature conforme adicionar buckets.
      { name: 'default', ttl: 60_000, limit: 600 },
      { name: 'auth-email', ttl: 15 * 60_000, limit: 5 },
      { name: 'market', ttl: 60_000, limit: 60 },
      { name: 'ai-analyst', ttl: 86_400_000, limit: 20 },
    ]),
    PrismaModule,
    HealthModule,
    AuthModule,
    EmailModule,
    CredentialsModule,
    EmailVerificationModule,
    UsersModule,
    StorageModule,
    QueueModule,
    AiRuntimeModule,
    MetricsModule,
    MarketModule,
    WalletsModule,
    PositionsModule,
    ...(process.env.BULL_BOARD_ENABLED === 'true'
      ? [BullBoardAdminModule]
      : []),
  ],
  providers: [
    { provide: APP_INTERCEPTOR, useClass: LoggerInterceptor },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: UserScopedThrottlerGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
