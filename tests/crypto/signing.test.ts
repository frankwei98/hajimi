import { describe, expect, it } from 'vitest';
import {
  buildRegistrationPayload,
  buildRevocationPayload,
  ed25519KeypairFromSeed,
  signEnvelope,
  signText,
  verifyEnvelopeSender,
  verifyTextSignature,
} from '../../src/lib/crypto/signing';
import { x25519 } from '@noble/curves/ed25519.js';
import { encryptForRecipients } from '../../src/lib/crypto/hybrid/encrypt';
import { encodeBech32PublicKey } from '../../src/lib/crypto/x25519';

describe('Ed25519 signing helpers', () => {
  it('signs and verifies registration payloads', () => {
    const keypair = ed25519KeypairFromSeed(new Uint8Array(32).fill(7));
    const payload = buildRegistrationPayload('alice', 'hajimi1enc', keypair.publicSigningKeyBech32);
    const signature = signText(payload, keypair.privateSigningKeyBytes);

    expect(verifyTextSignature(payload, signature, keypair.publicSigningKeyBech32)).toBe(true);
    expect(verifyTextSignature(payload + '|tampered', signature, keypair.publicSigningKeyBech32)).toBe(false);
  });

  it('signs and verifies revocation payloads', () => {
    const keypair = ed25519KeypairFromSeed(new Uint8Array(32).fill(9));
    const payload = buildRevocationPayload('hajimi1enc', 1_700_000_000_000, '用户主动吊销');
    const signature = signText(payload, keypair.privateSigningKeyBytes);

    expect(verifyTextSignature(payload, signature, keypair.publicSigningKeyBech32)).toBe(true);
    expect(verifyTextSignature(buildRevocationPayload('hajimi1other', 1_700_000_000_000, '用户主动吊销'), signature, keypair.publicSigningKeyBech32)).toBe(false);
  });

  it('signs and verifies hybrid envelopes', async () => {
    const recipient = x25519.keygen();
    const signingKey = ed25519KeypairFromSeed(new Uint8Array(32).fill(11));
    const kid = encodeBech32PublicKey(recipient.publicKey);
    const envelope = await encryptForRecipients(new TextEncoder().encode('secret'), [
      { kid, publicKeyBytes: recipient.publicKey },
    ]);

    const signed = signEnvelope(envelope, kid, signingKey.publicSigningKeyBech32, signingKey.privateSigningKeyBytes);
    expect(verifyEnvelopeSender(signed)).toBe(true);
    const tamperedCiphertext = signed.ciphertext.slice(0, -1) + (signed.ciphertext.endsWith('A') ? 'B' : 'A');
    expect(verifyEnvelopeSender({ ...signed, ciphertext: tamperedCiphertext })).toBe(false);
  });
});
