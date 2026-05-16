import type { StoredKey } from '../../storage/types';

export interface KeyActionDeps {
  pin: string;
  newPin: string;
  confirmPin: string;
  keys: StoredKey[];
  isUnlocked: boolean;
  revealedKeys: Record<string, string>;
  setError: (v: string | null) => void;
  setNotice: (v: string | null) => void;
  setCopiedField: (v: string | null) => void;
  setIsGenerating: (v: boolean) => void;
  setKeys: (keys: StoredKey[]) => void;
  setRevealedKeys: (v: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  setNewPin: (v: string) => void;
  setConfirmPin: (v: string) => void;
  unlockVault: (pin: string) => Promise<void>;
}