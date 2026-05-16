import { bytesToUtf8 } from "./encoding";
import { HYBRID_VERSION, HYBRID_ALG, type HybridEnvelope } from "./types";

export function envelopeToText(envelope: HybridEnvelope): string {
  return JSON.stringify(envelope, null, 2);
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