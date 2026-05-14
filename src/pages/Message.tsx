import { useParams } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Loader2, AlertCircle, FileText, Calendar, ShieldCheck, Lock, Unlock, KeyRound, Copy } from 'lucide-react';
import type { Id } from '../../convex/_generated/dataModel';
import { useEffect, useState, useCallback } from 'react';
import { useKeyVaultStore } from '../lib/state/keyVaultStore';
import { KeyCenterUnlock } from './key-center/KeyCenterUnlock';
import {
  parseEnvelope,
  decryptForRecipient,
  decodePayload,
  pickMatchingKid,
} from '../lib/crypto/hybrid/hybrid';

export function Message() {
  const { messageId } = useParams();
  const [pin, setPin] = useState('');
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedData, setDecryptedData] = useState<{ title?: string; content?: string; raw: string } | null>(null);
  const [matchedKid, setMatchedKid] = useState('');

  const { keys, isLoaded, isUnlocked, privateKeyByPub, loadKeys, unlockVault } = useKeyVaultStore();

  useEffect(() => {
    loadKeys().catch(() => undefined);
  }, [loadKeys]);

  // Fetch message from Convex
  const message = useQuery(api.messages.getMessage, { 
    messageId: messageId as Id<'message'>,
  });

  const handleUnlock = async () => {
    setUnlockError(null);
    if (pin.length < 6) {
      setUnlockError('请输入 6 位 PIN');
      return;
    }
    try {
      await unlockVault(pin);
    } catch (err) {
      setUnlockError(err instanceof Error ? err.message : '解锁失败');
    }
  };

  const handleDecrypt = useCallback(async () => {
    if (!message || !isUnlocked) return;
    
    setDecryptError(null);
    setIsDecrypting(true);
    try {
      const cleanData = JSON.stringify(message.body, (key, value) => {
        if (key.startsWith('_')) return undefined;
        return value;
      });
      
      const envelope = parseEnvelope(cleanData);
      if (!envelope || !envelope.recipients) {
        throw new Error('密文数据格式非法：缺少 recipients 字段');
      }
      
      const kid = pickMatchingKid(envelope, Object.keys(privateKeyByPub));
      if (!kid) {
        throw new Error('该消息没有指定你的任何一个本地密钥作为接收者');
      }
      
      const privateKey = privateKeyByPub[kid];
      const plaintext = await decryptForRecipient(envelope, privateKey, kid);
      const payload = decodePayload(plaintext);
      
      setMatchedKid(kid);
      setDecryptedData(payload);
    } catch (err) {
      setDecryptError(err instanceof Error ? err.message : '解密失败');
    } finally {
      setIsDecrypting(false);
    }
  }, [message, isUnlocked, privateKeyByPub]);

  // Automatically decrypt when unlocked and message is available
  useEffect(() => {
    if (isUnlocked && message && !decryptedData && !decryptError && !isDecrypting) {
      handleDecrypt();
    }
  }, [isUnlocked, message, decryptedData, decryptError, isDecrypting, handleDecrypt]);

  // Loading state
  if (message === undefined || !isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 text-black animate-spin" />
        <p className="text-gray-500 animate-pulse">正在从云端调取加密消息...</p>
      </div>
    );
  }

  // Not found state (404)
  if (message === null) {
    return (
      <div className="max-w-md mx-auto mt-12">
        <div className="bg-white shadow sm:rounded-lg overflow-hidden border-t-4 border-red-500">
          <div className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">未找到该消息</h2>
            <p className="text-gray-500 mb-6">
              抱歉，该消息可能已被删除，或者链接有误。
            </p>
            <a 
              href="/"
              className="inline-flex items-center px-4 py-2 border border-gray-200 text-sm font-medium rounded-md text-gray-900 bg-white hover:bg-gray-50 transition-colors"
            >
              返回首页
            </a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-black" />
              已获取加密消息
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              消息已成功从数据库加载，{decryptedData ? '内容已解密。' : '请进行解密以查看内容。'}
            </p>
          </div>
          {decryptedData && (
            <div className="flex items-center gap-2 px-3 py-1 bg-black border border-transparent rounded-full text-xs font-medium text-white">
              <Unlock className="w-3.5 h-3.5" />
              已解密
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
            <div className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              创建时间: {new Date(message._creationTime).toLocaleString()}
            </div>
            <div className="flex items-center gap-1">
              <FileText className="w-3.5 h-3.5" />
              ID: {messageId}
            </div>
          </div>

          {!isUnlocked ? (
            <div className="space-y-4">
              {keys.length > 0 ? (
                <KeyCenterUnlock
                  pin={pin}
                  error={unlockError}
                  onPinChange={setPin}
                  onUnlock={handleUnlock}
                />
              ) : (
                <div className="bg-gray-50 border-l-4 border-gray-900 p-4">
                  <div className="flex items-center gap-3">
                    <Lock className="w-6 h-6 text-gray-900" />
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">未发现本地密钥</h3>
                      <p className="text-sm text-gray-600 mt-1">
                        你当前浏览器中没有可用的私钥，无法直接解密此消息。请先在「密钥中心」创建或导入密钥。
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : isDecrypting ? (
            <div className="flex flex-col items-center justify-center py-12 space-y-4">
              <Loader2 className="w-8 h-8 text-black animate-spin" />
              <p className="text-gray-500">正在匹配密钥并解密...</p>
            </div>
          ) : decryptError ? (
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <div className="flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-500" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">解密失败</h3>
                  <p className="text-sm text-red-700 mt-1">{decryptError}</p>
                </div>
              </div>
            </div>
          ) : decryptedData ? (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-500">
              {decryptedData.title && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-1">标题</h3>
                  <div className="text-2xl font-bold text-gray-900 leading-tight">
                    {decryptedData.title}
                  </div>
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
                  onClick={() => {
                    navigator.clipboard.writeText(decryptedData.content || decryptedData.raw);
                  }}
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-900 hover:text-black transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  复制解密内容
                </button>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-1">
                密文 JSON 数据
              </label>
              <div className="relative">
                <pre className="bg-black text-gray-300 p-4 rounded-lg overflow-x-auto font-mono text-xs leading-relaxed max-h-[500px]">
                  {JSON.stringify(message, (key, value) => {
                    if (key.startsWith('_')) return undefined;
                    return value;
                  }, 2)}
                </pre>
              </div>
            </div>
          )}

          {!decryptedData && !isDecrypting && (
            <div className="bg-gray-50 border-l-4 border-gray-200 p-4">
              <div className="flex">
                <div className="ml-3">
                  <p className="text-sm text-gray-600">
                    💡 <strong>提示：</strong> 这是一个长文分享链接。
                    {!isUnlocked 
                      ? " 请输入 PIN 解锁你的密钥库以尝试自动解密。" 
                      : " 你也可以复制上方的密文 JSON，前往「解密工坊」手动查看内容。"}
                  </p>
                </div>
              </div>
            </div>
          )}

          {!decryptedData && (
            <div className="pt-4 flex justify-end">
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
