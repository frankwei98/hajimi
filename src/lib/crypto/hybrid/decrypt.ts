import { x25519 } from "@noble/curves/ed25519.js";
import { base64UrlToBytes, utf8ToBytes } from "./encoding";
import { encodeBech32PublicKey } from "../x25519";
import { HYBRID_VERSION, HYBRID_ALG, type HybridEnvelope } from "./types";
import { aesGcmDecrypt, hkdfSha256, buildMessageAad, buildWrapAad, AAD_PREFIX } from "./primitives";

export async function decryptForRecipient(
  envelope: HybridEnvelope,
  recipientPrivateKey: Uint8Array,
  recipientKid?: string,
): Promise<Uint8Array> {
  if (envelope.v !== HYBRID_VERSION) throw new Error("不支持的版本");
  if (envelope.alg !== HYBRID_ALG) throw new Error("不支持的算法");

  const epkBytes = base64UrlToBytes(envelope.epk);
  const recipientPubBytes = x25519.getPublicKey(recipientPrivateKey);
  const kid = recipientKid ?? encodeBech32PublicKey(recipientPubBytes);
  const recipientEntry = envelope.recipients.find((item) => item.kid === kid);
  if (!recipientEntry) throw new Error("未找到匹配的接收者条目");

  const shared = x25519.getSharedSecret(recipientPrivateKey, epkBytes);
  const salt = base64UrlToBytes(recipientEntry.salt);
  const info = utf8ToBytes(`${AAD_PREFIX}|v=${HYBRID_VERSION}|alg=${HYBRID_ALG}|epk=${envelope.epk}|kid=${kid}|kdf`);
  const kek = await hkdfSha256(shared, salt, info, 32);
  const wrapNonce = base64UrlToBytes(recipientEntry.wrapNonce);
  const wrapAad = buildWrapAad(HYBRID_VERSION, HYBRID_ALG, envelope.epk, kid);
  const cek = await aesGcmDecrypt(kek, wrapNonce, base64UrlToBytes(recipientEntry.encCEK), wrapAad);

  const messageAad = buildMessageAad(HYBRID_VERSION, HYBRID_ALG, envelope.epk);
  return aesGcmDecrypt(cek, base64UrlToBytes(envelope.nonce), base64UrlToBytes(envelope.ciphertext), messageAad);
}