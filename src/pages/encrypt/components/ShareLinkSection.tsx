import { Copy, Check, ExternalLink } from 'lucide-react';
import { ShareInitView } from './ShareInitView';
import type { TurnstileInstance } from '@marsidev/react-turnstile';

interface ShareLinkSectionProps {
  shareUrl: string | null;
  isSharing: boolean;
  isShareInitiated: boolean;
  token: string | null;
  turnstileRef: React.RefObject<TurnstileInstance | null>;
  handleShareClick: () => void;
  setToken: (v: string | null) => void;
  onCopyShareUrl: () => void;
}

export function ShareLinkSection({
  shareUrl, isSharing, isShareInitiated, token, turnstileRef, handleShareClick, setToken, onCopyShareUrl,
}: ShareLinkSectionProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
          <span className="bg-black text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">1</span>
          通过安全链接分享 (推荐)
        </h4>
      </div>
      {!shareUrl ? (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="text-sm text-gray-600">
              生成一个一次性链接，发送给接收者。
              <br />
              <span className="text-xs text-gray-400">我们会验证您的环境安全，然后上传密文。</span>
            </div>
            <ShareInitView
              isShareInitiated={isShareInitiated}
              isSharing={isSharing}
              token={token}
              turnstileRef={turnstileRef}
              onShareClick={handleShareClick}
              setToken={setToken}
            />
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 animate-in zoom-in-95 duration-200">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                <Check className="w-4 h-4 text-black" />链接已就绪
              </span>
              <a href={shareUrl} target="_blank" rel="noreferrer" className="text-xs text-gray-600 hover:text-black flex items-center gap-1 underline decoration-gray-300 underline-offset-2">
                直接打开 <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-white border border-gray-200 rounded px-3 py-2 text-sm font-mono text-gray-600 break-all select-all shadow-inner">
                {shareUrl}
              </div>
              <button onClick={onCopyShareUrl} className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-black transition-colors">
                <Copy className="w-4 h-4" />复制
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}