import { useState, useCallback, useRef } from 'react';
import { api } from '../../../convex/_generated/api';
import type { TurnstileInstance } from '@marsidev/react-turnstile';
import { generateMnemonicWords, mnemonicToKeyPair } from '../../lib/crypto/mnemonic';
import { encryptPrivateKey, isValidPin, toHex } from '../../lib/crypto/keyVault';
import { buildRegistrationPayload, signText } from '../../lib/crypto/signing';
import { requireBackend } from '../../lib/backend/convexClient';
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

  const turnstileRef = useRef<TurnstileInstance | null>(null);
  const { setKeys, setPrivateKey, setSigningPrivateKey } = useKeyVaultStore();

  const handleRegister = useCallback(async () => {
    setError(null);
    setNotice(null);
    if (!/^[a-zA-Z0-9_-]{3,20}$/.test(handle)) {
      setError('Handle 格式不正确：仅允许字母、数字、下划线和连字符，长度 3-20');
      return;
    }
    if (!isValidPin(pin)) {
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
      const signingEncryption = await encryptPrivateKey(keyPair.privateSigningKeyBytes, pin);
      const entry: StoredKey = {
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        publicKeyBech32: keyPair.publicKeyBech32,
        publicKeyHex: toHex(keyPair.publicKeyBytes),
        publicSigningKeyBech32: keyPair.publicSigningKeyBech32,
        publicSigningKeyHex: toHex(keyPair.publicSigningKeyBytes),
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
      const token = turnstileRef.current?.getResponse();
      if (!token) throw new Error('请完成人机验证');
      const registrationPayload = buildRegistrationPayload(
        handle,
        keyPair.publicKeyBech32,
        keyPair.publicSigningKeyBech32,
      );
      await requireBackend().action(api.users.registerUser, {
        handle,
        publicKeyBech32: keyPair.publicKeyBech32,
        publicSigningKeyBech32: keyPair.publicSigningKeyBech32,
        registrationSignature: signText(registrationPayload, keyPair.privateSigningKeyBytes),
        token,
      });
      await addKey(entry);
      setKeys(prev => [entry, ...prev]);
      setPrivateKey(entry.publicKeyBech32, keyPair.privateKeyBytes);
      setSigningPrivateKey(entry.publicKeyBech32, keyPair.privateSigningKeyBytes);
      setMnemonic(mnemonicWords);
      setNotice('注册成功！请妥善保存助记词');
    } catch (err) {
      setError(err instanceof Error ? err.message : '注册失败');
    } finally {
      setIsBusy(false);
    }
  }, [handle, pin, confirmPin, setKeys, setPrivateKey, setSigningPrivateKey]);

  return {
    handle, setHandle, pin, setPin, confirmPin, setConfirmPin,
    mnemonic, error, notice, isBusy, handleRegister, turnstileRef,
  };
}
