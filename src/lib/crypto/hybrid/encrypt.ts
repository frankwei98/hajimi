import { x25519 } from "@noble/curves/ed25519.js";
import { bytesToBase64Url, utf8ToBytes } from "./encoding";
import { HYBRID_VERSION, HYBRID_ALG, type HybridEnvelope, type HybridRecipient } from "./types";
import { aesGcmEncrypt, hkdfSha256, buildMessageAad, buildWrapAad, AAD_PREFIX } from "./primitives";

export async function encryptForRecipients(
  plaintext: Uint8Array,
  recipients: { kid: string; publicKeyBytes: Uint8Array }[],
): Promise<HybridEnvelope> {
  if (recipients.length === 0) throw new Error("至少需要一个接收者公钥");

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
    const info = utf8ToBytes(`${AAD_PREFIX}|v=${HYBRID_VERSION}|alg=${HYBRID_ALG}|epk=${epk}|kid=${recipient.kid}|kdf`);
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

  return { v: HYBRID_VERSION, alg: HYBRID_ALG, epk, nonce: bytesToBase64Url(nonce), ciphertext: bytesToBase64Url(ciphertext), recipients: recipientEntries };
}