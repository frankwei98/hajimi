import { useEffect, useMemo, useRef, useState } from 'react';
import { generateX25519Keypair } from '../lib/crypto/x25519';
import { addKey, deleteKey, listKeys, putKeys } from '../lib/storage/keyStore';
import type { StoredKey } from '../lib/storage/types';

function toHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

const KDF_ITERATIONS = 150_000;
const EXPORT_VERSION = 1;

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function base64ToBytes(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveAesKey(passphrase: string, salt: Uint8Array, iterations: number) {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(passphrase),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations,
      hash: 'SHA-256',
    },
    baseKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function encryptPrivateKey(privateKeyBytes: Uint8Array, passphrase: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveAesKey(passphrase, salt, KDF_ITERATIONS);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    privateKeyBytes
  );
  return {
    encryptedPrivateKey: bytesToBase64(new Uint8Array(ciphertext)),
    iv: bytesToBase64(iv),
    salt: bytesToBase64(salt),
    kdfIterations: KDF_ITERATIONS,
  };
}

async function decryptPrivateKey(entry: StoredKey, passphrase: string) {
  const iv = base64ToBytes(entry.iv);
  const salt = base64ToBytes(entry.salt);
  const key = await deriveAesKey(passphrase, salt, entry.kdfIterations);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    base64ToBytes(entry.encryptedPrivateKey)
  );
  return new Uint8Array(plaintext);
}

async function encryptExportPayload(payload: object, passphrase: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveAesKey(passphrase, salt, KDF_ITERATIONS);
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, plaintext);
  return {
    version: EXPORT_VERSION,
    kdfIterations: KDF_ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    data: bytesToBase64(new Uint8Array(ciphertext)),
  };
}

async function decryptExportPayload(
  packageData: {
    version: number;
    kdfIterations: number;
    salt: string;
    iv: string;
    data: string;
  },
  passphrase: string
) {
  const iv = base64ToBytes(packageData.iv);
  const salt = base64ToBytes(packageData.salt);
  const key = await deriveAesKey(passphrase, salt, packageData.kdfIterations);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    base64ToBytes(packageData.data)
  );
  const decoded = new TextDecoder().decode(plaintext);
  return JSON.parse(decoded) as { keys: StoredKey[]; exportedAt: string; version: number };
}

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
  const pinInputRef = useRef<HTMLInputElement | null>(null);
  const importInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    listKeys()
      .then((items) => {
        const sorted = [...items].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setKeys(sorted);
      })
      .catch(() => {
        setError('读取本地密钥失败');
      });
  }, []);

  const keysCountLabel = useMemo(() => {
    if (keys.length === 0) return '暂无密钥';
    return `已保存 ${keys.length} 把密钥`;
  }, [keys.length]);

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

  const handleImport = async (file: File) => {
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
        return;
      }
      await putKeys(incoming);
      const merged = [...incoming, ...keys].sort((a, b) =>
        b.createdAt.localeCompare(a.createdAt)
      );
      setKeys(merged);
      setNotice(`已导入 ${incoming.length} 把密钥`);
    } catch {
      setError('导入失败或 PIN 错误');
    } finally {
      if (importInputRef.current) {
        importInputRef.current.value = '';
      }
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

  return (
    <div className="bg-white shadow sm:rounded-lg p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">⚙️ 密钥中心</h2>
        <p className="text-gray-500">管理本地密钥对与加解密设置。</p>
      </div>

      <div className="border-t border-gray-200 pt-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <div
            className="relative"
            onClick={() => pinInputRef.current?.focus()}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                pinInputRef.current?.focus();
              }
            }}
          >
            <input
              ref={pinInputRef}
              type="password"
              inputMode="numeric"
              autoComplete="one-time-code"
              aria-label="输入 6 位 PIN"
              value={pin}
              onChange={(event) => {
                const next = event.target.value.replace(/\D/g, '').slice(0, 6);
                setPin(next);
              }}
              className="absolute inset-0 h-full w-full opacity-0"
            />
            <div className="flex gap-2">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="flex h-10 w-10 items-center justify-center rounded-md border border-gray-300 bg-white text-base font-mono text-gray-900"
                >
                  {pin[index] ?? ''}
                </div>
              ))}
            </div>
          </div>
          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating}
            className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-gray-800 disabled:opacity-60"
          >
            {isGenerating ? '生成中...' : '生成 X25519 密钥对'}
          </button>
          <span className="text-xs text-gray-500">{keysCountLabel}</span>
        </div>
        <div className="text-xs text-gray-500">
          私钥会用 6 位 PIN 派生的 AES-GCM 加密后写入 IndexedDB（明文不会存储）。忘记 PIN 将无法解密。
        </div>

        {notice && (
          <div className="rounded-md border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {notice}
          </div>
        )}

        {error && (
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleExport}
            className="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            导出密钥包
          </button>
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                void handleImport(file);
              }
            }}
          />
          <button
            type="button"
            onClick={() => importInputRef.current?.click()}
            className="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
          >
            导入密钥包
          </button>
        </div>

        {keys.length === 0 ? (
          <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
            生成后会保存到 IndexedDB，并在下方表格中展示公钥信息。
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-gray-200">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left">创建时间</th>
                  <th className="px-4 py-3 text-left">公钥（bech32）</th>
                  <th className="px-4 py-3 text-left">来源</th>
                  <th className="px-4 py-3 text-right">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {keys.map((entry) => (
                  <tr key={entry.id}>
                    <td className="px-4 py-3 text-gray-700">
                      {new Date(entry.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <div className="break-all font-mono text-gray-900">
                        {entry.publicKeyBech32}
                      </div>
                      <div className="mt-2 text-xs text-gray-500">
                        公钥 hex: {entry.publicKeyHex}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {entry.source === 'webcrypto' ? 'WebCrypto' : 'noble'}
                    </td>
                    <td className="px-4 py-3 text-right space-x-3">
                      <button
                        type="button"
                        onClick={() => handleCopy(`pub-${entry.id}`, entry.publicKeyBech32)}
                        className="text-xs font-medium text-gray-700 hover:text-gray-900"
                      >
                        {copiedField === `pub-${entry.id}` ? '已复制' : '复制公钥'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleToggleReveal(entry)}
                        className="text-xs font-medium text-amber-700 hover:text-amber-900"
                      >
                        {revealedKeys[entry.id] ? '隐藏私钥' : '显示私钥'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(entry.id)}
                        className="text-xs font-medium text-red-600 hover:text-red-700"
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {Object.keys(revealedKeys).length > 0 && (
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 space-y-2">
            <div className="text-xs text-amber-700">已解锁私钥（hex）</div>
            {Object.entries(revealedKeys).map(([id, value]) => (
              <div key={id} className="break-all font-mono text-sm text-amber-900">
                {value}
              </div>
            ))}
            <button
              type="button"
              onClick={() => setRevealedKeys({})}
              className="text-xs font-medium text-amber-800 hover:text-amber-900"
            >
              一键隐藏
            </button>
          </div>
        )}

        <div className="rounded-md border border-gray-200 bg-gray-50 p-4 space-y-3">
          <div className="text-sm font-semibold text-gray-800">PIN 修改</div>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="password"
              inputMode="numeric"
              placeholder="新 PIN"
              value={newPin}
              onChange={(event) => {
                const next = event.target.value.replace(/\D/g, '').slice(0, 6);
                setNewPin(next);
              }}
              className="w-28 rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
            <input
              type="password"
              inputMode="numeric"
              placeholder="确认新 PIN"
              value={confirmPin}
              onChange={(event) => {
                const next = event.target.value.replace(/\D/g, '').slice(0, 6);
                setConfirmPin(next);
              }}
              className="w-28 rounded-md border border-gray-300 px-3 py-2 text-xs text-gray-900 shadow-sm focus:border-gray-500 focus:outline-none focus:ring-1 focus:ring-gray-500"
            />
            <button
              type="button"
              onClick={handlePinChange}
              className="inline-flex items-center rounded-md bg-gray-900 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-gray-800"
            >
              更新 PIN
            </button>
          </div>
          <div className="text-xs text-gray-500">
            更新 PIN 会重新加密全部私钥，过程可能需要几秒。
          </div>
        </div>
      </div>
    </div>
  );
}
