import { useRef } from 'react';
import { PinInput } from '../../components/PinInput';
import type { StoredKey } from '../../lib/storage/types';
import { KeysTable } from './KeysTable';
import { RevealPanel } from './RevealPanel';
import { PinChangePanel } from './PinChangePanel';

type KeyCenterDashboardProps = {
  pin: string;
  keysCountLabel: string;
  isGenerating: boolean;
  notice: string | null;
  error: string | null;
  keys: StoredKey[];
  copiedField: string | null;
  revealedKeys: Record<string, string>;
  newPin: string;
  confirmPin: string;
  onPinChange: (value: string) => void;
  onGenerate: () => void;
  onExport: () => void;
  onImport: (file: File) => Promise<void> | void;
  onCopy: (label: string, value: string) => void;
  onToggleReveal: (entry: StoredKey) => void;
  onDelete: (entryId: string) => void;
  onHideRevealed: () => void;
  onNewPinChange: (value: string) => void;
  onConfirmPinChange: (value: string) => void;
  onPinUpdate: () => void;
};

export function KeyCenterDashboard({
  pin,
  keysCountLabel,
  isGenerating,
  notice,
  error,
  keys,
  copiedField,
  revealedKeys,
  newPin,
  confirmPin,
  onPinChange,
  onGenerate,
  onExport,
  onImport,
  onCopy,
  onToggleReveal,
  onDelete,
  onHideRevealed,
  onNewPinChange,
  onConfirmPinChange,
  onPinUpdate,
}: KeyCenterDashboardProps) {
  const importInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="bg-white shadow sm:rounded-lg p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">⚙️ 密钥中心</h2>
        <p className="text-gray-500">管理本地密钥对与加解密设置。</p>
      </div>

      <div className="border-t border-gray-200 pt-6 space-y-4">
        <div className="flex flex-wrap items-center gap-3">
          <PinInput value={pin} onChange={onPinChange} />
          <button
            type="button"
            onClick={onGenerate}
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
          <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-700">
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
            onClick={onExport}
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
                Promise.resolve(onImport(file)).finally(() => {
                  if (importInputRef.current) {
                    importInputRef.current.value = '';
                  }
                });
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

        <KeysTable
          keys={keys}
          copiedField={copiedField}
          onCopy={onCopy}
          onToggleReveal={onToggleReveal}
          onDelete={onDelete}
          revealedKeys={revealedKeys}
        />

        <RevealPanel revealedKeys={revealedKeys} onHideAll={onHideRevealed} />

        <PinChangePanel
          newPin={newPin}
          confirmPin={confirmPin}
          onNewPinChange={onNewPinChange}
          onConfirmPinChange={onConfirmPinChange}
          onSubmit={onPinUpdate}
        />
      </div>
    </div>
  );
}
