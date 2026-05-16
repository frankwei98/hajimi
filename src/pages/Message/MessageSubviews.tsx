import { KeyRound, Copy } from 'lucide-react';

interface DecryptedContentProps {
  decryptedData: { title?: string; content?: string; raw: string };
  matchedKid: string;
}

export function DecryptedContent({ decryptedData, matchedKid }: DecryptedContentProps) {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
      {decryptedData.title && (
        <div>
          <h3 className="text-sm font-medium text-gray-500 mb-1">标题</h3>
          <div className="text-2xl font-bold text-gray-900 leading-tight">{decryptedData.title}</div>
        </div>
      )}
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-1">内容</h3>
        <div className="prose prose-gray max-w-none bg-gray-50 p-6 rounded-xl border border-gray-100 text-gray-800 whitespace-pre-wrap font-sans text-lg leading-relaxed shadow-sm">
          {decryptedData.content || decryptedData.raw}
        </div>
      </div>
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 text-xs text-gray-400">
          <KeyRound className="w-3.5 h-3.5" />
          匹配密钥: <span className="font-mono text-gray-500">{matchedKid}</span>
        </div>
        <button
          onClick={() => navigator.clipboard.writeText(decryptedData.content || decryptedData.raw)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-900 hover:text-black transition-colors"
        >
          <Copy className="w-4 h-4" />复制解密内容
        </button>
      </div>
    </div>
  );
}

interface CiphertextPreviewProps {
  message: Record<string, unknown>;
}

export function CiphertextPreview({ message }: CiphertextPreviewProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">密文 JSON 数据</label>
      <div className="relative">
        <pre className="bg-black text-gray-300 p-4 rounded-lg overflow-x-auto font-mono text-xs leading-relaxed max-h-[500px]">
          {JSON.stringify(message, (key, value) => {
            if (key.startsWith('_')) return undefined;
            return value;
          }, 2)}
        </pre>
      </div>
    </div>
  );
}

interface CopyCiphertextButtonProps {
  message: Record<string, unknown>;
}

export function CopyCiphertextButton({ message }: CopyCiphertextButtonProps) {
  return (
    <button
      type="button"
      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-black hover:bg-gray-800 transition-colors"
      onClick={() => {
        const cleanData = JSON.stringify(message, (key, value) => {
          if (key.startsWith('_')) return undefined;
          return value;
        }, 2);
        navigator.clipboard.writeText(cleanData);
      }}
    >
      复制密文 JSON
    </button>
  );
}