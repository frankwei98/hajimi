import { useState, useRef, useEffect } from 'react';
import {
  Copy,
  Send,
  ShieldCheck,
  Check,
  Link as LinkIcon,
  ExternalLink,
  ChevronDown,
  RefreshCw,
} from 'lucide-react';
import { Turnstile, type TurnstileInstance } from '@marsidev/react-turnstile';

interface EncryptOutputPanelProps {
  output: string;
  onCopy: () => void;
  onShare: (captchaToken: string) => void;
  onEncrypt: () => void;
  onCopyShareUrl: () => void;
  isEncrypting: boolean;
  isSharing: boolean;
  shareUrl: string | null;
}

const TURNSTILE_SITE_KEY = import.meta.env.VITE_CF_TURNSTILE_KEY;

function OutputResult({
  output,
  onCopy,
  onShare,
  onCopyShareUrl,
  isSharing,
  shareUrl,
}: Omit<EncryptOutputPanelProps, 'onEncrypt' | 'isEncrypting'>) {
  const [showRaw, setShowRaw] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isShareInitiated, setIsShareInitiated] = useState(false);
  const turnstileRef = useRef<TurnstileInstance>(null);

  // 当点击分享且 token 准备好时，自动执行分享
  useEffect(() => {
    if (isShareInitiated && token && !isSharing && !shareUrl) {
      onShare(token);
    }
  }, [token, isShareInitiated, isSharing, shareUrl, onShare]);

  const handleShareClick = () => {
    setIsShareInitiated(true);
    // 如果已有 token，effect 会自动触发分享
    // 如果没有，显示 Turnstile 并等待 onSuccess
    if (!token) {
      turnstileRef.current?.reset();
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
      {/* 成功头部 */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-start sm:items-center gap-4">
        <div className="bg-black p-2 rounded-full flex-shrink-0 text-white">
          <Check className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            消息加密成功
          </h3>
          <p className="text-sm text-gray-600 mt-0.5">
            密文已生成，请选择发送方式。
          </p>
        </div>
      </div>

      <div className="p-6 space-y-8">
        {/* 方式一：链接分享 (Primary) */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <span className="bg-black text-white w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">
                1
              </span>
              通过安全链接分享 (推荐)
            </h4>
          </div>

          {!shareUrl ? (
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                <div className="text-sm text-gray-600">
                  生成一个一次性链接，发送给接收者。
                  <br />
                  <span className="text-xs text-gray-400">
                    我们会验证您的环境安全，然后上传密文。
                  </span>
                </div>
                
                {isShareInitiated ? (
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
                      
                      {/* Turnstile Container */}
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
                              <div className="text-xs text-red-500">
                                缺少 Site Key
                              </div>
                            )}
                         </div>
                      )}
                   </div>
                ) : (
                  <button
                    onClick={handleShareClick}
                    className="flex-shrink-0 inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm font-medium rounded-md hover:bg-gray-800 shadow-sm transition-all active:scale-95"
                  >
                    <LinkIcon className="w-4 h-4" />
                    生成分享链接
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-lg border border-gray-200 p-4 animate-in zoom-in-95 duration-200">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-gray-900 flex items-center gap-2">
                    <Check className="w-4 h-4 text-black" />
                    链接已就绪
                  </span>
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-gray-600 hover:text-black flex items-center gap-1 underline decoration-gray-300 underline-offset-2"
                  >
                    直接打开 <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white border border-gray-200 rounded px-3 py-2 text-sm font-mono text-gray-600 break-all select-all shadow-inner">
                    {shareUrl}
                  </div>
                  <button
                    onClick={onCopyShareUrl}
                    className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-300 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-50 focus:ring-2 focus:ring-black transition-colors"
                  >
                    <Copy className="w-4 h-4" />
                    复制
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="border-t border-gray-100" />

        {/* 方式二：手动复制 (Secondary) */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium text-gray-900 flex items-center gap-2">
              <span className="bg-gray-100 text-gray-600 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold">
                2
              </span>
              手动复制密文
            </h4>
            <button
              onClick={() => setShowRaw(!showRaw)}
              className="text-xs text-gray-500 hover:text-black flex items-center gap-1 transition-colors"
            >
              {showRaw ? '收起详情' : '展开详情'}
              <ChevronDown
                className={`w-3 h-3 transition-transform ${showRaw ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
          
          <div className="text-sm text-gray-500 mb-3">
             如果不希望通过链接分享，您可以直接复制下方的 JSON 密文发送给接收者。
          </div>

          {showRaw && (
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
                <Copy className="w-3 h-3" />
                复制
              </button>
            </div>
          )}
           {!showRaw && (
              <button
                 onClick={onCopy}
                 className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-black border border-gray-200 rounded px-3 py-1.5 bg-white hover:border-gray-400 transition-all"
              >
                 <Copy className="w-4 h-4" />
                 复制 JSON 密文到剪贴板
              </button>
           )}
        </div>
      </div>
    </div>
  );
}

export function EncryptOutputPanel({
  output,
  onCopy,
  onShare,
  onEncrypt,
  onCopyShareUrl,
  isEncrypting,
  isSharing,
  shareUrl,
}: EncryptOutputPanelProps) {
  return (
    <div className="space-y-6">
      {output && (
        <OutputResult
          key={output} // Re-mount on new output to reset states
          output={output}
          onCopy={onCopy}
          onShare={onShare}
          onCopyShareUrl={onCopyShareUrl}
          isSharing={isSharing}
          shareUrl={shareUrl}
        />
      )}

      {/* Encrypt Button Area */}
      <div className="pt-2 flex justify-end">
        <button
          type="button"
          className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] ${
             output ? 'bg-gray-800 hover:bg-black' : 'bg-black hover:bg-gray-800'
          }`}
          onClick={onEncrypt}
          disabled={isEncrypting || isSharing}
        >
          <Send className="w-5 h-5 mr-2" />
          {isEncrypting ? '加密中...' : (output ? '重新生成消息' : '生成加密消息')}
        </button>
      </div>
    </div>
  );
}
