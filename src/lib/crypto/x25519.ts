import { bech32 } from 'bech32';
import { x25519 } from '@noble/curves/ed25519.js';

export type X25519Keypair = {
  publicKeyBytes: Uint8Array;
  privateKeyBytes: Uint8Array;
  publicKeyBech32: string;
  source: 'webcrypto' | 'noble';
};

const PUBLIC_KEY_PREFIX = 'hajimi';

function encodeBech32(bytes: Uint8Array) {
  return bech32.encode(PUBLIC_KEY_PREFIX, bech32.toWords(bytes));
}

async function tryWebCrypto(): Promise<X25519Keypair | null> {
  if (!globalThis.crypto?.subtle) return null;
  try {
    const keyPair = await crypto.subtle.generateKey(
      { name: 'X25519' },
      true,
      ['deriveKey', 'deriveBits']
    );
    const publicKeyBytes = new Uint8Array(
      await crypto.subtle.exportKey('raw', keyPair.publicKey)
    );
    const privateKeyBytes = new Uint8Array(
      await crypto.subtle.exportKey('raw', keyPair.privateKey)
    );
    return {
      publicKeyBytes,
      privateKeyBytes,
      publicKeyBech32: encodeBech32(publicKeyBytes),
      source: 'webcrypto',
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
    publicKeyBech32: encodeBech32(publicKeyBytes),
    source: 'noble',
  };
}

export async function generateX25519Keypair(): Promise<X25519Keypair> {
  const webCryptoResult = await tryWebCrypto();
  if (webCryptoResult) return webCryptoResult;
  return generateWithNoble();
}
