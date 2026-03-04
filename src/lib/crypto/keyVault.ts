import type { StoredKey } from "../storage/types";

export const KDF_ITERATIONS = 150_000;
export const EXPORT_VERSION = 1;

export function toHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((b) => {
    binary += String.fromCharCode(b);
  });
  return btoa(binary);
}

function base64ToBytes(base64: string) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function deriveAesKey(
  passphrase: string,
  salt: Uint8Array,
  iterations: number,
) {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: salt as unknown as BufferSource,
      iterations,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptPrivateKey(
  privateKeyBytes: Uint8Array,
  passphrase: string,
) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveAesKey(passphrase, salt, KDF_ITERATIONS);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as unknown as BufferSource },
    key,
    privateKeyBytes as unknown as BufferSource,
  );
  return {
    encryptedPrivateKey: bytesToBase64(new Uint8Array(ciphertext)),
    iv: bytesToBase64(iv),
    salt: bytesToBase64(salt),
    kdfIterations: KDF_ITERATIONS,
  };
}

export async function decryptPrivateKey(entry: StoredKey, passphrase: string) {
  const iv = base64ToBytes(entry.iv);
  const salt = base64ToBytes(entry.salt);
  const key = await deriveAesKey(passphrase, salt, entry.kdfIterations);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as unknown as BufferSource },
    key,
    base64ToBytes(entry.encryptedPrivateKey) as unknown as BufferSource,
  );
  return new Uint8Array(plaintext);
}

export async function encryptExportPayload(
  payload: object,
  passphrase: string,
) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveAesKey(passphrase, salt, KDF_ITERATIONS);
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as unknown as BufferSource },
    key,
    plaintext as unknown as BufferSource,
  );
  return {
    version: EXPORT_VERSION,
    kdfIterations: KDF_ITERATIONS,
    salt: bytesToBase64(salt),
    iv: bytesToBase64(iv),
    data: bytesToBase64(new Uint8Array(ciphertext)),
  };
}

export async function decryptExportPayload(
  packageData: {
    version: number;
    kdfIterations: number;
    salt: string;
    iv: string;
    data: string;
  },
  passphrase: string,
) {
  const iv = base64ToBytes(packageData.iv);
  const salt = base64ToBytes(packageData.salt);
  const key = await deriveAesKey(passphrase, salt, packageData.kdfIterations);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    base64ToBytes(packageData.data),
  );
  const decoded = new TextDecoder().decode(plaintext);
  return JSON.parse(decoded) as {
    keys: StoredKey[];
    exportedAt: string;
    version: number;
  };
}
