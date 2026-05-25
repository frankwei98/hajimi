import { bech32 } from "bech32";

const PUBLIC_KEY_PREFIX = "hajimi";
const HYBRID_VERSION = 1;
const HYBRID_ALG = "X25519-HKDF-SHA256-AES-256-GCM";
const MAX_RECIPIENTS = 50;
const MAX_CIPHERTEXT_BYTES = 256_000;
const BASE64URL_RE = /^[A-Za-z0-9_-]+$/;
const SIGNING_PUBLIC_KEY_PREFIX = "hajimisig";

type MessageBody = {
  v: number;
  alg: string;
  epk: string;
  nonce: string;
  ciphertext: string;
  recipients: { kid: string; salt: string; wrapNonce: string; encCEK: string }[];
  sender?: { kid: string; publicSigningKeyBech32: string; signature: string };
};

function base64UrlLength(value: string, field: string): number {
  if (!value || !BASE64URL_RE.test(value)) throw new Error(`${field} 不是有效 base64url`);
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  return atob(base64 + "=".repeat((4 - (base64.length % 4)) % 4)).length;
}

function assertBytes(value: string, field: string, expectedLength?: number, minLength?: number) {
  const length = base64UrlLength(value, field);
  if (expectedLength != null && length !== expectedLength) {
    throw new Error(`${field} 长度应为 ${expectedLength} 字节`);
  }
  if (minLength != null && length < minLength) throw new Error(`${field} 长度过短`);
  return length;
}

function assertHajimiPublicKey(value: string, field: string) {
  const decoded = bech32.decode(value.trim());
  if (decoded.prefix !== PUBLIC_KEY_PREFIX) throw new Error(`${field} 公钥前缀不正确`);
  const bytes = new Uint8Array(bech32.fromWords(decoded.words));
  if (bytes.length !== 32) throw new Error(`${field} 公钥长度不正确`);
}

function assertSigningPublicKey(value: string, field: string) {
  const decoded = bech32.decode(value.trim());
  if (decoded.prefix !== SIGNING_PUBLIC_KEY_PREFIX) throw new Error(`${field} 签名公钥前缀不正确`);
  const bytes = new Uint8Array(bech32.fromWords(decoded.words));
  if (bytes.length !== 32) throw new Error(`${field} 签名公钥长度不正确`);
}

export function assertValidMessageBody(body: MessageBody) {
  if (body.v !== HYBRID_VERSION) throw new Error("不支持的密文版本");
  if (body.alg !== HYBRID_ALG) throw new Error("不支持的密文算法");
  assertBytes(body.epk, "epk", 32);
  assertBytes(body.nonce, "nonce", 12);
  const ciphertextLength = assertBytes(body.ciphertext, "ciphertext", undefined, 16);
  if (ciphertextLength > MAX_CIPHERTEXT_BYTES) throw new Error("ciphertext 过大");
  if (!Array.isArray(body.recipients) || body.recipients.length === 0) throw new Error("缺少收件人");
  if (body.recipients.length > MAX_RECIPIENTS) throw new Error("收件人过多");
  body.recipients.forEach((recipient, index) => {
    assertHajimiPublicKey(recipient.kid, `recipients[${index}].kid`);
    assertBytes(recipient.salt, `recipients[${index}].salt`, 16);
    assertBytes(recipient.wrapNonce, `recipients[${index}].wrapNonce`, 12);
    assertBytes(recipient.encCEK, `recipients[${index}].encCEK`, undefined, 16);
  });
  if (body.sender) {
    assertHajimiPublicKey(body.sender.kid, "sender.kid");
    assertSigningPublicKey(body.sender.publicSigningKeyBech32, "sender.publicSigningKeyBech32");
    assertBytes(body.sender.signature, "sender.signature", 64);
  }
}
