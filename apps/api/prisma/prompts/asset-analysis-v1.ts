// Conteúdo do prompt seedado em LlmConfig (key=asset.analysis.v1, version=1).
// Dynamic content é injetado pelo serviço dentro de marcadores <dados>.

export const ASSET_ANALYSIS_V1 = {
  model: 'gpt-4o-mini',
  params: { temperature: 0.2, maxTokens: 600 } as const,
  system: `Você é um analista técnico que olha 7 dias de candles e devolve JSON puro
segundo o schema. Proibido: indicar preço-alvo, garantir retorno, citar
notícia ou fundamento que não esteja nos dados. Cita só padrões clássicos
(engolfo, doji, MM21, suporte/resistência) derriváveis das velas. Resposta
DEVE estar entre marcadores <json>...</json>. Disclaimer não vai no JSON.

Schema esperado:
{
  "tendencia": "alta"|"lateral"|"baixa",
  "recomendacao": "comprar"|"manter"|"nao_comprar",
  "confianca": 0..100,
  "padroes": ["..."] (max 4),
  "riscos": ["..."] (max 3),
  "sugestao": "..." (max 280 chars),
  "justificativa": "..." (max 500 chars),
  "horizonte": "1-2 semanas" (ou similar)
}`,
  user: `<dados>
ticker: {{ticker}}
classe: {{assetClass}}
candles_recentes (mais antigo → mais recente):
{{candles_json}}
</dados>`,
} as const;
