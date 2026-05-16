import { decryptPrivateKey, toHex } from '../crypto/keyVault';
import { deleteKey } from '../storage/keyStore';
import type { StoredKey } from '../storage/types';
import { useKeyVaultStore } from '../state/keyVaultStore';
import type { KeyActionDeps } from './types';

export function useKeyReveal(deps: KeyActionDeps) {
  const { privateKeyByPub, setPrivateKey, removePrivateKey } = useKeyVaultStore();
  const { pin, keys, isUnlocked, revealedKeys, setError, setNotice, setKeys, setRevealedKeys } = deps;

  const handleToggleReveal = async (entry: StoredKey) => {
    if (revealedKeys[entry.id]) {
      setRevealedKeys((prev) => { const next = { ...prev }; delete next[entry.id]; return next; });
      return;
    }
    setError(null);
    setNotice(null);
    try {
      let pk = privateKeyByPub[entry.publicKeyBech32];
      if (!pk) {
        if (!/^\d{6}$/.test(pin)) throw new Error('请输入 6 位数字 PIN 以解密私钥');
        pk = await decryptPrivateKey(entry, pin);
        if (isUnlocked) setPrivateKey(entry.publicKeyBech32, pk);
      }
      setRevealedKeys((prev) => ({ ...prev, [entry.id]: toHex(pk) }));
    } catch {
      setError('口令错误或解密失败');
    }
  };

  const handleDelete = async (entryId: string) => {
    try {
      const entry = keys.find((item) => item.id === entryId);
      await deleteKey(entryId);
      setKeys(keys.filter((item) => item.id !== entryId));
      setRevealedKeys((prev) => { const next = { ...prev }; delete next[entryId]; return next; });
      if (entry) removePrivateKey(entry.publicKeyBech32);
      deps.setNotice('已删除');
    } catch {
      setError('删除失败');
    }
  };

  return { handleToggleReveal, handleDelete };
}