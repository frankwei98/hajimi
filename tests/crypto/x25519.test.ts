import { describe, expect, it } from 'vitest';
import { bech32 } from 'bech32';
import {
  generateX25519Keypair,
  encodeBech32PublicKey,
  decodeBech32PublicKey,
  isHajimiPublicKey,
  PUBLIC_KEY_PREFIX,
} from '../../src/lib/crypto/x25519';

describe('bech32 encoding', () => {
  it('round-trips a 32-byte public key', async () => {
    const kp = await generateX25519Keypair();
    expect(kp.publicKeyBech32).toMatch(new RegExp(`^${PUBLIC_KEY_PREFIX}1`));
    const decoded = decodeBech32PublicKey(kp.publicKeyBech32);
    expect(decoded).toEqual(kp.publicKeyBytes);
  });

  it('rejects wrong prefix', () => {
    const validData = new Uint8Array(32);
    const otherPrefix = bech32.encode('other', bech32.toWords(validData));
    expect(() => decodeBech32PublicKey(otherPrefix)).toThrow('公钥前缀不正确');
  });

  it('rejects wrong length', () => {
    // Encode a short payload (16 bytes instead of 32)
    const short = encodeBech32PublicKey(new Uint8Array(16));
    expect(() => decodeBech32PublicKey(short)).toThrow('公钥长度不正确');
  });

  it('isHajimiPublicKey returns true for valid key', async () => {
    const kp = await generateX25519Keypair();
    expect(isHajimiPublicKey(kp.publicKeyBech32)).toBe(true);
  });

  it('isHajimiPublicKey returns false for invalid input', () => {
    expect(isHajimiPublicKey('not-a-key')).toBe(false);
    expect(isHajimiPublicKey('')).toBe(false);
  });
});

describe('X25519 key generation', () => {
  it('generates a valid keypair', async () => {
    const kp = await generateX25519Keypair();
    expect(kp.publicKeyBytes).toHaveLength(32);
    expect(kp.privateKeyBytes).toHaveLength(32);
    expect(kp.publicKeyBech32).toMatch(new RegExp(`^${PUBLIC_KEY_PREFIX}1`));
    expect(['webcrypto', 'noble']).toContain(kp.source);
  });

  it('generates unique keypairs', async () => {
    const kp1 = await generateX25519Keypair();
    const kp2 = await generateX25519Keypair();
    expect(kp1.publicKeyBytes).not.toEqual(kp2.publicKeyBytes);
    expect(kp1.privateKeyBytes).not.toEqual(kp2.privateKeyBytes);
  });
});
