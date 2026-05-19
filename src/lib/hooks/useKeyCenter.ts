import { useEffect, useMemo, useState } from 'react';
import { useKeyVaultStore } from '../state/keyVaultStore';
import { useKeyGenerate, useKeyReveal, useKeyVaultActions, useKeyPinChange, useKeyMnemonic, useKeyIdentity } from '../keyActions';

export function useKeyCenter() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [revealedKeys, setRevealedKeys] = useState<Record<string, string>>({});
  const [initMode, setInitMode] = useState<'create' | 'import'>('create');

  const {
    keys,
    isLoaded,
    isUnlocked,
    loadKeys,
    setKeys,
    setUnlocked,
    unlockVault,
  } = useKeyVaultStore();

  const deps = useMemo(() => ({
    pin, newPin, confirmPin, keys, isUnlocked, revealedKeys,
    setError, setNotice, setCopiedField, setIsGenerating,
    setKeys, setRevealedKeys, setNewPin, setConfirmPin, unlockVault,
  }), [pin, newPin, confirmPin, keys, isUnlocked, revealedKeys, unlockVault]);
  const gen = useKeyGenerate(deps);
  const rev = useKeyReveal(deps);
  const vlt = useKeyVaultActions(deps);
  const pinA = useKeyPinChange(deps);
  const mnem = useKeyMnemonic(deps);
  const identity = useKeyIdentity({ keys, setKeys, setError, setNotice });

  useEffect(() => {
    loadKeys().catch(() => setError('读取本地密钥失败'));
  }, [loadKeys]);

  const keysCountLabel = useMemo(() => {
    if (keys.length === 0) return '暂无密钥';
    return `已保存 ${keys.length} 把密钥`;
  }, [keys.length]);

  const handleUnlock = async () => {
    if (!/^\d{6}$/.test(pin)) {
      setError('请输入 6 位 PIN 以解锁');
      return;
    }
    setError(null);
    setNotice(null);
    try {
      await unlockVault(pin);
    } catch {
      setError('PIN 错误，解锁失败');
    }
  };

  const handleInitCreate = () => {
    if (!/^\d{6}$/.test(pin)) {
      setError('请设置 6 位数字 PIN');
      return;
    }
    if (pin !== confirmPin) {
      setError('两次输入的 PIN 不一致');
      return;
    }
    setError(null);
    setNotice(null);
    setUnlocked(true);
  };

  return {
    isGenerating,
    error,
    notice,
    copiedField,
    pin,
    newPin,
    confirmPin,
    revealedKeys,
    initMode,
    keys,
    isLoaded,
    isUnlocked,
    keysCountLabel,
    setPin,
    setNewPin,
    setConfirmPin,
    setInitMode,
    handleUnlock,
    handleInitCreate,
    ...gen,
    ...rev,
    ...vlt,
    ...pinA,
    ...mnem,
    ...identity,
    setRevealedKeys,
    setError,
    setNotice,
  };
}