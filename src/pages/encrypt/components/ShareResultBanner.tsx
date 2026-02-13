import { Check, Copy, ExternalLink } from 'lucide-react';

interface ShareResultBannerProps {
  shareUrl: string;
  onCopyShareUrl: () => void;
}

export function ShareResultBanner({ shareUrl, onCopyShareUrl }: ShareResultBannerProps) {
  return (
    <div className="rounded-md bg-green-50 p-4 border border-green-200">
      <div className="flex">
        <div className="flex-shrink-0">
          <Check className="h-5 w-5 text-green-400" aria-hidden="true" />
        </div>
        <div className="ml-3 flex-1 md:flex md:justify-between">
          <p className="text-sm text-green-700">
            消息已上传！任何人访问此链接均可尝试解密。
          </p>
          <p className="mt-3 text-sm md:ml-6 md:mt-0">
            <button
              onClick={onCopyShareUrl}
              className="whitespace-nowrap font-medium text-green-700 hover:text-green-600 flex items-center gap-1"
            >
              <Copy className="w-4 h-4" />
              复制链接
            </button>
          </p>
        </div>
      </div>
      <div className="mt-2 flex items-center gap-2 bg-white p-2 rounded border border-green-100 text-xs font-mono text-green-800 break-all">
        <ExternalLink className="w-3 h-3 flex-shrink-0" />
        {shareUrl}
      </div>
    </div>
  );
}
