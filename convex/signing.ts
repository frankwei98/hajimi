import { bech32 } from "bech32";
import { ed25519 } from "@noble/curves/ed25519.js";

const SIGNING_PUBLIC_KEY_PREFIX = "hajimisig";

function base64UrlToBytes(input: string): Uint8Array {
  const base64 = input.replace(/-/g, "+").replace(/_/g, "/");
  const padLen = (4 - (base64.length % 4)) % 4;
  const bin = atob(base64 + "=".repeat(padLen));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) out[i] = bin.charCodeAt(i);
  return out;
}

function utf8ToBytes(input: string): Uint8Array {
  return new TextEncoder().encode(input);
}

export function decodeBech32SigningPublicKey(value: string): Uint8Array {
  const decoded = bech32.decode(value.trim());
  if (decoded.prefix !== SIGNING_PUBLIC_KEY_PREFIX) throw new Error("签名公钥前缀不正确");
  const bytes = new Uint8Array(bech32.fromWords(decoded.words));
  if (bytes.length !== 32) throw new Error("签名公钥长度不正确");
  return bytes;
}

export function buildRegistrationPayload(handle: string, publicKeyBech32: string, publicSigningKeyBech32: string) {
  return `hajimi-register-v1|handle=${handle}|enc=${publicKeyBech32}|sig=${publicSigningKeyBech32}`;
}

export function buildRevocationPayload(kid: string, revokedAt: number, reason = "") {
  return `hajimi-revoke-v1|kid=${kid}|revokedAt=${revokedAt}|reason=${reason}`;
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
