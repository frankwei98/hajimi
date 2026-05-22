import { useMemo } from 'react';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';

export function useRevocationSet() {
  const revocations = useQuery(api.revocations.listRevocations, { limit: 500 });
  return useMemo(() => new Set(revocations?.map((r: { kid: string }) => r.kid)), [revocations]);
}
