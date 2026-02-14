import { Check, Copy } from 'lucide-react';
import type { StoredKey } from '../../lib/storage/types';

type KeysTableProps = {
  keys: StoredKey[];
  copiedField: string | null;
  onCopy: (label: string, value: string) => void;
  onToggleReveal: (entry: StoredKey) => void;
  onDelete: (entryId: string) => void;
  revealedKeys: Record<string, string>;
};

export function KeysTable({
  keys,
  copiedField,
  onCopy,
  onToggleReveal,
  onDelete,
  revealedKeys,
}: KeysTableProps) {
  if (keys.length === 0) {
    return (
      <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-6 text-sm text-gray-500">
        生成后会保存到 IndexedDB，并在下方表格中展示公钥信息。
      </div>
    );
  }

  return (
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
                <div className="flex items-center gap-2 group">
                  <div
                    onClick={() => onCopy(`pub-${entry.id}`, entry.publicKeyBech32)}
                    className="break-all font-mono text-gray-900 cursor-pointer hover:text-black transition-colors"
                    title="点击复制"
                  >
                    {entry.publicKeyBech32}
                  </div>
                  <button
                    type="button"
                    onClick={() => onCopy(`pub-${entry.id}`, entry.publicKeyBech32)}
                    className="flex-shrink-0 p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                    title="复制公钥"
                  >
                    {copiedField === `pub-${entry.id}` ? (
                      <Check className="h-3.5 w-3.5 text-black" />
                    ) : (
                      <Copy className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
                {/* <div className="mt-2 text-xs text-gray-500">公钥 hex: {entry.publicKeyHex}</div> */}
              </td>
              <td className="px-4 py-3 text-gray-600">
                {entry.source === 'webcrypto' ? 'WebCrypto' : 'noble'}
              </td>
              <td className="px-4 py-3 text-right space-x-3">
                {/* <button
                  type="button"
                  onClick={() => onCopy(`pub-${entry.id}`, entry.publicKeyBech32)}
                  className="text-xs font-medium text-gray-700 hover:text-gray-900"
                >
                  {copiedField === `pub-${entry.id}` ? '已复制' : '复制公钥'}
                </button> */}
                <button
                  type="button"
                  onClick={() => onToggleReveal(entry)}
                  className="text-xs font-medium text-gray-600 hover:text-black transition-colors"
                >
                  {revealedKeys[entry.id] ? '隐藏私钥' : '显示私钥'}
                </button>
                <button
                  type="button"
                  onClick={() => onDelete(entry.id)}
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
  );
}
