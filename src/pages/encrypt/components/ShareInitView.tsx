import { Link as LinkIcon, ShieldCheck, RefreshCw } from 'lucide-react';
import { Turnstile } from '@marsidev/react-turnstile';
import type { TurnstileInstance } from '@marsidev/react-turnstile';

const TURNSTILE_SITE_KEY = import.meta.env.VITE_CF_TURNSTILE_KEY;

interface ShareInitViewProps {
  isShareInitiated: boolean;
  isSharing: boolean;
  token: string | null;
  turnstileRef: React.RefObject<TurnstileInstance | null>;
  onShareClick: () => void;
  setToken: (v: string | null) => void;
}

export function ShareInitView({
  isShareInitiated,
  isSharing,
  token,
  turnstileRef,
  onShareClick,
  setToken,
}: ShareInitViewProps) {
  if (!isShareInitiated) {
    return (
      <button
        onClick={onShareClick}
        className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 shadow-sm transition-all active:scale-95"
      >
        <LinkIcon className="w-4 h-4" />
        生成分享链接
      </button>
    );
  }
  return (
    <div className="flex flex-col items-end gap-2 min-w-[120px]">
      <div className="flex items-center gap-2 text-sm text-gray-600">
        {isSharing ? (
          <>
            <RefreshCw className="w-4 h-4 animate-spin text-black" />
            <span className="font-medium text-black">创建中...</span>
          </>
        ) : (
          <>
            <ShieldCheck className="w-4 h-4 text-gray-400" />
            <span className="text-xs">验证环境中...</span>
          </>
        )}
      </div>
      {!token && !isSharing && (
        <div className="h-[65px] flex justify-end">
          {TURNSTILE_SITE_KEY ? (
            <Turnstile
              ref={turnstileRef}
              siteKey={TURNSTILE_SITE_KEY}
              onSuccess={setToken}
              onExpire={() => setToken(null)}
              onError={() => setToken(null)}
              options={{ size: 'compact' }}
            />
          ) : (
            <div className="text-xs text-red-500">缺少 Site Key</div>
          )}
        </div>
      )}
    </div>
  );
}