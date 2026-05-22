import { decryptPrivateKey, encryptPrivateKey, isValidPin } from '../crypto/keyVault';
import { putKeys } from '../storage/keyStore';
import type { StoredKey } from '../storage/types';
import type { KeyActionDeps } from './types';

export function useKeyPinChange(deps: KeyActionDeps) {
  const { pin, newPin, confirmPin, keys, setError, setNotice, setKeys, setRevealedKeys, setNewPin, setConfirmPin } = deps;

  const handlePinChange = async () => {
    if (!isValidPin(pin)) { setError('请输入旧的 6 位 PIN'); return; }
    if (!isValidPin(newPin)) { setError('请输入新的 6 位 PIN'); return; }
    if (newPin !== confirmPin) { setError('两次输入的新 PIN 不一致'); return; }
    setError(null);
    setNotice(null);
    try {
      const updated: StoredKey[] = [];
      for (const entry of keys) {
        const pk = await decryptPrivateKey(entry, pin);
        const enc = await encryptPrivateKey(pk, newPin);
        updated.push({ ...entry, encryptedPrivateKey: enc.encryptedPrivateKey, iv: enc.iv, salt: enc.salt, kdfIterations: enc.kdfIterations });
      }
      await putKeys(updated);
      setKeys(updated.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      setRevealedKeys({});
      setNewPin('');
      setConfirmPin('');
      setNotice('PIN 已更新');
    } catch {
      setError('PIN 更新失败（旧 PIN 可能不正确）');
    }
  };

  return { handlePinChange };
}