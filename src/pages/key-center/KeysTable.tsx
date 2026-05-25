import { Check, Copy, AlertTriangle } from 'lucide-react';
import type { StoredKey } from '../../lib/storage/types';
import { IdentityPanel } from './IdentityPanel';
import { useRevocationSet } from './useRevocationSet';
import { api } from '../../../convex/_generated/api';
import { useCallback, useState } from 'react';
import { buildRevocationPayload, signText } from '../../lib/crypto/signing';
import { useKeyVaultStore } from '../../lib/state/keyVaultStore';
import { requireBackend } from '../../lib/backend/convexClient';

type KeysTableProps = {
  keys: StoredKey[];
  copiedField: string | null;
  onCopy: (label: string, value: string) => void;
  onToggleReveal: (entry: StoredKey) => void;
  onDelete: (entryId: string) => void;
  revealedKeys: Record<string, string>;
  onUpdateIdentity: (entryId: string, updates: { label?: string; avatarUrl?: string }) => void;
};

export function KeysTable({ keys, copiedField, onCopy, onToggleReveal, onDelete, revealedKeys, onUpdateIdentity }: KeysTableProps) {
  const revokedKids = useRevocationSet();
  const { signingPrivateKeyByPub, isUnlocked } = useKeyVaultStore();
  const [revokingKid, setRevokingKid] = useState<string | null>(null);
  const [revokeError, setRevokeError] = useState<string | null>(null);

  const handleRevoke = useCallback(async (entry: StoredKey) => {
    setRevokeError(null);
    if (!isUnlocked) {
      setRevokeError('请先解锁密钥库再吊销密钥');
      return;
    }
    if (!entry.publicSigningKeyBech32) {
      setRevokeError('该密钥缺少签名身份，无法安全吊销');
      return;
    }
    const privateSigningKey = signingPrivateKeyByPub[entry.publicKeyBech32];
    if (!privateSigningKey) {
      setRevokeError('找不到该密钥的签名私钥');
      return;
    }
    const revokedAt = Date.now();
    const reason = '用户主动吊销';
    const payload = buildRevocationPayload(entry.publicKeyBech32, revokedAt, reason);
    setRevokingKid(entry.publicKeyBech32);
    try {
      await requireBackend().mutation(api.revocations.publishRevocation, {
        kid: entry.publicKeyBech32,
        publicSigningKeyBech32: entry.publicSigningKeyBech32,
        revokedAt,
        reason,
        signature: signText(payload, privateSigningKey),
      });
    } catch (err) {
      setRevokeError(err instanceof Error ? err.message : '吊销失败');
    } finally {
      setRevokingKid(null);
    }
  }, [isUnlocked, signingPrivateKeyByPub]);

  if (keys.length === 0) {
    return (
      <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
        生成后会保存到 IndexedDB，并在下方表格中展示公钥信息。
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="overflow-x-auto rounded-md border border-gray-200">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50 text-xs font-semibold uppercase text-gray-500">
            <tr>
              <th className="px-4 py-3 text-left">身份</th>
              <th className="px-4 py-3 text-left">创建时间</th>
              <th className="px-4 py-3 text-left">公钥（bech32）</th>
              <th className="px-4 py-3 text-left">来源</th>
              <th className="px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {keys.map((entry) => (
              <KeyRow key={entry.id} entry={entry} copiedField={copiedField} onCopy={onCopy} onToggleReveal={onToggleReveal} onDelete={onDelete} revealedKeys={revealedKeys} onUpdateIdentity={onUpdateIdentity} isRevoked={revokedKids.has(entry.publicKeyBech32)} onRevoke={handleRevoke} isRevoking={revokingKid === entry.publicKeyBech32} />
            ))}
          </tbody>
        </table>
      </div>
      {revokeError && <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{revokeError}</div>}
    </div>
  );
}

function KeyRow({ entry, copiedField, onCopy, onToggleReveal, onDelete, revealedKeys, onUpdateIdentity, isRevoked, onRevoke, isRevoking }: Omit<KeysTableProps, 'keys'> & { entry: StoredKey; isRevoked: boolean; onRevoke: (entry: StoredKey) => void; isRevoking: boolean }) {
  return (
    <tr className={isRevoked ? 'bg-red-50' : undefined}>
      <td className="px-4 py-3">
        <IdentityPanel entry={entry} onUpdate={onUpdateIdentity} />
      </td>
      <td className="px-4 py-3 text-gray-700">{new Date(entry.createdAt).toLocaleString()}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {isRevoked && <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />}
          <button type="button" onClick={() => onCopy(`pub-${entry.id}`, entry.publicKeyBech32)} className="break-all font-mono text-gray-900 cursor-pointer hover:text-black transition-colors text-left" title="点击复制">
            {entry.publicKeyBech32}
          </button>
          <button type="button" onClick={() => onCopy(`pub-${entry.id}`, entry.publicKeyBech32)} className="flex-shrink-0 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors" title="复制公钥">
            {copiedField === `pub-${entry.id}` ? <Check className="h-3.5 w-3.5 text-black" /> : <Copy className="h-3.5 w-3.5" />}
          </button>
        </div>
      </td>
      <td className="px-4 py-3 text-gray-600">{entry.source === 'webcrypto' ? 'WebCrypto' : entry.source === 'mnemonic' ? '助记词' : 'noble'}</td>
      <td className="px-4 py-3 text-right space-x-3">
        <button type="button" onClick={() => onToggleReveal(entry)} className="text-xs font-medium text-gray-600 hover:text-black transition-colors">
          {revealedKeys[entry.id] ? '隐藏私钥' : '显示私钥'}
        </button>
        {!isRevoked && entry.publicSigningKeyBech32 && (
          <button type="button" onClick={() => onRevoke(entry)} disabled={isRevoking} className="text-xs font-medium text-orange-600 hover:text-orange-700 disabled:opacity-60">
            {isRevoking ? '吊销中...' : '吊销'}
          </button>
        )}
        <button type="button" onClick={() => onDelete(entry.id)} className="text-xs font-medium text-red-600 hover:text-red-700">删除</button>
      </td>
    </tr>
  );
}
