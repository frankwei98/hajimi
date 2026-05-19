import { bytesToUtf8 } from "./encoding";
import { bytesToBase58, base58ToBytes } from "./base58";
import { bytesToEmoji, emojiToBytes, EMOJI_DICT } from "./emoji";
import { HYBRID_VERSION, HYBRID_ALG, type HybridEnvelope, type EncodingFormat } from "./types";

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

  for (let i = 0; i < envelope.recipients.length; i += 1) {
    const r = envelope.recipients[i] as Record<string, unknown>;
    if (typeof r.kid !== "string" || !r.kid) throw new Error(`密文格式不正确：recipients[${i}].kid 缺失`);
    if (typeof r.salt !== "string" || !r.salt) throw new Error(`密文格式不正确：recipients[${i}].salt 缺失`);
    if (typeof r.wrapNonce !== "string" || !r.wrapNonce) throw new Error(`密文格式不正确：recipients[${i}].wrapNonce 缺失`);
    if (typeof r.encCEK !== "string" || !r.encCEK) throw new Error(`密文格式不正确：recipients[${i}].encCEK 缺失`);
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