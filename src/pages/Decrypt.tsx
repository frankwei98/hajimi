import { useEffect, useMemo, useState } from 'react';
import { KeyRound, Unlock, FileText, Copy } from 'lucide-react';
import { PinInput } from '../components/PinInput';
import {
  decodePayload,
  decryptForRecipient,
  parseEnvelope,
  type HybridEnvelope,
} from '../lib/crypto/hybrid/hybrid';
import { useKeyVaultStore } from '../lib/state/keyVaultStore';

function pickMatchingKid(envelope: HybridEnvelope, available: string[]) {
  return envelope.recipients.find((item) => available.includes(item.kid))?.kid ?? '';
}

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

  const availableKids = useMemo(() => keys.map((key) => key.publicKeyBech32), [keys]);

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
              <KeyRound className="w-5 h-5 text-indigo-600" />
              解密工坊
            </h2>
            <p className="mt-1 text-sm text-gray-500">
              解锁密钥库后，自动匹配密文中的接收者公钥。
            </p>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">密钥库解锁</label>
            <div className="text-xs text-gray-500">已保存 {keys.length} 把密钥</div>
            <PinInput value={pin} onChange={setPin} disabled={isBusy || keys.length === 0} />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleUnlock}
                disabled={isBusy || keys.length === 0}
                className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                <Unlock className="h-4 w-4" />
                {isBusy ? '解锁中...' : '解锁密钥库'}
              </button>
              {isUnlocked ? (
                <button
                  type="button"
                  onClick={handleLock}
                  className="inline-flex items-center gap-2 rounded-md border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  锁定
                </button>
              ) : null}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">密文 JSON</label>
            <textarea
              rows={8}
              className="w-full rounded-md border border-gray-300 p-3 font-mono text-xs"
              placeholder="粘贴加密结果 JSON"
              value={envelopeText}
              onChange={(e) => setEnvelopeText(e.target.value)}
            />
          </div>

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleDecrypt}
              disabled={isBusy}
              className="inline-flex items-center gap-2 rounded-md bg-indigo-600 px-6 py-3 text-base font-medium text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              <FileText className="h-5 w-5" />
              {isBusy ? '解密中...' : '解密消息'}
            </button>
          </div>

          {matchedKid ? (
            <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-xs text-green-700 break-all">
              已匹配密钥：{matchedKid}
            </div>
          ) : null}

          {resultText ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">解密结果</span>
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
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
                className="w-full rounded-md border border-gray-200 bg-gray-50 p-3 font-mono text-xs"
                value={resultText}
              />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
