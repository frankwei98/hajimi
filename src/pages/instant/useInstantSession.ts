import { useState, useEffect, useCallback } from 'react';
import { generateX25519Keypair, type X25519Keypair } from '../../lib/crypto/x25519';
import { parseAnyEnvelope, decryptForRecipient, decodePayload } from '../../lib/crypto/hybrid';
import { parseInstantInput } from './parseInstantInput';
import { fetchEnvelopeFromMessage } from './fetchEnvelopeFromMessage';
import { checkRecipientMatch, assertSignatureValid } from './decryptWithTemporaryKey';

type InstantResult = {
  title?: string;
  content?: string;
  raw: string;
  matchedKid: string;
};

export function useInstantSession() {
  const [keypair, setKeypair] = useState<X25519Keypair | null>(null);
  const [inputText, setInputText] = useState('');
  const [isBusy, setIsBusy] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const [initError, setInitError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InstantResult | null>(null);

  useEffect(() => {
    let cancelled = false;
    generateX25519Keypair()
      .then((kp) => { if (!cancelled) setKeypair(kp); })
      .catch((err) => { if (!cancelled) setInitError(err instanceof Error ? err.message : '密钥生成失败'); })
      .finally(() => { if (!cancelled) setIsGenerating(false); });
    return () => { cancelled = true; };
  }, []);

  const regenerate = useCallback(async () => {
    setResult(null);
    setInputText('');
    setError(null);
    setInitError(null);
    setIsGenerating(true);
    try {
      setKeypair(await generateX25519Keypair());
    } catch (err) {
      setInitError(err instanceof Error ? err.message : '密钥生成失败');
    } finally {
      setIsGenerating(false);
    }
  }, []);

  const handleDecrypt = useCallback(async () => {
    if (!keypair) { setError('临时密钥尚未生成'); return; }
    setError(null);
    setResult(null);

    try {
      setIsBusy(true);
      const parsed = parseInstantInput(inputText);

      const envelope = parsed.type === 'message-link'
        ? await fetchEnvelopeFromMessage(parsed.messageId)
        : parseAnyEnvelope(parsed.text);

      assertSignatureValid(envelope);
      checkRecipientMatch(envelope, keypair.publicKeyBech32);

      const plaintext = await decryptForRecipient(envelope, keypair.privateKeyBytes, keypair.publicKeyBech32);
      const payload = decodePayload(plaintext);

      setResult({
        ...payload,
        matchedKid: keypair.publicKeyBech32,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : '解密失败');
    } finally {
      setIsBusy(false);
    }
  }, [keypair, inputText]);

  return {
    keypair, inputText, setInputText,
    isBusy, isGenerating, initError, error, result,
    regenerate, handleDecrypt,
  };
}
