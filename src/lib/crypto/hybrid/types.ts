export const HYBRID_VERSION = 1 as const;
export const HYBRID_ALG = "X25519-HKDF-SHA256-AES-256-GCM" as const;

export type EncodingFormat = "json" | "base58" | "emoji";

export type HybridRecipient = {
  kid: string;
  salt: string;
  wrapNonce: string;
  encCEK: string;
};

export type HybridSender = {
  kid: string;
  publicSigningKeyBech32: string;
  signature: string;
};

export type HybridEnvelope = {
  v: typeof HYBRID_VERSION;
  alg: typeof HYBRID_ALG;
  epk: string;
  nonce: string;
  ciphertext: string;
  recipients: HybridRecipient[];
  sender?: HybridSender;
};
