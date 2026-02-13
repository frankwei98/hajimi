import type { StoredKey } from '../../../lib/storage/types';

interface RecipientKeyPickerProps {
  keys: Pick<StoredKey, 'id' | 'publicKeyBech32'>[];
  selectedRecipients: string[];
  onToggle: (publicKey: string) => void;
}

export function RecipientKeyPicker({ keys, selectedRecipients, onToggle }: RecipientKeyPickerProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">从密钥中心选择收件人</label>
      {keys.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500">
          暂无本地密钥，可去密钥中心创建。
        </div>
      ) : (
        <div className="space-y-2">
          {keys.map((entry) => {
            const checked = selectedRecipients.includes(entry.publicKeyBech32);
            return (
              <label key={entry.id} className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => onToggle(entry.publicKeyBech32)}
                />
                <span className="font-mono text-xs break-all">{entry.publicKeyBech32}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
