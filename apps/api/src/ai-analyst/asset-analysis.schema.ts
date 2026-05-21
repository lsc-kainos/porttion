import { z } from 'zod';

export const assetAnalysisPayloadSchema = z.object({
  tendencia: z.enum(['alta', 'lateral', 'baixa']),
  recomendacao: z.enum(['comprar', 'manter', 'nao_comprar']),
  confianca: z.number().int().min(0).max(100),
  padroes: z.array(z.string().min(1).max(80)).max(4),
  riscos: z.array(z.string().min(1).max(120)).max(3),
  sugestao: z.string().min(1).max(280),
  justificativa: z.string().min(1).max(500),
  horizonte: z.string().min(1).max(40),
});

export type AssetAnalysisPayload = z.infer<typeof assetAnalysisPayloadSchema>;
