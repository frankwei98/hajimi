import { Lock } from 'lucide-react';

type Props = {
  value: string;
  onChange: (v: string) => void;
  onDecrypt: () => void;
  isBusy: boolean;
};

export function CipherInputPanel({ value, onChange, onDecrypt, isBusy }: Props) {
  return (
    <div className="bg-white shadow rounded-lg p-4">
      <h3 className="text-sm font-medium text-gray-700 mb-2">粘贴密文或消息链接</h3>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={'粘贴密文 JSON / Base58 / Emoji\n或消息链接 /m/:messageId'}
        rows={5}
        className="w-full border rounded px-3 py-2 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-gray-900"
      />
      <button
        onClick={onDecrypt}
        disabled={isBusy || !value.trim()}
        className="mt-3 w-full py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-700 disabled:opacity-40 flex items-center justify-center gap-2"
      >
        <Lock className="w-4 h-4" />
        {isBusy ? '解密中...' : '解密'}
      </button>
    </div>
  );
}
