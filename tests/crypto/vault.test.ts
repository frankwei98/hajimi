import { describe, expect, it } from 'vitest';
import { decryptPrivateKey, encryptPrivateKey, encryptExportPayload, decryptExportPayload, KDF_ITERATIONS, isValidPin } from '../../src/lib/crypto/keyVault';
import type { StoredKey } from '../../src/lib/storage/types';

describe('PIN validation', () => {
  it('accepts exactly 6 digits', () => {
    expect(isValidPin('123456')).toBe(true);
  });

  it('rejects non-digit or wrong-length PIN values', () => {
    expect(isValidPin('12345')).toBe(false);
    expect(isValidPin('1234567')).toBe(false);
    expect(isValidPin('12ab56')).toBe(false);
  });
});

describe('vault key encryption/decryption', () => {
  it('round-trips a private key with correct PIN', async () => {
    const privateKey = crypto.getRandomValues(new Uint8Array(32));
    const pin = '123456';

    const encrypted = await encryptPrivateKey(privateKey, pin);

    expect(encrypted.encryptedPrivateKey).toBeTruthy();
    expect(encrypted.iv).toBeTruthy();
    expect(encrypted.salt).toBeTruthy();
    expect(encrypted.kdfIterations).toBe(KDF_ITERATIONS);

    const storedKey: StoredKey = {
      id: 'test-key',
      publicKeyBech32: 'hajimi1test',
      publicKeyHex: '0000',
      encryptedPrivateKey: encrypted.encryptedPrivateKey,
      iv: encrypted.iv,
      salt: encrypted.salt,
      kdfIterations: encrypted.kdfIterations,
      source: 'webcrypto',
      label: 'test',
      createdAt: new Date().toISOString(),
    };

    const decrypted = await decryptPrivateKey(storedKey, pin);
    expect(decrypted).toEqual(privateKey);
  });

  it('fails with wrong PIN', async () => {
    const privateKey = crypto.getRandomValues(new Uint8Array(32));
    const encrypted = await encryptPrivateKey(privateKey, '123456');

    const storedKey: StoredKey = {
      id: 'test-key',
      publicKeyBech32: 'hajimi1test',
      publicKeyHex: '0000',
      encryptedPrivateKey: encrypted.encryptedPrivateKey,
      iv: encrypted.iv,
      salt: encrypted.salt,
      kdfIterations: encrypted.kdfIterations,
      source: 'webcrypto',
      label: 'test',
      createdAt: new Date().toISOString(),
    };

    await expect(decryptPrivateKey(storedKey, '654321')).rejects.toThrow();
  });

  it('fails when PIN is not exactly 6 digits', async () => {
    const privateKey = crypto.getRandomValues(new Uint8Array(32));

    await expect(encryptPrivateKey(privateKey, 'test')).rejects.toThrow('PIN 必须为 6 位数字');
    await expect(encryptPrivateKey(privateKey, '12345')).rejects.toThrow('PIN 必须为 6 位数字');
  });

  it('produces different ciphertext for same key and PIN', async () => {
    const privateKey = crypto.getRandomValues(new Uint8Array(32));
    const pin = '123456';

    const e1 = await encryptPrivateKey(privateKey, pin);
    const e2 = await encryptPrivateKey(privateKey, pin);

    expect(e1.encryptedPrivateKey).not.toBe(e2.encryptedPrivateKey);
    expect(e1.iv).not.toBe(e2.iv);
    expect(e1.salt).not.toBe(e2.salt);
  });
});

describe('export payload encryption/decryption', () => {
  it('round-trips an export payload', async () => {
    const payload = {
      keys: [
        {
          id: 'key-1',
          publicKeyBech32: 'hajimi1abc',
          encryptedPrivateKey: 'enc-data',
          iv: 'iv-data',
          salt: 'salt-data',
          kdfIterations: KDF_ITERATIONS,
          label: 'my key',
          createdAt: new Date().toISOString(),
        },
      ],
      exportedAt: new Date().toISOString(),
      version: 1,
    };

    const exported = await encryptExportPayload(payload, '123456');

    expect(exported.version).toBeTruthy();
    expect(exported.kdfIterations).toBe(KDF_ITERATIONS);
    expect(exported.salt).toBeTruthy();
    expect(exported.iv).toBeTruthy();
    expect(exported.data).toBeTruthy();

    const decrypted = await decryptExportPayload(exported, '123456');
    expect(decrypted.keys).toHaveLength(1);
    expect(decrypted.keys[0].publicKeyBech32).toBe('hajimi1abc');
    expect(decrypted.version).toBe(1);
  });

  it('fails with wrong passphrase', async () => {
    const payload = { test: true };
    const exported = await encryptExportPayload(payload, '123456');

    await expect(decryptExportPayload(exported, '654321')).rejects.toThrow();
  });
});
