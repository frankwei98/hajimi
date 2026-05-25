import { Copy } from 'lucide-react';
import { useState, useCallback } from 'react';

type Props = {
  title?: string;
  content?: string;
  raw: string;
  matchedKid: string;
};

export function InstantResult({ title, content, raw, matchedKid }: Props) {
  const [copied, setCopied] = useState(false);
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(content ?? raw);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch { /* 剪贴板权限被拒绝 */ }
  }, [content, raw]);

  return (
    <div className="bg-white shadow rounded-lg p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700">解密结果</h3>
        <button onClick={handleCopy} className="text-xs text-gray-500 hover:text-gray-800">
          <Copy className="w-3.5 h-3.5 inline mr-1" />
          {copied ? '已复制' : '复制'}
        </button>
      </div>
      {title && <p className="text-base font-semibold text-gray-900">{title}</p>}
      {content && <p className="text-sm text-gray-800 whitespace-pre-wrap">{content}</p>}
      {!content && <p className="text-sm text-gray-800 whitespace-pre-wrap font-mono">{raw}</p>}
      <p className="text-xs text-gray-400 break-all">匹配公钥: {matchedKid}</p>
    </div>
  );
}
