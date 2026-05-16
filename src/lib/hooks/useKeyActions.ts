import { useKeyVaultStore } from '../state/keyVaultStore';
import { generateX25519Keypair } from '../crypto/x25519';
import {
  decryptExportPayload,
  decryptPrivateKey,
  encryptExportPayload,
  encryptPrivateKey,
  toHex,
  EXPORT_VERSION,
} from '../crypto/keyVault';
import { addKey, deleteKey, putKeys } from '../storage/keyStore';
import type { StoredKey } from '../storage/types';

interface KeyActionDeps {
  pin: string;
  newPin: string;
  confirmPin: string;
  keys: StoredKey[];
  isUnlocked: boolean;
  revealedKeys: Record<string, string>;
  setError: (v: string | null) => void;
  setNotice: (v: string | null) => void;
  setCopiedField: (v: string | null) => void;
  setIsGenerating: (v: boolean) => void;
  setKeys: (keys: StoredKey[]) => void;
  setRevealedKeys: (v: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  setNewPin: (v: string) => void;
  setConfirmPin: (v: string) => void;
  unlockVault: (pin: string) => Promise<void>;
}

export function useKeyActions(deps: KeyActionDeps) {
  const { privateKeyByPub, setPrivateKey, removePrivateKey } = useKeyVaultStore();
  const {
    pin, newPin, confirmPin, keys, isUnlocked, revealedKeys,
    setError, setNotice, setCopiedField, setIsGenerating,
    setKeys, setRevealedKeys, setNewPin, setConfirmPin, unlockVault,
  } = deps;

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
      if (isUnlocked) {
        setPrivateKey(entry.publicKeyBech32, result.privateKeyBytes);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '生成失败');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async (label: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(label);
      setTimeout(() => setCopiedField(null), 1200);
    } catch {
      setCopiedField(null);
    }
  };

  const handleToggleReveal = async (entry: StoredKey) => {
    if (revealedKeys[entry.id]) {
      setRevealedKeys((prev) => {
        const next = { ...prev };
        delete next[entry.id];
        return next;
      });
      return;
    }
    setError(null);
    setNotice(null);
    try {
      let pk = privateKeyByPub[entry.publicKeyBech32];
      if (!pk) {
        if (!/^\d{6}$/.test(pin)) {
          throw new Error('请输入 6 位数字 PIN 以解密私钥');
        }
        pk = await decryptPrivateKey(entry, pin);
        if (isUnlocked) {
          setPrivateKey(entry.publicKeyBech32, pk);
        }
      }
      setRevealedKeys((prev) => ({
        ...prev,
        [entry.id]: toHex(pk),
      }));
    } catch {
      setError('口令错误或解密失败');
    }
  };

  const handleDelete = async (entryId: string) => {
    try {
      const entry = keys.find((item) => item.id === entryId);
      await deleteKey(entryId);
      const next = keys.filter((item) => item.id !== entryId);
      setKeys(next);
      setRevealedKeys((prev) => {
        const next = { ...prev };
        delete next[entryId];
        return next;
      });
      if (entry) removePrivateKey(entry.publicKeyBech32);
      setNotice('已删除');
    } catch {
      setError('删除失败');
    }
  };

  const handleExport = async () => {
    if (!/^\d{6}$/.test(pin)) {
      setError('请输入 6 位数字 PIN 以导出');
      return;
    }
    if (keys.length === 0) {
      setError('没有可导出的密钥');
      return;
    }
    setError(null);
    setNotice(null);
    try {
      const payload = {
        version: EXPORT_VERSION,
        exportedAt: new Date().toISOString(),
        keys,
      };
      const encryptedPackage = await encryptExportPayload(payload, pin);
      const filename = `hajimi-keystore-${new Date().toISOString().replace(/[:.]/g, '')}.json`;
      const blob = new Blob([JSON.stringify(encryptedPackage, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();
      URL.revokeObjectURL(url);
      setNotice('导出完成');
    } catch {
      setError('导出失败');
    }
  };

  const handleImport = async (file: File, onSuccess?: () => void) => {
    if (!/^\d{6}$/.test(pin)) {
      setError('请输入 6 位数字 PIN 以导入');
      return;
    }
    setError(null);
    setNotice(null);
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as {
        version: number;
        kdfIterations: number;
        salt: string;
        iv: string;
        data: string;
      };
      if (parsed.version !== EXPORT_VERSION) {
        throw new Error(`不支持的密钥包版本：${parsed.version}，当前支持版本 ${EXPORT_VERSION}`);
      }
      const decrypted = await decryptExportPayload(parsed, pin);
      if (!Array.isArray(decrypted.keys)) {
        throw new Error('无效的密钥包');
      }
      const existing = new Map(keys.map((e) => [e.publicKeyBech32, e]));
      const incoming: StoredKey[] = decrypted.keys
        .filter((e) => e?.publicKeyBech32 && e?.encryptedPrivateKey)
        .filter((e) => !existing.has(e.publicKeyBech32))
        .map((e) => ({ ...e, id: crypto.randomUUID() }));
      if (incoming.length === 0) {
        setNotice('没有可导入的新密钥');
        if (keys.length === 0 && onSuccess) onSuccess();
        return;
      }
      await putKeys(incoming);
      const merged = [...incoming, ...keys].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      setKeys(merged);
      if (isUnlocked) await unlockVault(pin);
      setNotice(`已导入 ${incoming.length} 把密钥`);
      onSuccess?.();
    } catch {
      setError('导入失败或 PIN 错误');
    }
  };

  const handlePinChange = async () => {
    if (!/^\d{6}$/.test(pin)) {
      setError('请输入旧的 6 位 PIN');
      return;
    }
    if (!/^\d{6}$/.test(newPin)) {
      setError('请输入新的 6 位 PIN');
      return;
    }
    if (newPin !== confirmPin) {
      setError('两次输入的新 PIN 不一致');
      return;
    }
    setError(null);
    setNotice(null);
    try {
      const updated: StoredKey[] = [];
      for (const entry of keys) {
        const pk = await decryptPrivateKey(entry, pin);
        const enc = await encryptPrivateKey(pk, newPin);
        updated.push({
          ...entry,
          encryptedPrivateKey: enc.encryptedPrivateKey,
          iv: enc.iv,
          salt: enc.salt,
          kdfIterations: enc.kdfIterations,
        });
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

  return {
    handleGenerate,
    handleCopy,
    handleToggleReveal,
    handleDelete,
    handleExport,
    handleImport,
    handlePinChange,
  };
}