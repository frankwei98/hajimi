import { Loader2, AlertCircle, ShieldCheck, Lock, Unlock } from 'lucide-react';
import { useState } from 'react';
import { isValidPin } from '../../lib/crypto/keyVault';
import { useKeyVaultStore } from '../../lib/state/keyVaultStore';
import { KeyCenterUnlock } from '../key-center/KeyCenterUnlock';
import { useMessageDecrypt } from './useMessageDecrypt';
import { DecryptedContent, CiphertextPreview, CopyCiphertextButton } from './MessageSubviews';

export function Message() {
  const [pin, setPin] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);

  const { message, isLoaded, isUnlocked, isDecrypting, decryptError, decryptedData, matchedKid } = useMessageDecrypt();
  const { keys, unlockVault } = useKeyVaultStore();

  const handleUnlock = async () => {
    setUnlockError(null);
    if (!isValidPin(pin)) { setUnlockError('请输入 6 位 PIN'); return; }
    try { await unlockVault(pin); } catch (err) { setUnlockError(err instanceof Error ? err.message : '解锁失败'); }
  };

  if (message === undefined || !isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-black animate-spin" />
        <p className="text-gray-500 animate-pulse">正在从云端调取加密消息...</p>
      </div>
    );
  }

  if (message === null) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white shadow sm:rounded-lg overflow-hidden border-t-4 border-red-500">
          <div className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">未找到该消息</h2>
            <p className="text-gray-500 mb-6">抱歉，该消息可能已被删除，或者链接有误。</p>
            <a href="/" className="inline-flex items-center px-4 py-2 border border-gray-200 text-sm font-medium rounded-md text-gray-900 bg-white hover:bg-gray-50 transition-colors">返回首页</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-black" />已获取加密消息</h2>
            <p className="mt-1 text-sm text-gray-500">消息已成功从数据库加载，{decryptedData ? '内容已解密。' : '请进行解密以查看内容。'}</p>
          </div>
          {decryptedData && <div className="flex items-center gap-2 px-3 py-1 bg-black border border-transparent rounded-full text-xs font-medium text-white"><Unlock className="w-3.5 h-3.5" />已解密</div>}
        </div>

        <div className="p-6 space-y-6">
          {!isUnlocked ? (
            <div className="space-y-4">
              {keys.length > 0 ? (
                <KeyCenterUnlock pin={pin} error={unlockError} onPinChange={setPin} onUnlock={handleUnlock} />
              ) : (
                <div className="bg-gray-50 border-l-4 border-gray-900 p-4"><div className="flex items-center gap-3"><Lock className="w-6 h-6 text-gray-900" /><div><h3 className="text-sm font-medium text-gray-900">未发现本地密钥</h3><p className="text-sm text-gray-600 mt-1">你当前浏览器中没有可用的私钥，无法直接解密此消息。请先在「密钥中心」创建或导入密钥。</p></div></div></div>
              )}
            </div>
          ) : isDecrypting ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4"><Loader2 className="w-8 h-8 text-black animate-spin" /><p className="text-gray-500">正在匹配密钥并解密...</p></div>
          ) : decryptError ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4"><div className="flex items-center gap-3"><AlertCircle className="w-6 h-6 text-red-500" /><div><h3 className="text-sm font-medium text-red-800">解密失败</h3><p className="text-sm text-red-700 mt-1">{decryptError}</p></div></div></div>
          ) : decryptedData ? (
            <DecryptedContent decryptedData={decryptedData} matchedKid={matchedKid} />
          ) : (
            <CiphertextPreview message={message} />
          )}

          {!decryptedData && !isDecrypting && (
            <div className="bg-gray-50 border-l-4 border-gray-200 p-4"><div className="flex"><div className="ml-3"><p className="text-sm text-gray-600">💡 <strong>提示：</strong> 这是一个长文分享链接。{!isUnlocked ? ' 请输入 PIN 解锁你的密钥库以尝试自动解密。' : ' 你也可以复制上方的密文 JSON，前往「解密工坊」手动查看内容。'}</p></div></div></div>
          )}
          {!decryptedData && <div className="pt-4 flex justify-end"><CopyCiphertextButton message={message} /></div>}
        </div>
      </div>
    </div>
  );
}