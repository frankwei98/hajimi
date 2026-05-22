import { describe, expect, it, vi } from 'vitest';
import {
  aesGcmEncrypt,
  aesGcmDecrypt,
  hkdfSha256,
  buildMessageAad,
  buildWrapAad,
  AAD_PREFIX,
  assertSubtle,
} from '../../src/lib/crypto/hybrid/primitives';

describe('AES-GCM encrypt/decrypt', () => {
  it('round-trips plaintext', async () => {
    const key = crypto.getRandomValues(new Uint8Array(32));
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode('hello hajimi');

    const ciphertext = await aesGcmEncrypt(key, nonce, plaintext);
    expect(ciphertext).not.toEqual(plaintext);

    const decrypted = await aesGcmDecrypt(key, nonce, ciphertext);
    expect(decrypted).toEqual(plaintext);
  });

  it('round-trips with AAD', async () => {
    const key = crypto.getRandomValues(new Uint8Array(32));
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode('secret message');
    const aad = new TextEncoder().encode('context');

    const ciphertext = await aesGcmEncrypt(key, nonce, plaintext, aad);
    const decrypted = await aesGcmDecrypt(key, nonce, ciphertext, aad);
    expect(decrypted).toEqual(plaintext);
  });

  it('fails with wrong AAD', async () => {
    const key = crypto.getRandomValues(new Uint8Array(32));
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode('secret');
    const aad = new TextEncoder().encode('correct-context');
    const wrongAad = new TextEncoder().encode('wrong-context');

    const ciphertext = await aesGcmEncrypt(key, nonce, plaintext, aad);
    await expect(aesGcmDecrypt(key, nonce, ciphertext, wrongAad)).rejects.toThrow();
  });

  it('fails with wrong key', async () => {
    const key1 = crypto.getRandomValues(new Uint8Array(32));
    const key2 = crypto.getRandomValues(new Uint8Array(32));
    const nonce = crypto.getRandomValues(new Uint8Array(12));
    const plaintext = new TextEncoder().encode('secret');

    const ciphertext = await aesGcmEncrypt(key1, nonce, plaintext);
    await expect(aesGcmDecrypt(key2, nonce, ciphertext)).rejects.toThrow();
  });
});

describe('HKDF-SHA256', () => {
  it('derives key material of requested length', async () => {
    const ikm = crypto.getRandomValues(new Uint8Array(32));
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const info = new TextEncoder().encode('test-info');

    const derived = await hkdfSha256(ikm, salt, info, 32);
    expect(derived).toHaveLength(32);
  });

  it('produces deterministic output for same inputs', async () => {
    const ikm = new Uint8Array([1, 2, 3, 4, 5, 6, 7, 8]);
    const salt = new Uint8Array([9, 10]);
    const info = new TextEncoder().encode('test');

    const d1 = await hkdfSha256(ikm, salt, info, 32);
    const d2 = await hkdfSha256(ikm, salt, info, 32);
    expect(d1).toEqual(d2);
  });

  it('produces different output for different info strings', async () => {
    const ikm = new Uint8Array(32);
    const salt = new Uint8Array(16);

    const d1 = await hkdfSha256(ikm, salt, new TextEncoder().encode('info-a'), 32);
    const d2 = await hkdfSha256(ikm, salt, new TextEncoder().encode('info-b'), 32);
    expect(d1).not.toEqual(d2);
  });
});

describe('AAD construction', () => {
  it('buildMessageAad includes correct prefix and suffix', () => {
    const aad = buildMessageAad(1, 'X25519-HKDF-SHA256-AES-256-GCM', 'epk123');
    const text = new TextDecoder().decode(aad);
    expect(text).toBe(`${AAD_PREFIX}|v=1|alg=X25519-HKDF-SHA256-AES-256-GCM|epk=epk123|msg`);
  });

  it('buildWrapAad includes kid and wrap suffix', () => {
    const aad = buildWrapAad(1, 'X25519-HKDF-SHA256-AES-256-GCM', 'epk123', 'kid456');
    const text = new TextDecoder().decode(aad);
    expect(text).toBe(`${AAD_PREFIX}|v=1|alg=X25519-HKDF-SHA256-AES-256-GCM|epk=epk123|kid=kid456|wrap`);
  });

  it('message and wrap AADs are different', () => {
    const msg = buildMessageAad(1, 'alg', 'epk');
    const wrap = buildWrapAad(1, 'alg', 'epk', 'kid');
    expect(msg).not.toEqual(wrap);
  });
});

describe('assertSubtle', () => {
  it('does not throw when crypto.subtle is available', () => {
    expect(() => assertSubtle()).not.toThrow();
  });

  it('throws when crypto.subtle is missing', () => {
    const original = globalThis.crypto;
    vi.stubGlobal('crypto', { getRandomValues: original.getRandomValues.bind(original) });
    try {
      expect(() => assertSubtle()).toThrow('不支持 WebCrypto');
    } finally {
      vi.stubGlobal('crypto', original);
    }
  });
});
