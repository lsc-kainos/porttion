import { validateEnv } from './env.schema';

const validRaw = {
  NODE_ENV: 'development',
  PORT: '3001',
  DATABASE_URL: 'postgresql://kainos:kainos@localhost:5432/kainos',
  ALLOWED_ORIGINS: 'http://localhost:3000',
  NEXTAUTH_SECRET: 'a'.repeat(32),
  VOLUME_ROOT: '/tmp/volume',
  STORAGE_URL_SECRET: 'b'.repeat(32),
  INTERNAL_SERVICE_TOKEN: 'x'.repeat(32),
  LLM_PROVIDER: 'mock',
};

function omit<T extends Record<string, unknown>>(
  obj: T,
  key: keyof T,
): Partial<T> {
  const copy: Record<string, unknown> = { ...obj };
  delete copy[key as string];
  return copy as Partial<T>;
}

describe('validateEnv', () => {
  it('aceita env válida e coage PORT para number', () => {
    const env = validateEnv(validRaw);
    expect(env.PORT).toBe(3001);
    expect(env.NODE_ENV).toBe('development');
    expect(env.DATABASE_URL).toBe(validRaw.DATABASE_URL);
    expect(env.ALLOWED_ORIGINS).toBe(validRaw.ALLOWED_ORIGINS);
  });

  it('aplica default para NODE_ENV e PORT quando ausentes', () => {
    const env = validateEnv(omit(omit(validRaw, 'NODE_ENV'), 'PORT'));
    expect(env.NODE_ENV).toBe('development');
    expect(env.PORT).toBe(3001);
  });

  it('rejeita quando DATABASE_URL está ausente', () => {
    expect(() => validateEnv(omit(validRaw, 'DATABASE_URL'))).toThrow(
      /DATABASE_URL/,
    );
  });

  it('rejeita quando ALLOWED_ORIGINS está ausente', () => {
    expect(() => validateEnv(omit(validRaw, 'ALLOWED_ORIGINS'))).toThrow(
      /ALLOWED_ORIGINS/,
    );
  });

  it('rejeita DATABASE_URL não-URL', () => {
    expect(() =>
      validateEnv({ ...validRaw, DATABASE_URL: 'not-a-url' }),
    ).toThrow(/DATABASE_URL/);
  });

  it('rejeita NODE_ENV inválido', () => {
    expect(() => validateEnv({ ...validRaw, NODE_ENV: 'staging' })).toThrow(
      /NODE_ENV/,
    );
  });

  it('rejeita NEXTAUTH_SECRET ausente', () => {
    expect(() => validateEnv(omit(validRaw, 'NEXTAUTH_SECRET'))).toThrow(
      /NEXTAUTH_SECRET/,
    );
  });

  it('aceita NEXTAUTH_SECRET com 32+ chars', () => {
    const env = validateEnv(validRaw);
    expect(env.NEXTAUTH_SECRET).toHaveLength(32);
  });

  it('rejeita INTERNAL_SERVICE_TOKEN com menos de 32 chars', () => {
    expect(() =>
      validateEnv({ ...validRaw, INTERNAL_SERVICE_TOKEN: 'short' }),
    ).toThrow(/INTERNAL_SERVICE_TOKEN/);
  });

  describe('Storage', () => {
    it('default STORAGE_DRIVER=volume, UPLOAD_MAX_BYTES=10MB', () => {
      const env = validateEnv(validRaw);
      expect(env.STORAGE_DRIVER).toBe('volume');
      expect(env.UPLOAD_MAX_BYTES).toBe(10_485_760);
    });

    it('rejeita STORAGE_URL_SECRET com menos de 32 chars', () => {
      expect(() =>
        validateEnv({ ...validRaw, STORAGE_URL_SECRET: 'short' }),
      ).toThrow(/STORAGE_URL_SECRET/);
    });

    it('exige VOLUME_ROOT quando STORAGE_DRIVER=volume (default)', () => {
      expect(() => validateEnv(omit(validRaw, 'VOLUME_ROOT'))).toThrow(
        /VOLUME_ROOT/,
      );
    });

    it('não exige VOLUME_ROOT quando STORAGE_DRIVER=r2', () => {
      const r2Raw = {
        ...omit(validRaw, 'VOLUME_ROOT'),
        STORAGE_DRIVER: 'r2',
        R2_ACCOUNT_ID: 'acc',
        R2_ACCESS_KEY_ID: 'kid',
        R2_SECRET_ACCESS_KEY: 'sec',
        R2_BUCKET: 'my-bucket',
      };
      expect(() => validateEnv(r2Raw)).not.toThrow();
    });

    it('exige vars R2 quando STORAGE_DRIVER=r2', () => {
      const r2Base = {
        ...omit(validRaw, 'VOLUME_ROOT'),
        STORAGE_DRIVER: 'r2',
      };
      expect(() => validateEnv(r2Base)).toThrow(/R2_ACCOUNT_ID/);
    });
  });

  describe('LLM', () => {
    it('aceita LLM_PROVIDER=mock sem OPENAI_API_KEY', () => {
      expect(() =>
        validateEnv({ ...validRaw, LLM_PROVIDER: 'mock' }),
      ).not.toThrow();
    });

    it('exige OPENAI_API_KEY quando LLM_PROVIDER=openai', () => {
      expect(() =>
        validateEnv({ ...validRaw, LLM_PROVIDER: 'openai' }),
      ).toThrow(/OPENAI_API_KEY/);
    });

    it('aceita LLM_PROVIDER=openai com OPENAI_API_KEY', () => {
      expect(() =>
        validateEnv({
          ...validRaw,
          LLM_PROVIDER: 'openai',
          OPENAI_API_KEY: 'sk-test',
        }),
      ).not.toThrow();
    });
  });

  describe('Bull Board', () => {
    it('exige basic auth user/password quando BULL_BOARD_ENABLED=true', () => {
      expect(() =>
        validateEnv({ ...validRaw, BULL_BOARD_ENABLED: 'true' }),
      ).toThrow(/BULL_BOARD_BASIC_AUTH/);
    });

    it('aceita BULL_BOARD_ENABLED=true com user+pass', () => {
      expect(() =>
        validateEnv({
          ...validRaw,
          BULL_BOARD_ENABLED: 'true',
          BULL_BOARD_BASIC_AUTH_USER: 'admin',
          BULL_BOARD_BASIC_AUTH_PASSWORD: 'secret',
        }),
      ).not.toThrow();
    });
  });
});
