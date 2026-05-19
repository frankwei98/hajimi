import { decodeBech32PublicKey, isHajimiPublicKey } from '../../../lib/crypto/x25519';

export interface RecipientEntry {
  kid: string;
  publicKeyBytes: Uint8Array;
}

export function parseRecipients(input: string): RecipientEntry[] {
  const raw = input
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const unique = Array.from(new Set(raw));
  const valid = unique.filter(isHajimiPublicKey);
  return valid.map((kid) => ({
    kid,
    publicKeyBytes: decodeBech32PublicKey(kid)
  }));
}

export function mergeRecipients(
  manual: RecipientEntry[], 
  selected: RecipientEntry[]
): RecipientEntry[] {
  const unique = new Map<string, RecipientEntry>();
  manual.forEach((item) => unique.set(item.kid, item));
  selected.forEach((item) => unique.set(item.kid, item));
  return Array.from(unique.values());
}

export function validateEncryptInput(
  recipients: RecipientEntry[],
  title: string,
  content: string
): string | null {
  if (recipients.length === 0) {
    return '请至少填写一个收件人公钥';
  }
  if (!title.trim() && !content.trim()) {
    return '请至少填写标题或内容';
  }
  return null;
}
