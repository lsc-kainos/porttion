import { Module } from '@nestjs/common';
import { AiAnalystController } from './ai-analyst.controller';
import { AiAnalystService } from './ai-analyst.service';
import { MarketModule } from '../market/market.module';
import { AiRuntimeModule } from '../ai-runtime/ai-runtime.module';

@Module({
  imports: [MarketModule, AiRuntimeModule],
  controllers: [AiAnalystController],
  providers: [AiAnalystService],
})
export class AiAnalystModule {}
