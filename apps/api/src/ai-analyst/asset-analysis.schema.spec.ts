import { assetAnalysisPayloadSchema } from './asset-analysis.schema';

describe('assetAnalysisPayloadSchema', () => {
  const valid = {
    tendencia: 'alta',
    recomendacao: 'comprar',
    confianca: 75,
    padroes: ['engolfo'],
    riscos: ['volatilidade'],
    sugestao: 'Considere posição reduzida.',
    justificativa: 'Padrão de continuação após suporte testado.',
    horizonte: '1-2 semanas',
  };

  it('aceita payload válido', () => {
    expect(() => assetAnalysisPayloadSchema.parse(valid)).not.toThrow();
  });

  it('rejeita recomendacao fora do enum', () => {
    expect(() =>
      assetAnalysisPayloadSchema.parse({ ...valid, recomendacao: 'vender' }),
    ).toThrow();
  });

  it('rejeita confianca > 100', () => {
    expect(() =>
      assetAnalysisPayloadSchema.parse({ ...valid, confianca: 120 }),
    ).toThrow();
  });

  it('rejeita padroes com mais de 4 itens', () => {
    expect(() =>
      assetAnalysisPayloadSchema.parse({
        ...valid,
        padroes: ['a', 'b', 'c', 'd', 'e'],
      }),
    ).toThrow();
  });

  it('rejeita sugestao com mais de 280 chars', () => {
    expect(() =>
      assetAnalysisPayloadSchema.parse({ ...valid, sugestao: 'x'.repeat(281) }),
    ).toThrow();
  });
});
