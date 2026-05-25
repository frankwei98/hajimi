import { Copy, RefreshCw } from 'lucide-react';
import { useState, useCallback } from 'react';

type Props = {
  publicKey: string;
  onRegenerate: () => void;
  isGenerating: boolean;
};

export function PublicKeyCard({ publicKey, onRegenerate, isGenerating }: Props) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(publicKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* 剪贴板权限被拒绝 */ }
  }, [publicKey]);

  return (
    <div className="bg-white shadow rounded-lg p-4">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium text-gray-700">临时公钥</h3>
        <button
          onClick={onRegenerate}
          disabled={isGenerating}
          className="text-xs text-gray-500 hover:text-gray-800 disabled:opacity-40 flex items-center gap-1"
        >
          <RefreshCw className="w-3 h-3" /> 重新生成
        </button>
      </div>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs bg-gray-50 rounded px-3 py-2 break-all text-gray-800 font-mono">
          {publicKey}
        </code>
        <button
          onClick={handleCopy}
          className="shrink-0 px-3 py-2 bg-gray-900 text-white text-xs rounded hover:bg-gray-700 flex items-center gap-1"
        >
          <Copy className="w-3 h-3" />
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      <p className="text-xs text-gray-400 mt-2">请先把此公钥发给 sender，再粘贴密文。</p>
    </div>
  );
}
