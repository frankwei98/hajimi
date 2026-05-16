import { generateX25519Keypair } from '../crypto/x25519';
import { encryptPrivateKey, toHex } from '../crypto/keyVault';
import { addKey } from '../storage/keyStore';
import type { StoredKey } from '../storage/types';
import { useKeyVaultStore } from '../state/keyVaultStore';
import type { KeyActionDeps } from './types';

export function useKeyGenerate(deps: KeyActionDeps) {
  const { setPrivateKey } = useKeyVaultStore();
  const { pin, keys, isUnlocked, setError, setNotice, setIsGenerating, setKeys } = deps;

  const handleGenerate = async () => {
    if (!/^\d{6}$/.test(pin)) {
      setError('请设置 6 位数字 PIN 用于加密私钥');
      return;
    }
    setNotice(null);
    setIsGenerating(true);
    setError(null);
    try {
      const result = await generateX25519Keypair();
      const encryption = await encryptPrivateKey(result.privateKeyBytes, pin);
      const entry: StoredKey = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        publicKeyBech32: result.publicKeyBech32,
        publicKeyHex: toHex(result.publicKeyBytes),
        encryptedPrivateKey: encryption.encryptedPrivateKey,
        iv: encryption.iv,
        salt: encryption.salt,
        kdfIterations: encryption.kdfIterations,
        source: result.source,
      };
      await addKey(entry);
      const next = [entry, ...keys];
      setKeys(next);
      if (isUnlocked) setPrivateKey(entry.publicKeyBech32, result.privateKeyBytes);
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      deps.setCopiedField(label);
      setTimeout(() => deps.setCopiedField(null), 1200);
    } catch {
      deps.setCopiedField(null);
    }
  };

  return { handleGenerate, handleCopy };
}