import { bech32 } from "bech32";
import { x25519 } from "@noble/curves/ed25519.js";
import { base64UrlToBytes } from "./hybrid/encoding";

export type X25519Keypair = {
  publicKeyBytes: Uint8Array;
  privateKeyBytes: Uint8Array;
  publicKeyBech32: string;
  source: "webcrypto" | "noble";
};

export const PUBLIC_KEY_PREFIX = "hajimi";

export function encodeBech32PublicKey(bytes: Uint8Array) {
  return bech32.encode(PUBLIC_KEY_PREFIX, bech32.toWords(bytes));
}

export function decodeBech32PublicKey(value: string): Uint8Array {
  const decoded = bech32.decode(value.trim());
  if (decoded.prefix !== PUBLIC_KEY_PREFIX) {
    throw new Error(`公钥前缀不正确，应为 ${PUBLIC_KEY_PREFIX}`);
  }
  const bytes = new Uint8Array(bech32.fromWords(decoded.words));
  if (bytes.length !== 32) {
    throw new Error("公钥长度不正确");
  }
  return bytes;
}

export function isHajimiPublicKey(value: string): boolean {
  try {
    decodeBech32PublicKey(value);
    return true;
  } catch {
    return false;
  }
}

async function tryWebCrypto(): Promise<X25519Keypair | null> {
  if (!globalThis.crypto?.subtle) return null;
  try {
    const keyPair = await crypto.subtle.generateKey({ name: "X25519" }, true, [
      "deriveKey",
      "deriveBits",
    ]);
    const publicKeyBytes = new Uint8Array(
      await crypto.subtle.exportKey(
        "raw",
        (keyPair as CryptoKeyPair).publicKey,
      ),
    );
    const jwk = (await crypto.subtle.exportKey(
      "jwk",
      (keyPair as CryptoKeyPair).privateKey,
    )) as JsonWebKey;
    if (!jwk.d) throw new Error("Missing JWK private key material");
    const privateKeyBytes = base64UrlToBytes(jwk.d);

    return {
      publicKeyBytes,
      privateKeyBytes,
      publicKeyBech32: encodeBech32PublicKey(publicKeyBytes),
      source: "webcrypto",
    };
  } catch {
    return null;
  }
}

function generateWithNoble(): X25519Keypair {
  const { secretKey, publicKey } = x25519.keygen();
  const privateKeyBytes = secretKey;
  const publicKeyBytes = publicKey;
  return {
    publicKeyBytes,
    privateKeyBytes,
    publicKeyBech32: encodeBech32PublicKey(publicKeyBytes),
    source: "noble",
  };
}

export async function generateX25519Keypair(): Promise<X25519Keypair> {
  const webCryptoResult = await tryWebCrypto();
  if (webCryptoResult) return webCryptoResult;
  return generateWithNoble();
}
