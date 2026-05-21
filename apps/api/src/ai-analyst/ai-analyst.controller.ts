import { Body, Controller, Post, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AiAnalystService } from './ai-analyst.service';
import { AnalyzeAssetDto } from './dto/analyze-asset.dto';

interface AuthedRequest {
  user: { id: string };
}

@Controller({ path: 'analyst', version: '1' })
export class AiAnalystController {
  constructor(private readonly analyst: AiAnalystService) {}

  @Post('asset')
  @Throttle({ 'ai-analyst': { limit: 20, ttl: 24 * 60 * 60 * 1000 } })
  analyze(@Req() req: AuthedRequest, @Body() dto: AnalyzeAssetDto) {
    return this.analyst.analyze(req.user.id, dto.ticker, dto.windowDays);
  }
}
