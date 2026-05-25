import { describe, expect, it } from 'vitest';
import { bytesToBase64Url, base64UrlToBytes, utf8ToBytes, bytesToUtf8 } from '../../src/lib/crypto/hybrid/encoding';
import { bytesToBase58, base58ToBytes } from '../../src/lib/crypto/hybrid/base58';
import { bytesToEmoji, emojiToBytes } from '../../src/lib/crypto/hybrid/emoji';
import { toHex, bytesToBase64, base64ToBytes } from '../../src/lib/crypto/vault/encoding';

describe('base64url encoding', () => {
  it('round-trips arbitrary bytes', () => {
    const original = new Uint8Array([0, 1, 127, 128, 255, 254, 42]);
    const encoded = bytesToBase64Url(original);
    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');
    expect(encoded).not.toContain('=');
    const decoded = base64UrlToBytes(encoded);
    expect(decoded).toEqual(original);
  });

  it('handles empty input', () => {
    expect(bytesToBase64Url(new Uint8Array(0))).toBe('');
    expect(base64UrlToBytes('')).toEqual(new Uint8Array(0));
  });

  it('round-trips all 256 byte values', () => {
    const allBytes = new Uint8Array(256);
    for (let i = 0; i < 256; i++) allBytes[i] = i;
    const encoded = bytesToBase64Url(allBytes);
    const decoded = base64UrlToBytes(encoded);
    expect(decoded).toEqual(allBytes);
  });
});

describe('base64 encoding (vault)', () => {
  it('round-trips arbitrary bytes', () => {
    const original = new Uint8Array([72, 101, 108, 108, 111]);
    const encoded = bytesToBase64(original);
    expect(encoded).toBe('SGVsbG8=');
    const decoded = base64ToBytes(encoded);
    expect(decoded).toEqual(original);
  });
});

describe('utf8 encoding', () => {
  it('round-trips ASCII text', () => {
    const text = 'Hello, Hajimi!';
    expect(bytesToUtf8(utf8ToBytes(text))).toBe(text);
  });

  it('round-trips Chinese text', () => {
    const text = '你好世界';
    expect(bytesToUtf8(utf8ToBytes(text))).toBe(text);
  });

  it('round-trips emoji', () => {
    const text = '🔐🔑';
    expect(bytesToUtf8(utf8ToBytes(text))).toBe(text);
  });
});

describe('base58 encoding', () => {
  it('round-trips arbitrary bytes', () => {
    const original = new Uint8Array([1, 2, 3, 4, 5, 0, 0, 9, 10]);
    const encoded = bytesToBase58(original);
    const decoded = base58ToBytes(encoded);
    expect(decoded).toEqual(original);
  });

  it('handles leading zeros', () => {
    const original = new Uint8Array([0, 0, 0, 1, 2]);
    const encoded = bytesToBase58(original);
    expect(encoded.startsWith('111')).toBe(true);
    const decoded = base58ToBytes(encoded);
    expect(decoded).toEqual(original);
  });

  it('round-trips all-zero bytes', () => {
    const original = new Uint8Array([0, 0, 0]);
    const encoded = bytesToBase58(original);
    expect(encoded).toBe('111');
    expect(base58ToBytes(encoded)).toEqual(original);
  });

  it('handles empty input', () => {
    expect(bytesToBase58(new Uint8Array(0))).toBe('');
    expect(base58ToBytes('')).toEqual(new Uint8Array(0));
  });

  it('throws on invalid base58 character', () => {
    expect(() => base58ToBytes('0OIl')).toThrow();
  });
});

describe('emoji encoding', () => {
  it('round-trips single bytes', () => {
    const original = new Uint8Array([0, 1, 255]);
    const encoded = bytesToEmoji(original);
    expect(typeof encoded).toBe('string');
    const decoded = emojiToBytes(encoded);
    expect(decoded).toEqual(original);
  });

  it('round-trips all 256 byte values', () => {
    const allBytes = new Uint8Array(256);
    for (let i = 0; i < 256; i++) allBytes[i] = i;
    const encoded = bytesToEmoji(allBytes);
    const decoded = emojiToBytes(encoded);
    expect(decoded).toEqual(allBytes);
  });

  it('throws on invalid emoji character', () => {
    expect(() => emojiToBytes('A')).toThrow('无效的 Emoji 字符');
  });
});

describe('hex encoding (vault)', () => {
  it('converts bytes to hex', () => {
    expect(toHex(new Uint8Array([0, 15, 255]))).toBe('000fff');
  });

  it('handles empty input', () => {
    expect(toHex(new Uint8Array(0))).toBe('');
  });
});
