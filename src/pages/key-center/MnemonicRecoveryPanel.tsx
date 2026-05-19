import { useState } from 'react';

interface MnemonicRecoveryPanelProps {
  pin: string;
  error: string | null;
  onRecover: (mnemonic: string) => void;
}

export function MnemonicRecoveryPanel({ pin, error, onRecover }: MnemonicRecoveryPanelProps) {
  const [mnemonic, setMnemonic] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  if (!isOpen) {
    return (
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
      >
        从助记词恢复密钥 →
      </button>
    );
  }

  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-4 space-y-3">
      <div className="text-sm font-medium text-gray-700">从助记词恢复</div>
      <textarea
        rows={2}
        className="shadow-sm focus:ring-black focus:border-black block w-full sm:text-sm border-gray-300 rounded-md p-3 border resize-none font-mono text-xs"
        placeholder="输入 12 个助记词，用空格分隔"
        value={mnemonic}
        onChange={(e) => setMnemonic(e.target.value)}
      />
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onRecover(mnemonic)}
          disabled={!/^\d{6}$/.test(pin) || !mnemonic.trim()}
          className="inline-flex items-center rounded-md bg-gray-900 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-gray-800 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          恢复密钥
        </button>
        <button
          type="button"
          onClick={() => { setIsOpen(false); setMnemonic(''); }}
          className="text-sm text-gray-500 hover:text-gray-700"
        >
          取消
        </button>
      </div>
      {error && <div className="text-sm text-red-600 font-medium">{error}</div>}
    </div>
  );
}
