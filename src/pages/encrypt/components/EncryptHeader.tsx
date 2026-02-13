import { Lock } from 'lucide-react';

export function EncryptHeader() {
  return (
    <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
      <div>
        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <Lock className="w-5 h-5 text-indigo-600" />
          加密工坊
        </h2>
        <p className="mt-1 text-sm text-gray-500">
          支持多个接收者公钥，一次生成可分享的密文。
        </p>
      </div>
    </div>
  );
}
