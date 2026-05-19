import { useState, useCallback } from 'react';
import { useMutation } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import { generateMnemonicWords, mnemonicToKeyPair } from '../../lib/crypto/mnemonic';
import { encryptPrivateKey, toHex } from '../../lib/crypto/keyVault';
import { addKey } from '../../lib/storage/keyStore';
import type { StoredKey } from '../../lib/storage/types';
import { useKeyVaultStore } from '../../lib/state/keyVaultStore';

export function useRegister() {
  const [handle, setHandle] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [mnemonic, setMnemonic] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const registerUser = useMutation(api.users.registerUser);
  const { keys, setKeys, setPrivateKey } = useKeyVaultStore();

  const handleRegister = useCallback(async () => {
    setError(null);
    setNotice(null);
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(handle)) {
      setError('Handle 格式不正确：仅允许字母、数字、下划线和连字符，长度 3-20');
      return;
    }
    if (!/^\d{6}$/.test(pin)) {
      setError('请设置 6 位数字 PIN');
      return;
    }
    if (pin !== confirmPin) {
      setError('两次输入的 PIN 不一致');
      return;
    }
    setIsBusy(true);
    try {
      const mnemonicWords = await generateMnemonicWords();
      const keyPair = await mnemonicToKeyPair(mnemonicWords);
      const encryption = await encryptPrivateKey(keyPair.privateKeyBytes, pin);
      const entry: StoredKey = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        publicKeyBech32: keyPair.publicKeyBech32,
        publicKeyHex: toHex(keyPair.publicKeyBytes),
        encryptedPrivateKey: encryption.encryptedPrivateKey,
        iv: encryption.iv,
        salt: encryption.salt,
        kdfIterations: encryption.kdfIterations,
        source: 'mnemonic',
      };
      await addKey(entry);
      setKeys([entry, ...keys]);
      setPrivateKey(entry.publicKeyBech32, keyPair.privateKeyBytes);
      await registerUser({ handle, publicKeyBech32: keyPair.publicKeyBech32 });
      setMnemonic(mnemonicWords);
      setNotice('注册成功！请妥善保存助记词');
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
    } finally {
      setIsBusy(false);
    }
  }, [handle, pin, confirmPin, keys, registerUser, setKeys, setPrivateKey]);

  return {
    handle, setHandle, pin, setPin, confirmPin, setConfirmPin,
    mnemonic, error, notice, isBusy, handleRegister,
  };
}
