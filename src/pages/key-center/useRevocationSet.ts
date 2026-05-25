import { useEffect, useMemo, useState } from 'react';
import { api } from '../../../convex/_generated/api';
import { hasBackend, requireBackend } from '../../lib/backend/convexClient';

export function useRevocationSet() {
  const [revocations, setRevocations] = useState<{ kid: string }[]>([]);
  useEffect(() => {
    if (!hasBackend) return;
    let cancelled = false;
    requireBackend()
      .query(api.revocations.listRevocations, { limit: 500 })
      .then((result) => {
        if (!cancelled) setRevocations(result as { kid: string }[]);
      })
      .catch(() => {
        if (!cancelled) setRevocations([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return useMemo(() => new Set(revocations?.map((r: { kid: string }) => r.kid)), [revocations]);
}
