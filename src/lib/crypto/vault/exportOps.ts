import { KDF_ITERATIONS, EXPORT_VERSION, bytesToBase64, base64ToBytes } from "./constants";
import type { StoredKey } from "../../storage/types";

export async function encryptExportPayload(payload: object, passphrase: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveAesKey(passphrase, salt, KDF_ITERATIONS);
  const plaintext = new TextEncoder().encode(JSON.stringify(payload));
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    plaintext as BufferSource,
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
  packageData: { version: number; kdfIterations: number; salt: string; iv: string; data: string },
  passphrase: string,
) {
  const iv = base64ToBytes(packageData.iv);
  const salt = base64ToBytes(packageData.salt);
  const key = await deriveAesKey(passphrase, salt, packageData.kdfIterations);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    base64ToBytes(packageData.data) as BufferSource,
  );
  const decoded = new TextDecoder().decode(plaintext);
  return JSON.parse(decoded) as { keys: StoredKey[]; exportedAt: string; version: number };
}

async function deriveAesKey(passphrase: string, salt: Uint8Array, iterations: number) {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey("raw", encoder.encode(passphrase), "PBKDF2", false, ["deriveKey"]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}