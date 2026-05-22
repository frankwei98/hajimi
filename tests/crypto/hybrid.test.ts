import { describe, expect, it } from 'vitest';
import { x25519 } from '@noble/curves/ed25519.js';
import { encryptForRecipients } from '../../src/lib/crypto/hybrid/encrypt';
import { decryptForRecipient } from '../../src/lib/crypto/hybrid/decrypt';
import { encodeBech32PublicKey } from '../../src/lib/crypto/x25519';
import { HYBRID_VERSION, HYBRID_ALG, type HybridEnvelope } from '../../src/lib/crypto/hybrid/types';

function makeRecipient() {
  const { secretKey, publicKey } = x25519.keygen();
  return {
    privateKey: secretKey,
    publicKey,
    kid: encodeBech32PublicKey(publicKey),
  };
}

describe('hybrid encrypt/decrypt', () => {
  it('single recipient round-trip', async () => {
    const recipient = makeRecipient();
    const plaintext = new TextEncoder().encode('你好，这是一条加密消息');

    const envelope = await encryptForRecipients(plaintext, [
      { kid: recipient.kid, publicKeyBytes: recipient.publicKey },
    ]);

    expect(envelope.v).toBe(HYBRID_VERSION);
    expect(envelope.alg).toBe(HYBRID_ALG);
    expect(envelope.recipients).toHaveLength(1);
    expect(envelope.recipients[0].kid).toBe(recipient.kid);

    const decrypted = await decryptForRecipient(envelope, recipient.privateKey);
    expect(new TextDecoder().decode(decrypted)).toBe('你好，这是一条加密消息');
  });

  it('multiple recipients can each decrypt', async () => {
    const r1 = makeRecipient();
    const r2 = makeRecipient();
    const r3 = makeRecipient();
    const plaintext = new TextEncoder().encode('multi-recipient message');

    const envelope = await encryptForRecipients(plaintext, [
      { kid: r1.kid, publicKeyBytes: r1.publicKey },
      { kid: r2.kid, publicKeyBytes: r2.publicKey },
      { kid: r3.kid, publicKeyBytes: r3.publicKey },
    ]);

    expect(envelope.recipients).toHaveLength(3);

    const d1 = await decryptForRecipient(envelope, r1.privateKey);
    const d2 = await decryptForRecipient(envelope, r2.privateKey);
    const d3 = await decryptForRecipient(envelope, r3.privateKey);

    const expected = 'multi-recipient message';
    expect(new TextDecoder().decode(d1)).toBe(expected);
    expect(new TextDecoder().decode(d2)).toBe(expected);
    expect(new TextDecoder().decode(d3)).toBe(expected);
  });

  it('non-recipient cannot decrypt', async () => {
    const recipient = makeRecipient();
    const outsider = makeRecipient();
    const plaintext = new TextEncoder().encode('secret');

    const envelope = await encryptForRecipients(plaintext, [
      { kid: recipient.kid, publicKeyBytes: recipient.publicKey },
    ]);

    await expect(decryptForRecipient(envelope, outsider.privateKey)).rejects.toThrow(
      '未找到匹配的接收者条目',
    );
  });

  it('rejects empty recipients', async () => {
    const plaintext = new TextEncoder().encode('test');
    await expect(encryptForRecipients(plaintext, [])).rejects.toThrow('至少需要一个接收者公钥');
  });

  it('each message produces different ciphertext', async () => {
    const recipient = makeRecipient();
    const plaintext = new TextEncoder().encode('same text');
    const recipients = [{ kid: recipient.kid, publicKeyBytes: recipient.publicKey }];

    const e1 = await encryptForRecipients(plaintext, recipients);
    const e2 = await encryptForRecipients(plaintext, recipients);

    expect(e1.ciphertext).not.toBe(e2.ciphertext);
    expect(e1.epk).not.toBe(e2.epk);
    expect(e1.recipients[0].salt).not.toBe(e2.recipients[0].salt);
  });

  it('envelope contains valid base64url in all fields', async () => {
    const recipient = makeRecipient();
    const plaintext = new TextEncoder().encode('test');

    const envelope = await encryptForRecipients(plaintext, [
      { kid: recipient.kid, publicKeyBytes: recipient.publicKey },
    ]);

    const base64UrlPattern = /^[A-Za-z0-9_-]+$/;
    expect(envelope.epk).toMatch(base64UrlPattern);
    expect(envelope.nonce).toMatch(base64UrlPattern);
    expect(envelope.ciphertext).toMatch(base64UrlPattern);

    for (const r of envelope.recipients) {
      expect(r.salt).toMatch(base64UrlPattern);
      expect(r.wrapNonce).toMatch(base64UrlPattern);
      expect(r.encCEK).toMatch(base64UrlPattern);
    }
  });

  it('encrypts large payload', async () => {
    const recipient = makeRecipient();
    const largeText = 'x'.repeat(100_000);
    const plaintext = new TextEncoder().encode(largeText);

    const envelope = await encryptForRecipients(plaintext, [
      { kid: recipient.kid, publicKeyBytes: recipient.publicKey },
    ]);

    const decrypted = await decryptForRecipient(envelope, recipient.privateKey);
    expect(new TextDecoder().decode(decrypted)).toBe(largeText);
  });

  it('decrypts with explicit recipientKid', async () => {
    const recipient = makeRecipient();
    const plaintext = new TextEncoder().encode('explicit kid test');

    const envelope = await encryptForRecipients(plaintext, [
      { kid: recipient.kid, publicKeyBytes: recipient.publicKey },
    ]);

    const decrypted = await decryptForRecipient(envelope, recipient.privateKey, recipient.kid);
    expect(new TextDecoder().decode(decrypted)).toBe('explicit kid test');
  });

  it('rejects mismatched version', async () => {
    const recipient = makeRecipient();
    const envelope = await encryptForRecipients(
      new TextEncoder().encode('test'),
      [{ kid: recipient.kid, publicKeyBytes: recipient.publicKey }],
    );

    const bad: HybridEnvelope = { ...envelope, v: 99 as typeof HYBRID_VERSION };
    await expect(decryptForRecipient(bad, recipient.privateKey)).rejects.toThrow('不支持的版本');
  });

  it('rejects mismatched algorithm', async () => {
    const recipient = makeRecipient();
    const envelope = await encryptForRecipients(
      new TextEncoder().encode('test'),
      [{ kid: recipient.kid, publicKeyBytes: recipient.publicKey }],
    );

    const bad: HybridEnvelope = { ...envelope, alg: 'wrong-alg' as typeof HYBRID_ALG };
    await expect(decryptForRecipient(bad, recipient.privateKey)).rejects.toThrow('不支持的算法');
  });

  it('decrypts empty plaintext', async () => {
    const recipient = makeRecipient();
    const plaintext = new Uint8Array(0);

    const envelope = await encryptForRecipients(plaintext, [
      { kid: recipient.kid, publicKeyBytes: recipient.publicKey },
    ]);

    const decrypted = await decryptForRecipient(envelope, recipient.privateKey);
    expect(decrypted).toEqual(new Uint8Array(0));
  });

  it('encrypts binary payload (non-UTF8)', async () => {
    const recipient = makeRecipient();
    const plaintext = new Uint8Array([0, 1, 2, 255, 254, 253, 128, 127]);

    const envelope = await encryptForRecipients(plaintext, [
      { kid: recipient.kid, publicKeyBytes: recipient.publicKey },
    ]);

    const decrypted = await decryptForRecipient(envelope, recipient.privateKey);
    expect(decrypted).toEqual(plaintext);
  });
});
