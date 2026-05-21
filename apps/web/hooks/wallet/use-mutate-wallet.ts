'use client';
import { useCallback } from 'react';
import { useSWRConfig } from 'swr';
import type { WalletDetail } from '@kainos/shared-types';

interface CreateInput {
  name: string;
  baseCurrency: 'BRL' | 'USD' | 'EUR';
  strategy: 'balanceada' | 'crescimento' | 'renda' | 'personalizada' | null;
}

interface UpdateInput {
  name?: string;
  strategy?: 'balanceada' | 'crescimento' | 'renda' | 'personalizada' | null;
}

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await res.json();
  return (await res.json()) as T;
}

async function patch<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`/api${path}`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw await res.json();
  return (await res.json()) as T;
}

async function del(path: string): Promise<void> {
  const res = await fetch(`/api${path}`, { method: 'DELETE', credentials: 'include' });
  if (!res.ok && res.status !== 204) throw await res.json();
}

export function useMutateWallet() {
  const { mutate } = useSWRConfig();
  const invalidate = () => mutate('/v1/wallets');

  const create = useCallback(
    async (input: CreateInput): Promise<WalletDetail> => {
      const result = await post<WalletDetail>('/v1/wallets', input);
      await invalidate();
      return result;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mutate],
  );

  const update = useCallback(
    async (id: string, input: UpdateInput): Promise<WalletDetail> => {
      const result = await patch<WalletDetail>(`/v1/wallets/${id}`, input);
      await invalidate();
      await mutate(`/v1/wallets/${id}`);
      return result;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mutate],
  );

  const remove = useCallback(
    async (id: string): Promise<void> => {
      await del(`/v1/wallets/${id}`);
      await invalidate();
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [mutate],
  );

  return { create, update, remove };
}
