import { generateMnemonic, validateMnemonic, mnemonicToSeedSync } from '@scure/bip39';
import { x25519 } from '@noble/curves/ed25519.js';
import { encodeBech32PublicKey } from './x25519.js';
import { ed25519KeypairFromSeed } from './signing.js';

const MNEMONIC_STRENGTH = 128;
const X25519_DERIVATION_SALT = 'hajimi-x25519-v1';
const ED25519_DERIVATION_SALT = 'hajimi-ed25519-sign-v1';

async function sha512Bytes(data: Uint8Array): Promise<Uint8Array> {
  const hash = await crypto.subtle.digest('SHA-512', data as BufferSource);
  return new Uint8Array(hash);
}

export async function generateMnemonicWords(): Promise<string> {
  const { wordlist } = await import('@scure/bip39/wordlists/simplified-chinese.js');
  return generateMnemonic(wordlist, MNEMONIC_STRENGTH);
}

function isChineseWordlist(mnemonic: string): boolean {
  const words = mnemonic.trim().split(/\s+/);
  return words.some((w) => w.charCodeAt(0) > 127);
}

async function deriveDomainSeed(seed: Uint8Array, domain: string): Promise<Uint8Array> {
  const domainBytes = new TextEncoder().encode(domain);
  const combined = new Uint8Array(seed.length + domainBytes.length);
  combined.set(seed);
  combined.set(domainBytes, seed.length);
  return (await sha512Bytes(combined)).slice(0, 32);
}

export async function validateMnemonicWords(mnemonic: string): Promise<boolean> {
  try {
    const trimmed = mnemonic.trim();
    const { wordlist } = await import(
      isChineseWordlist(trimmed)
        ? '@scure/bip39/wordlists/simplified-chinese.js'
        : '@scure/bip39/wordlists/english.js'
    );
    return validateMnemonic(trimmed, wordlist);
  } catch {
    return false;
  }
}

export async function mnemonicToKeyPair(mnemonic: string): Promise<{
  publicKeyBytes: Uint8Array;
  privateKeyBytes: Uint8Array;
  publicKeyBech32: string;
  publicSigningKeyBytes: Uint8Array;
  privateSigningKeyBytes: Uint8Array;
  publicSigningKeyBech32: string;
}> {
  const trimmed = mnemonic.trim();
  const { wordlist } = await import(
    isChineseWordlist(trimmed)
      ? '@scure/bip39/wordlists/simplified-chinese.js'
      : '@scure/bip39/wordlists/english.js'
  );
  if (!validateMnemonic(trimmed, wordlist)) {
    throw new Error('助记词无效');
  }
  const seed = mnemonicToSeedSync(trimmed, wordlist);
  const privateKeyBytes = await deriveDomainSeed(seed, X25519_DERIVATION_SALT);
  const publicKeyBytes = x25519.getPublicKey(privateKeyBytes);
  const signing = ed25519KeypairFromSeed(await deriveDomainSeed(seed, ED25519_DERIVATION_SALT));
  return {
    publicKeyBytes,
    privateKeyBytes,
    publicKeyBech32: encodeBech32PublicKey(publicKeyBytes),
    publicSigningKeyBytes: signing.publicSigningKeyBytes,
    privateSigningKeyBytes: signing.privateSigningKeyBytes,
    publicSigningKeyBech32: signing.publicSigningKeyBech32,
  };
}

export { MNEMONIC_STRENGTH };
