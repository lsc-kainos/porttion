-- CreateEnum
CREATE TYPE "MovementType" AS ENUM ('BUY', 'SELL', 'DEPOSIT', 'WITHDRAW', 'DIVIDEND');

-- CreateTable
CREATE TABLE "Movement" (
    "id" TEXT NOT NULL,
    "walletId" TEXT NOT NULL,
    "ticker" TEXT,
    "type" "MovementType" NOT NULL,
    "qty" DOUBLE PRECISION NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "occurredAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Movement_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Movement_walletId_occurredAt_idx" ON "Movement"("walletId", "occurredAt");

-- CreateIndex
CREATE INDEX "Movement_walletId_ticker_idx" ON "Movement"("walletId", "ticker");

-- AddForeignKey
ALTER TABLE "Movement" ADD CONSTRAINT "Movement_walletId_fkey" FOREIGN KEY ("walletId") REFERENCES "Wallet"("id") ON DELETE CASCADE ON UPDATE CASCADE;
