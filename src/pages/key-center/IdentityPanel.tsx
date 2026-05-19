import { useState } from 'react';
import type { StoredKey } from '../../lib/storage/types';

interface IdentityPanelProps {
  entry: StoredKey;
  onUpdate: (entryId: string, updates: { label?: string; avatarUrl?: string }) => void;
}

export function IdentityPanel({ entry, onUpdate }: IdentityPanelProps) {
  const [label, setLabel] = useState(entry.label ?? '');
  const [avatarUrl, setAvatarUrl] = useState(entry.avatarUrl ?? '');
  const [isEditing, setIsEditing] = useState(false);

  if (!isEditing) {
    return (
      <div className="flex items-center gap-3">
        {entry.avatarUrl && /^https?:\/\//.test(entry.avatarUrl) && <img src={entry.avatarUrl} alt="" className="w-8 h-8 rounded-full object-cover" />}
        <span className="text-sm font-medium text-gray-900">{entry.label || entry.publicKeyBech32.slice(0, 12) + '...'}</span>
        <button type="button" onClick={() => setIsEditing(true)} className="text-xs text-gray-500 hover:text-gray-700">编辑</button>
      </div>
    );
  }

  return (
    <div className="space-y-3 p-3 bg-gray-50 rounded border border-gray-200">
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">昵称</label>
        <input type="text" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="可选，仅本地展示" className="shadow-sm focus:ring-black focus:border-black block w-full sm:text-sm border-gray-300 rounded-md p-2 border" />
      </div>
      <div>
        <label className="block text-xs font-medium text-gray-500 mb-1">头像 URL</label>
        <input type="text" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)} placeholder="https://..." className="shadow-sm focus:ring-black focus:border-black block w-full sm:text-sm border-gray-300 rounded-md p-2 border" />
      </div>
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => { onUpdate(entry.id, { label, avatarUrl }); setIsEditing(false); }} className="inline-flex items-center rounded-md bg-gray-900 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-gray-800">保存</button>
        <button type="button" onClick={() => { setIsEditing(false); setLabel(entry.label ?? ''); setAvatarUrl(entry.avatarUrl ?? ''); }} className="text-xs text-gray-500 hover:text-gray-700">取消</button>
      </div>
    </div>
  );
}
