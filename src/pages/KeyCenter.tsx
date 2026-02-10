import { useEffect, useMemo, useState } from 'react';
import { generateX25519Keypair } from '../lib/crypto/x25519';
import {
  decryptExportPayload,
  decryptPrivateKey,
  encryptExportPayload,
  encryptPrivateKey,
  toHex,
  EXPORT_VERSION,
} from '../lib/crypto/keyVault';
import { addKey, deleteKey, listKeys, putKeys } from '../lib/storage/keyStore';
import type { StoredKey } from '../lib/storage/types';
import { KeyCenterOnboarding } from './key-center/KeyCenterOnboarding';
import { KeyCenterUnlock } from './key-center/KeyCenterUnlock';
import { KeyCenterDashboard } from './key-center/KeyCenterDashboard';

export function KeyCenter() {
  const [keys, setKeys] = useState<StoredKey[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [revealedKeys, setRevealedKeys] = useState<Record<string, string>>({});
  const [isLoadingKeys, setIsLoadingKeys] = useState(true);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [initMode, setInitMode] = useState<'create' | 'import'>('create');

  useEffect(() => {
    listKeys()
      .then((items) => {
        const sorted = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setKeys(sorted);
      })
      .catch(() => {
        setError('读取本地密钥失败');
      })
      .finally(() => {
        setIsLoadingKeys(false);
      });
  }, []);

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
      if (keys.length > 0) {
        await decryptPrivateKey(keys[0], pin);
      }
      setIsUnlocked(true);
    } catch {
      setError('PIN 错误，解锁失败');
    }
  };

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
      setKeys((prev) => [entry, ...prev]);
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
    if (!/^\d{6}$/.test(pin)) {
      setError('请输入 6 位数字 PIN 以解密私钥');
      return;
    }
    setError(null);
    setNotice(null);
    try {
      const privateKeyBytes = await decryptPrivateKey(entry, pin);
      setRevealedKeys((prev) => ({
        ...prev,
        [entry.id]: toHex(privateKeyBytes),
      }));
    } catch {
      setError('口令错误或解密失败');
    }
  };

  const handleDelete = async (entryId: string) => {
    try {
      await deleteKey(entryId);
      setKeys((prev) => prev.filter((item) => item.id !== entryId));
      setRevealedKeys((prev) => {
        const next = { ...prev };
        delete next[entryId];
        return next;
      });
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
      const filename = `hajimi-keystore-${new Date()
        .toISOString()
        .replace(/[:.]/g, '')}.json`;
      const blob = new Blob([JSON.stringify(encryptedPackage, null, 2)], {
        type: 'application/json',
      });
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
      const decrypted = await decryptExportPayload(parsed, pin);
      if (!Array.isArray(decrypted.keys)) {
        throw new Error('无效的密钥包');
      }
      const existing = new Map(keys.map((entry) => [entry.publicKeyBech32, entry]));
      const incoming: StoredKey[] = decrypted.keys
        .filter((entry) => entry?.publicKeyBech32 && entry?.encryptedPrivateKey)
        .filter((entry) => !existing.has(entry.publicKeyBech32))
        .map((entry) => ({
          ...entry,
          id: crypto.randomUUID(),
        }));
      if (incoming.length === 0) {
        setNotice('没有可导入的新密钥');
        if (keys.length === 0 && onSuccess) onSuccess();
        return;
      }
      await putKeys(incoming);
      const merged = [...incoming, ...keys].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      );
      setKeys(merged);
      setNotice(`已导入 ${incoming.length} 把密钥`);
      onSuccess?.();
    } catch {
      setError('导入失败或 PIN 错误');
    } finally {
      // input reset handled by component
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
    setIsUnlocked(true);
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
        const privateKeyBytes = await decryptPrivateKey(entry, pin);
        const encryption = await encryptPrivateKey(privateKeyBytes, newPin);
        updated.push({
          ...entry,
          encryptedPrivateKey: encryption.encryptedPrivateKey,
          iv: encryption.iv,
          salt: encryption.salt,
          kdfIterations: encryption.kdfIterations,
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

  if (isLoadingKeys) {
    return (
      <div className="bg-white shadow sm:rounded-lg p-12 text-center text-gray-500">
        正在加载密钥库...
      </div>
    );
  }

  if (!isUnlocked) {
    if (keys.length === 0) {
      return (
        <KeyCenterOnboarding
          initMode={initMode}
          pin={pin}
          confirmPin={confirmPin}
          error={error}
          notice={notice}
          onModeChange={(mode) => {
            setInitMode(mode);
            setPin('');
            setConfirmPin('');
            setError(null);
            setNotice(null);
          }}
          onPinChange={setPin}
          onConfirmPinChange={setConfirmPin}
          onCreate={handleInitCreate}
          onImport={handleImport}
          onImported={() => setIsUnlocked(true)}
        />
      );
    }

    return <KeyCenterUnlock pin={pin} error={error} onPinChange={setPin} onUnlock={handleUnlock} />;
  }

  return (
    <KeyCenterDashboard
      pin={pin}
      keysCountLabel={keysCountLabel}
      isGenerating={isGenerating}
      notice={notice}
      error={error}
      keys={keys}
      copiedField={copiedField}
      revealedKeys={revealedKeys}
      newPin={newPin}
      confirmPin={confirmPin}
      onPinChange={setPin}
      onGenerate={handleGenerate}
      onExport={handleExport}
      onImport={(file) => handleImport(file)}
      onCopy={handleCopy}
      onToggleReveal={handleToggleReveal}
      onDelete={(entryId) => void handleDelete(entryId)}
      onHideRevealed={() => setRevealedKeys({})}
      onNewPinChange={setNewPin}
      onConfirmPinChange={setConfirmPin}
      onPinUpdate={handlePinChange}
    />
  );
}
