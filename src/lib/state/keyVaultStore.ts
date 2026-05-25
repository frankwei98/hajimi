import { create } from 'zustand';
import type { StoredKey } from '../storage/types';
import { listKeys } from '../storage/keyStore';
import { decryptPrivateKey } from '../crypto/keyVault';

type KeyVaultState = {
  keys: StoredKey[];
  isLoaded: boolean;
  isUnlocked: boolean;
  privateKeyByPub: Record<string, Uint8Array>;
  signingPrivateKeyByPub: Record<string, Uint8Array>;
  loadKeys: () => Promise<void>;
  setKeys: (entriesOrFn: StoredKey[] | ((prev: StoredKey[]) => StoredKey[])) => void;
  setPrivateKey: (kid: string, key: Uint8Array) => void;
  setSigningPrivateKey: (kid: string, key: Uint8Array) => void;
  removePrivateKey: (kid: string) => void;
  setUnlocked: (value: boolean) => void;
  unlockVault: (pin: string) => Promise<void>;
  lockVault: () => void;
};

export const useKeyVaultStore = create<KeyVaultState>((set, get) => ({
  keys: [],
  isLoaded: false,
  isUnlocked: false,
  privateKeyByPub: {},
  signingPrivateKeyByPub: {},
  loadKeys: async () => {
    const entries = await listKeys();
    const sorted = [...entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    set({ keys: sorted, isLoaded: true });
  },
  setKeys: (entriesOrFn) =>
    typeof entriesOrFn === 'function'
      ? set((state) => ({ keys: entriesOrFn(state.keys) }))
      : set({ keys: entriesOrFn }),
  setPrivateKey: (kid, key) =>
    set((state) => ({
      privateKeyByPub: { ...state.privateKeyByPub, [kid]: key },
    })),
  setSigningPrivateKey: (kid, key) =>
    set((state) => ({
      signingPrivateKeyByPub: { ...state.signingPrivateKeyByPub, [kid]: key },
    })),
  removePrivateKey: (kid) =>
    set((state) => {
      const next = { ...state.privateKeyByPub };
      const nextSigning = { ...state.signingPrivateKeyByPub };
      delete next[kid];
      delete nextSigning[kid];
      return { privateKeyByPub: next, signingPrivateKeyByPub: nextSigning };
    }),
  setUnlocked: (value) => set({ isUnlocked: value }),
  unlockVault: async (pin: string) => {
    const { keys } = get();
    if (keys.length === 0) {
      set({ isUnlocked: true, privateKeyByPub: {}, signingPrivateKeyByPub: {} });
      return;
    }
    const decrypted = await Promise.all(
      keys.map(async (entry) => ({
        kid: entry.publicKeyBech32,
        key: await decryptPrivateKey(entry, pin),
        signingKey: entry.encryptedSigningPrivateKey
          ? await decryptPrivateKey(
              {
                ...entry,
                encryptedPrivateKey: entry.encryptedSigningPrivateKey,
                iv: entry.signingIv ?? entry.iv,
                salt: entry.signingSalt ?? entry.salt,
                kdfIterations: entry.signingKdfIterations ?? entry.kdfIterations,
              },
              pin,
            )
          : undefined,
      }))
    );
    const map: Record<string, Uint8Array> = {};
    const signingMap: Record<string, Uint8Array> = {};
    decrypted.forEach((item) => {
      map[item.kid] = item.key;
      if (item.signingKey) signingMap[item.kid] = item.signingKey;
    });
    set({ isUnlocked: true, privateKeyByPub: map, signingPrivateKeyByPub: signingMap });
  },
  lockVault: () => set({ isUnlocked: false, privateKeyByPub: {}, signingPrivateKeyByPub: {} }),
}));
