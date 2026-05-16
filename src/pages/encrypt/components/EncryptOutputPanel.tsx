import { Send, Check } from 'lucide-react';
import { useShareFlow } from './useShareFlow';
import { ShareLinkSection } from './ShareLinkSection';
import { CopySection } from './CopySection';

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

function OutputResult({
  output,
  onCopy,
  onShare,
  onCopyShareUrl,
  isSharing,
  shareUrl,
}: Omit<EncryptOutputPanelProps, 'onEncrypt' | 'isEncrypting'>) {
  const { token, isShareInitiated, turnstileRef, showRaw, setShowRaw, handleShareClick, setToken } =
    useShareFlow(shareUrl, isSharing, onShare);

  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden animate-in fade-in slide-in-from-bottom-2">
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-100 flex items-start sm:items-center gap-4">
        <div className="bg-black p-2 rounded-full flex-shrink-0 text-white">
          <Check className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-gray-900">消息加密成功</h3>
          <p className="text-sm text-gray-600 mt-0.5">密文已生成，请选择发送方式。</p>
        </div>
      </div>

      <div className="p-6 space-y-8">
        <ShareLinkSection
          shareUrl={shareUrl}
          isSharing={isSharing}
          isShareInitiated={isShareInitiated}
          token={token}
          turnstileRef={turnstileRef}
          handleShareClick={handleShareClick}
          setToken={setToken}
          onCopyShareUrl={onCopyShareUrl}
        />

        <div className="border-t border-gray-100" />

        <CopySection output={output} showRaw={showRaw} setShowRaw={setShowRaw} onCopy={onCopy} />
      </div>
    </div>
  );
}

export function EncryptOutputPanel({
  output, onCopy, onShare, onEncrypt, onCopyShareUrl, isEncrypting, isSharing, shareUrl,
}: EncryptOutputPanelProps) {
  return (
    <div className="space-y-6">
      {output && (
        <OutputResult key={output} output={output} onCopy={onCopy} onShare={onShare} onCopyShareUrl={onCopyShareUrl} isSharing={isSharing} shareUrl={shareUrl} />
      )}
      <div className="pt-2 flex justify-end">
        <button type="button" className={`inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black transition-all disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.98] ${output ? 'bg-gray-800 hover:bg-black' : 'bg-black hover:bg-gray-800'}`} onClick={onEncrypt} disabled={isEncrypting || isSharing}>
          <Send className="w-5 h-5 mr-2" />
          {isEncrypting ? '加密中...' : (output ? '重新生成消息' : '生成加密消息')}
        </button>
      </div>
    </div>
  );
}