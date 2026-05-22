import { describe, expect, it } from 'vitest';
import { encryptPrivateKey, decryptPrivateKey } from '../../src/lib/crypto/vault/keyOps';
import { encryptExportPayload, decryptExportPayload } from '../../src/lib/crypto/vault/exportOps';
import { KDF_ITERATIONS } from '../../src/lib/crypto/vault/constants';
import type { StoredKey } from '../../src/lib/storage/types';

describe('vault key encryption/decryption', () => {
  it('round-trips a private key with correct PIN', async () => {
    const privateKey = crypto.getRandomValues(new Uint8Array(32));
    const pin = 'my-secret-pin-123';

    const encrypted = await encryptPrivateKey(privateKey, pin);

    expect(encrypted.encryptedPrivateKey).toBeTruthy();
    expect(encrypted.iv).toBeTruthy();
    expect(encrypted.salt).toBeTruthy();
    expect(encrypted.kdfIterations).toBe(KDF_ITERATIONS);

    // Build a StoredKey-like object
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
    const encrypted = await encryptPrivateKey(privateKey, 'correct-pin');

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

    await expect(decryptPrivateKey(storedKey, 'wrong-pin')).rejects.toThrow();
  });

  it('produces different ciphertext for same key and PIN (randomized IV/salt)', async () => {
    const privateKey = crypto.getRandomValues(new Uint8Array(32));
    const pin = 'same-pin';

    const e1 = await encryptPrivateKey(privateKey, pin);
    const e2 = await encryptPrivateKey(privateKey, pin);

    expect(e1.encryptedPrivateKey).not.toBe(e2.encryptedPrivateKey);
    expect(e1.iv).not.toBe(e2.iv);
    expect(e1.salt).not.toBe(e2.salt);
  });

  it('fails when encryptedPrivateKey is corrupted', async () => {
    const privateKey = crypto.getRandomValues(new Uint8Array(32));
    const encrypted = await encryptPrivateKey(privateKey, 'test');

    const storedKey: StoredKey = {
      id: 'test-key',
      publicKeyBech32: 'hajimi1test',
      publicKeyHex: '0000',
      encryptedPrivateKey: 'AAAA' + encrypted.encryptedPrivateKey.slice(4),
      iv: encrypted.iv,
      salt: encrypted.salt,
      kdfIterations: encrypted.kdfIterations,
      source: 'webcrypto',
      createdAt: new Date().toISOString(),
    };

    await expect(decryptPrivateKey(storedKey, 'test')).rejects.toThrow();
  });

  it('fails when iv is corrupted', async () => {
    const privateKey = crypto.getRandomValues(new Uint8Array(32));
    const encrypted = await encryptPrivateKey(privateKey, 'test');

    const storedKey: StoredKey = {
      id: 'test-key',
      publicKeyBech32: 'hajimi1test',
      publicKeyHex: '0000',
      encryptedPrivateKey: encrypted.encryptedPrivateKey,
      iv: 'AAAA' + encrypted.iv.slice(4),
      salt: encrypted.salt,
      kdfIterations: encrypted.kdfIterations,
      source: 'webcrypto',
      createdAt: new Date().toISOString(),
    };

    await expect(decryptPrivateKey(storedKey, 'test')).rejects.toThrow();
  });

  it('fails when salt is corrupted', async () => {
    const privateKey = crypto.getRandomValues(new Uint8Array(32));
    const encrypted = await encryptPrivateKey(privateKey, 'test');

    const storedKey: StoredKey = {
      id: 'test-key',
      publicKeyBech32: 'hajimi1test',
      publicKeyHex: '0000',
      encryptedPrivateKey: encrypted.encryptedPrivateKey,
      iv: encrypted.iv,
      salt: 'AAAA' + encrypted.salt.slice(4),
      kdfIterations: encrypted.kdfIterations,
      source: 'webcrypto',
      createdAt: new Date().toISOString(),
    };

    await expect(decryptPrivateKey(storedKey, 'test')).rejects.toThrow();
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
          createdAt: Date.now(),
        },
      ],
      exportedAt: new Date().toISOString(),
      version: 1,
    };
    const passphrase = 'export-passphrase-456';

    const exported = await encryptExportPayload(payload, passphrase);

    expect(exported.version).toBeTruthy();
    expect(exported.kdfIterations).toBe(KDF_ITERATIONS);
    expect(exported.salt).toBeTruthy();
    expect(exported.iv).toBeTruthy();
    expect(exported.data).toBeTruthy();

    const decrypted = await decryptExportPayload(exported, passphrase);
    expect(decrypted.keys).toHaveLength(1);
    expect(decrypted.keys[0].publicKeyBech32).toBe('hajimi1abc');
    expect(decrypted.version).toBe(1);
  });

  it('fails with wrong passphrase', async () => {
    const payload = { test: true };
    const exported = await encryptExportPayload(payload, 'correct');

    await expect(decryptExportPayload(exported, 'wrong')).rejects.toThrow();
  });
});
