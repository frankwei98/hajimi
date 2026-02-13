import { describe, expect, it, vi } from 'vitest';

vi.mock('../../src/lib/crypto/x25519', () => ({
  decodeBech32PublicKey: (kid: string) => Uint8Array.from([kid.charCodeAt(0)]),
}));

import {
  mergeRecipients,
  parseRecipients,
  validateEncryptInput,
  type RecipientEntry,
} from '../../src/pages/encrypt/utils/recipients';

describe('recipients utils', () => {
  it('parseRecipients should split/trim/dedupe recipients', () => {
    const parsed = parseRecipients('alice, bob\nalice\n  bob  ');
    expect(parsed.map((item) => item.kid)).toEqual(['alice', 'bob']);
    expect(parsed[0]?.publicKeyBytes).toEqual(Uint8Array.from(['a'.charCodeAt(0)]));
    expect(parsed[1]?.publicKeyBytes).toEqual(Uint8Array.from(['b'.charCodeAt(0)]));
  });

  it('mergeRecipients should keep unique recipients and selected should override duplicates', () => {
    const manual: RecipientEntry[] = [
      { kid: 'alice', publicKeyBytes: Uint8Array.from([1]) },
      { kid: 'bob', publicKeyBytes: Uint8Array.from([2]) },
    ];
    const selected: RecipientEntry[] = [
      { kid: 'bob', publicKeyBytes: Uint8Array.from([9]) },
      { kid: 'charlie', publicKeyBytes: Uint8Array.from([3]) },
    ];

    const merged = mergeRecipients(manual, selected);
    expect(merged.map((item) => item.kid)).toEqual(['alice', 'bob', 'charlie']);
    expect(merged.find((item) => item.kid === 'bob')?.publicKeyBytes).toEqual(Uint8Array.from([9]));
  });

  it('validateEncryptInput should validate required recipients and content', () => {
    expect(validateEncryptInput([], '', '')).toBe('请至少填写一个收件人公钥');
    expect(
      validateEncryptInput([{ kid: 'alice', publicKeyBytes: Uint8Array.from([1]) }], '', '   ')
    ).toBe('请至少填写标题或内容');
    expect(
      validateEncryptInput([{ kid: 'alice', publicKeyBytes: Uint8Array.from([1]) }], 'title', '')
    ).toBeNull();
  });
});
