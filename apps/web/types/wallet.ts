// PROVISÓRIO — será removido no Commit 3 quando @kainos/shared-types
// exportar os tipos via packages/shared-types/src/porttion.ts.
export interface WalletSummary {
  id: string;
  name: string;
  baseCurrency: 'BRL' | 'USD' | 'EUR';
  strategy: 'balanceada' | 'crescimento' | 'renda' | 'personalizada' | null;
  positionsCount: number;
  patrimonio: number | null;
  plTotal: number | null;
  variacaoDiaPct: number | null;
  stale: boolean;
  createdAt: string;
  updatedAt: string;
}
