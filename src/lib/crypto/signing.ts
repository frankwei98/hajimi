import { bech32 } from "bech32";
import { ed25519 } from "@noble/curves/ed25519.js";
import { bytesToBase64Url, base64UrlToBytes, utf8ToBytes } from "./hybrid/encoding";
import type { HybridEnvelope } from "./hybrid/types";

export const SIGNING_PUBLIC_KEY_PREFIX = "hajimisig";

export type Ed25519Keypair = {
  publicSigningKeyBytes: Uint8Array;
  privateSigningKeyBytes: Uint8Array;
  publicSigningKeyBech32: string;
};

export function encodeBech32SigningPublicKey(bytes: Uint8Array) {
  return bech32.encode(SIGNING_PUBLIC_KEY_PREFIX, bech32.toWords(bytes));
}

export function decodeBech32SigningPublicKey(value: string): Uint8Array {
  const decoded = bech32.decode(value.trim());
  if (decoded.prefix !== SIGNING_PUBLIC_KEY_PREFIX) {
    throw new Error(`签名公钥前缀不正确，应为 ${SIGNING_PUBLIC_KEY_PREFIX}`);
  }
  const bytes = new Uint8Array(bech32.fromWords(decoded.words));
  if (bytes.length !== 32) throw new Error("签名公钥长度不正确");
  return bytes;
}

export function ed25519KeypairFromSeed(seed: Uint8Array): Ed25519Keypair {
  const { secretKey, publicKey } = ed25519.keygen(seed);
  return {
    privateSigningKeyBytes: secretKey,
    publicSigningKeyBytes: publicKey,
    publicSigningKeyBech32: encodeBech32SigningPublicKey(publicKey),
  };
}

export function buildRegistrationPayload(handle: string, publicKeyBech32: string, publicSigningKeyBech32: string) {
  return `hajimi-register-v1|handle=${handle}|enc=${publicKeyBech32}|sig=${publicSigningKeyBech32}`;
}

export function buildRevocationPayload(kid: string, revokedAt: number, reason = "") {
  return `hajimi-revoke-v1|kid=${kid}|revokedAt=${revokedAt}|reason=${reason}`;
}

export function buildEnvelopeSigningPayload(envelope: HybridEnvelope) {
  return `hajimi-envelope-v1|${JSON.stringify({
    v: envelope.v,
    alg: envelope.alg,
    epk: envelope.epk,
    nonce: envelope.nonce,
    ciphertext: envelope.ciphertext,
    recipients: envelope.recipients,
  })}`;
}

export function signText(message: string, privateSigningKeyBytes: Uint8Array): string {
  return bytesToBase64Url(ed25519.sign(utf8ToBytes(message), privateSigningKeyBytes));
}

export function verifyTextSignature(message: string, signatureBase64Url: string, publicSigningKeyBech32: string): boolean {
  try {
    return ed25519.verify(
      base64UrlToBytes(signatureBase64Url),
      utf8ToBytes(message),
      decodeBech32SigningPublicKey(publicSigningKeyBech32),
      { zip215: false },
    );
  } catch {
    return false;
  }
}

export function signEnvelope(
  envelope: HybridEnvelope,
  senderKid: string,
  publicSigningKeyBech32: string,
  privateSigningKeyBytes: Uint8Array,
): HybridEnvelope {
  return {
    ...envelope,
    sender: {
      kid: senderKid,
      publicSigningKeyBech32,
      signature: signText(buildEnvelopeSigningPayload(envelope), privateSigningKeyBytes),
    },
  };
}

export function verifyEnvelopeSender(envelope: HybridEnvelope): boolean {
  if (!envelope.sender) return false;
  return verifyTextSignature(
    buildEnvelopeSigningPayload(envelope),
    envelope.sender.signature,
    envelope.sender.publicSigningKeyBech32,
  );
}
