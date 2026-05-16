import { useEffect, useState } from 'react';
import { KeyRound, Unlock, FileText, Copy } from 'lucide-react';
import { PinInput } from '../components/PinInput';
import { ErrorAlert } from '../components/ErrorAlert';
import {
  decodePayload,
  decryptForRecipient,
  parseEnvelope,
  pickMatchingKid,
} from '../lib/crypto/hybrid';
import { useKeyVaultStore } from '../lib/state/keyVaultStore';

export function Decrypt() {
  const [pin, setPin] = useState('');
  const [envelopeText, setEnvelopeText] = useState('');
  const [resultText, setResultText] = useState('');
  const [resultTitle, setResultTitle] = useState('');
  const [resultContent, setResultContent] = useState('');
  const [matchedKid, setMatchedKid] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const { keys, privateKeyByPub, isUnlocked, loadKeys, unlockVault, lockVault } = useKeyVaultStore();

  useEffect(() => {
    loadKeys().catch(() => undefined);
  }, [loadKeys]);

  const handleUnlock = async () => {
    setError(null);
    if (keys.length === 0) {
      setError('暂无密钥，请先在密钥中心创建');
      return;
    }
    if (pin.length < 6) {
      setError('请输入 6 位 PIN');
      return;
    }
    try {
      setIsBusy(true);
      await unlockVault(pin);
    } catch (err) {
      setError(err instanceof Error ? err.message : '解锁失败');
    } finally {
      setIsBusy(false);
    }
  };

  const handleLock = () => {
    lockVault();
    setMatchedKid('');
  };

  const handleDecrypt = async () => {
    setError(null);
    setResultText('');
    setResultTitle('');
    setResultContent('');
    setMatchedKid('');

    if (!isUnlocked) {
      setError('请先解锁密钥库');
      return;
    }
    if (!envelopeText.trim()) {
      setError('请粘贴密文 JSON');
      return;
    }

    try {
      setIsBusy(true);
      const envelope = parseEnvelope(envelopeText);
      const kid = pickMatchingKid(envelope, Object.keys(privateKeyByPub));
      if (!kid) {
        throw new Error('密文中没有匹配本地密钥的接收者');
      }
      const privateKey = privateKeyByPub[kid];
      const plaintext = await decryptForRecipient(envelope, privateKey, kid);
      const payload = decodePayload(plaintext);
      setMatchedKid(kid);
      setResultText(payload.raw);
      setResultTitle(payload.title ?? '');
      setResultContent(payload.content ?? '');
    } catch (err) {
      setError(err instanceof Error ? err.message : '解密失败');
    } finally {
      setIsBusy(false);
    }
  };

  const handleCopy = async () => {
    if (!resultText) return;
    await navigator.clipboard.writeText(resultText);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-black" />
              解密工坊
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              解锁密钥库后，自动匹配密文中的接收者公钥。
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {!isUnlocked ? (
            <div className="space-y-3">
              <label className="block text-sm font-medium text-gray-700">密钥库解锁</label>
              <div className="text-xs text-gray-500">已保存 {keys.length} 把密钥</div>
              <PinInput value={pin} onChange={setPin} disabled={isBusy || keys.length === 0} />
              
              <ErrorAlert error={error} />

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleUnlock}
                  disabled={isBusy || keys.length === 0}
                  className="inline-flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60 transition-colors"
                >
                  <Unlock className="h-4 w-4" />
                  {isBusy ? '解锁中...' : '解锁密钥库'}
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between rounded-md bg-green-50 px-4 py-3 text-sm text-green-700 border border-green-200">
              <div className="flex items-center gap-2">
                <Unlock className="h-4 w-4" />
                <span className="font-medium">密钥库已解锁</span>
                <span className="text-xs opacity-80">({keys.length} 把密钥)</span>
              </div>
              <button
                type="button"
                onClick={handleLock}
                className="text-xs font-medium underline hover:text-green-800"
              >
                锁定
              </button>
            </div>
          )}

          {isUnlocked && (
            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">密文 JSON</label>
                <textarea
                  rows={8}
                  className="w-full rounded-md border border-gray-300 p-3 font-mono text-xs focus:ring-black focus:border-black"
                  placeholder="粘贴加密结果 JSON"
                  value={envelopeText}
                  onChange={(e) => setEnvelopeText(e.target.value)}
                />
              </div>

              <ErrorAlert error={error} />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleDecrypt}
                  disabled={isBusy}
                  className="inline-flex items-center gap-2 rounded-md bg-black px-6 py-3 text-base font-medium text-white hover:bg-gray-800 disabled:opacity-60 transition-colors shadow-sm"
                >
                  <FileText className="h-5 w-5" />
                  {isBusy ? '解密中...' : '解密消息'}
                </button>
              </div>

              {matchedKid ? (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-4 py-3 text-xs text-gray-700 break-all">
                  已匹配密钥：{matchedKid}
                </div>
              ) : null}

              {resultText ? (
                <div className="space-y-3 animate-in fade-in slide-in-from-bottom-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-700">解密结果</span>
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1 text-sm text-gray-900 hover:text-black transition-colors"
                    >
                      <Copy className="w-4 h-4" />
                      复制
                    </button>
                  </div>
                  {resultTitle || resultContent ? (
                    <div className="rounded-md border border-gray-200 bg-gray-50 p-4 text-sm text-gray-700">
                      {resultTitle ? <div className="font-semibold mb-2">{resultTitle}</div> : null}
                      {resultContent ? <div className="whitespace-pre-wrap">{resultContent}</div> : null}
                    </div>
                  ) : null}
                  <textarea
                    readOnly
                    rows={6}
                    className="w-full rounded-md border border-gray-200 bg-gray-50 p-3 font-mono text-xs focus:ring-black focus:border-black"
                    value={resultText}
                  />
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
