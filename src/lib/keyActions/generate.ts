import { useState, useCallback } from 'react';
import { generateMnemonicWords, mnemonicToKeyPair } from '../crypto/mnemonic';
import { encryptPrivateKey, toHex } from '../crypto/keyVault';
import { addKey } from '../storage/keyStore';
import type { StoredKey } from '../storage/types';
import { useKeyVaultStore } from '../state/keyVaultStore';
import type { KeyActionDeps, KeyGenerateResult } from './types';

export function useKeyGenerate(deps: KeyActionDeps): KeyGenerateResult {
  const { setPrivateKey } = useKeyVaultStore();
  const { pin, keys, isUnlocked, setError, setNotice, setIsGenerating, setKeys } = deps;
  const [generatedMnemonic, setGeneratedMnemonic] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (!/^\d{6}$/.test(pin)) {
      setError('请设置 6 位数字 PIN 用于加密私钥');
      return;
    }
    setNotice(null);
    setIsGenerating(true);
    setError(null);
    setGeneratedMnemonic(null);
    try {
      const mnemonic = await generateMnemonicWords();
      const result = await mnemonicToKeyPair(mnemonic);
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
        source: 'mnemonic',
      };
      await addKey(entry);
      const next = [entry, ...keys];
      setKeys(next);
      if (isUnlocked) setPrivateKey(entry.publicKeyBech32, result.privateKeyBytes);
      setGeneratedMnemonic(mnemonic);
      setNotice('密钥已生成，请妥善保存助记词');
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败');
    } finally {
      setIsGenerating(false);
    }
  }, [pin, keys, isUnlocked, setError, setNotice, setIsGenerating, setKeys, setPrivateKey]);

  const handleCopy = useCallback(async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      deps.setCopiedField(label);
      setTimeout(() => deps.setCopiedField(null), 1200);
    } catch {
      deps.setCopiedField(null);
    }
  }, [deps.setCopiedField]);

  return { handleGenerate, handleCopy, generatedMnemonic };
}
