// Seed: Carteira Grupo 04
//
// Cria (ou atualiza) a carteira "Carteira Grupo 04" para o usuário
// lsc@kainos-labs.com.br com o estado final consolidado das movimentações
// da turma (último snapshot — 13/05/2026, TOTAL R$ 99.537,07).
//
// Como o schema atual armazena apenas o estado corrente (Position é snapshot,
// não histórico de movimentações), o seed materializa a foto final.
//
// Execução: `npx tsx apps/api/prisma/seeds/carteira-grupo-04.ts`
// ou via npm: `npm run seed:carteira-grupo-04 -w @kainos/api`

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const USER_EMAIL = 'lsc@kainos-labs.com.br';
const WALLET_NAME = 'Carteira Grupo 04';

type SeedPosition = {
  ticker: string;
  qty: number;
  avgPrice: number;
  assetClass: 'acoes_br' | 'etf' | 'renda_fixa' | 'cripto' | 'moeda';
};

// Estado final — CARTEIRA 7, DATA: 13/05/2026, TOTAL R$ 99.537,07.
// `caixa` é modelado como posição em `moeda` com avgPrice=1 (não existe campo
// dedicado para saldo livre no schema atual).
const POSITIONS: SeedPosition[] = [
  {
    ticker: 'TESOURO_SELIC_2031',
    qty: 3.34,
    avgPrice: 18587.65,
    assetClass: 'renda_fixa',
  },
  { ticker: 'PETR4', qty: 230, avgPrice: 47.46, assetClass: 'acoes_br' },
  { ticker: 'BOVA11', qty: 65, avgPrice: 182.2, assetClass: 'etf' },
  { ticker: 'TAEE11', qty: 18, avgPrice: 42.54, assetClass: 'etf' },
  { ticker: 'BBDC4', qty: 134, avgPrice: 19.0, assetClass: 'acoes_br' },
  { ticker: 'KEPL3', qty: 105, avgPrice: 7.73, assetClass: 'acoes_br' },
  { ticker: 'USD', qty: 760.18, avgPrice: 5.2275, assetClass: 'moeda' },
  { ticker: 'EUR', qty: 661.35, avgPrice: 6.0482, assetClass: 'moeda' },
  { ticker: 'OURO', qty: 130, avgPrice: 24.67, assetClass: 'moeda' },
  { ticker: 'CAIXA', qty: 10.23, avgPrice: 1, assetClass: 'moeda' },
];

async function main(): Promise<void> {
  const user = await prisma.user.upsert({
    where: { email: USER_EMAIL },
    create: { email: USER_EMAIL, name: 'lsc', role: 'USER' },
    update: {},
  });

  const wallet = await prisma.wallet.upsert({
    where: { userId_name: { userId: user.id, name: WALLET_NAME } },
    create: {
      userId: user.id,
      name: WALLET_NAME,
      baseCurrency: 'BRL',
      strategy: 'Carteira didática do Grupo 04 (snapshot 13/05/2026)',
    },
    update: {
      baseCurrency: 'BRL',
      strategy: 'Carteira didática do Grupo 04 (snapshot 13/05/2026)',
    },
  });

  for (const p of POSITIONS) {
    await prisma.position.upsert({
      where: { walletId_ticker: { walletId: wallet.id, ticker: p.ticker } },
      create: {
        walletId: wallet.id,
        ticker: p.ticker,
        qty: p.qty,
        avgPrice: p.avgPrice,
        assetClass: p.assetClass,
      },
      update: {
        qty: p.qty,
        avgPrice: p.avgPrice,
        assetClass: p.assetClass,
      },
    });
  }

  // eslint-disable-next-line no-console
  console.log(
    `[seed:carteira-grupo-04] wallet=${wallet.id} positions=${POSITIONS.length}`,
  );
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[seed:carteira-grupo-04] failed', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
