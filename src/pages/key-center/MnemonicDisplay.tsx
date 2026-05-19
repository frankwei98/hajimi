import { Check, Copy } from 'lucide-react';

interface MnemonicDisplayProps {
  mnemonic: string | null;
  onCopy: (label: string, value: string) => void;
  copiedField: string | null;
}

export function MnemonicDisplay({ mnemonic, onCopy, copiedField }: MnemonicDisplayProps) {
  if (!mnemonic) return null;

  const isCopied = copiedField === 'mnemonic';

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="text-sm font-medium text-amber-800">⚠️ 新生成的助记词（请妥善保存）</div>
        <button
          type="button"
          onClick={() => onCopy('mnemonic', mnemonic)}
          className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 hover:text-amber-900 transition-colors"
        >
          {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
          {isCopied ? '已复制' : '复制'}
        </button>
      </div>
      <div className="font-mono text-sm text-amber-900 bg-amber-100/50 p-3 rounded leading-relaxed break-words">
        {mnemonic}
      </div>
      <div className="text-xs text-amber-600">
        助记词是恢复密钥的唯一方式，请勿截图或存储在联网设备中。
      </div>
    </div>
  );
}
