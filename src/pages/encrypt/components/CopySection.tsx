import { Copy, ChevronDown } from 'lucide-react';

interface CopySectionProps {
  output: string;
  showRaw: boolean;
  setShowRaw: React.Dispatch<React.SetStateAction<boolean>>;
  onCopy: () => void;
}

export function CopySection({ output, showRaw, setShowRaw, onCopy }: CopySectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <span className="bg-gray-100 text-gray-600 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">2</span>
          手动复制密文
        </h4>
        <button
          onClick={() => setShowRaw((v) => !v)}
          className="text-xs text-gray-500 hover:text-black flex items-center gap-1 transition-colors"
        >
          {showRaw ? '收起详情' : '展开详情'}
          <ChevronDown className={`w-3 h-3 transition-transform ${showRaw ? 'rotate-180' : ''}`} />
        </button>
      </div>
      <div className="text-sm text-gray-500 mb-3">
        如果不希望通过链接分享，您可以直接复制下方的 JSON 密文发送给接收者。
      </div>
      {showRaw ? (
        <div className="relative animate-in fade-in slide-in-from-top-1">
          <textarea
            readOnly
            rows={6}
            className="w-full rounded-md border border-gray-300 bg-gray-50 p-3 font-mono text-xs text-gray-600 focus:ring-black focus:border-black block"
            value={output}
          />
          <button
            onClick={onCopy}
            className="absolute top-2 right-2 inline-flex items-center gap-1 px-2 py-1 bg-white/80 backdrop-blur border border-gray-200 rounded text-xs font-medium text-gray-700 hover:bg-gray-100 shadow-sm"
          >
            <Copy className="w-3 h-3" />复制
          </button>
        </div>
      ) : (
        <button
          onClick={onCopy}
          className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-black border border-gray-200 rounded px-3 py-1.5 bg-white hover:border-gray-400 transition-all"
        >
          <Copy className="w-4 h-4" />复制 JSON 密文到剪贴板
        </button>
      )}
    </div>
  );
}