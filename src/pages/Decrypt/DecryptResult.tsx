import { Copy } from 'lucide-react';

interface DecryptResultProps {
  resultText: string;
  resultTitle: string;
  resultContent: string;
  onCopy: () => void;
}

export function DecryptResult({ resultText, resultTitle, resultContent, onCopy }: DecryptResultProps) {
  if (!resultText) return null;

  return (
    <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-gray-700">解密结果</span>
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex items-center gap-1 text-sm text-gray-900 hover:text-black transition-colors"
        >
          <Copy className="w-4 h-4" />复制
        </button>
      </div>
      {(resultTitle || resultContent) && (
        <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
          {resultTitle ? <div className="font-semibold mb-2">{resultTitle}</div> : null}
          {resultContent ? <div className="whitespace-pre-wrap">{resultContent}</div> : null}
        </div>
      )}
      <textarea
        readOnly
        rows={6}
        className="w-full rounded-md border border-gray-200 bg-gray-50 p-3 font-mono text-xs focus:ring-black focus:border-black"
        value={resultText}
      />
    </div>
  );
}