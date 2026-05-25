import { bytesToUtf8 } from "./encoding";
import { bytesToBase58, base58ToBytes } from "./base58";
import { bytesToEmoji, emojiToBytes, EMOJI_DICT } from "./emoji";
import { HYBRID_VERSION, HYBRID_ALG, type HybridEnvelope, type EncodingFormat } from "./types";
import { decodeBech32PublicKey } from "../x25519";
import { decodeBech32SigningPublicKey } from "../signing";

const MAX_RECIPIENTS = 50;
const MAX_CIPHERTEXT_BYTES = 256_000;
const BASE64URL_RE = /^[A-Za-z0-9_-]+$/;

function assertBase64UrlBytes(value: string, field: string, expectedLength?: number, minLength?: number): Uint8Array {
  if (!BASE64URL_RE.test(value)) throw new Error(`密文格式不正确：${field} 不是 base64url`);
  const bytes = atob(value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4));
  const out = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i += 1) out[i] = bytes.charCodeAt(i);
  if (expectedLength != null && out.length !== expectedLength) {
    throw new Error(`密文格式不正确：${field} 长度应为 ${expectedLength} 字节`);
  }
  if (minLength != null && out.length < minLength) {
    throw new Error(`密文格式不正确：${field} 长度过短`);
  }
  return out;
}

export function envelopeToText(envelope: HybridEnvelope): string {
  return JSON.stringify(envelope, null, 2);
}

export function envelopeToTextWithFormat(envelope: HybridEnvelope, format: EncodingFormat): string {
  if (format === "json") return envelopeToText(envelope);
  const jsonBytes = new TextEncoder().encode(JSON.stringify(envelope));
  if (format === "base58") return bytesToBase58(jsonBytes);
  return bytesToEmoji(jsonBytes);
}

export function parseEnvelope(text: string): HybridEnvelope {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error("密文格式不正确：无法解析 JSON");
  }

  if (!parsed || typeof parsed !== "object") {
    throw new Error("密文格式不正确：必须为对象");
  }

  const envelope = parsed as Record<string, unknown>;

  if (envelope.v !== HYBRID_VERSION) {
    throw new Error(`不支持的版本：${envelope.v}，当前支持版本 ${HYBRID_VERSION}`);
  }
  if (typeof envelope.alg !== "string" || envelope.alg !== HYBRID_ALG) {
    throw new Error(`不支持的算法：${envelope.alg}`);
  }
  if (typeof envelope.epk !== "string" || !envelope.epk) {
    throw new Error("密文格式不正确：缺少 epk 字段");
  }
  if (typeof envelope.nonce !== "string" || !envelope.nonce) {
    throw new Error("密文格式不正确：缺少 nonce 字段");
  }
  if (typeof envelope.ciphertext !== "string" || !envelope.ciphertext) {
    throw new Error("密文格式不正确：缺少 ciphertext 字段");
  }
  if (!Array.isArray(envelope.recipients) || envelope.recipients.length === 0) {
    throw new Error("密文格式不正确：缺少 recipients 字段或为空");
  }
  if (envelope.recipients.length > MAX_RECIPIENTS) {
    throw new Error(`密文格式不正确：收件人不能超过 ${MAX_RECIPIENTS} 个`);
  }

  assertBase64UrlBytes(envelope.epk, "epk", 32);
  assertBase64UrlBytes(envelope.nonce, "nonce", 12);
  const ciphertext = assertBase64UrlBytes(envelope.ciphertext, "ciphertext", undefined, 16);
  if (ciphertext.length > MAX_CIPHERTEXT_BYTES) {
    throw new Error("密文格式不正确：ciphertext 过大");
  }

  for (let i = 0; i < envelope.recipients.length; i += 1) {
    const r = envelope.recipients[i] as Record<string, unknown>;
    if (typeof r.kid !== "string" || !r.kid) throw new Error(`密文格式不正确：recipients[${i}].kid 缺失`);
    if (typeof r.salt !== "string" || !r.salt) throw new Error(`密文格式不正确：recipients[${i}].salt 缺失`);
    if (typeof r.wrapNonce !== "string" || !r.wrapNonce) throw new Error(`密文格式不正确：recipients[${i}].wrapNonce 缺失`);
    if (typeof r.encCEK !== "string" || !r.encCEK) throw new Error(`密文格式不正确：recipients[${i}].encCEK 缺失`);
    try {
      decodeBech32PublicKey(r.kid);
    } catch {
      throw new Error(`密文格式不正确：recipients[${i}].kid 不是有效公钥`);
    }
    assertBase64UrlBytes(r.salt, `recipients[${i}].salt`, 16);
    assertBase64UrlBytes(r.wrapNonce, `recipients[${i}].wrapNonce`, 12);
    assertBase64UrlBytes(r.encCEK, `recipients[${i}].encCEK`, undefined, 16);
  }

  if (envelope.sender != null) {
    if (typeof envelope.sender !== "object") throw new Error("密文格式不正确：sender 必须为对象");
    const sender = envelope.sender as Record<string, unknown>;
    if (typeof sender.kid !== "string" || !sender.kid) throw new Error("密文格式不正确：sender.kid 缺失");
    if (typeof sender.publicSigningKeyBech32 !== "string" || !sender.publicSigningKeyBech32) {
      throw new Error("密文格式不正确：sender.publicSigningKeyBech32 缺失");
    }
    if (typeof sender.signature !== "string" || !sender.signature) throw new Error("密文格式不正确：sender.signature 缺失");
    try {
      decodeBech32PublicKey(sender.kid);
      decodeBech32SigningPublicKey(sender.publicSigningKeyBech32);
    } catch {
      throw new Error("密文格式不正确：sender 公钥格式不正确");
    }
    assertBase64UrlBytes(sender.signature, "sender.signature", 64);
  }

  return envelope as HybridEnvelope;
}

function looksLikeBase58(text: string): boolean {
  return /^[123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz]+$/.test(text.trim());
}

function looksLikeEmoji(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < 2) return false;
  const chars = [...trimmed];
  const dictSet = new Set(EMOJI_DICT);
  return chars.some((c) => dictSet.has(c)) && chars.every((c) => dictSet.has(c) || /\s/.test(c));
}

export function parseAnyEnvelope(text: string): HybridEnvelope {
  const trimmed = text.trim();
  try {
    return parseEnvelope(trimmed);
  } catch {
    if (looksLikeBase58(trimmed)) {
      try {
        const jsonBytes = base58ToBytes(trimmed);
        const json = new TextDecoder().decode(jsonBytes);
        return parseEnvelope(json);
      } catch {
        throw new Error("Base58 密文解码失败");
      }
    }
    if (looksLikeEmoji(trimmed)) {
      try {
        const jsonBytes = emojiToBytes(trimmed);
        const json = new TextDecoder().decode(jsonBytes);
        return parseEnvelope(json);
      } catch {
        throw new Error("Emoji 密文解码失败");
      }
    }
    throw new Error("无法识别密文格式（支持 JSON / Base58 / Emoji）");
  }
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

export function pickMatchingKid(envelope: HybridEnvelope, available: string[]) {
  return envelope.recipients.find((item) => available.includes(item.kid))?.kid ?? "";
}
