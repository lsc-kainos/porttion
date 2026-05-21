import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const TEST_EMAIL = 'e2e@porttion.test';
const TEST_PASSWORD = 'e2e-secret-must-be-strong-1';

export async function setupTestUser(): Promise<{ email: string; password: string }> {
  const prisma = new PrismaClient();
  try {
    const passwordHash = await bcrypt.hash(TEST_PASSWORD, 10);
    // Destructive: deleteMany cascades into wallets/positions/etc. Without this,
    // a previous test run that failed before afterAll could leave a wallet
    // behind, breaking the empty-state assertion at the start of the slice.
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
    await prisma.user.create({
      data: {
        email: TEST_EMAIL,
        name: 'E2E User',
        passwordHash,
        emailVerifiedAt: new Date(),
        role: 'USER',
      },
    });
    return { email: TEST_EMAIL, password: TEST_PASSWORD };
  } finally {
    await prisma.$disconnect();
  }
}

export async function cleanupTestUser(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    await prisma.user.deleteMany({ where: { email: TEST_EMAIL } });
  } finally {
    await prisma.$disconnect();
  }
}
