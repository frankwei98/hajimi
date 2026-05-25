import { useParams } from 'react-router-dom';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { useEffect, useState, useCallback } from 'react';
import { useKeyVaultStore } from '../../lib/state/keyVaultStore';
import { parseEnvelope, decryptForRecipient, decodePayload, pickMatchingKid } from '../../lib/crypto/hybrid';
import { hasBackend, requireBackend } from '../../lib/backend/convexClient';
import { verifyEnvelopeSender } from '../../lib/crypto/signing';

type StoredMessage = { body: unknown } & Record<string, unknown>;

export function useMessageDecrypt() {
  const { messageId } = useParams();
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedData, setDecryptedData] = useState<{ title?: string; content?: string; raw: string } | null>(null);
  const [matchedKid, setMatchedKid] = useState('');
  const [message, setMessage] = useState<StoredMessage | null | undefined>(hasBackend ? undefined : null);

  const { isLoaded, isUnlocked, privateKeyByPub, loadKeys } = useKeyVaultStore();

  useEffect(() => {
    loadKeys().catch((err) => console.error('加载密钥失败', err));
  }, [loadKeys]);

  useEffect(() => {
    if (!messageId || !hasBackend) {
      return;
    }
    let cancelled = false;
    requireBackend()
      .query(api.messages.getMessage, { messageId: messageId as Id<'message'> })
      .then((result) => {
        if (!cancelled) setMessage(result as StoredMessage | null);
      })
      .catch((err) => {
        if (!cancelled) {
          setMessage(null);
          setDecryptError(err instanceof Error ? err.message : '读取消息失败');
        }
      });
    return () => {
      cancelled = true;
    };
  }, [messageId]);

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
      if (envelope.sender && !verifyEnvelopeSender(envelope)) {
        throw new Error('发送者签名验证失败');
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

  useEffect(() => {
    if (isUnlocked && message && !decryptedData && !decryptError && !isDecrypting) {
      queueMicrotask(() => {
        void handleDecrypt();
      });
    }
  }, [isUnlocked, message, decryptedData, decryptError, isDecrypting, handleDecrypt]);

  return {
    messageId,
    message,
    isLoaded,
    isUnlocked,
    isDecrypting,
    decryptError,
    decryptedData,
    matchedKid,
  };
}
