import { Test } from '@nestjs/testing';
import {
  ServiceUnavailableException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { AiAnalystService } from './ai-analyst.service';
import { PrismaService } from '../prisma/prisma.service';
import { MarketService } from '../market/market.service';
import { AiRuntimeService } from '../ai-runtime/ai-runtime.service';
import { LlmConfigService } from '../ai-runtime/llm-config.service';

const prismaMock = () => ({
  assetAnalysis: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
});

const marketMock = () => ({
  validateTicker: jest.fn(),
  ohlc: jest.fn(),
});

const runtimeMock = () => ({
  generateObject: jest.fn(),
});

const llmConfigMock = () => ({
  findActive: jest.fn().mockResolvedValue({ version: 1 }),
});

describe('AiAnalystService', () => {
  let service: AiAnalystService;
  let prisma: ReturnType<typeof prismaMock>;
  let market: ReturnType<typeof marketMock>;
  let runtime: ReturnType<typeof runtimeMock>;
  let llmConfig: ReturnType<typeof llmConfigMock>;

  beforeEach(async () => {
    prisma = prismaMock();
    market = marketMock();
    runtime = runtimeMock();
    llmConfig = llmConfigMock();
    const mod = await Test.createTestingModule({
      providers: [
        AiAnalystService,
        { provide: PrismaService, useValue: prisma },
        { provide: MarketService, useValue: market },
        { provide: AiRuntimeService, useValue: runtime },
        { provide: LlmConfigService, useValue: llmConfig },
      ],
    }).compile();
    service = mod.get(AiAnalystService);
  });

  it('cache hit: devolve análise existente sem chamar LLM', async () => {
    const cached = {
      ticker: 'PETR4',
      windowDays: 7,
      payload: {
        tendencia: 'alta',
        recomendacao: 'comprar',
        confianca: 70,
        padroes: [],
        riscos: [],
        sugestao: 's',
        justificativa: 'j',
        horizonte: '1-2 semanas',
      },
      promptKey: 'asset.analysis.v1',
      promptVersion: 1,
      createdAt: new Date(),
    };
    prisma.assetAnalysis.findFirst.mockResolvedValueOnce(cached);
    const result = await service.analyze('u1', 'PETR4', 7);
    expect(result.cached).toBe(true);
    expect(runtime.generateObject).not.toHaveBeenCalled();
  });

  it('cache miss: valida ticker, busca candles, chama LLM, persiste', async () => {
    prisma.assetAnalysis.findFirst.mockResolvedValueOnce(null);
    market.validateTicker.mockResolvedValueOnce({
      ticker: 'PETR4',
      assetClass: 'acoes_br',
      exchange: 'SAO',
      name: 'X',
    });
    market.ohlc.mockResolvedValueOnce(
      Array.from({ length: 30 }, (_, i) => ({
        date: `2026-04-${String(i + 1).padStart(2, '0')}`,
        open: 1,
        high: 1,
        low: 1,
        close: 1,
        volume: 0,
      })),
    );
    runtime.generateObject.mockResolvedValueOnce({
      tendencia: 'alta',
      recomendacao: 'comprar',
      confianca: 65,
      padroes: [],
      riscos: [],
      sugestao: 's',
      justificativa: 'j',
      horizonte: '1-2 semanas',
    });
    prisma.assetAnalysis.create.mockResolvedValueOnce({
      id: 'a1',
      ticker: 'PETR4',
      windowDays: 7,
      payload: {},
      promptKey: 'asset.analysis.v1',
      promptVersion: 1,
      createdAt: new Date(),
    });

    const result = await service.analyze('u1', 'PETR4', 7);

    expect(market.validateTicker).toHaveBeenCalledWith('PETR4');
    expect(market.ohlc).toHaveBeenCalledWith('PETR4', '30d');
    expect(runtime.generateObject).toHaveBeenCalled();
    expect(prisma.assetAnalysis.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          userId: 'u1',
          ticker: 'PETR4',
          windowDays: 7,
        }),
      }),
    );
    expect(result.cached).toBe(false);
  });

  it('ticker inválido: 422 sem chamar LLM', async () => {
    prisma.assetAnalysis.findFirst.mockResolvedValueOnce(null);
    market.validateTicker.mockRejectedValueOnce(
      new UnprocessableEntityException(),
    );
    await expect(service.analyze('u1', 'XPTO9', 7)).rejects.toBeInstanceOf(
      UnprocessableEntityException,
    );
    expect(runtime.generateObject).not.toHaveBeenCalled();
  });

  it('OHLC degradado (<7 candles): 503 sem chamar LLM', async () => {
    prisma.assetAnalysis.findFirst.mockResolvedValueOnce(null);
    market.validateTicker.mockResolvedValueOnce({
      ticker: 'PETR4',
      assetClass: 'acoes_br',
      exchange: 'SAO',
      name: 'X',
    });
    market.ohlc.mockResolvedValueOnce([
      { date: '2026-04-01', open: 1, high: 1, low: 1, close: 1, volume: 0 },
    ]);
    await expect(service.analyze('u1', 'PETR4', 7)).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
    expect(runtime.generateObject).not.toHaveBeenCalled();
  });

  it('TTL 1h respeitado: análise > 1h não conta como hit', async () => {
    // findFirst com filtro createdAt gte (now - 1h) já feito no service; aqui verificamos o where:
    prisma.assetAnalysis.findFirst.mockResolvedValueOnce(null);
    market.validateTicker.mockResolvedValueOnce({
      ticker: 'PETR4',
      assetClass: 'acoes_br',
      exchange: 'SAO',
      name: 'X',
    });
    market.ohlc.mockResolvedValueOnce(
      Array.from({ length: 10 }, () => ({
        date: '2026-04-01',
        open: 1,
        high: 1,
        low: 1,
        close: 1,
        volume: 0,
      })),
    );
    runtime.generateObject.mockResolvedValueOnce({
      tendencia: 'alta',
      recomendacao: 'comprar',
      confianca: 65,
      padroes: [],
      riscos: [],
      sugestao: 's',
      justificativa: 'j',
      horizonte: '1-2 semanas',
    });
    prisma.assetAnalysis.create.mockResolvedValueOnce({
      id: 'a1',
      ticker: 'PETR4',
      windowDays: 7,
      payload: {},
      promptKey: 'asset.analysis.v1',
      promptVersion: 1,
      createdAt: new Date(),
    });

    await service.analyze('u1', 'PETR4', 7);
    expect(prisma.assetAnalysis.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          userId: 'u1',
          ticker: 'PETR4',
          windowDays: 7,
          createdAt: expect.objectContaining({ gte: expect.any(Date) }),
        }),
      }),
    );
  });
});
