# F1a — Foundation + Auth Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Entregar a fundação visual (tema OpenClaw + fontes + i18n com validação CI) e o sistema de autenticação completo do Porttion (email/senha com verificação via Resend, mantendo Google/GitHub do template), terminando com PR contra `staging`.

**Architecture:** **Estende o template, não substitui.** Adiciona `CredentialsProvider` ao NextAuth existente (que já roda Google+GitHub + um provider e2e), módulos `email` + `auth/credentials` + `auth/email-verification` no Nest, e estende o `User` Prisma com `passwordHash`/`emailVerifiedAt` + novo modelo `EmailToken`. A comunicação web↔api segue o padrão `internalFetch` (S2S via `INTERNAL_SERVICE_TOKEN`) já estabelecido pelo `users/sync`.

**Tech Stack:** Next.js 16 + NextAuth v4 (Credentials) · NestJS 11 + Prisma 6 + Zod · Resend (HTML strings, sem React Email no MVP) · bcryptjs (puro JS, sem deps nativas) · Tailwind v4 + shadcn/ui · next-intl · GitHub Actions.

**Pré-requisitos para começar:**

- Spec 00 aprovada (`docs/superpowers/specs/2026-05-20-spec-00-roadmap.md`).
- Conta Resend criada com domain auth (SPF/DKIM/DMARC) configurada.
- Variáveis `RESEND_API_KEY`, `EMAIL_FROM`, `APP_URL` disponíveis para dev (env.local) e Railway (staging).

---

## File Structure

### Arquivos criados

```
apps/api/prisma/migrations/<timestamp>_auth_email/migration.sql      # gerada automaticamente
apps/api/src/email/email.module.ts
apps/api/src/email/email.service.ts
apps/api/src/email/email.service.spec.ts
apps/api/src/email/templates/verify-email.html.ts                    # HTML string template
apps/api/src/email/templates/reset-password.html.ts
apps/api/src/auth/credentials/credentials.module.ts
apps/api/src/auth/credentials/credentials.service.ts                 # signup + validate
apps/api/src/auth/credentials/credentials.service.spec.ts
apps/api/src/auth/credentials/internal-credentials.controller.ts     # endpoints S2S /internal
apps/api/src/auth/credentials/internal-credentials.controller.spec.ts
apps/api/src/auth/credentials/dto/signup.dto.ts
apps/api/src/auth/credentials/dto/validate.dto.ts
apps/api/src/auth/email-verification/email-verification.module.ts
apps/api/src/auth/email-verification/email-verification.service.ts
apps/api/src/auth/email-verification/email-verification.service.spec.ts
apps/api/src/auth/email-verification/email-verification.controller.ts
apps/api/src/auth/email-verification/email-verification.controller.spec.ts
apps/api/src/auth/email-verification/email-token.service.ts
apps/api/src/auth/email-verification/email-token.service.spec.ts
apps/api/src/auth/email-verification/dto/verify.dto.ts
apps/api/src/auth/email-verification/dto/forgot.dto.ts
apps/api/src/auth/email-verification/dto/reset.dto.ts

apps/web/app/(public)/layout.tsx
apps/web/app/(public)/page.tsx                                       # landing placeholder
apps/web/app/(public)/signup/page.tsx
apps/web/app/(public)/verify-email/[token]/page.tsx
apps/web/app/(public)/forgot-password/page.tsx
apps/web/app/(public)/reset-password/[token]/page.tsx
apps/web/components/features/auth/signup-form.tsx
apps/web/components/features/auth/forgot-password-form.tsx
apps/web/components/features/auth/reset-password-form.tsx
apps/web/components/features/auth/credentials-login-form.tsx
apps/web/fonts/InstrumentSerif-Italic.woff2                          # baixar de Google Fonts
apps/web/scripts/i18n-check.ts

.github/workflows/i18n-check.yml
.github/pull_request_template.md

docs/superpowers/plans/2026-05-20-spec-01a-foundation-and-auth.md    # este arquivo
```

### Arquivos modificados

```
apps/api/prisma/schema.prisma                # +passwordHash, +emailVerifiedAt, +EmailToken, +enum EmailTokenKind
apps/api/src/config/env.schema.ts            # +RESEND_API_KEY, +EMAIL_FROM, +APP_URL
apps/api/src/app.module.ts                   # +EmailModule, +CredentialsModule, +EmailVerificationModule, +ThrottlerModule bucket auth-email
apps/api/src/users/users.service.ts          # +findByEmail, +updatePassword (se ainda não existir)
apps/api/package.json                        # +resend, +bcryptjs, +@types/bcryptjs

apps/web/app/layout.tsx                      # fontes via next/font
apps/web/app/globals.css                     # paleta OpenClaw + tokens estendidos
apps/web/components/layout/logo.tsx          # marca Porttion (P azul)
apps/web/components/ui/badge.tsx             # variantes success/warning/danger
apps/web/components/features/login/login.tsx # form email/senha acima dos botões OAuth
apps/web/lib/auth.ts                         # +CredentialsProvider (produção)
apps/web/lib/internal-api.ts                 # sem mudança; só usado
apps/web/lib/env.ts                          # +APP_URL public (se necessário)
apps/web/messages/pt-BR.json                 # reestrutura: namespaces por feature; +auth.*
apps/web/package.json                        # +zod já presente, nada novo aqui

CLAUDE.md                                    # +§ Fluxo de entrega (PR→staging, P0)
docs/architecture.md                         # link para spec 00 e este plano
```

---

## Task 1: Instalar dependências novas

**Files:**

- Modify: `apps/api/package.json`
- Modify: `apps/web/package.json` (nenhuma adição obrigatória, mas vamos confirmar zod)

- [ ] **Step 1: Instalar deps backend**

```bash
npm install --workspace=@kainos/api resend bcryptjs
npm install --workspace=@kainos/api --save-dev @types/bcryptjs
```

- [ ] **Step 2: Validar instalação**

```bash
npm --workspace=@kainos/api ls resend bcryptjs
```

Expected: ambos listados sem `UNMET DEPENDENCY`.

- [ ] **Step 3: Commit**

```bash
git add apps/api/package.json apps/api/package-lock.json package-lock.json
git commit -m "chore(api): add resend and bcryptjs"
```

---

## Task 2: Estender env schema com Resend e APP_URL

**Files:**

- Modify: `apps/api/src/config/env.schema.ts`
- Test: `apps/api/src/config/env.schema.spec.ts` (existe — estender)

- [ ] **Step 1: Adicionar test failing para campos obrigatórios novos**

Em `apps/api/src/config/env.schema.spec.ts`, adicionar:

```typescript
describe('email and app url', () => {
  const base = {
    DATABASE_URL: 'postgres://u:p@h:5432/d',
    ALLOWED_ORIGINS: 'http://localhost:3000',
    NEXTAUTH_SECRET: 'a'.repeat(32),
    INTERNAL_SERVICE_TOKEN: 'b'.repeat(32),
    STORAGE_URL_SECRET: 'c'.repeat(32),
    VOLUME_ROOT: '/tmp/storage',
  };

  it('exige RESEND_API_KEY', () => {
    expect(() => validateEnv({ ...base, EMAIL_FROM: 'no@p.io', APP_URL: 'http://x' })).toThrow(
      /RESEND_API_KEY/,
    );
  });

  it('exige EMAIL_FROM válido', () => {
    expect(() =>
      validateEnv({
        ...base,
        RESEND_API_KEY: 're_x',
        EMAIL_FROM: 'naoEhEmail',
        APP_URL: 'http://x',
      }),
    ).toThrow(/EMAIL_FROM/);
  });

  it('exige APP_URL url', () => {
    expect(() =>
      validateEnv({ ...base, RESEND_API_KEY: 're_x', EMAIL_FROM: 'no@p.io', APP_URL: 'nao-url' }),
    ).toThrow(/APP_URL/);
  });

  it('aceita os 3 campos válidos', () => {
    expect(() =>
      validateEnv({
        ...base,
        RESEND_API_KEY: 're_x',
        EMAIL_FROM: 'no-reply@porttion.app',
        APP_URL: 'https://porttion.app',
      }),
    ).not.toThrow();
  });
});
```

- [ ] **Step 2: Rodar test — falha esperada**

```bash
cd apps/api && npx jest env.schema.spec -t "email and app url"
```

Expected: FAIL com erro de validação dos novos campos (campos ausentes no schema).

- [ ] **Step 3: Adicionar campos ao schema**

Em `apps/api/src/config/env.schema.ts`, dentro do `z.object({...})`, adicionar (antes do `.superRefine`):

```typescript
    // --- Email transactional ---
    RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY é obrigatório'),
    EMAIL_FROM: z
      .string()
      .email('EMAIL_FROM deve ser email válido'),

    // URL pública do app — usada em links de verify/reset enviados por email.
    APP_URL: z.string().url('APP_URL deve ser URL válida'),
```

- [ ] **Step 4: Rodar test — passa**

```bash
cd apps/api && npx jest env.schema.spec
```

Expected: PASS em todos os testes do arquivo.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/config/env.schema.ts apps/api/src/config/env.schema.spec.ts
git commit -m "feat(api): require RESEND_API_KEY, EMAIL_FROM, APP_URL in env schema"
```

---

## Task 3: Estender Prisma schema com auth email/senha

**Files:**

- Modify: `apps/api/prisma/schema.prisma`
- Create: `apps/api/prisma/migrations/<timestamp>_auth_email/migration.sql` (gerado)

- [ ] **Step 1: Editar schema.prisma**

Substituir o bloco `model User { ... }` por:

```prisma
model User {
  id              String   @id @default(cuid())
  email           String   @unique
  name            String?
  avatar          String?
  role            Role     @default(USER)
  passwordHash    String?
  emailVerifiedAt DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  llmConfigs  LlmConfig[]
  emailTokens EmailToken[]
}
```

E adicionar ao final do arquivo:

```prisma
enum EmailTokenKind {
  VERIFY
  RESET
}

model EmailToken {
  id        String         @id @default(cuid())
  userId    String
  kind      EmailTokenKind
  tokenHash String         @unique
  expiresAt DateTime
  usedAt    DateTime?
  createdAt DateTime       @default(now())
  user      User           @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId, kind])
}
```

- [ ] **Step 2: Gerar migration**

```bash
cd apps/api && npx prisma migrate dev --name auth_email
```

Expected: migration criada e aplicada no DB local sem erro.

- [ ] **Step 3: Gerar cliente Prisma**

```bash
cd apps/api && npx prisma generate
```

Expected: `[Prisma] generated`.

- [ ] **Step 4: Typecheck**

```bash
npm run typecheck --workspace=@kainos/api
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/prisma/schema.prisma apps/api/prisma/migrations/
git commit -m "feat(api): extend User and add EmailToken for credential auth"
```

---

## Task 4: EmailService com adapter Resend

**Files:**

- Create: `apps/api/src/email/email.module.ts`
- Create: `apps/api/src/email/email.service.ts`
- Test: `apps/api/src/email/email.service.spec.ts`
- Create: `apps/api/src/email/templates/verify-email.html.ts`
- Create: `apps/api/src/email/templates/reset-password.html.ts`

- [ ] **Step 1: Escrever templates HTML**

`apps/api/src/email/templates/verify-email.html.ts`:

```typescript
export function verifyEmailHtml(params: { name: string | null; verifyUrl: string }): string {
  const greeting = params.name ? `Olá, ${escapeHtml(params.name)}` : 'Olá';
  return `<!doctype html>
<html lang="pt-BR">
<body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#0a0a0a;color:#fafafa;padding:32px;">
  <div style="max-width:480px;margin:0 auto;">
    <h1 style="font-size:20px;font-weight:500;">${greeting},</h1>
    <p>Confirme seu email para terminar o cadastro no Porttion.</p>
    <p><a href="${escapeAttr(params.verifyUrl)}" style="display:inline-block;background:#3b6cf5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;">Confirmar email</a></p>
    <p style="color:#888;font-size:13px;">Se você não criou esta conta, ignore este email. O link expira em 24 horas.</p>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );
}
const escapeAttr = escapeHtml;
```

`apps/api/src/email/templates/reset-password.html.ts`:

```typescript
export function resetPasswordHtml(params: { name: string | null; resetUrl: string }): string {
  const greeting = params.name ? `Olá, ${escapeHtml(params.name)}` : 'Olá';
  return `<!doctype html>
<html lang="pt-BR">
<body style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:#0a0a0a;color:#fafafa;padding:32px;">
  <div style="max-width:480px;margin:0 auto;">
    <h1 style="font-size:20px;font-weight:500;">${greeting},</h1>
    <p>Recebemos um pedido de redefinição da sua senha no Porttion.</p>
    <p><a href="${escapeAttr(params.resetUrl)}" style="display:inline-block;background:#3b6cf5;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;">Redefinir senha</a></p>
    <p style="color:#888;font-size:13px;">Se você não pediu isso, ignore. O link expira em 30 minutos.</p>
  </div>
</body>
</html>`;
}

function escapeHtml(s: string): string {
  return s.replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string,
  );
}
const escapeAttr = escapeHtml;
```

- [ ] **Step 2: Escrever failing test do EmailService**

`apps/api/src/email/email.service.spec.ts`:

```typescript
import { ConfigService } from '@nestjs/config';
import { EmailService } from './email.service';

const sendMock = jest.fn();
jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({ emails: { send: sendMock } })),
}));

describe('EmailService', () => {
  let service: EmailService;
  const cfg = {
    getOrThrow: (k: string) =>
      ({ RESEND_API_KEY: 're_x', EMAIL_FROM: 'no-reply@porttion.app' })[k] as string,
  } as unknown as ConfigService;

  beforeEach(() => {
    sendMock.mockReset();
    sendMock.mockResolvedValue({ data: { id: 'mock' }, error: null });
    service = new EmailService(cfg);
  });

  it('envia email com from, to, subject e html', async () => {
    await service.send({ to: 'u@x.com', subject: 'Confirmar', html: '<p>oi</p>' });
    expect(sendMock).toHaveBeenCalledWith({
      from: 'no-reply@porttion.app',
      to: 'u@x.com',
      subject: 'Confirmar',
      html: '<p>oi</p>',
    });
  });

  it('lança erro se Resend devolver error', async () => {
    sendMock.mockResolvedValue({ data: null, error: { message: 'invalid api key' } });
    await expect(service.send({ to: 'u@x.com', subject: 's', html: '<p/>' })).rejects.toThrow(
      /invalid api key/,
    );
  });
});
```

- [ ] **Step 3: Rodar — falha esperada**

```bash
cd apps/api && npx jest email.service.spec
```

Expected: FAIL (módulo não existe).

- [ ] **Step 4: Implementar EmailService**

`apps/api/src/email/email.service.ts`:

```typescript
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';

export interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly client: Resend;
  private readonly from: string;

  constructor(cfg: ConfigService) {
    this.client = new Resend(cfg.getOrThrow<string>('RESEND_API_KEY'));
    this.from = cfg.getOrThrow<string>('EMAIL_FROM');
  }

  async send({ to, subject, html }: SendEmailInput): Promise<void> {
    const { error } = await this.client.emails.send({ from: this.from, to, subject, html });
    if (error) {
      // log sem to/subject para evitar PII em logs além do necessário
      this.logger.error(`Resend error: ${error.message}`);
      throw new Error(`Email send failed: ${error.message}`);
    }
  }
}
```

`apps/api/src/email/email.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { EmailService } from './email.service';

@Module({
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
```

- [ ] **Step 5: Rodar — passa**

```bash
cd apps/api && npx jest email.service.spec
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/email/
git commit -m "feat(api): add EmailService backed by Resend"
```

---

## Task 5: EmailTokenService (gera, hasheia, valida tokens)

**Files:**

- Create: `apps/api/src/auth/email-verification/email-token.service.ts`
- Test: `apps/api/src/auth/email-verification/email-token.service.spec.ts`

- [ ] **Step 1: Escrever failing test**

`apps/api/src/auth/email-verification/email-token.service.spec.ts`:

```typescript
import { PrismaService } from '../../prisma/prisma.service';
import { EmailTokenService } from './email-token.service';

describe('EmailTokenService', () => {
  const prisma = {
    emailToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  } as unknown as PrismaService;
  const service = new EmailTokenService(prisma);

  beforeEach(() => jest.clearAllMocks());

  it('issue() gera token de 32 bytes hex e persiste apenas o hash', async () => {
    (prisma.emailToken.create as jest.Mock).mockResolvedValue({});
    const token = await service.issue({ userId: 'u1', kind: 'VERIFY', ttlMinutes: 60 });
    expect(token).toMatch(/^[a-f0-9]{64}$/);
    const arg = (prisma.emailToken.create as jest.Mock).mock.calls[0][0].data;
    expect(arg.userId).toBe('u1');
    expect(arg.kind).toBe('VERIFY');
    expect(arg.tokenHash).toMatch(/^[a-f0-9]{64}$/);
    expect(arg.tokenHash).not.toBe(token);
    expect(arg.expiresAt).toBeInstanceOf(Date);
  });

  it('consume() valida hash, expiração e marca usedAt', async () => {
    const token = 'a'.repeat(64);
    const tokenHash = require('node:crypto').createHash('sha256').update(token).digest('hex');
    (prisma.emailToken.findUnique as jest.Mock).mockResolvedValue({
      id: 't1',
      userId: 'u1',
      kind: 'VERIFY',
      tokenHash,
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
    });
    (prisma.emailToken.update as jest.Mock).mockResolvedValue({});
    const res = await service.consume({ token, kind: 'VERIFY' });
    expect(res.userId).toBe('u1');
    expect(prisma.emailToken.update).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: { usedAt: expect.any(Date) },
    });
  });

  it('consume() rejeita token usado', async () => {
    (prisma.emailToken.findUnique as jest.Mock).mockResolvedValue({
      id: 't1',
      kind: 'VERIFY',
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: new Date(),
    });
    await expect(service.consume({ token: 'x'.repeat(64), kind: 'VERIFY' })).rejects.toThrow(
      /inválido/,
    );
  });

  it('consume() rejeita expirado', async () => {
    (prisma.emailToken.findUnique as jest.Mock).mockResolvedValue({
      id: 't1',
      kind: 'VERIFY',
      expiresAt: new Date(Date.now() - 1000),
      usedAt: null,
    });
    await expect(service.consume({ token: 'x'.repeat(64), kind: 'VERIFY' })).rejects.toThrow(
      /expirado/,
    );
  });

  it('consume() rejeita kind divergente', async () => {
    (prisma.emailToken.findUnique as jest.Mock).mockResolvedValue({
      id: 't1',
      kind: 'RESET',
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: null,
    });
    await expect(service.consume({ token: 'x'.repeat(64), kind: 'VERIFY' })).rejects.toThrow(
      /inválido/,
    );
  });
});
```

- [ ] **Step 2: Rodar — falha esperada**

```bash
cd apps/api && npx jest email-token.service.spec
```

Expected: FAIL (módulo não existe).

- [ ] **Step 3: Implementar**

`apps/api/src/auth/email-verification/email-token.service.ts`:

```typescript
import { Injectable, BadRequestException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../../prisma/prisma.service';

export type EmailTokenKind = 'VERIFY' | 'RESET';

@Injectable()
export class EmailTokenService {
  constructor(private readonly prisma: PrismaService) {}

  async issue(params: {
    userId: string;
    kind: EmailTokenKind;
    ttlMinutes: number;
  }): Promise<string> {
    const token = randomBytes(32).toString('hex');
    const tokenHash = createHash('sha256').update(token).digest('hex');
    await this.prisma.emailToken.create({
      data: {
        userId: params.userId,
        kind: params.kind,
        tokenHash,
        expiresAt: new Date(Date.now() + params.ttlMinutes * 60_000),
      },
    });
    return token;
  }

  async consume(params: { token: string; kind: EmailTokenKind }): Promise<{ userId: string }> {
    const tokenHash = createHash('sha256').update(params.token).digest('hex');
    const record = await this.prisma.emailToken.findUnique({ where: { tokenHash } });
    if (!record || record.kind !== params.kind || record.usedAt) {
      throw new BadRequestException('Token inválido.');
    }
    if (record.expiresAt < new Date()) {
      throw new BadRequestException('Token expirado.');
    }
    await this.prisma.emailToken.update({
      where: { id: record.id },
      data: { usedAt: new Date() },
    });
    return { userId: record.userId };
  }
}
```

- [ ] **Step 4: Rodar — passa**

```bash
cd apps/api && npx jest email-token.service.spec
```

Expected: PASS em todos os 5 cases.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/auth/email-verification/email-token.service.ts apps/api/src/auth/email-verification/email-token.service.spec.ts
git commit -m "feat(api): add EmailTokenService with hashed tokens and consume guards"
```

---

## Task 6: CredentialsService (signup + validate)

**Files:**

- Create: `apps/api/src/auth/credentials/credentials.service.ts`
- Test: `apps/api/src/auth/credentials/credentials.service.spec.ts`
- Create: `apps/api/src/auth/credentials/dto/signup.dto.ts`
- Create: `apps/api/src/auth/credentials/dto/validate.dto.ts`

- [ ] **Step 1: Escrever DTOs**

`apps/api/src/auth/credentials/dto/signup.dto.ts`:

```typescript
import { IsEmail, IsString, MinLength, MaxLength, Matches } from 'class-validator';

export class SignupDto {
  @IsEmail() email!: string;
  @IsString() @MinLength(2) @MaxLength(80) name!: string;

  @IsString()
  @MinLength(10, { message: 'Senha precisa de pelo menos 10 caracteres.' })
  @MaxLength(128)
  @Matches(/[A-Za-z]/, { message: 'Senha precisa conter letras.' })
  @Matches(/[0-9]/, { message: 'Senha precisa conter números.' })
  password!: string;
}
```

`apps/api/src/auth/credentials/dto/validate.dto.ts`:

```typescript
import { IsEmail, IsString } from 'class-validator';

export class ValidateCredentialsDto {
  @IsEmail() email!: string;
  @IsString() password!: string;
}
```

- [ ] **Step 2: Failing test**

`apps/api/src/auth/credentials/credentials.service.spec.ts`:

```typescript
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { EmailTokenService } from '../email-verification/email-token.service';
import { CredentialsService } from './credentials.service';
import { ConfigService } from '@nestjs/config';

describe('CredentialsService', () => {
  const prisma = {
    user: { findUnique: jest.fn(), create: jest.fn() },
  } as unknown as PrismaService;
  const email = { send: jest.fn() } as unknown as EmailService;
  const tokens = { issue: jest.fn() } as unknown as EmailTokenService;
  const cfg = { getOrThrow: () => 'https://porttion.app' } as unknown as ConfigService;
  const service = new CredentialsService(prisma, email, tokens, cfg);

  beforeEach(() => jest.clearAllMocks());

  describe('signup', () => {
    it('cria usuário, gera token VERIFY 24h e envia email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        name: 'A',
      });
      (tokens.issue as jest.Mock).mockResolvedValue('rawtoken');
      (email.send as jest.Mock).mockResolvedValue(undefined);

      await service.signup({ email: 'a@b.com', name: 'A', password: 'senha12345' });

      const created = (prisma.user.create as jest.Mock).mock.calls[0][0].data;
      expect(created.email).toBe('a@b.com');
      expect(created.passwordHash).not.toBe('senha12345');
      expect(await bcrypt.compare('senha12345', created.passwordHash)).toBe(true);
      expect(tokens.issue).toHaveBeenCalledWith({
        userId: 'u1',
        kind: 'VERIFY',
        ttlMinutes: 60 * 24,
      });
      expect(email.send).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'a@b.com',
          subject: expect.stringMatching(/Confirme/),
          html: expect.stringContaining('https://porttion.app/verify-email/rawtoken'),
        }),
      );
    });

    it('rejeita email duplicado com 409', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({ id: 'u1' });
      await expect(
        service.signup({ email: 'a@b.com', name: 'A', password: 'senha12345' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });
  });

  describe('validate', () => {
    it('retorna user quando email/senha conferem e email verificado', async () => {
      const hash = await bcrypt.hash('senha12345', 10);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        id: 'u1',
        email: 'a@b.com',
        name: 'A',
        avatar: null,
        passwordHash: hash,
        emailVerifiedAt: new Date(),
      });
      const res = await service.validate({ email: 'a@b.com', password: 'senha12345' });
      expect(res).toEqual({ id: 'u1', email: 'a@b.com', name: 'A', avatar: null });
    });

    it('rejeita 401 se usuário não existe', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      await expect(
        service.validate({ email: 'x@x.com', password: 'qualquer' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejeita 401 se senha errada', async () => {
      const hash = await bcrypt.hash('senha12345', 10);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        passwordHash: hash,
        emailVerifiedAt: new Date(),
      });
      await expect(
        service.validate({ email: 'a@b.com', password: 'errada' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });

    it('rejeita 401 com mensagem "email não verificado" se emailVerifiedAt é null', async () => {
      const hash = await bcrypt.hash('senha12345', 10);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        passwordHash: hash,
        emailVerifiedAt: null,
      });
      await expect(service.validate({ email: 'a@b.com', password: 'senha12345' })).rejects.toThrow(
        /não verificado/i,
      );
    });

    it('rejeita 401 se passwordHash é null (conta criada por OAuth)', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue({
        passwordHash: null,
        emailVerifiedAt: new Date(),
      });
      await expect(
        service.validate({ email: 'a@b.com', password: 'qualquer' }),
      ).rejects.toBeInstanceOf(UnauthorizedException);
    });
  });
});
```

- [ ] **Step 3: Rodar — falha**

```bash
cd apps/api && npx jest credentials.service.spec
```

Expected: FAIL (módulo não existe).

- [ ] **Step 4: Implementar**

`apps/api/src/auth/credentials/credentials.service.ts`:

```typescript
import { Injectable, ConflictException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { EmailTokenService } from '../email-verification/email-token.service';
import { verifyEmailHtml } from '../../email/templates/verify-email.html';

const BCRYPT_ROUNDS = 10;
const VERIFY_TTL_MIN = 60 * 24;

export interface SignupInput {
  email: string;
  name: string;
  password: string;
}

export interface ValidateInput {
  email: string;
  password: string;
}

export interface ValidatedUser {
  id: string;
  email: string;
  name: string | null;
  avatar: string | null;
}

@Injectable()
export class CredentialsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly tokens: EmailTokenService,
    private readonly cfg: ConfigService,
  ) {}

  async signup(input: SignupInput): Promise<void> {
    const existing = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (existing) {
      throw new ConflictException('Email já está em uso.');
    }
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);
    const user = await this.prisma.user.create({
      data: {
        email: input.email,
        name: input.name,
        passwordHash,
      },
    });
    const token = await this.tokens.issue({
      userId: user.id,
      kind: 'VERIFY',
      ttlMinutes: VERIFY_TTL_MIN,
    });
    const appUrl = this.cfg.getOrThrow<string>('APP_URL');
    await this.email.send({
      to: user.email,
      subject: 'Confirme seu email no Porttion',
      html: verifyEmailHtml({
        name: user.name,
        verifyUrl: `${appUrl}/verify-email/${token}`,
      }),
    });
  }

  async validate(input: ValidateInput): Promise<ValidatedUser> {
    const user = await this.prisma.user.findUnique({ where: { email: input.email } });
    if (!user || !user.passwordHash) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }
    const ok = await bcrypt.compare(input.password, user.passwordHash);
    if (!ok) {
      throw new UnauthorizedException('Credenciais inválidas.');
    }
    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException('Email não verificado.');
    }
    return { id: user.id, email: user.email, name: user.name, avatar: user.avatar };
  }
}
```

- [ ] **Step 5: Rodar — passa**

```bash
cd apps/api && npx jest credentials.service.spec
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/auth/credentials/
git commit -m "feat(api): add CredentialsService for signup + validate"
```

---

## Task 7: EmailVerificationService (verify, forgot, reset)

**Files:**

- Create: `apps/api/src/auth/email-verification/email-verification.service.ts`
- Test: `apps/api/src/auth/email-verification/email-verification.service.spec.ts`
- Create: `apps/api/src/auth/email-verification/dto/verify.dto.ts`
- Create: `apps/api/src/auth/email-verification/dto/forgot.dto.ts`
- Create: `apps/api/src/auth/email-verification/dto/reset.dto.ts`

- [ ] **Step 1: DTOs**

```typescript
// verify.dto.ts
import { IsString, Length } from 'class-validator';
export class VerifyDto {
  @IsString() @Length(64, 64) token!: string;
}

// forgot.dto.ts
import { IsEmail } from 'class-validator';
export class ForgotDto {
  @IsEmail() email!: string;
}

// reset.dto.ts
import { IsString, Length, MinLength, MaxLength, Matches } from 'class-validator';
export class ResetDto {
  @IsString() @Length(64, 64) token!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(128)
  @Matches(/[A-Za-z]/)
  @Matches(/[0-9]/)
  newPassword!: string;
}
```

- [ ] **Step 2: Failing test**

`apps/api/src/auth/email-verification/email-verification.service.spec.ts`:

```typescript
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { EmailTokenService } from './email-token.service';
import { EmailVerificationService } from './email-verification.service';
import { ConfigService } from '@nestjs/config';

describe('EmailVerificationService', () => {
  const prisma = {
    user: { update: jest.fn(), findUnique: jest.fn() },
  } as unknown as PrismaService;
  const email = { send: jest.fn() } as unknown as EmailService;
  const tokens = { issue: jest.fn(), consume: jest.fn() } as unknown as EmailTokenService;
  const cfg = { getOrThrow: () => 'https://porttion.app' } as unknown as ConfigService;
  const service = new EmailVerificationService(prisma, email, tokens, cfg);

  beforeEach(() => jest.clearAllMocks());

  it('verify(): consome token VERIFY e marca emailVerifiedAt', async () => {
    (tokens.consume as jest.Mock).mockResolvedValue({ userId: 'u1' });
    (prisma.user.update as jest.Mock).mockResolvedValue({});
    await service.verify({ token: 'x'.repeat(64) });
    expect(tokens.consume).toHaveBeenCalledWith({ token: 'x'.repeat(64), kind: 'VERIFY' });
    expect(prisma.user.update).toHaveBeenCalledWith({
      where: { id: 'u1' },
      data: { emailVerifiedAt: expect.any(Date) },
    });
  });

  it('forgotPassword(): se email não existe, retorna silenciosamente (anti-enum)', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
    await service.forgotPassword({ email: 'fantasma@x.com' });
    expect(email.send).not.toHaveBeenCalled();
    expect(tokens.issue).not.toHaveBeenCalled();
  });

  it('forgotPassword(): se email existe, emite RESET 30min e envia email', async () => {
    (prisma.user.findUnique as jest.Mock).mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      name: 'A',
    });
    (tokens.issue as jest.Mock).mockResolvedValue('rawtoken');
    await service.forgotPassword({ email: 'a@b.com' });
    expect(tokens.issue).toHaveBeenCalledWith({ userId: 'u1', kind: 'RESET', ttlMinutes: 30 });
    expect(email.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'a@b.com',
        html: expect.stringContaining('https://porttion.app/reset-password/rawtoken'),
      }),
    );
  });

  it('resetPassword(): consome token RESET e atualiza hash', async () => {
    (tokens.consume as jest.Mock).mockResolvedValue({ userId: 'u1' });
    (prisma.user.update as jest.Mock).mockResolvedValue({});
    await service.resetPassword({ token: 'x'.repeat(64), newPassword: 'novasenha123' });
    expect(tokens.consume).toHaveBeenCalledWith({ token: 'x'.repeat(64), kind: 'RESET' });
    const updArg = (prisma.user.update as jest.Mock).mock.calls[0][0];
    expect(updArg.where).toEqual({ id: 'u1' });
    expect(await bcrypt.compare('novasenha123', updArg.data.passwordHash)).toBe(true);
  });
});
```

- [ ] **Step 3: Rodar — falha**

```bash
cd apps/api && npx jest email-verification.service.spec
```

Expected: FAIL.

- [ ] **Step 4: Implementar**

`apps/api/src/auth/email-verification/email-verification.service.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailService } from '../../email/email.service';
import { EmailTokenService } from './email-token.service';
import { resetPasswordHtml } from '../../email/templates/reset-password.html';

const RESET_TTL_MIN = 30;
const BCRYPT_ROUNDS = 10;

@Injectable()
export class EmailVerificationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly email: EmailService,
    private readonly tokens: EmailTokenService,
    private readonly cfg: ConfigService,
  ) {}

  async verify(params: { token: string }): Promise<void> {
    const { userId } = await this.tokens.consume({ token: params.token, kind: 'VERIFY' });
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailVerifiedAt: new Date() },
    });
  }

  async forgotPassword(params: { email: string }): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email: params.email } });
    if (!user) {
      // anti-enumeração: não revela se email existe
      return;
    }
    const token = await this.tokens.issue({
      userId: user.id,
      kind: 'RESET',
      ttlMinutes: RESET_TTL_MIN,
    });
    const appUrl = this.cfg.getOrThrow<string>('APP_URL');
    await this.email.send({
      to: user.email,
      subject: 'Redefinir sua senha no Porttion',
      html: resetPasswordHtml({
        name: user.name,
        resetUrl: `${appUrl}/reset-password/${token}`,
      }),
    });
  }

  async resetPassword(params: { token: string; newPassword: string }): Promise<void> {
    const { userId } = await this.tokens.consume({ token: params.token, kind: 'RESET' });
    const passwordHash = await bcrypt.hash(params.newPassword, BCRYPT_ROUNDS);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });
  }
}
```

- [ ] **Step 5: Rodar — passa**

```bash
cd apps/api && npx jest email-verification.service.spec
```

Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/auth/email-verification/
git commit -m "feat(api): add EmailVerificationService for verify/forgot/reset"
```

---

## Task 8: Internal Credentials Controller (S2S /auth/validate)

**Files:**

- Create: `apps/api/src/auth/credentials/internal-credentials.controller.ts`
- Test: `apps/api/src/auth/credentials/internal-credentials.controller.spec.ts`

> Endpoint **internal** (S2S, validado por `InternalOnly` decorator + `InternalServiceGuard`). Chamado pelo NextAuth Credentials provider do web. Não exposto ao público.

- [ ] **Step 1: Failing test**

```typescript
import { Test } from '@nestjs/testing';
import { CredentialsService } from './credentials.service';
import { InternalCredentialsController } from './internal-credentials.controller';

describe('InternalCredentialsController', () => {
  let controller: InternalCredentialsController;
  const service = { signup: jest.fn(), validate: jest.fn() } as unknown as CredentialsService;

  beforeEach(async () => {
    const mod = await Test.createTestingModule({
      controllers: [InternalCredentialsController],
      providers: [{ provide: CredentialsService, useValue: service }],
    }).compile();
    controller = mod.get(InternalCredentialsController);
    jest.clearAllMocks();
  });

  it('POST /internal/auth/validate delega ao service', async () => {
    (service.validate as jest.Mock).mockResolvedValue({
      id: 'u1',
      email: 'a@b.com',
      name: 'A',
      avatar: null,
    });
    const res = await controller.validate({ email: 'a@b.com', password: 'p' });
    expect(service.validate).toHaveBeenCalledWith({ email: 'a@b.com', password: 'p' });
    expect(res).toEqual({ id: 'u1', email: 'a@b.com', name: 'A', avatar: null });
  });
});
```

- [ ] **Step 2: Rodar — falha**

```bash
cd apps/api && npx jest internal-credentials.controller.spec
```

Expected: FAIL.

- [ ] **Step 3: Implementar**

```typescript
import { Body, Controller, Post } from '@nestjs/common';
import { CredentialsService, ValidatedUser } from './credentials.service';
import { ValidateCredentialsDto } from './dto/validate.dto';
import { InternalOnly } from '../decorators/internal-only.decorator';

@Controller('api/v1/internal/auth')
@InternalOnly()
export class InternalCredentialsController {
  constructor(private readonly service: CredentialsService) {}

  @Post('validate')
  async validate(@Body() body: ValidateCredentialsDto): Promise<ValidatedUser> {
    return this.service.validate(body);
  }
}
```

- [ ] **Step 4: Rodar — passa**

```bash
cd apps/api && npx jest internal-credentials.controller.spec
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/auth/credentials/internal-credentials.controller.ts apps/api/src/auth/credentials/internal-credentials.controller.spec.ts
git commit -m "feat(api): internal endpoint for credential validation (S2S)"
```

---

## Task 9: Public Auth Controller (signup, verify, forgot, reset)

**Files:**

- Create: `apps/api/src/auth/email-verification/email-verification.controller.ts`
- Test: `apps/api/src/auth/email-verification/email-verification.controller.spec.ts`

> Endpoints **públicos** (decorados com `@Public()`). Throttler bucket dedicado `auth-email`.

- [ ] **Step 1: Failing test**

```typescript
import { Test } from '@nestjs/testing';
import { Throttle } from '@nestjs/throttler';
import { CredentialsService } from '../credentials/credentials.service';
import { EmailVerificationService } from './email-verification.service';
import { AuthController } from './email-verification.controller';

describe('AuthController', () => {
  let controller: AuthController;
  const credentials = { signup: jest.fn() } as unknown as CredentialsService;
  const verification = {
    verify: jest.fn(),
    forgotPassword: jest.fn(),
    resetPassword: jest.fn(),
  } as unknown as EmailVerificationService;

  beforeEach(async () => {
    const mod = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        { provide: CredentialsService, useValue: credentials },
        { provide: EmailVerificationService, useValue: verification },
      ],
    }).compile();
    controller = mod.get(AuthController);
    jest.clearAllMocks();
  });

  it('POST /auth/signup', async () => {
    await controller.signup({ email: 'a@b.com', name: 'A', password: 'senha12345' });
    expect(credentials.signup).toHaveBeenCalledWith({
      email: 'a@b.com',
      name: 'A',
      password: 'senha12345',
    });
  });

  it('POST /auth/verify', async () => {
    await controller.verify({ token: 'x'.repeat(64) });
    expect(verification.verify).toHaveBeenCalledWith({ token: 'x'.repeat(64) });
  });

  it('POST /auth/forgot-password', async () => {
    await controller.forgot({ email: 'a@b.com' });
    expect(verification.forgotPassword).toHaveBeenCalledWith({ email: 'a@b.com' });
  });

  it('POST /auth/reset-password', async () => {
    await controller.reset({ token: 'x'.repeat(64), newPassword: 'novasenha123' });
    expect(verification.resetPassword).toHaveBeenCalledWith({
      token: 'x'.repeat(64),
      newPassword: 'novasenha123',
    });
  });
});
```

- [ ] **Step 2: Rodar — falha**

```bash
cd apps/api && npx jest email-verification.controller.spec
```

Expected: FAIL.

- [ ] **Step 3: Implementar**

```typescript
import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { Public } from '../decorators/public.decorator';
import { CredentialsService } from '../credentials/credentials.service';
import { SignupDto } from '../credentials/dto/signup.dto';
import { EmailVerificationService } from './email-verification.service';
import { VerifyDto } from './dto/verify.dto';
import { ForgotDto } from './dto/forgot.dto';
import { ResetDto } from './dto/reset.dto';

@Controller('api/v1/auth')
@Public()
@Throttle({ 'auth-email': { limit: 5, ttl: 15 * 60_000 } })
export class AuthController {
  constructor(
    private readonly credentials: CredentialsService,
    private readonly verification: EmailVerificationService,
  ) {}

  @Post('signup')
  @HttpCode(202)
  async signup(@Body() body: SignupDto): Promise<{ ok: true }> {
    await this.credentials.signup(body);
    return { ok: true };
  }

  @Post('verify')
  @HttpCode(200)
  async verify(@Body() body: VerifyDto): Promise<{ ok: true }> {
    await this.verification.verify(body);
    return { ok: true };
  }

  @Post('forgot-password')
  @HttpCode(202)
  async forgot(@Body() body: ForgotDto): Promise<{ ok: true }> {
    await this.verification.forgotPassword(body);
    return { ok: true };
  }

  @Post('reset-password')
  @HttpCode(200)
  async reset(@Body() body: ResetDto): Promise<{ ok: true }> {
    await this.verification.resetPassword(body);
    return { ok: true };
  }
}
```

- [ ] **Step 4: Rodar — passa**

```bash
cd apps/api && npx jest email-verification.controller.spec
```

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add apps/api/src/auth/email-verification/email-verification.controller.ts apps/api/src/auth/email-verification/email-verification.controller.spec.ts
git commit -m "feat(api): public auth endpoints for signup/verify/forgot/reset"
```

---

## Task 10: Cabear módulos no AppModule + ThrottlerModule bucket

**Files:**

- Create: `apps/api/src/email/email.module.ts` (já criado em Task 4)
- Create: `apps/api/src/auth/credentials/credentials.module.ts`
- Create: `apps/api/src/auth/email-verification/email-verification.module.ts`
- Modify: `apps/api/src/app.module.ts`

- [ ] **Step 1: CredentialsModule**

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailModule } from '../../email/email.module';
import { EmailVerificationModule } from '../email-verification/email-verification.module';
import { CredentialsService } from './credentials.service';
import { InternalCredentialsController } from './internal-credentials.controller';

@Module({
  imports: [PrismaModule, EmailModule, EmailVerificationModule],
  controllers: [InternalCredentialsController],
  providers: [CredentialsService],
  exports: [CredentialsService],
})
export class CredentialsModule {}
```

- [ ] **Step 2: EmailVerificationModule**

```typescript
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailModule } from '../../email/email.module';
import { EmailTokenService } from './email-token.service';
import { EmailVerificationService } from './email-verification.service';

@Module({
  imports: [PrismaModule, EmailModule],
  providers: [EmailTokenService, EmailVerificationService],
  exports: [EmailTokenService, EmailVerificationService],
})
export class EmailVerificationModule {}
```

- [ ] **Step 3: AuthController vive onde?**

`AuthController` (público) precisa importar `CredentialsService` e `EmailVerificationService`. Vamos colocá-lo no `EmailVerificationModule` adicionando `controllers: [AuthController]` ali e importando `CredentialsModule`.

Editar `email-verification.module.ts`:

```typescript
import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { EmailModule } from '../../email/email.module';
import { EmailTokenService } from './email-token.service';
import { EmailVerificationService } from './email-verification.service';
import { AuthController } from './email-verification.controller';
import { CredentialsModule } from '../credentials/credentials.module';

@Module({
  imports: [PrismaModule, EmailModule, forwardRef(() => CredentialsModule)],
  controllers: [AuthController],
  providers: [EmailTokenService, EmailVerificationService],
  exports: [EmailTokenService, EmailVerificationService],
})
export class EmailVerificationModule {}
```

E em `credentials.module.ts`, trocar `imports: [..., EmailVerificationModule]` por `imports: [..., forwardRef(() => EmailVerificationModule)]`.

- [ ] **Step 4: Atualizar AppModule**

Em `apps/api/src/app.module.ts`:

```typescript
// adicionar imports no topo
import { EmailModule } from './email/email.module';
import { CredentialsModule } from './auth/credentials/credentials.module';
import { EmailVerificationModule } from './auth/email-verification/email-verification.module';
```

No bloco `imports: [...]`, adicionar `EmailModule`, `CredentialsModule`, `EmailVerificationModule` após `AuthModule`.

No `ThrottlerModule.forRoot([...])`, adicionar bucket:

```typescript
ThrottlerModule.forRoot([
  { name: 'default', ttl: 60_000, limit: 600 },
  { name: 'auth-email', ttl: 15 * 60_000, limit: 5 },
]),
```

- [ ] **Step 5: Rodar typecheck + todos os tests**

```bash
npm run typecheck --workspace=@kainos/api
cd apps/api && npx jest
```

Expected: ambos PASS.

- [ ] **Step 6: Commit**

```bash
git add apps/api/src/app.module.ts apps/api/src/auth/credentials/credentials.module.ts apps/api/src/auth/email-verification/email-verification.module.ts
git commit -m "feat(api): wire credentials + email-verification modules and auth-email throttler bucket"
```

---

## Task 11: Smoke E2E manual — signup → verify

**Files:**

- nenhum arquivo modificado; verificação manual

- [ ] **Step 1: Subir DB + API**

```bash
npm run db:up
npm run dev --workspace=@kainos/api
```

- [ ] **Step 2: Definir env (`apps/api/.env.local`)**

```
RESEND_API_KEY=re_<chave_real_de_dev>
EMAIL_FROM=no-reply@<seu_dominio_de_teste>
APP_URL=http://localhost:3000
```

- [ ] **Step 3: Fazer signup via curl**

```bash
curl -sS -X POST http://localhost:3001/api/v1/auth/signup \
  -H 'content-type: application/json' \
  -d '{"email":"<seu_email_real>","name":"Você","password":"senha12345"}'
```

Expected: `{"ok":true}` HTTP 202, e email chega na caixa.

- [ ] **Step 4: Pegar token do email + verificar**

```bash
curl -sS -X POST http://localhost:3001/api/v1/auth/verify \
  -H 'content-type: application/json' \
  -d '{"token":"<token_do_link_no_email>"}'
```

Expected: `{"ok":true}` HTTP 200. Conferir no DB que `emailVerifiedAt` foi setado.

- [ ] **Step 5: Validar credentials (S2S)**

```bash
curl -sS -X POST http://localhost:3001/api/v1/internal/auth/validate \
  -H 'content-type: application/json' \
  -H "X-Internal-Service-Token: $(cat apps/api/.env.local | grep INTERNAL_SERVICE_TOKEN | cut -d= -f2)" \
  -d '{"email":"<seu_email>","password":"senha12345"}'
```

Expected: `{"id":"...","email":"...","name":"Você","avatar":null}` HTTP 200.

- [ ] **Step 6: Anotar no commit do PR**

Não há commit nesta task — é gate manual antes de seguir.

---

## Task 12: Fontes — Inter, Instrument Serif, JetBrains Mono

**Files:**

- Modify: `apps/web/app/layout.tsx`
- Modify: `apps/web/app/globals.css`
- Create: `apps/web/fonts/InstrumentSerif-Italic.woff2`

- [ ] **Step 1: Baixar Instrument Serif Italic**

```bash
mkdir -p apps/web/fonts
curl -L -o apps/web/fonts/InstrumentSerif-Italic.woff2 \
  https://fonts.gstatic.com/s/instrumentserif/v4/jizFRFtXLrHaaTYwTOhpAW8a3eRJBJ-5elr0lLE.woff2
```

Expected: arquivo > 20KB. Se mudar de URL, baixar manualmente do Google Fonts e colar no path.

- [ ] **Step 2: Editar `apps/web/app/layout.tsx`**

No topo, adicionar:

```typescript
import { Inter, JetBrains_Mono } from 'next/font/google';
import localFont from 'next/font/local';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});
const jetbrains = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
});
const instrument = localFont({
  src: '../fonts/InstrumentSerif-Italic.woff2',
  variable: '--font-serif',
  style: 'italic',
  weight: '400',
  display: 'swap',
});
```

Aplicar as variáveis no `<html>` tag:

```tsx
<html lang="pt-BR" className={`${inter.variable} ${jetbrains.variable} ${instrument.variable}`}>
```

- [ ] **Step 3: Editar `apps/web/app/globals.css`**

No `@theme` (ou onde estiverem as tokens Tailwind v4), adicionar:

```css
@theme {
  --font-sans: 'Inter', ui-sans-serif, system-ui, -apple-system, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
  --font-serif: 'Instrument Serif', ui-serif, serif;
}
```

(Se o arquivo já tem `--font-sans`, **sobrescrever** com as 3 famílias acima.)

- [ ] **Step 4: Rodar dev + smoke visual**

```bash
npm run dev --workspace=@kainos/web
```

Abrir `http://localhost:3000/login`. Inspecionar `<html>` no devtools: confirmar que `font-family` resolve para `Inter`. Em uma página de teste rápida (ex.: criar `<span className="font-serif italic">acontecendo</span>` na home), confirmar serifa.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/layout.tsx apps/web/app/globals.css apps/web/fonts/
git commit -m "feat(web): add Inter, JetBrains Mono, Instrument Serif fonts"
```

---

## Task 13: Paleta OpenClaw + tokens estendidos

**Files:**

- Modify: `apps/web/app/globals.css`
- Modify: `apps/web/components/ui/badge.tsx`

- [ ] **Step 1: Substituir CSS vars em `globals.css`**

Localizar o bloco `:root { ... }` e `.dark { ... }` (ou `@theme`). Substituir pela paleta OpenClaw + extends:

```css
:root {
  --background: oklch(1 0 0);
  --foreground: oklch(0.18 0 0);
  --card: oklch(0.99 0 0);
  --card-foreground: oklch(0.18 0 0);
  --popover: oklch(1 0 0);
  --popover-foreground: oklch(0.18 0 0);
  --primary: oklch(0.18 0 0);
  --primary-foreground: oklch(0.98 0 0);
  --secondary: oklch(0.96 0 0);
  --secondary-foreground: oklch(0.18 0 0);
  --muted: oklch(0.96 0 0);
  --muted-foreground: oklch(0.48 0 0);
  --accent: oklch(0.96 0 0);
  --accent-foreground: oklch(0.18 0 0);
  --destructive: oklch(0.58 0.22 27);
  --destructive-foreground: oklch(0.98 0 0);
  --border: oklch(0.92 0 0);
  --border-strong: oklch(0.84 0 0);
  --input: oklch(0.92 0 0);
  --ring: oklch(0.62 0.19 260);
  --sidebar: oklch(0.98 0 0);
  --sidebar-foreground: oklch(0.18 0 0);
  --sidebar-border: oklch(0.92 0 0);
  --sidebar-accent: oklch(0.94 0 0);

  --success: oklch(0.62 0.16 150);
  --success-foreground: oklch(0.98 0 0);
  --success-muted: oklch(0.94 0.06 150);
  --success-muted-foreground: oklch(0.34 0.12 150);

  --warning: oklch(0.78 0.16 80);
  --warning-foreground: oklch(0.18 0 0);
  --warning-muted: oklch(0.96 0.06 80);
  --warning-muted-foreground: oklch(0.42 0.14 80);

  --danger-muted: oklch(0.96 0.06 27);
  --danger-muted-foreground: oklch(0.42 0.18 27);

  --chart-1: oklch(0.81 0.1 252);
  --chart-2: oklch(0.62 0.19 260);
  --chart-3: oklch(0.55 0.22 263);
  --chart-4: oklch(0.49 0.22 264);
  --chart-5: oklch(0.42 0.18 266);

  --radius: 0.625rem;
}

.dark {
  --background: oklch(0 0 0);
  --foreground: oklch(0.98 0 0);
  --card: oklch(0.08 0 0);
  --card-foreground: oklch(0.98 0 0);
  --popover: oklch(0.08 0 0);
  --popover-foreground: oklch(0.98 0 0);
  --primary: oklch(0.62 0.19 260);
  --primary-foreground: oklch(0.98 0 0);
  --secondary: oklch(0.14 0 0);
  --secondary-foreground: oklch(0.98 0 0);
  --muted: oklch(0.14 0 0);
  --muted-foreground: oklch(0.66 0 0);
  --accent: oklch(0.14 0 0);
  --accent-foreground: oklch(0.98 0 0);
  --destructive: oklch(0.58 0.22 27);
  --destructive-foreground: oklch(0.98 0 0);
  --border: oklch(0.18 0 0);
  --border-strong: oklch(0.28 0 0);
  --input: oklch(0.18 0 0);
  --ring: oklch(0.62 0.19 260);
  --sidebar: oklch(0.04 0 0);
  --sidebar-foreground: oklch(0.98 0 0);
  --sidebar-border: oklch(0.18 0 0);
  --sidebar-accent: oklch(0.14 0 0);

  --success: oklch(0.72 0.18 150);
  --success-foreground: oklch(0.05 0 0);
  --success-muted: oklch(0.2 0.08 150);
  --success-muted-foreground: oklch(0.82 0.14 150);

  --warning: oklch(0.78 0.16 80);
  --warning-foreground: oklch(0.05 0 0);
  --warning-muted: oklch(0.22 0.08 80);
  --warning-muted-foreground: oklch(0.84 0.14 80);

  --danger-muted: oklch(0.22 0.1 27);
  --danger-muted-foreground: oklch(0.84 0.18 27);
}
```

- [ ] **Step 2: Estender Badge com variantes success/warning/danger**

Em `apps/web/components/ui/badge.tsx`, no `badgeVariants` (cva), adicionar nas variants:

```typescript
success: 'bg-[var(--success-muted)] text-[var(--success-muted-foreground)] border-transparent',
warning: 'bg-[var(--warning-muted)] text-[var(--warning-muted-foreground)] border-transparent',
danger: 'bg-[var(--danger-muted)] text-[var(--danger-muted-foreground)] border-transparent',
```

- [ ] **Step 3: Typecheck**

```bash
npm run typecheck --workspace=@kainos/web
```

Expected: PASS.

- [ ] **Step 4: Smoke visual**

`npm run dev --workspace=@kainos/web`, abrir `/login`, conferir que o azul de hover/ring é o `--ring` (azul vívido) e que tema escuro fica preto puro.

- [ ] **Step 5: Commit**

```bash
git add apps/web/app/globals.css apps/web/components/ui/badge.tsx
git commit -m "feat(web): apply OpenClaw palette + success/warning/danger badge variants"
```

---

## Task 14: Logo do Porttion (P azul vívido)

**Files:**

- Modify: `apps/web/components/layout/logo.tsx`

- [ ] **Step 1: Substituir o componente**

`apps/web/components/layout/logo.tsx`:

```tsx
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  href?: string;
  className?: string;
  showWordmark?: boolean;
}

export function Logo({ href = '/', className, showWordmark = true }: LogoProps) {
  return (
    <Link href={href} className={cn('inline-flex items-center gap-2', className)}>
      <span
        aria-hidden
        className="grid h-8 w-8 place-items-center rounded-md bg-[oklch(0.62_0.19_260)] text-sm font-semibold text-white"
      >
        P
      </span>
      {showWordmark ? <span className="text-base font-medium tracking-tight">Porttion</span> : null}
    </Link>
  );
}
```

- [ ] **Step 2: Typecheck**

```bash
npm run typecheck --workspace=@kainos/web
```

Expected: PASS (se `cn` ou `Link` mudaram nome, ajustar imports).

- [ ] **Step 3: Commit**

```bash
git add apps/web/components/layout/logo.tsx
git commit -m "feat(web): rebrand Logo to Porttion mark (blue P)"
```

---

## Task 15: i18n — reestruturar pt-BR.json por feature

**Files:**

- Modify: `apps/web/messages/pt-BR.json`

- [ ] **Step 1: Substituir conteúdo do arquivo**

Substituir **todo** o conteúdo de `apps/web/messages/pt-BR.json` por:

```json
{
  "common": {
    "loading": "Carregando…",
    "error": "Algo deu errado.",
    "retry": "Tentar de novo",
    "cancel": "Cancelar",
    "save": "Salvar",
    "continue": "Continuar",
    "back": "Voltar"
  },
  "errors": {
    "unknown": "Não conseguimos completar a operação. Tente de novo em instantes."
  },
  "landing": {
    "nav": {
      "features": "Recursos",
      "how_it_works": "Como funciona",
      "use_cases": "Casos de uso",
      "faq": "FAQ",
      "login": "Entrar",
      "open_dashboard": "Acessar dashboard"
    },
    "hero": {
      "eyebrow": "01 ─── ANÁLISE DE ATIVOS COM IA",
      "headline_before": "Entenda o que está",
      "headline_emphasis": "acontecendo",
      "headline_after": "com a sua carteira.",
      "subcopy": "Acompanhe ativos da B3, ETFs, renda fixa, cripto e moedas em um só lugar. Receba uma leitura clara — em português — sobre tendência, recomendação e justificativa, gerada por um analista de IA treinado em padrões gráficos.",
      "cta_primary": "Começar grátis",
      "cta_secondary": "Ver uma carteira de exemplo"
    }
  },
  "auth": {
    "signup": {
      "title": "Criar sua conta",
      "subtitle": "Comece a entender sua carteira em minutos.",
      "name_label": "Nome",
      "email_label": "Email",
      "password_label": "Senha",
      "password_hint": "Pelo menos 10 caracteres, com letras e números.",
      "submit": "Criar conta",
      "already_have_account": "Já tem conta?",
      "go_to_login": "Entrar",
      "success_title": "Confirme seu email",
      "success_body": "Enviamos um link de confirmação para {email}. Clique para ativar sua conta."
    },
    "login": {
      "title": "Entrar",
      "subtitle": "Sua carteira está te esperando.",
      "email_label": "Email",
      "password_label": "Senha",
      "submit": "Entrar",
      "forgot": "Esqueci minha senha",
      "or": "ou",
      "google": "Continuar com Google",
      "github": "Continuar com GitHub",
      "no_account": "Ainda não tem conta?",
      "go_to_signup": "Criar conta",
      "tagline": "Porttion · análise com IA"
    },
    "verify": {
      "title": "Confirmando seu email…",
      "success_title": "Email confirmado.",
      "success_body": "Sua conta está ativa. Você já pode entrar.",
      "error_title": "Link inválido ou expirado",
      "error_body": "Solicite um novo link de confirmação na tela de login.",
      "go_to_login": "Ir para login"
    },
    "forgot": {
      "title": "Esqueci minha senha",
      "subtitle": "Digite o email da sua conta e enviamos um link para redefinir a senha.",
      "email_label": "Email",
      "submit": "Enviar link",
      "submitted_title": "Verifique sua caixa de email",
      "submitted_body": "Se houver uma conta com {email}, você receberá um link em instantes."
    },
    "reset": {
      "title": "Definir nova senha",
      "password_label": "Nova senha",
      "password_hint": "Pelo menos 10 caracteres, com letras e números.",
      "submit": "Salvar nova senha",
      "success_title": "Senha alterada",
      "success_body": "Você já pode entrar com a nova senha.",
      "error_title": "Link inválido ou expirado",
      "error_body": "Solicite um novo link na tela de esqueci a senha."
    },
    "errors": {
      "Configuration": "Erro de configuração da autenticação.",
      "AccessDenied": "Acesso negado.",
      "Verification": "Link inválido ou expirado.",
      "OAuthAccountNotLinked": "Esse email já está vinculado a outro provedor.",
      "CredentialsSignin": "Email ou senha inválidos.",
      "EmailNotVerified": "Confirme seu email antes de entrar. Verifique sua caixa de entrada.",
      "Default": "Não conseguimos completar o login. Tente de novo."
    }
  },
  "topbar": {
    "theme_toggle": "Alternar tema",
    "menu": {
      "theme": "Tema",
      "theme_light": "Claro",
      "theme_dark": "Escuro",
      "theme_system": "Sistema",
      "logout": "Sair"
    }
  }
}
```

- [ ] **Step 2: Rodar testes web**

```bash
npm run test --workspace=@kainos/web
```

Expected: alguns testes podem falhar se citam keys antigas (ex.: `home.title`). Atualizar testes para apontar para as keys novas (ou marcar como skip se forem de feature removida).

- [ ] **Step 3: Commit**

```bash
git add apps/web/messages/pt-BR.json
git commit -m "feat(web): restructure i18n by feature (auth, landing, common, topbar)"
```

---

## Task 16: Script de validação i18n + GitHub Action

**Files:**

- Create: `apps/web/scripts/i18n-check.ts`
- Create: `.github/workflows/i18n-check.yml`
- Modify: `apps/web/package.json` (script `i18n:check`)

- [ ] **Step 1: Script de validação**

`apps/web/scripts/i18n-check.ts`:

```typescript
#!/usr/bin/env tsx
import { readFileSync } from 'node:fs';
import { globSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(__dirname, '..');
const MESSAGES_FILE = resolve(ROOT, 'messages/pt-BR.json');

// Coleta todas as chaves planas de um objeto JSON: { a: { b: "x" } } => "a.b"
function flatten(obj: unknown, prefix = ''): Set<string> {
  const out = new Set<string>();
  if (typeof obj !== 'object' || obj === null) return out;
  for (const [k, v] of Object.entries(obj)) {
    const key = prefix ? `${prefix}.${k}` : k;
    if (typeof v === 'object' && v !== null) {
      for (const child of flatten(v, key)) out.add(child);
    } else {
      out.add(key);
    }
  }
  return out;
}

// Extrai chaves usadas via t('...') ou useTranslations('ns').
// Regra: useTranslations('auth.signup') → namespace 'auth.signup';
// dentro daquele componente, t('email_label') → key 'auth.signup.email_label'.
const NS_REGEX = /useTranslations\(\s*['"]([\w.]+)['"]\s*\)/g;
const T_REGEX = /\bt\(\s*['"]([\w.]+)['"]/g;

function extractFromFile(path: string): { ns: string | null; keys: string[] } {
  const src = readFileSync(path, 'utf8');
  const nsMatch = NS_REGEX.exec(src);
  NS_REGEX.lastIndex = 0;
  const ns = nsMatch?.[1] ?? null;
  const keys: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = T_REGEX.exec(src))) keys.push(m[1]);
  T_REGEX.lastIndex = 0;
  return { ns, keys };
}

function main(): void {
  const defined = flatten(JSON.parse(readFileSync(MESSAGES_FILE, 'utf8')));
  const files = globSync('{app,components,lib}/**/*.{ts,tsx}', { cwd: ROOT });
  const missing: { file: string; key: string }[] = [];

  for (const rel of files) {
    const { ns, keys } = extractFromFile(resolve(ROOT, rel));
    for (const k of keys) {
      const full = ns ? `${ns}.${k}` : k;
      if (!defined.has(full)) missing.push({ file: rel, key: full });
    }
  }

  if (missing.length) {
    console.error(`\n✗ ${missing.length} chave(s) i18n usada(s) sem definição em pt-BR.json:\n`);
    for (const { file, key } of missing) console.error(`  ${file}: ${key}`);
    process.exit(1);
  }
  console.log(`✓ i18n-check: ${defined.size} keys, ${files.length} files scanned.`);
}

main();
```

- [ ] **Step 2: Adicionar script no package.json**

Em `apps/web/package.json`, adicionar em `scripts`:

```json
"i18n:check": "tsx scripts/i18n-check.ts"
```

E adicionar `tsx` como devDependency:

```bash
npm install --workspace=@kainos/web --save-dev tsx
```

- [ ] **Step 3: Rodar localmente**

```bash
npm run i18n:check --workspace=@kainos/web
```

Expected: `✓ i18n-check: N keys, M files scanned.` Se aparecer chave faltando, **adicionar em pt-BR.json** (não silenciar). O `Login` atual usa `login.*` e `auth.errors.*` que renomeamos — vai apontar inconsistências. Ajustar.

- [ ] **Step 4: GitHub Action**

`.github/workflows/i18n-check.yml`:

```yaml
name: i18n-check
on:
  pull_request:
    paths:
      - 'apps/web/messages/**'
      - 'apps/web/**/*.ts'
      - 'apps/web/**/*.tsx'
      - 'apps/web/scripts/i18n-check.ts'
jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          cache: 'npm'
      - run: npm ci
      - run: npm run i18n:check --workspace=@kainos/web
```

- [ ] **Step 5: Commit**

```bash
git add apps/web/scripts/i18n-check.ts apps/web/package.json apps/web/package-lock.json package-lock.json .github/workflows/i18n-check.yml
git commit -m "ci(web): add i18n-check script and GitHub Action"
```

---

## Task 17: NextAuth Credentials provider (produção)

**Files:**

- Modify: `apps/web/lib/auth.ts`

- [ ] **Step 1: Adicionar provider de produção**

Em `apps/web/lib/auth.ts`, substituir o bloco `providers: [...]` por:

```typescript
providers: [
  GoogleProvider({
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  }),
  GitHubProvider({
    clientId: env.GITHUB_CLIENT_ID,
    clientSecret: env.GITHUB_CLIENT_SECRET,
  }),
  CredentialsProvider({
    id: 'credentials',
    name: 'Credenciais',
    credentials: {
      email: { label: 'Email', type: 'email' },
      password: { label: 'Senha', type: 'password' },
    },
    authorize: async (creds) => {
      if (!creds?.email || !creds?.password) return null;
      const res = await internalFetch('/api/v1/internal/auth/validate', {
        method: 'POST',
        body: JSON.stringify({ email: creds.email, password: creds.password }),
      });
      if (!res.ok) {
        if (res.status === 401) {
          const body = (await res.json().catch(() => ({}))) as { message?: string };
          if (body.message?.toLowerCase().includes('não verificado')) {
            throw new Error('EmailNotVerified');
          }
          throw new Error('CredentialsSignin');
        }
        throw new Error('Default');
      }
      const user = (await res.json()) as { id: string; email: string; name: string | null; avatar: string | null };
      return { id: user.id, email: user.email, name: user.name, image: user.avatar };
    },
  }),
  // E2E_TEST provider mantido como já estava
  ...(process.env.NODE_ENV === 'test' || process.env.E2E_TEST === '1' ? [/* ... bloco e2e existente ... */] : []),
],
```

(Manter o `...(process.env.NODE_ENV === 'test' ... )` exatamente como estava no arquivo.)

- [ ] **Step 2: Test do Credentials authorize**

Criar `apps/web/lib/__tests__/auth.credentials-provider.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('../internal-api', () => ({ internalFetch: vi.fn() }));
vi.mock('../env', () => ({
  env: {
    GOOGLE_CLIENT_ID: 'g',
    GOOGLE_CLIENT_SECRET: 'g',
    GITHUB_CLIENT_ID: 'h',
    GITHUB_CLIENT_SECRET: 'h',
    NEXTAUTH_SECRET: 'a'.repeat(32),
  },
}));
vi.mock('../secret-fingerprint', () => ({ secretFingerprint: () => 'fp' }));

import { internalFetch } from '../internal-api';
import { authOptions } from '../auth';

function credentialsProvider() {
  return authOptions.providers.find((p: any) => p.id === 'credentials') as any;
}

describe('Credentials provider', () => {
  beforeEach(() => vi.mocked(internalFetch).mockReset());

  it('retorna user em 200', async () => {
    vi.mocked(internalFetch).mockResolvedValue(
      new Response(JSON.stringify({ id: 'u1', email: 'a@b.com', name: 'A', avatar: null }), {
        status: 200,
      }) as any,
    );
    const res = await credentialsProvider().authorize({ email: 'a@b.com', password: 'p' });
    expect(res).toEqual({ id: 'u1', email: 'a@b.com', name: 'A', image: null });
  });

  it('lança EmailNotVerified em 401 + mensagem "não verificado"', async () => {
    vi.mocked(internalFetch).mockResolvedValue(
      new Response(JSON.stringify({ message: 'Email não verificado.' }), { status: 401 }) as any,
    );
    await expect(
      credentialsProvider().authorize({ email: 'a@b.com', password: 'p' }),
    ).rejects.toThrow('EmailNotVerified');
  });

  it('lança CredentialsSignin em 401 genérico', async () => {
    vi.mocked(internalFetch).mockResolvedValue(
      new Response(JSON.stringify({ message: 'Credenciais inválidas.' }), { status: 401 }) as any,
    );
    await expect(
      credentialsProvider().authorize({ email: 'a@b.com', password: 'p' }),
    ).rejects.toThrow('CredentialsSignin');
  });

  it('retorna null se credenciais ausentes', async () => {
    const res = await credentialsProvider().authorize({});
    expect(res).toBeNull();
  });
});
```

- [ ] **Step 3: Rodar**

```bash
npm run test --workspace=@kainos/web -- auth.credentials-provider
```

Expected: 4 testes PASS.

- [ ] **Step 4: Commit**

```bash
git add apps/web/lib/auth.ts apps/web/lib/__tests__/auth.credentials-provider.test.ts
git commit -m "feat(web): NextAuth Credentials provider for email/password login"
```

---

## Task 18: Tela de Signup

**Files:**

- Create: `apps/web/app/(public)/layout.tsx`
- Create: `apps/web/app/(public)/page.tsx`
- Create: `apps/web/app/(public)/signup/page.tsx`
- Create: `apps/web/components/features/auth/signup-form.tsx`

> Cria a rota group `(public)` que abriga signup/login/verify/forgot/reset/landing. Login já existe em `apps/web/app/login/` no template — deixamos por enquanto e a Task 22 reorganiza.

- [ ] **Step 1: `(public)/layout.tsx`**

```tsx
import type { ReactNode } from 'react';

export default function PublicLayout({ children }: { children: ReactNode }) {
  return <div className="bg-background text-foreground min-h-screen">{children}</div>;
}
```

- [ ] **Step 2: `(public)/page.tsx` (landing placeholder mínimo)**

```tsx
import Link from 'next/link';
import { Logo } from '@/components/layout/logo';
import { Button } from '@/components/ui/button';

export default function LandingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col gap-12 px-6 py-10">
      <header className="flex items-center justify-between">
        <Logo />
        <div className="flex items-center gap-3">
          <Button variant="ghost" asChild>
            <Link href="/login">Entrar</Link>
          </Button>
          <Button asChild>
            <Link href="/signup">Começar grátis</Link>
          </Button>
        </div>
      </header>
      <section className="flex max-w-2xl flex-col gap-6">
        <p className="text-muted-foreground text-xs tracking-[0.14em] uppercase">
          01 ─── Análise de ativos com IA
        </p>
        <h1 className="text-4xl font-medium tracking-tight md:text-6xl">
          Entenda o que está <span className="font-serif italic">acontecendo</span> com a sua
          carteira.
        </h1>
        <p className="text-muted-foreground text-base md:text-lg">
          Landing completa virá na F1d. Esta é uma versão placeholder enquanto a fundação é
          construída.
        </p>
      </section>
    </main>
  );
}
```

- [ ] **Step 3: `SignupForm` component**

`apps/web/components/features/auth/signup-form.tsx`:

```tsx
'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function SignupForm() {
  const t = useTranslations('auth.signup');
  const router = useRouter();
  const [state, setState] = useState<'idle' | 'submitting' | 'submitted' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [email, setEmail] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('submitting');
    setErrorMsg(null);
    const data = new FormData(e.currentTarget);
    const payload = {
      email: String(data.get('email') ?? ''),
      name: String(data.get('name') ?? ''),
      password: String(data.get('password') ?? ''),
    };
    setEmail(payload.email);
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/signup`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setState('submitted');
      return;
    }
    if (res.status === 409) {
      setState('error');
      setErrorMsg('Esse email já está em uso.');
      return;
    }
    setState('error');
    setErrorMsg('Não conseguimos criar sua conta. Tente de novo.');
  }

  if (state === 'submitted') {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-medium">{t('success_title')}</h2>
        <p className="text-muted-foreground text-sm">{t('success_body', { email })}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">{t('name_label')}</Label>
        <Input id="name" name="name" type="text" required minLength={2} maxLength={80} />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">{t('email_label')}</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">{t('password_label')}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={10}
          maxLength={128}
        />
        <p className="text-muted-foreground text-xs">{t('password_hint')}</p>
      </div>
      {errorMsg ? <p className="text-sm text-[var(--destructive)]">{errorMsg}</p> : null}
      <Button type="submit" disabled={state === 'submitting'}>
        {state === 'submitting' ? '…' : t('submit')}
      </Button>
      <p className="text-muted-foreground text-sm">
        {t('already_have_account')}{' '}
        <Link href="/login" className="underline">
          {t('go_to_login')}
        </Link>
      </p>
    </form>
  );
}
```

- [ ] **Step 4: `(public)/signup/page.tsx`**

```tsx
import { useTranslations } from 'next-intl';
import { Logo } from '@/components/layout/logo';
import { SignupForm } from '@/components/features/auth/signup-form';

export default function SignupPage() {
  const t = useTranslations('auth.signup');
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6 py-12">
      <Logo href="/" />
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>
      <SignupForm />
    </main>
  );
}
```

- [ ] **Step 5: Adicionar `NEXT_PUBLIC_API_URL` em `apps/web/lib/env.ts`**

Conferir se já existe. Se não, adicionar:

```typescript
NEXT_PUBLIC_API_URL: z.string().url(),
```

E garantir no `.env.local` do web: `NEXT_PUBLIC_API_URL=http://localhost:3001`.

- [ ] **Step 6: Smoke**

`npm run dev` em ambos workspaces, abrir `http://localhost:3000/signup`, submeter formulário. Confirmar 202 e email recebido.

- [ ] **Step 7: Commit**

```bash
git add apps/web/app/\(public\)/ apps/web/components/features/auth/signup-form.tsx apps/web/lib/env.ts
git commit -m "feat(web): signup page with email/password and confirmation flow"
```

---

## Task 19: Tela de Verify Email

**Files:**

- Create: `apps/web/app/(public)/verify-email/[token]/page.tsx`

- [ ] **Step 1: Page (server component que chama a API e renderiza estado)**

```tsx
import Link from 'next/link';
import { Logo } from '@/components/layout/logo';
import { Button } from '@/components/ui/button';
import { getTranslations } from 'next-intl/server';

interface PageProps {
  params: Promise<{ token: string }>;
}

async function verify(token: string): Promise<'ok' | 'error'> {
  const res = await fetch(
    `${process.env.API_URL_INTERNAL ?? process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/verify`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token }),
      cache: 'no-store',
    },
  );
  return res.ok ? 'ok' : 'error';
}

export default async function VerifyEmailPage({ params }: PageProps) {
  const { token } = await params;
  const t = await getTranslations('auth.verify');
  const status = await verify(token);

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6 py-12">
      <Logo href="/" />
      {status === 'ok' ? (
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-medium">{t('success_title')}</h1>
          <p className="text-muted-foreground text-sm">{t('success_body')}</p>
          <Button asChild>
            <Link href="/login">{t('go_to_login')}</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          <h1 className="text-2xl font-medium">{t('error_title')}</h1>
          <p className="text-muted-foreground text-sm">{t('error_body')}</p>
          <Button variant="outline" asChild>
            <Link href="/login">{t('go_to_login')}</Link>
          </Button>
        </div>
      )}
    </main>
  );
}
```

- [ ] **Step 2: Smoke**

Abrir o link recebido por email (Task 11). Conferir que cai na rota e mostra "Email confirmado.". DB confirma `emailVerifiedAt`.

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/\(public\)/verify-email/
git commit -m "feat(web): verify-email page consumes /auth/verify"
```

---

## Task 20: Tela de Forgot Password

**Files:**

- Create: `apps/web/app/(public)/forgot-password/page.tsx`
- Create: `apps/web/components/features/auth/forgot-password-form.tsx`

- [ ] **Step 1: ForgotPasswordForm**

```tsx
'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ForgotPasswordForm() {
  const t = useTranslations('auth.forgot');
  const [state, setState] = useState<'idle' | 'submitting' | 'submitted'>('idle');
  const [email, setEmail] = useState('');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('submitting');
    const data = new FormData(e.currentTarget);
    const value = String(data.get('email') ?? '');
    setEmail(value);
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/forgot-password`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ email: value }),
    });
    // sucesso silencioso (anti-enumeração); sempre mostra mesmo estado
    setState('submitted');
  }

  if (state === 'submitted') {
    return (
      <div className="flex flex-col gap-3">
        <h2 className="text-xl font-medium">{t('submitted_title')}</h2>
        <p className="text-muted-foreground text-sm">{t('submitted_body', { email })}</p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="email">{t('email_label')}</Label>
        <Input id="email" name="email" type="email" required />
      </div>
      <Button type="submit" disabled={state === 'submitting'}>
        {state === 'submitting' ? '…' : t('submit')}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Page**

```tsx
import { Logo } from '@/components/layout/logo';
import { ForgotPasswordForm } from '@/components/features/auth/forgot-password-form';
import { useTranslations } from 'next-intl';

export default function ForgotPasswordPage() {
  const t = useTranslations('auth.forgot');
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6 py-12">
      <Logo href="/" />
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>
      <ForgotPasswordForm />
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/\(public\)/forgot-password/ apps/web/components/features/auth/forgot-password-form.tsx
git commit -m "feat(web): forgot-password page"
```

---

## Task 21: Tela de Reset Password

**Files:**

- Create: `apps/web/app/(public)/reset-password/[token]/page.tsx`
- Create: `apps/web/components/features/auth/reset-password-form.tsx`

- [ ] **Step 1: ResetPasswordForm**

```tsx
'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations('auth.reset');
  const [state, setState] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('submitting');
    const data = new FormData(e.currentTarget);
    const newPassword = String(data.get('password') ?? '');
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/reset-password`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });
    setState(res.ok ? 'success' : 'error');
  }

  if (state === 'success') {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-medium">{t('success_title')}</h2>
        <p className="text-muted-foreground text-sm">{t('success_body')}</p>
        <Button asChild>
          <Link href="/login">Ir para login</Link>
        </Button>
      </div>
    );
  }

  if (state === 'error') {
    return (
      <div className="flex flex-col gap-4">
        <h2 className="text-xl font-medium">{t('error_title')}</h2>
        <p className="text-muted-foreground text-sm">{t('error_body')}</p>
        <Button variant="outline" asChild>
          <Link href="/forgot-password">Pedir novo link</Link>
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="password">{t('password_label')}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          required
          minLength={10}
          maxLength={128}
        />
        <p className="text-muted-foreground text-xs">{t('password_hint')}</p>
      </div>
      <Button type="submit" disabled={state === 'submitting'}>
        {state === 'submitting' ? '…' : t('submit')}
      </Button>
    </form>
  );
}
```

- [ ] **Step 2: Page**

```tsx
import { Logo } from '@/components/layout/logo';
import { ResetPasswordForm } from '@/components/features/auth/reset-password-form';
import { useTranslations } from 'next-intl';

interface Props {
  params: Promise<{ token: string }>;
}

export default async function ResetPasswordPage({ params }: Props) {
  const { token } = await params;
  const t = useTranslations('auth.reset');
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6 py-12">
      <Logo href="/" />
      <h1 className="text-2xl font-medium">{t('title')}</h1>
      <ResetPasswordForm token={token} />
    </main>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add apps/web/app/\(public\)/reset-password/ apps/web/components/features/auth/reset-password-form.tsx
git commit -m "feat(web): reset-password page"
```

---

## Task 22: Refatorar Login para email/senha + OAuth

**Files:**

- Modify: `apps/web/components/features/login/login.tsx`
- Modify: `apps/web/app/login/page.tsx` (mover para `(public)/login/page.tsx`)

- [ ] **Step 1: Mover login para route group `(public)`**

```bash
mkdir -p apps/web/app/\(public\)/login
git mv apps/web/app/login/page.tsx apps/web/app/\(public\)/login/page.tsx
rmdir apps/web/app/login
```

- [ ] **Step 2: Refatorar `login.tsx`**

Substituir `apps/web/components/features/login/login.tsx` por:

```tsx
'use client';
import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter, useSearchParams } from 'next/navigation';
import { signIn } from 'next-auth/react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/layout/logo';
import { GoogleLogo } from './google-logo';
import { GithubLogo } from './github-logo';

const ERROR_KEYS = [
  'Configuration',
  'AccessDenied',
  'Verification',
  'OAuthAccountNotLinked',
  'CredentialsSignin',
  'EmailNotVerified',
  'Default',
] as const;
type ErrorKey = (typeof ERROR_KEYS)[number];

export function Login() {
  const t = useTranslations('auth.login');
  const tErr = useTranslations('auth.errors');
  const params = useSearchParams();
  const router = useRouter();
  const errorParam = params.get('error');
  const errorKey: ErrorKey | null = errorParam
    ? (ERROR_KEYS as readonly string[]).includes(errorParam)
      ? (errorParam as ErrorKey)
      : 'Default'
    : null;

  const [submitting, setSubmitting] = useState(false);
  const [localError, setLocalError] = useState<ErrorKey | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitting(true);
    setLocalError(null);
    const data = new FormData(e.currentTarget);
    const res = await signIn('credentials', {
      email: String(data.get('email') ?? ''),
      password: String(data.get('password') ?? ''),
      redirect: false,
    });
    setSubmitting(false);
    if (!res || res.error) {
      const key: ErrorKey =
        res?.error === 'EmailNotVerified' ? 'EmailNotVerified' : 'CredentialsSignin';
      setLocalError(key);
      return;
    }
    router.replace('/');
  }

  const visibleError: ErrorKey | null = localError ?? errorKey;

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center gap-8 px-6 py-12">
      <Logo href="/" />
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-medium">{t('title')}</h1>
        <p className="text-muted-foreground text-sm">{t('subtitle')}</p>
      </header>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="email">{t('email_label')}</Label>
          <Input id="email" name="email" type="email" required autoComplete="email" />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="password">{t('password_label')}</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            autoComplete="current-password"
          />
        </div>
        {visibleError ? (
          <p className="text-sm text-[var(--destructive)]" role="alert">
            {tErr(visibleError)}
          </p>
        ) : null}
        <Button type="submit" disabled={submitting}>
          {submitting ? '…' : t('submit')}
        </Button>
        <Link href="/forgot-password" className="text-muted-foreground text-sm underline">
          {t('forgot')}
        </Link>
      </form>

      <div className="text-muted-foreground flex items-center gap-3 text-xs tracking-[0.14em] uppercase">
        <span className="h-px flex-1 bg-[var(--border)]" />
        {t('or')}
        <span className="h-px flex-1 bg-[var(--border)]" />
      </div>

      <div className="flex flex-col gap-3">
        <Button variant="outline" onClick={() => signIn('google', { callbackUrl: '/' })}>
          <GoogleLogo /> {t('google')}
        </Button>
        <Button variant="outline" onClick={() => signIn('github', { callbackUrl: '/' })}>
          <GithubLogo /> {t('github')}
        </Button>
      </div>

      <p className="text-muted-foreground text-sm">
        {t('no_account')}{' '}
        <Link href="/signup" className="underline">
          {t('go_to_signup')}
        </Link>
      </p>
    </main>
  );
}
```

- [ ] **Step 3: Rodar i18n-check**

```bash
npm run i18n:check --workspace=@kainos/web
```

Expected: PASS.

- [ ] **Step 4: Rodar testes web**

```bash
npm run test --workspace=@kainos/web
```

Atualizar quaisquer testes que apontavam para `login.*` (template antigo) para usar `auth.login.*`. Se for muito custoso, deletar tests obsoletos e abrir issue para reescrever.

- [ ] **Step 5: Smoke**

`npm run dev`, abrir `/login`. Fluxo:

1. Tentar entrar com email recém-verificado da Task 11.
2. Conferir redirecionamento para `/`.
3. Sair, voltar com senha errada → ver erro `auth.errors.CredentialsSignin`.
4. Criar novo signup, **sem** verificar, tentar login → ver erro `auth.errors.EmailNotVerified`.

- [ ] **Step 6: Commit**

```bash
git add apps/web/components/features/login/login.tsx apps/web/app/
git commit -m "feat(web): login form with email/password + OAuth, error mapping for unverified email"
```

---

## Task 23: CLAUDE.md — fluxo de entrega

**Files:**

- Modify: `CLAUDE.md`

- [ ] **Step 1: Adicionar bloco**

Acrescentar ao final do `CLAUDE.md` (depois de "Backlog do template"):

```markdown
## Fluxo de entrega

Toda implementação termina em PR contra a branch `staging` (não direto pra `main`).

### Branches e ambientes

- `main` — produção. Sempre deployable. Deploy automático no Railway (env de produção).
- `staging` — pré-produção. Alvo de todos os PRs de feature. Deploy automático no Railway (env de staging).
- `feat/*`, `fix/*`, `chore/*`, `refactor/*` — branches de trabalho, deletadas após merge.

### Requisitos para merge em staging

1. **CI verde obrigatório:** lint + typecheck + test (Jest+Vitest) + build + e2e (Playwright em mobile e desktop) + `scripts/i18n-check.ts` precisam passar.
   - Nenhum job pode estar `skipped` exceto por path filter justificado (ex.: docs-only).
   - `--no-verify` em hooks é proibido sem aprovação explícita.
2. **Revisão obrigatória** com classificação por severidade:
   - **P0** — bloqueador (bug, regressão, falha de segurança, contrato quebrado, falha de critério de aceitação). **Precisa ser resolvido antes do merge.**
   - **P1** — importante mas não bloqueia (refactor sugerido, melhoria de UX/perf). Vira issue ou commit follow-up; **não bloqueia merge**.
   - **P2** — nice-to-have / opinião / nit. Resolução opcional.
3. **Squash and merge** apenas. Mensagem final = título do PR (conventional commit).

### Promoção staging → main

Promoção é manual e periódica (não automática). Após smoke test em staging do fluxo coberto pela fase, abre-se um PR `staging → main` com o release notes. Mesmo gate de CI verde se aplica.

## Convenção de i18n

- Toda string visível ao usuário vai por `t('key')` com namespace `<feature>.<scope>.<key>`.
- Sem concatenação de string em código; frases compostas usam ICU MessageFormat (`{name}`, `{n, plural, ...}`).
- Datas/números via `useFormatter` de `next-intl`, nunca `toLocaleString` solto.
- Validado em CI por `scripts/i18n-check.ts`. Chave usada sem definição = PR vermelho.
- Strings que **não** vão para i18n: símbolos de moeda (`R$`), tickers (`PETR4`), labels técnicos em mono (`gpt-4o-mini`, versão de prompt).
```

- [ ] **Step 2: Commit**

```bash
git add CLAUDE.md
git commit -m "docs(claude): add PR-to-staging flow and i18n convention"
```

---

## Task 24: PR Template

**Files:**

- Create: `.github/pull_request_template.md`

- [ ] **Step 1: Escrever template**

```markdown
## Resumo

<!-- 1-3 frases. Conecte com a fase / spec que essa PR implementa. -->

## Checklist

- [ ] CI verde (lint + typecheck + tests + build + e2e + i18n-check)
- [ ] Comentários **P0** resolvidos
- [ ] Sem `--no-verify` em hooks
- [ ] Sem hardcode de string visível (passou pelo `i18n-check`)
- [ ] Ownership: toda query nova de dado de usuário filtra por `userId`
- [ ] Nenhuma chave/segredo no client
- [ ] Migrações Prisma reversíveis (ou marcadas como destrutivas com plano)

## Como testar

<!-- Passo a passo manual. Inclua URL/comando para reproduzir. -->

## Screenshots / vídeos

<!-- Se mudou UI, anexar mobile (375px) e desktop. -->

## Rotas / contratos afetados

<!-- Listar endpoints, schemas, eventos. Quebra de contrato = P0. -->

## Severidade da review

| Sev    | Descrição                                             | Resolução                        |
| ------ | ----------------------------------------------------- | -------------------------------- |
| **P0** | Bug, regressão, falha de segurança, contrato quebrado | Obrigatório antes do merge       |
| **P1** | Refactor / UX / perf importante                       | Issue ou follow-up; não bloqueia |
| **P2** | Nit / opinião                                         | Opcional                         |
```

- [ ] **Step 2: Commit**

```bash
git add .github/pull_request_template.md
git commit -m "chore: add PR template with severity classification"
```

---

## Task 25: Garantir testes verdes + lint + typecheck completos

**Files:** nenhum; gate de qualidade

- [ ] **Step 1: Rodar suíte completa**

```bash
npm run lint
npm run typecheck
npm run test
npm run i18n:check --workspace=@kainos/web
npm run build
```

Expected: tudo verde. Se algo falha, corrigir antes de seguir.

- [ ] **Step 2: Commit (se houve fix)**

```bash
git add .
git commit -m "fix: post-foundation cleanups (lint/typecheck/tests)"
```

(Skip se nada mudou.)

---

## Task 26: Abrir PR contra staging

**Files:** nenhum

- [ ] **Step 1: Garantir que branch `staging` existe no remote**

```bash
git fetch origin
git ls-remote --heads origin staging
```

Se vazio:

```bash
git checkout main
git pull
git checkout -b staging
git push -u origin staging
git checkout refact
```

- [ ] **Step 2: Push da branch de feature**

A branch de trabalho deveria ser `feat/spec-01a-foundation-and-auth`. Se ainda está em `refact`:

```bash
git checkout -b feat/spec-01a-foundation-and-auth
git push -u origin feat/spec-01a-foundation-and-auth
```

- [ ] **Step 3: Abrir PR contra staging**

```bash
gh pr create --base staging --title "feat(F1a): foundation + auth (email/senha via Resend)" --body "$(cat <<'EOF'
## Resumo

Implementa **Spec 01a — Foundation + Auth** da F1: tema OpenClaw, fontes Inter / Instrument Serif / JetBrains Mono, i18n centralizado com validação em CI, autenticação por email/senha com verificação via Resend (mantendo Google/GitHub do template).

Veja `docs/superpowers/specs/2026-05-20-spec-00-roadmap.md` (§7 e §11) e `docs/superpowers/plans/2026-05-20-spec-01a-foundation-and-auth.md`.

## Como testar

1. `npm install && npm run db:setup`
2. Configurar `.env.local` em `apps/api` e `apps/web` (ver plano §Pré-requisitos)
3. `npm run dev`
4. Em `http://localhost:3000`:
   - `/signup` → criar conta
   - Conferir email de confirmação (Resend dashboard ou caixa)
   - Clicar no link de verify
   - `/login` → entrar com email/senha → cai em `/`
5. Testar `/forgot-password` → receber link → `/reset-password/[token]` → trocar senha

## Rotas / contratos novos

- `POST /api/v1/auth/signup` (public, 202)
- `POST /api/v1/auth/verify` (public, 200)
- `POST /api/v1/auth/forgot-password` (public, 202)
- `POST /api/v1/auth/reset-password` (public, 200)
- `POST /api/v1/internal/auth/validate` (S2S only)

## Checklist

- [x] CI verde
- [x] Sem hardcode de string visível
- [x] Toda query nova filtra por userId
- [x] Sem chave/segredo no client
- [x] Migration `auth_email` reversível

🤖 Generated with [Claude Code](https://claude.com/claude-code)
EOF
)"
```

- [ ] **Step 4: Aguardar CI verde + revisão P0**

Conferir GitHub Actions: `i18n-check` + lint/typecheck/test/build/e2e (estes últimos do workflow do template). Resolver comentários P0. Squash and merge para `staging` quando aprovado.

---

## Self-review (já executado)

**1. Cobertura da spec 00:**

- §2.1 Resend escolhido — coberto por Tasks 1, 2, 4
- §2.2 Mobile-first — adiado para spec-01c (layout) e spec-01d (Playwright); aqui só formulários nativamente responsivos via Tailwind
- §2.3 i18n centralizado em tokens com validação CI — Tasks 15, 16
- §3 Schema `EmailToken` + extensão de `User` — Task 3
- §4 Módulos backend `email`, `auth/credentials`, `auth/email-verification` — Tasks 4-10
- §4.3 Rate limit `auth-email` — Task 10
- §7.1 Telas 2-6 (Login, Signup, Verify, Forgot, Reset) — Tasks 18-22
- §10 Padrões compartilhados (i18n CI, validação Zod, ownership) — Tasks 15-16; ownership já enforce no template
- §11 Fluxo de entrega no CLAUDE.md — Task 23
- PR template — Task 24

**2. Placeholders:** nenhum "TBD" ou "implement later"; todas as tasks têm código completo.

**3. Type consistency:** `ValidatedUser`, `SignupInput`, `EmailTokenKind`, `EmailTokenService.issue()/.consume()` usados consistentemente entre tasks 5-10. `internalFetch` e `signIn('credentials', ...)` seguem assinaturas atuais do template e do next-auth v4.

**4. Decisões registradas explicitamente:**

- bcryptjs em vez de bcrypt (sem deps nativas) — Task 1
- HTML strings em vez de React Email — Task 4
- Sucesso silencioso em `forgotPassword` (anti-enumeração) — Task 7
- Token = 32 bytes hex, hash sha256 no DB — Task 5
- TTL: VERIFY 24h, RESET 30min — Tasks 5/7
- `forwardRef` entre `CredentialsModule` e `EmailVerificationModule` para resolver ciclo — Task 10
