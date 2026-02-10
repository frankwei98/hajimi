import type { X25519Keypair } from '../crypto/x25519';

export type StoredKey = {
  id: string;
  createdAt: string;
  publicKeyBech32: string;
  publicKeyHex: string;
  encryptedPrivateKey: string;
  iv: string;
  salt: string;
  kdfIterations: number;
  source: X25519Keypair['source'];
};
