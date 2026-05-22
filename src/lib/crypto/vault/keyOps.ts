import { KDF_ITERATIONS, bytesToBase64, base64ToBytes } from "./constants";
import type { StoredKey } from "../../storage/types";

const MIN_PIN_LENGTH = 4;

function validatePin(pin: string): void {
  if (pin.length < MIN_PIN_LENGTH) {
    throw new Error(`PIN 必须至少 ${MIN_PIN_LENGTH} 位`);
  }
}

async function deriveAesKey(passphrase: string, salt: Uint8Array, iterations: number) {
  const encoder = new TextEncoder();
  const baseKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(passphrase),
    "PBKDF2",
    false,
    ["deriveKey"],
  );
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: salt as BufferSource, iterations, hash: "SHA-256" },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

export async function encryptPrivateKey(privateKeyBytes: Uint8Array, passphrase: string) {
  validatePin(passphrase);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const key = await deriveAesKey(passphrase, salt, KDF_ITERATIONS);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    privateKeyBytes as BufferSource,
  );
  return {
    encryptedPrivateKey: bytesToBase64(new Uint8Array(ciphertext)),
    iv: bytesToBase64(iv),
    salt: bytesToBase64(salt),
    kdfIterations: KDF_ITERATIONS,
  };
}

export async function decryptPrivateKey(entry: StoredKey, passphrase: string) {
  validatePin(passphrase);
  const iv = base64ToBytes(entry.iv);
  const salt = base64ToBytes(entry.salt);
  const key = await deriveAesKey(passphrase, salt, entry.kdfIterations);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: iv as BufferSource },
    key,
    base64ToBytes(entry.encryptedPrivateKey) as BufferSource,
  );
  return new Uint8Array(plaintext);
}