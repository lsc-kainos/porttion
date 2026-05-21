import { renderHook, act } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMediaQuery } from '../use-media-query';

describe('useMediaQuery', () => {
  let listeners: ((e: MediaQueryListEvent) => void)[] = [];
  let matches = false;

  beforeEach(() => {
    listeners = [];
    matches = false;
    vi.stubGlobal('matchMedia', (query: string) => ({
      matches,
      media: query,
      addEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => {
        listeners.push(cb);
      },
      removeEventListener: (_: string, cb: (e: MediaQueryListEvent) => void) => {
        listeners = listeners.filter((l) => l !== cb);
      },
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('retorna false quando query não casa', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    expect(result.current).toBe(false);
  });

  it('atualiza quando media change dispara', () => {
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'));
    act(() => {
      listeners.forEach((cb) => cb({ matches: true } as unknown as MediaQueryListEvent));
    });
    expect(result.current).toBe(true);
  });
});
