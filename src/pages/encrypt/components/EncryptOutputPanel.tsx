import { Copy, Share2, Send } from 'lucide-react';

interface EncryptOutputPanelProps {
  output: string;
  onCopy: () => void;
  onShare: () => void;
  onEncrypt: () => void;
  isEncrypting: boolean;
  isSharing: boolean;
  shareUrl: string | null;
}

export function EncryptOutputPanel({
  output,
  onCopy,
  onShare,
  onEncrypt,
  isEncrypting,
  isSharing,
  shareUrl,
}: EncryptOutputPanelProps) {
  return (
    <div className="space-y-4">
      {output && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-700">加密结果（JSON）</span>
            <div className="flex gap-3">
              <button
                type="button"
                onClick={onCopy}
                className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
              >
                <Copy className="w-4 h-4" />
                复制密文
              </button>
              {!shareUrl && (
                <button
                  type="button"
                  onClick={onShare}
                  disabled={isSharing || isEncrypting}
                  className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700 disabled:opacity-50"
                >
                  <Share2 className="w-4 h-4" />
                  以链接分享
                </button>
              )}
            </div>
          </div>
          <textarea
            readOnly
            rows={8}
            className="w-full rounded-md border border-gray-200 bg-gray-50 p-3 font-mono text-xs"
            value={output}
          />
        </div>
      )}

      <div className="pt-4 flex justify-end">
        <button
          type="button"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-60"
          onClick={onEncrypt}
          disabled={isEncrypting || isSharing}
        >
          <Send className="w-5 h-5 mr-2" />
          {isEncrypting ? '加密中...' : isSharing ? '正在分享...' : '生成加密消息'}
        </button>
      </div>
    </div>
  );
}
