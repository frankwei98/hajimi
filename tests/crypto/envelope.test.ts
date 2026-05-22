import { describe, expect, it } from 'vitest';
import { x25519 } from '@noble/curves/ed25519.js';
import {
  parseEnvelope,
  parseAnyEnvelope,
  decodePayload,
  pickMatchingKid,
  envelopeToText,
  envelopeToTextWithFormat,
} from '../../src/lib/crypto/hybrid/utils';
import { encryptForRecipients } from '../../src/lib/crypto/hybrid/encrypt';
import { encodeBech32PublicKey } from '../../src/lib/crypto/x25519';

function makeRecipient() {
  const { secretKey, publicKey } = x25519.keygen();
  return { privateKey: secretKey, publicKey, kid: encodeBech32PublicKey(publicKey) };
}

describe('parseEnvelope', () => {
  it('parses a valid envelope', async () => {
    const recipient = makeRecipient();
    const envelope = await encryptForRecipients(
      new TextEncoder().encode('test'),
      [{ kid: recipient.kid, publicKeyBytes: recipient.publicKey }],
    );
    const json = JSON.stringify(envelope);
    const parsed = parseEnvelope(json);
    expect(parsed.v).toBe(envelope.v);
    expect(parsed.alg).toBe(envelope.alg);
    expect(parsed.epk).toBe(envelope.epk);
    expect(parsed.recipients).toHaveLength(1);
  });

  it('rejects invalid JSON', () => {
    expect(() => parseEnvelope('not json')).toThrow('无法解析 JSON');
  });

  it('rejects non-object', () => {
    expect(() => parseEnvelope('"string"')).toThrow('必须为对象');
  });

  it('rejects wrong version', () => {
    const bad = JSON.stringify({ v: 99, alg: 'X25519-HKDF-SHA256-AES-256-GCM', epk: 'a', nonce: 'b', ciphertext: 'c', recipients: [{ kid: 'k', salt: 's', wrapNonce: 'w', encCEK: 'e' }] });
    expect(() => parseEnvelope(bad)).toThrow('不支持的版本');
  });

  it('rejects wrong algorithm', () => {
    const bad = JSON.stringify({ v: 1, alg: 'wrong', epk: 'a', nonce: 'b', ciphertext: 'c', recipients: [{ kid: 'k', salt: 's', wrapNonce: 'w', encCEK: 'e' }] });
    expect(() => parseEnvelope(bad)).toThrow('不支持的算法');
  });

  it('rejects missing epk', () => {
    const bad = JSON.stringify({ v: 1, alg: 'X25519-HKDF-SHA256-AES-256-GCM', nonce: 'b', ciphertext: 'c', recipients: [{ kid: 'k', salt: 's', wrapNonce: 'w', encCEK: 'e' }] });
    expect(() => parseEnvelope(bad)).toThrow('缺少 epk');
  });

  it('rejects empty recipients', () => {
    const bad = JSON.stringify({ v: 1, alg: 'X25519-HKDF-SHA256-AES-256-GCM', epk: 'a', nonce: 'b', ciphertext: 'c', recipients: [] });
    expect(() => parseEnvelope(bad)).toThrow('缺少 recipients');
  });

  it('rejects missing recipient fields', () => {
    const bad = JSON.stringify({ v: 1, alg: 'X25519-HKDF-SHA256-AES-256-GCM', epk: 'a', nonce: 'b', ciphertext: 'c', recipients: [{ kid: 'k' }] });
    expect(() => parseEnvelope(bad)).toThrow();
  });

  it('rejects empty nonce', () => {
    const bad = JSON.stringify({ v: 1, alg: 'X25519-HKDF-SHA256-AES-256-GCM', epk: 'a', nonce: '', ciphertext: 'c', recipients: [{ kid: 'k', salt: 's', wrapNonce: 'w', encCEK: 'e' }] });
    expect(() => parseEnvelope(bad)).toThrow('缺少 nonce');
  });

  it('rejects empty ciphertext', () => {
    const bad = JSON.stringify({ v: 1, alg: 'X25519-HKDF-SHA256-AES-256-GCM', epk: 'a', nonce: 'b', ciphertext: '', recipients: [{ kid: 'k', salt: 's', wrapNonce: 'w', encCEK: 'e' }] });
    expect(() => parseEnvelope(bad)).toThrow('缺少 ciphertext');
  });

  it('rejects empty epk', () => {
    const bad = JSON.stringify({ v: 1, alg: 'X25519-HKDF-SHA256-AES-256-GCM', epk: '', nonce: 'b', ciphertext: 'c', recipients: [{ kid: 'k', salt: 's', wrapNonce: 'w', encCEK: 'e' }] });
    expect(() => parseEnvelope(bad)).toThrow('缺少 epk');
  });

  it('rejects recipient with empty salt', () => {
    const bad = JSON.stringify({ v: 1, alg: 'X25519-HKDF-SHA256-AES-256-GCM', epk: 'a', nonce: 'b', ciphertext: 'c', recipients: [{ kid: 'k', salt: '', wrapNonce: 'w', encCEK: 'e' }] });
    expect(() => parseEnvelope(bad)).toThrow('salt 缺失');
  });

  it('rejects recipient with empty wrapNonce', () => {
    const bad = JSON.stringify({ v: 1, alg: 'X25519-HKDF-SHA256-AES-256-GCM', epk: 'a', nonce: 'b', ciphertext: 'c', recipients: [{ kid: 'k', salt: 's', wrapNonce: '', encCEK: 'e' }] });
    expect(() => parseEnvelope(bad)).toThrow('wrapNonce 缺失');
  });

  it('rejects recipient with empty encCEK', () => {
    const bad = JSON.stringify({ v: 1, alg: 'X25519-HKDF-SHA256-AES-256-GCM', epk: 'a', nonce: 'b', ciphertext: 'c', recipients: [{ kid: 'k', salt: 's', wrapNonce: 'w', encCEK: '' }] });
    expect(() => parseEnvelope(bad)).toThrow('encCEK 缺失');
  });

  it('rejects recipient with empty kid', () => {
    const bad = JSON.stringify({ v: 1, alg: 'X25519-HKDF-SHA256-AES-256-GCM', epk: 'a', nonce: 'b', ciphertext: 'c', recipients: [{ kid: '', salt: 's', wrapNonce: 'w', encCEK: 'e' }] });
    expect(() => parseEnvelope(bad)).toThrow('kid 缺失');
  });

  it('rejects null input', () => {
    expect(() => parseEnvelope('null')).toThrow('必须为对象');
  });
});

describe('parseAnyEnvelope', () => {
  it('parses JSON format', async () => {
    const recipient = makeRecipient();
    const envelope = await encryptForRecipients(
      new TextEncoder().encode('test'),
      [{ kid: recipient.kid, publicKeyBytes: recipient.publicKey }],
    );
    const json = JSON.stringify(envelope);
    const parsed = parseAnyEnvelope(json);
    expect(parsed.v).toBe(envelope.v);
  });

  it('parses base58 format', async () => {
    const recipient = makeRecipient();
    const envelope = await encryptForRecipients(
      new TextEncoder().encode('test'),
      [{ kid: recipient.kid, publicKeyBytes: recipient.publicKey }],
    );
    const base58Text = envelopeToTextWithFormat(envelope, 'base58');
    const parsed = parseAnyEnvelope(base58Text);
    expect(parsed.v).toBe(envelope.v);
    expect(parsed.epk).toBe(envelope.epk);
  });

  it('parses emoji format', async () => {
    const recipient = makeRecipient();
    const envelope = await encryptForRecipients(
      new TextEncoder().encode('test'),
      [{ kid: recipient.kid, publicKeyBytes: recipient.publicKey }],
    );
    const emojiText = envelopeToTextWithFormat(envelope, 'emoji');
    const parsed = parseAnyEnvelope(emojiText);
    expect(parsed.v).toBe(envelope.v);
    expect(parsed.epk).toBe(envelope.epk);
  });

  it('throws on unrecognizable format', () => {
    expect(() => parseAnyEnvelope('xyz123 not valid at all!!!')).toThrow('无法识别密文格式');
  });

  it('throws on single character input', () => {
    // 'a' is valid base58, so it tries base58 decoding first which fails
    expect(() => parseAnyEnvelope('a')).toThrow();
  });

  it('parses base58 with whitespace trimming', async () => {
    const recipient = makeRecipient();
    const envelope = await encryptForRecipients(
      new TextEncoder().encode('test'),
      [{ kid: recipient.kid, publicKeyBytes: recipient.publicKey }],
    );
    const base58Text = envelopeToTextWithFormat(envelope, 'base58');
    const parsed = parseAnyEnvelope('  ' + base58Text + '  ');
    expect(parsed.epk).toBe(envelope.epk);
  });

  it('throws on base58-encoded garbage', () => {
    // Valid base58 chars but not a valid JSON envelope
    expect(() => parseAnyEnvelope('3vQB7B6MrGQZaxC8')).toThrow('Base58 密文解码失败');
  });
});

describe('decodePayload', () => {
  it('decodes JSON payload with title and content', () => {
    const payload = JSON.stringify({ title: '标题', content: '内容' });
    const bytes = new TextEncoder().encode(payload);
    const result = decodePayload(bytes);
    expect(result.title).toBe('标题');
    expect(result.content).toBe('内容');
    expect(result.raw).toBe(payload);
  });

  it('decodes plain text payload', () => {
    const bytes = new TextEncoder().encode('just plain text');
    const result = decodePayload(bytes);
    expect(result.title).toBeUndefined();
    expect(result.content).toBeUndefined();
    expect(result.raw).toBe('just plain text');
  });

  it('decodes empty bytes', () => {
    const result = decodePayload(new Uint8Array(0));
    expect(result.raw).toBe('');
    expect(result.title).toBeUndefined();
  });

  it('decodes partial JSON payload (only title)', () => {
    const bytes = new TextEncoder().encode(JSON.stringify({ title: 'only title' }));
    const result = decodePayload(bytes);
    expect(result.title).toBe('only title');
    expect(result.content).toBeUndefined();
  });
});

describe('pickMatchingKid', () => {
  it('finds matching kid from available list', async () => {
    const recipient = makeRecipient();
    const envelope = await encryptForRecipients(
      new TextEncoder().encode('test'),
      [{ kid: recipient.kid, publicKeyBytes: recipient.publicKey }],
    );
    const found = pickMatchingKid(envelope, [recipient.kid]);
    expect(found).toBe(recipient.kid);
  });

  it('returns empty string when no match', async () => {
    const recipient = makeRecipient();
    const envelope = await encryptForRecipients(
      new TextEncoder().encode('test'),
      [{ kid: recipient.kid, publicKeyBytes: recipient.publicKey }],
    );
    const found = pickMatchingKid(envelope, ['hajimi1nonexistent00000000000000000000000000000000000000000000']);
    expect(found).toBe('');
  });
});

describe('envelopeToText', () => {
  it('produces valid JSON', async () => {
    const recipient = makeRecipient();
    const envelope = await encryptForRecipients(
      new TextEncoder().encode('test'),
      [{ kid: recipient.kid, publicKeyBytes: recipient.publicKey }],
    );
    const text = envelopeToText(envelope);
    const parsed = JSON.parse(text);
    expect(parsed.v).toBe(envelope.v);
  });

  it('envelopeToTextWithFormat base58 round-trips', async () => {
    const recipient = makeRecipient();
    const envelope = await encryptForRecipients(
      new TextEncoder().encode('test'),
      [{ kid: recipient.kid, publicKeyBytes: recipient.publicKey }],
    );
    const base58 = envelopeToTextWithFormat(envelope, 'base58');
    const parsed = parseAnyEnvelope(base58);
    expect(parsed.epk).toBe(envelope.epk);
  });

  it('envelopeToTextWithFormat emoji round-trips', async () => {
    const recipient = makeRecipient();
    const envelope = await encryptForRecipients(
      new TextEncoder().encode('test'),
      [{ kid: recipient.kid, publicKeyBytes: recipient.publicKey }],
    );
    const emoji = envelopeToTextWithFormat(envelope, 'emoji');
    const parsed = parseAnyEnvelope(emoji);
    expect(parsed.epk).toBe(envelope.epk);
  });
});
