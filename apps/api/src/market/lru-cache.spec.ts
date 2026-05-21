import { LruCache } from './lru-cache';

describe('LruCache', () => {
  it('retorna valor cacheado dentro do TTL', () => {
    const cache = new LruCache<string, number>({ max: 10, ttlMs: 1000 });
    cache.set('a', 1);
    expect(cache.get('a')).toBe(1);
  });

  it('expira após o TTL', () => {
    jest.useFakeTimers();
    const cache = new LruCache<string, number>({ max: 10, ttlMs: 1000 });
    cache.set('a', 1);
    jest.advanceTimersByTime(1500);
    expect(cache.get('a')).toBeUndefined();
    jest.useRealTimers();
  });

  it('evita a chave menos recentemente usada quando estoura max', () => {
    const cache = new LruCache<string, number>({ max: 2, ttlMs: 60_000 });
    cache.set('a', 1);
    cache.set('b', 2);
    cache.get('a');
    cache.set('c', 3);
    expect(cache.get('b')).toBeUndefined();
    expect(cache.get('a')).toBe(1);
    expect(cache.get('c')).toBe(3);
  });

  it('delete e clear funcionam', () => {
    const cache = new LruCache<string, number>({ max: 10, ttlMs: 60_000 });
    cache.set('a', 1);
    cache.delete('a');
    expect(cache.get('a')).toBeUndefined();
    cache.set('b', 2);
    cache.clear();
    expect(cache.get('b')).toBeUndefined();
  });
});
