interface Entry<V> {
  value: V;
  expiresAt: number;
}

interface Opts {
  max: number;
  ttlMs: number;
}

// LRU + TTL in-process. `Map` no JS preserva ordem de inserção, então
// remover + inserir promove a chave para o final ("mais recentemente usada").
export class LruCache<K, V> {
  private readonly map = new Map<K, Entry<V>>();

  constructor(private readonly opts: Opts) {}

  get(key: K): V | undefined {
    const entry = this.map.get(key);
    if (!entry) return undefined;
    if (entry.expiresAt < Date.now()) {
      this.map.delete(key);
      return undefined;
    }
    // promove
    this.map.delete(key);
    this.map.set(key, entry);
    return entry.value;
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) this.map.delete(key);
    this.map.set(key, { value, expiresAt: Date.now() + this.opts.ttlMs });
    while (this.map.size > this.opts.max) {
      const first = this.map.keys().next().value;
      if (first === undefined) break;
      this.map.delete(first);
    }
  }

  delete(key: K): void {
    this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }
}
