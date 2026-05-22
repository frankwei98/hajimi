import { create } from 'zustand';
import type { StoredKey } from '../storage/types';
import { listKeys } from '../storage/keyStore';
import { decryptPrivateKey } from '../crypto/keyVault';

type KeyVaultState = {
  keys: StoredKey[];
  isLoaded: boolean;
  isUnlocked: boolean;
  privateKeyByPub: Record<string, Uint8Array>;
  loadKeys: () => Promise<void>;
  setKeys: (entriesOrFn: StoredKey[] | ((prev: StoredKey[]) => StoredKey[])) => void;
  setPrivateKey: (kid: string, key: Uint8Array) => void;
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
  removePrivateKey: (kid) =>
    set((state) => {
      const next = { ...state.privateKeyByPub };
      delete next[kid];
      return { privateKeyByPub: next };
    }),
  setUnlocked: (value) => set({ isUnlocked: value }),
  unlockVault: async (pin: string) => {
    const { keys } = get();
    if (keys.length === 0) {
      set({ isUnlocked: true, privateKeyByPub: {} });
      return;
    }
    const decrypted = await Promise.all(
      keys.map(async (entry) => ({
        kid: entry.publicKeyBech32,
        key: await decryptPrivateKey(entry, pin),
      }))
    );
    const map: Record<string, Uint8Array> = {};
    decrypted.forEach((item) => {
      map[item.kid] = item.key;
    });
    set({ isUnlocked: true, privateKeyByPub: map });
  },
  lockVault: () => set({ isUnlocked: false, privateKeyByPub: {} }),
}));
