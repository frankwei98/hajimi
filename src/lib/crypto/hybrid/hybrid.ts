import { x25519 } from '@noble/curves/ed25519.js';
import {
  base64UrlToBytes,
  bytesToBase64Url,
  bytesToUtf8,
  utf8ToBytes,
} from './encoding';
import { encodeBech32PublicKey } from '../x25519';

export const HYBRID_VERSION = 1 as const;
export const HYBRID_ALG = 'X25519-HKDF-SHA256-AES-256-GCM' as const;

export type HybridRecipient = {
  kid: string;
  salt: string;
  wrapNonce: string;
  encCEK: string;
};

export type HybridEnvelope = {
  v: typeof HYBRID_VERSION;
  alg: typeof HYBRID_ALG;
  epk: string;
  nonce: string;
  ciphertext: string;
  recipients: HybridRecipient[];
};

const AAD_PREFIX = 'hajimi-hybrid';

function assertSubtle() {
  if (!globalThis.crypto?.subtle) {
    throw new Error('当前环境不支持 WebCrypto');
  }
}

function buildMessageAad(version: number, alg: string, epk: string): Uint8Array {
  return utf8ToBytes(`${AAD_PREFIX}|v=${version}|alg=${alg}|epk=${epk}|msg`);
}

function buildWrapAad(version: number, alg: string, epk: string, kid: string): Uint8Array {
  return utf8ToBytes(`${AAD_PREFIX}|v=${version}|alg=${alg}|epk=${epk}|kid=${kid}|wrap`);
}

async function importAesKey(keyBytes: Uint8Array) {
  assertSubtle();
  return crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function aesGcmEncrypt(
  keyBytes: Uint8Array,
  nonce: Uint8Array,
  plaintext: Uint8Array,
  additionalData?: Uint8Array
): Promise<Uint8Array> {
  const key = await importAesKey(keyBytes);
  const ciphertext = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv: nonce, additionalData },
    key,
    plaintext
  );
  return new Uint8Array(ciphertext);
}

async function aesGcmDecrypt(
  keyBytes: Uint8Array,
  nonce: Uint8Array,
  ciphertext: Uint8Array,
  additionalData?: Uint8Array
): Promise<Uint8Array> {
  const key = await importAesKey(keyBytes);
  const plaintext = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: nonce, additionalData },
    key,
    ciphertext
  );
  return new Uint8Array(plaintext);
}

async function hkdfSha256(
  ikm: Uint8Array,
  salt: Uint8Array,
  info: Uint8Array,
  length: number
): Promise<Uint8Array> {
  assertSubtle();
  const key = await crypto.subtle.importKey('raw', ikm, 'HKDF', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits(
    { name: 'HKDF', hash: 'SHA-256', salt, info },
    key,
    length * 8
  );
  return new Uint8Array(bits);
}

export async function encryptForRecipients(
  plaintext: Uint8Array,
  recipients: { kid: string; publicKeyBytes: Uint8Array }[]
): Promise<HybridEnvelope> {
  if (recipients.length === 0) throw new Error('至少需要一个接收者公钥');

  const cek = crypto.getRandomValues(new Uint8Array(32));
  const nonce = crypto.getRandomValues(new Uint8Array(12));

  const { secretKey, publicKey } = x25519.keygen();
  const epk = bytesToBase64Url(publicKey);

  const messageAad = buildMessageAad(HYBRID_VERSION, HYBRID_ALG, epk);
  const ciphertext = await aesGcmEncrypt(cek, nonce, plaintext, messageAad);

  const recipientEntries: HybridRecipient[] = [];

  for (const recipient of recipients) {
    const shared = x25519.getSharedSecret(secretKey, recipient.publicKeyBytes);
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const info = utf8ToBytes(
      `${AAD_PREFIX}|v=${HYBRID_VERSION}|alg=${HYBRID_ALG}|epk=${epk}|kid=${recipient.kid}|kdf`
    );
    const kek = await hkdfSha256(shared, salt, info, 32);
    const wrapNonce = crypto.getRandomValues(new Uint8Array(12));
    const wrapAad = buildWrapAad(HYBRID_VERSION, HYBRID_ALG, epk, recipient.kid);
    const encCEK = await aesGcmEncrypt(kek, wrapNonce, cek, wrapAad);

    recipientEntries.push({
      kid: recipient.kid,
      salt: bytesToBase64Url(salt),
      wrapNonce: bytesToBase64Url(wrapNonce),
      encCEK: bytesToBase64Url(encCEK),
    });
  }

  return {
    v: HYBRID_VERSION,
    alg: HYBRID_ALG,
    epk,
    nonce: bytesToBase64Url(nonce),
    ciphertext: bytesToBase64Url(ciphertext),
    recipients: recipientEntries,
  };
}

export async function decryptForRecipient(
  envelope: HybridEnvelope,
  recipientPrivateKey: Uint8Array,
  recipientKid?: string
): Promise<Uint8Array> {
  if (envelope.v !== HYBRID_VERSION) throw new Error('不支持的版本');
  if (envelope.alg !== HYBRID_ALG) throw new Error('不支持的算法');

  const epkBytes = base64UrlToBytes(envelope.epk);
  const recipientPubBytes = x25519.getPublicKey(recipientPrivateKey);
  const kid = recipientKid ?? encodeBech32PublicKey(recipientPubBytes);
  const recipientEntry = envelope.recipients.find((item) => item.kid === kid);
  if (!recipientEntry) throw new Error('未找到匹配的接收者条目');

  const shared = x25519.getSharedSecret(recipientPrivateKey, epkBytes);
  const salt = base64UrlToBytes(recipientEntry.salt);
  const info = utf8ToBytes(
    `${AAD_PREFIX}|v=${HYBRID_VERSION}|alg=${HYBRID_ALG}|epk=${envelope.epk}|kid=${kid}|kdf`
  );
  const kek = await hkdfSha256(shared, salt, info, 32);
  const wrapNonce = base64UrlToBytes(recipientEntry.wrapNonce);
  const wrapAad = buildWrapAad(HYBRID_VERSION, HYBRID_ALG, envelope.epk, kid);
  const cek = await aesGcmDecrypt(kek, wrapNonce, base64UrlToBytes(recipientEntry.encCEK), wrapAad);

  const messageAad = buildMessageAad(HYBRID_VERSION, HYBRID_ALG, envelope.epk);
  const plaintext = await aesGcmDecrypt(
    cek,
    base64UrlToBytes(envelope.nonce),
    base64UrlToBytes(envelope.ciphertext),
    messageAad
  );
  return plaintext;
}

export function envelopeToText(envelope: HybridEnvelope): string {
  return JSON.stringify(envelope, null, 2);
}

export function parseEnvelope(text: string): HybridEnvelope {
  const parsed = JSON.parse(text) as HybridEnvelope;
  if (!parsed || typeof parsed !== 'object') throw new Error('密文格式不正确');
  return parsed;
}

export function decodePayload(plaintext: Uint8Array): { title?: string; content?: string; raw: string } {
  const raw = bytesToUtf8(plaintext);
  try {
    const parsed = JSON.parse(raw) as { title?: string; content?: string };
    return { title: parsed.title, content: parsed.content, raw };
  } catch {
    return { raw };
  }
}
