import { useMemo, useState, useEffect } from 'react';
import { Lock, Key, FileText, Send, Type, Copy, Share2, ExternalLink, Check } from 'lucide-react';
import { decodeBech32PublicKey, isHajimiPublicKey } from '../lib/crypto/x25519';
import { encryptForRecipients, envelopeToText, parseEnvelope } from '../lib/crypto/hybrid/hybrid';
import { utf8ToBytes } from '../lib/crypto/hybrid/encoding';
import { useKeyVaultStore } from '../lib/state/keyVaultStore';
import { useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';

const TITLE_LIMIT = 100;
const CONTENT_LIMIT = 1000;

function parseRecipients(input: string) {
  const raw = input
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const unique = Array.from(new Set(raw));
  return unique.map((kid) => ({ kid, publicKeyBytes: decodeBech32PublicKey(kid) }));
}

export function Encrypt() {
  const [recipientKeyText, setRecipientKeyText] = useState('');
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [output, setOutput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const { keys, loadKeys } = useKeyVaultStore();

  // DB related
  const uploadMutation = useMutation(api.messages.uploadMessage);

  useEffect(() => {
    loadKeys().catch(() => undefined);
  }, [loadKeys]);

  const recipientCount = useMemo(() => {
    if (!recipientKeyText.trim()) return selectedRecipients.length;
    return (
      recipientKeyText.split(/[\n,]+/).map((item) => item.trim()).filter(Boolean).length +
      selectedRecipients.length
    );
  }, [recipientKeyText, selectedRecipients]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value.length <= TITLE_LIMIT) {
      setTitle(value);
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= CONTENT_LIMIT) {
      setContent(value);
    }
  };

  const handleEncrypt = async () => {
    setError(null);
    setOutput('');
    setShareUrl(null);
    try {
      const manualRecipients = parseRecipients(recipientKeyText);
      const selected = selectedRecipients.map((kid) => ({
        kid,
        publicKeyBytes: decodeBech32PublicKey(kid),
      }));
      const merged = [...manualRecipients, ...selected];
      const unique = new Map<string, { kid: string; publicKeyBytes: Uint8Array }>();
      merged.forEach((item) => unique.set(item.kid, item));
      const recipients = Array.from(unique.values());

      if (recipients.length === 0) {
        throw new Error('请至少填写一个收件人公钥');
      }
      if (!title.trim() && !content.trim()) {
        throw new Error('请至少填写标题或内容');
      }

      setIsBusy(true);
      const payload = {
        title: title.trim(),
        content: content.trim(),
        createdAt: new Date().toISOString(),
      };
      const plaintext = utf8ToBytes(JSON.stringify(payload));
      const envelope = await encryptForRecipients(plaintext, recipients);
      setOutput(envelopeToText(envelope));
    } catch (err) {
      setError(err instanceof Error ? err.message : '加密失败');
    } finally {
      setIsBusy(false);
    }
  };

  const handleShare = async () => {
    if (!output) return;
    setError(null);
    setIsBusy(true);
    try {
      const envelope = parseEnvelope(output);
      const messageId = await uploadMutation({
        message: {
          body: envelope
        }
      });
      const url = `${window.location.origin}/m/${messageId}`;
      setShareUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传分享失败');
    } finally {
      setIsBusy(false);
    }
  };

  const handleCopyShareUrl = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    // You could add a temporary "copied" state here if desired
  };

  const handleCopy = async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
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

        <div className="p-6 space-y-6">
          <div>
            <label htmlFor="public-key" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Key className="w-4 h-4" />
              收件人公钥（可多行）
            </label>
            <div className="mt-1">
              <textarea
                id="public-key"
                rows={4}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-3 border resize-none font-mono text-xs"
                placeholder="每行一个 hajimi... 公钥"
                value={recipientKeyText}
                onChange={(e) => setRecipientKeyText(e.target.value)}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              当前 {recipientCount} 个收件人。{recipientKeyText && !isHajimiPublicKey(recipientKeyText.split(/[\n,]+/)[0].trim())
                ? '检测到可能的格式问题，请确认前缀为 hajimi'
                : ''}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">从密钥中心选择收件人</label>
            {keys.length === 0 ? (
              <div className="rounded-md border border-dashed border-gray-300 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                暂无本地密钥，可去密钥中心创建。
              </div>
            ) : (
              <div className="space-y-2">
                {keys.map((entry) => {
                  const checked = selectedRecipients.includes(entry.publicKeyBech32);
                  return (
                    <label key={entry.id} className="flex items-center gap-2 text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          const next = e.target.checked
                            ? [...selectedRecipients, entry.publicKeyBech32]
                            : selectedRecipients.filter((kid) => kid !== entry.publicKeyBech32);
                          setSelectedRecipients(next);
                        }}
                      />
                      <span className="font-mono text-xs break-all">{entry.publicKeyBech32}</span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <Type className="w-4 h-4" />
              标题
            </label>
            <div className="relative mt-1">
              <input
                type="text"
                id="title"
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-3 border pr-16"
                placeholder="例如：周五会议纪要"
                value={title}
                onChange={handleTitleChange}
              />
              <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <span className={`text-xs ${title.length >= TITLE_LIMIT ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                  {title.length}/{TITLE_LIMIT}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
              <FileText className="w-4 h-4" />
              内容
            </label>
            <div className="relative mt-1">
              <textarea
                id="content"
                rows={10}
                className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-3 border pb-8"
                placeholder="在此输入需要加密的敏感内容..."
                value={content}
                onChange={handleContentChange}
              />
              <div className="absolute bottom-2 right-3 pointer-events-none">
                <span className={`text-xs ${content.length >= CONTENT_LIMIT ? 'text-red-500 font-medium' : 'text-gray-400'}`}>
                  {content.length}/{CONTENT_LIMIT}
                </span>
              </div>
            </div>
          </div>

          {error ? (
            <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          ) : null}

          {output ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">加密结果（JSON）</span>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleCopy}
                      className="inline-flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700"
                    >
                      <Copy className="w-4 h-4" />
                      复制密文
                    </button>
                    {!shareUrl && (
                      <button
                        type="button"
                        onClick={handleShare}
                        disabled={isBusy}
                        className="inline-flex items-center gap-1 text-sm text-green-600 hover:text-green-700 disabled:opacity-50"
                      >
                        <Share2 className="w-4 h-4" />
                        以链接分享
                      </button>
                    )}
                  </div>
                </div>
                <textarea
                  readOnly
                  rows={8}
                  className="w-full rounded-md border border-gray-200 bg-gray-50 p-3 font-mono text-xs"
                  value={output}
                />
              </div>

              {shareUrl && (
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
                          onClick={handleCopyShareUrl}
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
              )}
            </div>
          ) : null}

          <div className="pt-4 flex justify-end">
            <button
              type="button"
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors disabled:opacity-60"
              onClick={handleEncrypt}
              disabled={isBusy}
            >
              <Send className="w-5 h-5 mr-2" />
              {isBusy ? (shareUrl ? '正在分享...' : '加密中...') : '生成加密消息'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
