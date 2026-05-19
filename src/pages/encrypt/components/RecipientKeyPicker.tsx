import type { StoredKey } from '../../../lib/storage/types';
import type { Contact } from '../../../lib/storage/types';

interface RecipientKeyPickerProps {
  keys: Pick<StoredKey, 'id' | 'publicKeyBech32'>[];
  contacts: Contact[];
  selectedRecipients: string[];
  onToggle: (publicKey: string) => void;
}

export function RecipientKeyPicker({ keys, contacts, selectedRecipients, onToggle }: RecipientKeyPickerProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">从密钥中心选择收件人</label>
      {keys.length === 0 && contacts.length === 0 ? (
        <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500">
          暂无本地密钥或通讯录联系人，可去密钥中心创建。
        </div>
      ) : (
        <div className="space-y-3">
          {keys.length > 0 && (
            <div>
              <div className="text-xs text-gray-400 mb-1">我的密钥</div>
              {keys.map((entry) => {
                const checked = selectedRecipients.includes(entry.publicKeyBech32);
                return (
                  <label key={entry.id} className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={checked} onChange={() => onToggle(entry.publicKeyBech32)} />
                    <span className="font-mono text-xs break-all">{entry.publicKeyBech32}</span>
                  </label>
                );
              })}
            </div>
          )}
          {contacts.length > 0 && (
            <div>
              <div className="text-xs text-gray-400 mb-1">通讯录</div>
              {contacts.map((c) => {
                const checked = selectedRecipients.includes(c.publicKeyBech32);
                return (
                  <label key={c.id} className="flex items-center gap-2 text-sm text-gray-700">
                    <input type="checkbox" checked={checked} onChange={() => onToggle(c.publicKeyBech32)} />
                    <span className="font-medium text-gray-900">@{c.handle}</span>
                    <span className="font-mono text-xs break-all text-gray-500">{c.publicKeyBech32}</span>
                  </label>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
