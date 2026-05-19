import { utf8ToBytes } from "./encoding";

export const AAD_PREFIX = "hajimi-hybrid";

export function assertSubtle() {
  if (!globalThis.crypto?.subtle) {
    throw new Error("当前环境不支持 WebCrypto");
  }
}

export function buildMessageAad(version: number, alg: string, epk: string): Uint8Array {
  return utf8ToBytes(`${AAD_PREFIX}|v=${version}|alg=${alg}|epk=${epk}|msg`);
}

export function buildWrapAad(version: number, alg: string, epk: string, kid: string): Uint8Array {
  return utf8ToBytes(`${AAD_PREFIX}|v=${version}|alg=${alg}|epk=${epk}|kid=${kid}|wrap`);
}

export async function importAesKey(keyBytes: Uint8Array) {
  assertSubtle();
  return crypto.subtle.importKey(
    "raw",
    keyBytes as BufferSource,
    "AES-GCM",
    false,
    ["encrypt", "decrypt"],
  );
}

export async function aesGcmEncrypt(
  keyBytes: Uint8Array,
  nonce: Uint8Array,
  plaintext: Uint8Array,
  additionalData?: Uint8Array,
): Promise<Uint8Array> {
  const key = await importAesKey(keyBytes);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: nonce as BufferSource, additionalData: additionalData as BufferSource },
    key,
    plaintext as BufferSource,
  );
  return new Uint8Array(ciphertext);
}

export async function aesGcmDecrypt(
  keyBytes: Uint8Array,
  nonce: Uint8Array,
  ciphertext: Uint8Array,
  additionalData?: Uint8Array,
): Promise<Uint8Array> {
  const key = await importAesKey(keyBytes);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: nonce as BufferSource, additionalData: additionalData as BufferSource },
    key,
    ciphertext as BufferSource,
  );
  return new Uint8Array(plaintext);
}

export async function hkdfSha256(
  ikm: Uint8Array,
  salt: Uint8Array,
  info: Uint8Array,
  length: number,
): Promise<Uint8Array> {
  assertSubtle();
  const key = await crypto.subtle.importKey("raw", ikm as BufferSource, "HKDF", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits(
    { name: "HKDF", hash: "SHA-256", salt: salt as BufferSource, info: info as BufferSource },
    key,
    length * 8,
  );
  return new Uint8Array(bits);
}