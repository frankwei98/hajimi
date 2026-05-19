import { useCallback, useRef, useEffect } from 'react';
import type { StoredKey } from '../../lib/storage/types';
import { updateKey } from '../../lib/storage/keyStore';

export function useKeyIdentity(deps: { keys: StoredKey[]; setKeys: (keys: StoredKey[]) => void; setError: (v: string | null) => void; setNotice: (v: string | null) => void }) {
  const { keys, setKeys, setError, setNotice } = deps;
  const keysRef = useRef(keys);
  useEffect(() => { keysRef.current = keys; }, [keys]);

  const handleUpdateIdentity = useCallback(async (entryId: string, updates: { label?: string; avatarUrl?: string }) => {
    setError(null);
    setNotice(null);
    try {
      const entry = keysRef.current.find((k) => k.id === entryId);
      if (!entry) { setError('找不到该密钥'); return; }
      const updated = { ...entry, ...updates };
      await updateKey(updated);
      setKeys(keysRef.current.map((k) => (k.id === entryId ? updated : k)));
      setNotice('身份信息已更新');
    } catch {
      setError('更新身份信息失败');
    }
  }, [setKeys, setError, setNotice]);

  return { handleUpdateIdentity };
}
