import { z } from 'zod';

export const envSchema = z
  .object({
    NODE_ENV: z
      .enum(['development', 'production', 'test'])
      .default('development'),
    PORT: z.coerce.number().default(3001),
    DATABASE_URL: z.string().url(),
    ALLOWED_ORIGINS: z.string().min(1, 'ALLOWED_ORIGINS é obrigatório'),
    NEXTAUTH_SECRET: z
      .string()
      .min(32, 'NEXTAUTH_SECRET deve ter pelo menos 32 chars'),

    // Service-to-service token usado pelo web pra chamar endpoints
    // internos da API (ex: sync de usuário no fluxo de login do NextAuth).
    INTERNAL_SERVICE_TOKEN: z
      .string()
      .min(32, 'INTERNAL_SERVICE_TOKEN deve ter pelo menos 32 chars'),

    // CSV de emails que recebem role ADMIN no upsert. String vazia = sem
    // admins. A determinação de role é regra de negócio do backend.
    ADMIN_EMAILS: z.string().optional().default(''),

    // --- Storage (módulo opcional — ver docs/modules.md) ---
    // Driver: 'volume' = FS local (dev/test), 'r2' = Cloudflare R2 (prod)
    STORAGE_DRIVER: z.enum(['volume', 'r2']).default('volume'),
    VOLUME_ROOT: z.string().min(1).optional(),
    STORAGE_URL_SECRET: z
      .string()
      .min(32, 'STORAGE_URL_SECRET deve ter pelo menos 32 chars'),
    UPLOAD_MAX_BYTES: z.coerce.number().int().positive().default(10_485_760),
    R2_ACCOUNT_ID: z.string().optional(),
    R2_ACCESS_KEY_ID: z.string().optional(),
    R2_SECRET_ACCESS_KEY: z.string().optional(),
    R2_BUCKET: z.string().optional(),

    // --- LLM provider (opcional — ai-runtime usa quando habilitado) ---
    // String vazia é tratada como ausente (placeholder em .env de dev).
    OPENAI_API_KEY: z.preprocess(
      (v) => (v === '' ? undefined : v),
      z.string().min(1).optional(),
    ),
    LLM_PROVIDER: z.enum(['openai', 'mock']).default('mock'),

    // --- Fila distribuída (BullMQ) ---
    REDIS_URL: z.string().url().default('redis://localhost:6379'),
    BULL_BOARD_ENABLED: z
      .preprocess((v) => v === 'true' || v === true, z.boolean())
      .default(false),
    BULL_BOARD_BASIC_AUTH_USER: z.string().optional(),
    BULL_BOARD_BASIC_AUTH_PASSWORD: z.string().optional(),

    // --- Email transactional ---
    RESEND_API_KEY: z.string().min(1, 'RESEND_API_KEY é obrigatório'),
    EMAIL_FROM: z.string().email('EMAIL_FROM deve ser email válido'),

    // URL pública do app — usada em links de verify/reset enviados por email.
    APP_URL: z.string().url('APP_URL deve ser URL válida'),
  })
  .superRefine((env, ctx) => {
    if (env.LLM_PROVIDER === 'openai' && !env.OPENAI_API_KEY) {
      ctx.addIssue({
        code: 'custom',
        path: ['OPENAI_API_KEY'],
        message: 'OPENAI_API_KEY é obrigatória quando LLM_PROVIDER=openai',
      });
    }
    if (env.STORAGE_DRIVER === 'volume' && !env.VOLUME_ROOT) {
      ctx.addIssue({
        code: 'custom',
        path: ['VOLUME_ROOT'],
        message: 'VOLUME_ROOT é obrigatória quando STORAGE_DRIVER=volume',
      });
    }
    if (env.STORAGE_DRIVER === 'r2') {
      for (const k of [
        'R2_ACCOUNT_ID',
        'R2_ACCESS_KEY_ID',
        'R2_SECRET_ACCESS_KEY',
        'R2_BUCKET',
      ] as const) {
        if (!env[k]) {
          ctx.addIssue({
            code: 'custom',
            path: [k],
            message: `${k} é obrigatória quando STORAGE_DRIVER=r2`,
          });
        }
      }
    }
    if (env.BULL_BOARD_ENABLED && !env.BULL_BOARD_BASIC_AUTH_USER) {
      ctx.addIssue({
        code: 'custom',
        path: ['BULL_BOARD_BASIC_AUTH_USER'],
        message:
          'BULL_BOARD_BASIC_AUTH_USER é obrigatória quando BULL_BOARD_ENABLED=true',
      });
    }
    if (env.BULL_BOARD_ENABLED && !env.BULL_BOARD_BASIC_AUTH_PASSWORD) {
      ctx.addIssue({
        code: 'custom',
        path: ['BULL_BOARD_BASIC_AUTH_PASSWORD'],
        message:
          'BULL_BOARD_BASIC_AUTH_PASSWORD é obrigatória quando BULL_BOARD_ENABLED=true',
      });
    }
  });

export type Env = z.infer<typeof envSchema>;

export function validateEnv(raw: Record<string, unknown>): Env {
  const parsed = envSchema.safeParse(raw);
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.')}: ${i.message}`)
      .join('\n');
    throw new Error(`Env inválida:\n${issues}`);
  }
  return parsed.data;
}
