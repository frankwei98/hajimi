import { useState, useCallback } from 'react';
import { mnemonicToKeyPair, validateMnemonicWords } from '../crypto/mnemonic';
import { encryptPrivateKey, isValidPin, toHex } from '../crypto/keyVault';
import { addKey, getKeyByPublicKey } from '../storage/keyStore';
import type { StoredKey } from '../storage/types';
import { useKeyVaultStore } from '../state/keyVaultStore';
import type { KeyActionDeps, KeyMnemonicResult } from './types';

export function useKeyMnemonic(deps: KeyActionDeps): KeyMnemonicResult {
  const { setPrivateKey, setSigningPrivateKey } = useKeyVaultStore();
  const { pin, isUnlocked, setError, setNotice, setKeys } = deps;
  const [mnemonicError, setMnemonicError] = useState<string | null>(null);

  const handleRecoverFromMnemonic = useCallback(async (mnemonic: string) => {
    if (!isValidPin(pin)) {
      setMnemonicError('请设置 6 位数字 PIN 用于加密私钥');
      return;
    }
    setError(null);
    setNotice(null);
    setMnemonicError(null);
    try {
      const isValid = await validateMnemonicWords(mnemonic);
      if (!isValid) {
        setMnemonicError('助记词无效，请检查后重试');
        return;
      }
      const result = await mnemonicToKeyPair(mnemonic);
      const existing = await getKeyByPublicKey(result.publicKeyBech32);
      if (existing) {
        setMnemonicError('该助记词对应的密钥已存在于本地');
        return;
      }
      const encryption = await encryptPrivateKey(result.privateKeyBytes, pin);
      const signingEncryption = await encryptPrivateKey(result.privateSigningKeyBytes, pin);
      const entry: StoredKey = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        publicKeyBech32: result.publicKeyBech32,
        publicKeyHex: toHex(result.publicKeyBytes),
        publicSigningKeyBech32: result.publicSigningKeyBech32,
        publicSigningKeyHex: toHex(result.publicSigningKeyBytes),
        encryptedPrivateKey: encryption.encryptedPrivateKey,
        encryptedSigningPrivateKey: signingEncryption.encryptedPrivateKey,
        iv: encryption.iv,
        salt: encryption.salt,
        signingIv: signingEncryption.iv,
        signingSalt: signingEncryption.salt,
        signingKdfIterations: signingEncryption.kdfIterations,
        kdfIterations: encryption.kdfIterations,
        source: 'mnemonic',
      };
      await addKey(entry);
      setKeys(prev => [entry, ...prev]);
      if (isUnlocked) {
        setPrivateKey(entry.publicKeyBech32, result.privateKeyBytes);
        setSigningPrivateKey(entry.publicKeyBech32, result.privateSigningKeyBytes);
      }
      setNotice('助记词恢复成功');
    } catch (err) {
      setMnemonicError(err instanceof Error ? err.message : '恢复失败');
    }
  }, [pin, isUnlocked, setError, setNotice, setKeys, setPrivateKey, setSigningPrivateKey]);

  return { handleRecoverFromMnemonic, mnemonicError };
}
