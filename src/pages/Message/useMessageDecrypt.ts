import { useParams } from 'react-router-dom';
import { useQuery } from 'convex/react';
import { api } from '../../../convex/_generated/api';
import type { Id } from '../../../convex/_generated/dataModel';
import { useEffect, useState, useCallback } from 'react';
import { useKeyVaultStore } from '../../lib/state/keyVaultStore';
import { parseEnvelope, decryptForRecipient, decodePayload, pickMatchingKid } from '../../lib/crypto/hybrid';

export function useMessageDecrypt() {
  const { messageId } = useParams();
  const [decryptError, setDecryptError] = useState<string | null>(null);
  const [isDecrypting, setIsDecrypting] = useState(false);
  const [decryptedData, setDecryptedData] = useState<{ title?: string; content?: string; raw: string } | null>(null);
  const [matchedKid, setMatchedKid] = useState('');

  const { isLoaded, isUnlocked, privateKeyByPub, loadKeys } = useKeyVaultStore();

  useEffect(() => {
    loadKeys().catch(() => undefined);
  }, [loadKeys]);

  const message = useQuery(api.messages.getMessage, {
    messageId: messageId as Id<'message'>,
  });

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

  useEffect(() => {
    if (isUnlocked && message && !decryptedData && !decryptError && !isDecrypting) {
      handleDecrypt();
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