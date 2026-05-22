import { encryptExportPayload, decryptExportPayload, EXPORT_VERSION } from '../crypto/keyVault';
import { putKeys, listKeys } from '../storage/keyStore';
import type { StoredKey } from '../storage/types';
import type { KeyActionDeps } from './types';

export function useKeyVaultActions(deps: KeyActionDeps) {
  const { pin, keys, isUnlocked, setError, setNotice, setKeys, unlockVault } = deps;

  const handleExport = async () => {
    if (!/^\d{6}$/.test(pin)) { setError('请输入 6 位数字 PIN 以导出'); return; }
    if (keys.length === 0) { setError('没有可导出的密钥'); return; }
    setError(null);
    setNotice(null);
    try {
      const payload = { version: EXPORT_VERSION, exportedAt: new Date().toISOString(), keys };
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

  const handleImport = async (file: File, onSuccess?: (usedPin: string) => void) => {
    if (!/^\d{6}$/.test(pin)) { setError('请输入 6 位数字 PIN 以导入'); return; }
    setError(null);
    setNotice(null);
    try {
      const parsed = JSON.parse(await file.text()) as { version: number; kdfIterations: number; salt: string; iv: string; data: string };
      if (parsed.version !== EXPORT_VERSION) throw new Error(`不支持的密钥包版本：${parsed.version}，当前支持的版本 ${EXPORT_VERSION}`);
      const decrypted = await decryptExportPayload(parsed, pin);
      if (!Array.isArray(decrypted.keys)) throw new Error('无效的密钥包');
      const dbEntries = await listKeys();
      const existing = new Map(dbEntries.map((e) => [e.publicKeyBech32, e]));
      const incoming: StoredKey[] = decrypted.keys
        .filter((e) => e?.publicKeyBech32 && e?.encryptedPrivateKey)
        .filter((e) => !existing.has(e.publicKeyBech32))
        .map((e) => ({ ...e, id: crypto.randomUUID() }));
      if (incoming.length === 0) {
        setNotice('没有可导入的新密钥');
        if (keys.length === 0 && onSuccess) onSuccess(pin);
        return;
      }
      await putKeys(incoming);
      setKeys(prev => [...incoming, ...prev].sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
      if (isUnlocked) await unlockVault(pin);
      setNotice(`已导入 ${incoming.length} 把密钥`);
      onSuccess?.(pin);
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败或 PIN 错误');
    }
  };

  return { handleExport, handleImport };
}
