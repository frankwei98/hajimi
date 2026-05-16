import { useEffect, useState, useCallback } from 'react';
import { decodePayload, decryptForRecipient, parseEnvelope, pickMatchingKid } from '../../lib/crypto/hybrid';
import { useKeyVaultStore } from '../../lib/state/keyVaultStore';

export function useDecrypt() {
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

  const handleUnlock = useCallback(async () => {
    setError(null);
    if (keys.length === 0) { setError('暂无密钥，请先在密钥中心创建'); return; }
    if (pin.length < 6) { setError('请输入 6 位 PIN'); return; }
    try {
      setIsBusy(true);
      await unlockVault(pin);
    } catch (err) {
      setError(err instanceof Error ? err.message : '解锁失败');
    } finally {
      setIsBusy(false);
    }
  }, [keys.length, pin, unlockVault]);

  const handleLock = useCallback(() => {
    lockVault();
    setMatchedKid('');
  }, [lockVault]);

  const handleDecrypt = useCallback(async () => {
    setError(null);
    setResultText('');
    setResultTitle('');
    setResultContent('');
    setMatchedKid('');
    if (!isUnlocked) { setError('请先解锁密钥库'); return; }
    if (!envelopeText.trim()) { setError('请粘贴密文 JSON'); return; }
    try {
      setIsBusy(true);
      const envelope = parseEnvelope(envelopeText);
      const kid = pickMatchingKid(envelope, Object.keys(privateKeyByPub));
      if (!kid) throw new Error('密文中没有匹配本地密钥的接收者');
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
  }, [isUnlocked, envelopeText, privateKeyByPub]);

  const handleCopy = useCallback(async () => {
    if (!resultText) return;
    await navigator.clipboard.writeText(resultText);
  }, [resultText]);

  return {
    pin, setPin, envelopeText, setEnvelopeText,
    resultText, resultTitle, resultContent, matchedKid,
    error, isBusy, isUnlocked, keys,
    handleUnlock, handleLock, handleDecrypt, handleCopy,
  };
}