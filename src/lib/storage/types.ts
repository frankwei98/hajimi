import type { X25519Keypair } from '../crypto/x25519';

export type StoredKey = {
  id: string;
  createdAt: string;
  publicKeyBech32: string;
  publicKeyHex: string;
  publicSigningKeyBech32?: string;
  publicSigningKeyHex?: string;
  encryptedPrivateKey: string;
  encryptedSigningPrivateKey?: string;
  iv: string;
  salt: string;
  signingIv?: string;
  signingSalt?: string;
  signingKdfIterations?: number;
  kdfIterations: number;
  source: X25519Keypair['source'] | 'mnemonic';
  label?: string;
  avatarUrl?: string;
};

export type Contact = {
  id: string;
  handle: string;
  publicKeyBech32: string;
  avatarUrl?: string;
  addedAt: string;
};
