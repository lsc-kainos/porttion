'use client';
import { useCallback } from 'react';
import { useSWRConfig } from 'swr';
import type { PositionWithQuote } from '@kainos/shared-types';

interface CreateInput {
  ticker: string;
  qty: number;
  avgPrice: number;
}

interface UpdateInput {
  qty?: number;
  avgPrice?: number;
}

export function useMutatePosition() {
  const { mutate } = useSWRConfig();

  const create = useCallback(
    async (walletId: string, input: CreateInput) => {
      const res = await fetch(`/api/v1/wallets/${walletId}/positions`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw await res.json();
      const result = (await res.json()) as PositionWithQuote;
      await mutate('/v1/wallets');
      await mutate(`/v1/wallets/${walletId}`);
      return result;
    },
    [mutate],
  );

  const update = useCallback(
    async (walletId: string, positionId: string, input: UpdateInput) => {
      const res = await fetch(`/api/v1/positions/${positionId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw await res.json();
      const result = (await res.json()) as PositionWithQuote;
      await mutate(`/v1/wallets/${walletId}`);
      return result;
    },
    [mutate],
  );

  const remove = useCallback(
    async (walletId: string, positionId: string) => {
      const res = await fetch(`/api/v1/positions/${positionId}`, {
        method: 'DELETE',
        credentials: 'include',
      });
      if (!res.ok && res.status !== 204) throw await res.json();
      await mutate(`/v1/wallets/${walletId}`);
      await mutate('/v1/wallets');
    },
    [mutate],
  );

  return { create, update, remove };
}
