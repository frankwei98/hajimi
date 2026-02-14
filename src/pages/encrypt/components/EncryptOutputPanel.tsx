import { useState, useRef } from 'react';
import { Copy, Share2, Send, ShieldCheck } from 'lucide-react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

interface EncryptOutputPanelProps {
  output: string;
  onCopy: () => void;
  onShare: (captchaToken: string) => void;
  onEncrypt: () => void;
  isEncrypting: boolean;
  isSharing: boolean;
  shareUrl: string | null;
}

const TURNSTILE_SITE_KEY = import.meta.env.VITE_CF_TURNSTILE_KEY;

function OutputResult({
  output,
  onCopy,
  onShare,
  isSharing,
  isEncrypting,
  shareUrl,
}: Omit<EncryptOutputPanelProps, 'onEncrypt'>) {
  const [token, setToken] = useState<string | null>(null);
  const turnstileRef = useRef<TurnstileInstance>(null);

  return (
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
              onClick={() => token && onShare(token)}
              disabled={isSharing || isEncrypting || !token}
              className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700 disabled:opacity-50 transition-opacity"
            >
              <Share2 className="w-4 h-4" />
              {isSharing ? '正在分享...' : '以链接分享'}
            </button>
          )}
        </div>
      </div>
      <textarea
        readOnly
        rows={8}
        className="w-full rounded-md border border-gray-200 bg-gray-50 p-3 font-mono text-xs focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
        value={output}
      />

      {!shareUrl && (
        <div className="flex flex-col items-end gap-2 pt-1">
          <div className="flex items-center gap-1.5 text-[10px] text-gray-400">
            <ShieldCheck className="w-3.5 h-3.5 text-green-500/70" />
            <span>分享功能受 Cloudflare Turnstile 保护</span>
          </div>
          <div className="min-h-[65px] flex items-center justify-end">
            {TURNSTILE_SITE_KEY ? (
              <Turnstile
                ref={turnstileRef}
                siteKey={TURNSTILE_SITE_KEY}
                onSuccess={setToken}
                onExpire={() => setToken(null)}
                onError={() => setToken(null)}
                options={{
                  theme: 'light',
                  size: 'normal',
                }}
              />
            ) : (
              <div className="text-xs text-red-400 bg-red-50 px-3 py-2 rounded-md border border-red-100">
                未配置 Turnstile Site Key (VITE_CF_TURNSTILE_KEY)
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
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
        <OutputResult
          key={output}
          output={output}
          onCopy={onCopy}
          onShare={onShare}
          isSharing={isSharing}
          isEncrypting={isEncrypting}
          shareUrl={shareUrl}
        />
      )}

      <div className="pt-4 flex justify-end">
        <button
          type="button"
          className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98]"
          onClick={onEncrypt}
          disabled={isEncrypting || isSharing}
        >
          <Send className="w-5 h-5 mr-2" />
          {isEncrypting ? '加密中...' : '生成加密消息'}
        </button>
      </div>
    </div>
  );
}
