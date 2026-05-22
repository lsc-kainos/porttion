// Seed: movimentações da Carteira Grupo 04
//
// Inferidas dos snapshots semanais (Carteira 1 → 7) e dos blocos
// "MUDANÇAS CARTEIRA X PARA Y". Como o grupo informou que não houve novos
// aportes — apenas realocações — todo delta de quantidade é compra ou venda.
//
// Pressuposto: a carteira inicial em 25/03/2026 foi montada com compras à
// vista no preço de custo da própria planilha (preço custo = preço atual na
// Carteira 1).
//
// Execução: `npx tsx apps/api/prisma/seeds/carteira-grupo-04-movimentos.ts`
// ou via npm: `npm run seed:carteira-grupo-04-movimentos -w @kainos/api`
//
// Idempotente — limpa as movimentações da carteira antes de reinserir.

import { PrismaClient, MovementType } from '@prisma/client';

const prisma = new PrismaClient();

const USER_EMAIL = 'lsc@kainos-labs.com.br';
const WALLET_NAME = 'Carteira Grupo 04';

type SeedMovement = {
  occurredAt: string; // ISO date
  type: MovementType;
  ticker: string;
  qty: number;
  price: number;
  notes?: string;
};

const INITIAL_DATE = '2026-03-25T00:00:00.000Z';

// Compras iniciais (Carteira 1 — 25/03/2026). preço custo == preço atual no
// snapshot inicial; assumimos que cada linha veio de uma compra.
const INITIAL_BUYS: SeedMovement[] = [
  { ticker: 'TESOURO_SELIC_2031', qty: 3.34, price: 18587.65 },
  { ticker: 'PETR4', qty: 95, price: 47.46 },
  { ticker: 'BOVA11', qty: 55, price: 182.2 },
  { ticker: 'FIQE3', qty: 758, price: 6.59 },
  { ticker: 'PRIO3', qty: 37, price: 67.4 },
  { ticker: 'INTB3', qty: 267, price: 14.87 },
  { ticker: 'USD', qty: 760.18, price: 5.2275 },
  { ticker: 'EUR', qty: 661.35, price: 6.0482 },
  { ticker: 'OURO', qty: 160, price: 24.67 },
].map((m) => ({
  ...m,
  occurredAt: INITIAL_DATE,
  type: MovementType.BUY,
  notes: 'Montagem inicial da carteira',
}));

// Realocações (datadas pelo snapshot pós-operação).
// Fonte: blocos "MUDANÇAS CARTEIRA X PARA Y" da planilha do grupo.
const REALLOCATIONS: SeedMovement[] = [
  // C2 → C3 (08/04/2026)
  {
    occurredAt: '2026-04-08T00:00:00.000Z',
    type: MovementType.SELL,
    ticker: 'PRIO3',
    qty: 17,
    price: 64.1,
  },
  {
    occurredAt: '2026-04-08T00:00:00.000Z',
    type: MovementType.SELL,
    ticker: 'FIQE3',
    qty: 30,
    price: 7.2,
  },
  {
    occurredAt: '2026-04-08T00:00:00.000Z',
    type: MovementType.BUY,
    ticker: 'PETR4',
    qty: 28,
    price: 46.62,
  },

  // C5 → C5.1 (27/04/2026) — mudança emergencial
  {
    occurredAt: '2026-04-27T00:00:00.000Z',
    type: MovementType.SELL,
    ticker: 'INTB3',
    qty: 267,
    price: 14.65,
    notes: 'Realocação emergencial',
  },
  {
    occurredAt: '2026-04-27T00:00:00.000Z',
    type: MovementType.SELL,
    ticker: 'FIQE3',
    qty: 728,
    price: 6.8,
    notes: 'Realocação emergencial',
  },
  {
    occurredAt: '2026-04-27T00:00:00.000Z',
    type: MovementType.BUY,
    ticker: 'PETR4',
    qty: 187,
    price: 47.25,
    notes: 'Realocação emergencial',
  },

  // C5.1 → C6 (29/04/2026)
  {
    occurredAt: '2026-04-29T00:00:00.000Z',
    type: MovementType.SELL,
    ticker: 'PRIO3',
    qty: 20,
    price: 66.35,
  },
  {
    occurredAt: '2026-04-29T00:00:00.000Z',
    type: MovementType.SELL,
    ticker: 'PETR4',
    qty: 20,
    price: 48.9,
  },
  {
    occurredAt: '2026-04-29T00:00:00.000Z',
    type: MovementType.BUY,
    ticker: 'BBDC4',
    qty: 40,
    price: 19.0,
  },
  {
    occurredAt: '2026-04-29T00:00:00.000Z',
    type: MovementType.BUY,
    ticker: 'TAEE11',
    qty: 18,
    price: 42.54,
  },
  {
    occurredAt: '2026-04-29T00:00:00.000Z',
    type: MovementType.BUY,
    ticker: 'KEPL3',
    qty: 105,
    price: 7.73,
  },

  // C6 → C7 (07/05/2026). "GOLD11" na planilha = OURO (delta 160→130 = 30).
  {
    occurredAt: '2026-05-07T00:00:00.000Z',
    type: MovementType.SELL,
    ticker: 'PETR4',
    qty: 60,
    price: 44.62,
  },
  {
    occurredAt: '2026-05-07T00:00:00.000Z',
    type: MovementType.SELL,
    ticker: 'OURO',
    qty: 30,
    price: 24.44,
    notes: 'Planilha refere como GOLD11; delta bate com OURO (160→130)',
  },
  {
    occurredAt: '2026-05-07T00:00:00.000Z',
    type: MovementType.BUY,
    ticker: 'BOVA11',
    qty: 10,
    price: 173.87,
  },
  {
    occurredAt: '2026-05-07T00:00:00.000Z',
    type: MovementType.BUY,
    ticker: 'BBDC4',
    qty: 94,
    price: 17.69,
  },
];

const ALL_MOVEMENTS: SeedMovement[] = [...INITIAL_BUYS, ...REALLOCATIONS];

async function main(): Promise<void> {
  const user = await prisma.user.findUnique({ where: { email: USER_EMAIL } });
  if (!user) {
    throw new Error(
      `Usuário ${USER_EMAIL} não encontrado — rode primeiro o seed da carteira (carteira-grupo-04.ts).`,
    );
  }

  const wallet = await prisma.wallet.findUnique({
    where: { userId_name: { userId: user.id, name: WALLET_NAME } },
  });
  if (!wallet) {
    throw new Error(
      `Carteira "${WALLET_NAME}" não encontrada — rode primeiro o seed da carteira (carteira-grupo-04.ts).`,
    );
  }

  await prisma.movement.deleteMany({ where: { walletId: wallet.id } });

  await prisma.movement.createMany({
    data: ALL_MOVEMENTS.map((m) => ({
      walletId: wallet.id,
      ticker: m.ticker,
      type: m.type,
      qty: m.qty,
      price: m.price,
      occurredAt: new Date(m.occurredAt),
      notes: m.notes,
    })),
  });

  // eslint-disable-next-line no-console
  console.log(
    `[seed:carteira-grupo-04-movimentos] wallet=${wallet.id} movements=${ALL_MOVEMENTS.length}`,
  );
}

main()
  .catch((err) => {
    // eslint-disable-next-line no-console
    console.error('[seed:carteira-grupo-04-movimentos] failed', err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
