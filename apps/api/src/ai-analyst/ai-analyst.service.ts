import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import type { ModelMessage } from 'ai';
import { PrismaService } from '../prisma/prisma.service';
import { MarketService } from '../market/market.service';
import { AiRuntimeService } from '../ai-runtime/ai-runtime.service';
import { LlmConfigService } from '../ai-runtime/llm-config.service';
import { assetAnalysisPayloadSchema } from './asset-analysis.schema';
import type { AssetAnalysisDto } from '@kainos/shared-types';

const CACHE_TTL_MS = 60 * 60 * 1000;
const PROMPT_KEY = 'asset.analysis.v1';

@Injectable()
export class AiAnalystService {
  private readonly logger = new Logger(AiAnalystService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly market: MarketService,
    private readonly runtime: AiRuntimeService,
    private readonly llmConfig: LlmConfigService,
  ) {}

  async analyze(
    userId: string,
    ticker: string,
    windowDays: 7,
  ): Promise<AssetAnalysisDto> {
    const t = ticker.toUpperCase();

    // 1. cache lookup (1h TTL, owned by userId)
    const cached = await this.prisma.assetAnalysis.findFirst({
      where: {
        userId,
        ticker: t,
        windowDays,
        createdAt: { gte: new Date(Date.now() - CACHE_TTL_MS) },
      },
      orderBy: { createdAt: 'desc' },
    });
    if (cached) {
      this.logger.log({ event: 'ai.analysis.cache_hit', userId, ticker: t });
      return this.toDto(cached, true);
    }

    // 2. validateTicker — throws 422 if unknown
    const meta = await this.market.validateTicker(t);

    // 3. candles (30d window, slice last 7)
    const ohlc = await this.market.ohlc(t, '30d');
    const candles = ohlc.slice(-7);
    if (candles.length < 7) {
      throw new ServiceUnavailableException({
        statusCode: 503,
        message: 'Cotações insuficientes para análise',
      });
    }

    // 4. resolve active prompt version for persistence
    const configRecord = await this.llmConfig.findActive(PROMPT_KEY);
    const promptVersion = configRecord?.version ?? 1;

    // 5. build user message with dynamic content inside <dados> delimiters
    //    (prompt injection guard — content never used as instruction)
    const userContent = `<dados>
ticker: ${t}
classe: ${meta.assetClass}
candles_recentes (mais antigo → mais recente):
${JSON.stringify(candles, null, 2)}
</dados>`;

    const messages: ModelMessage[] = [{ role: 'user', content: userContent }];

    // 6. call ai-runtime
    let payload: ReturnType<typeof assetAnalysisPayloadSchema.parse>;
    try {
      const raw = await this.runtime.generateObject({
        key: PROMPT_KEY,
        schema: assetAnalysisPayloadSchema,
        messages,
      });
      payload = assetAnalysisPayloadSchema.parse(raw);
    } catch (err) {
      this.logger.warn({
        event: 'ai.analysis.failed',
        userId,
        ticker: t,
        err: (err as Error).message,
      });
      throw new ServiceUnavailableException({
        statusCode: 503,
        message: 'Análise indisponível agora',
      });
    }

    // 7. persist (ownership: userId on every write)
    const record = await this.prisma.assetAnalysis.create({
      data: {
        userId,
        ticker: t,
        windowDays,
        payload: payload,
        promptKey: PROMPT_KEY,
        promptVersion,
      },
    });

    this.logger.log({ event: 'ai.analysis.generated', userId, ticker: t });
    return this.toDto(record, false);
  }

  private toDto(
    record: {
      ticker: string;
      windowDays: number;
      payload: unknown;
      promptKey: string;
      promptVersion: number;
      createdAt: Date;
    },
    cached: boolean,
  ): AssetAnalysisDto {
    return {
      ticker: record.ticker,
      windowDays: record.windowDays,
      generatedAt: record.createdAt.toISOString(),
      promptKey: record.promptKey,
      promptVersion: record.promptVersion,
      cached,
      payload: record.payload as AssetAnalysisDto['payload'],
    };
  }
}
