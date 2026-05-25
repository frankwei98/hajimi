import { describe, expect, it } from 'vitest';
import {
  generateMnemonicWords,
  validateMnemonicWords,
  mnemonicToKeyPair,
  MNEMONIC_STRENGTH,
} from '../../src/lib/crypto/mnemonic';
import { PUBLIC_KEY_PREFIX } from '../../src/lib/crypto/x25519';

describe('mnemonic generation', () => {
  it('generates a valid mnemonic', async () => {
    const mnemonic = await generateMnemonicWords();
    expect(typeof mnemonic).toBe('string');
    const words = mnemonic.trim().split(/\s+/);
    expect(words.length).toBe(MNEMONIC_STRENGTH === 128 ? 12 : 24);
  });

  it('generates unique mnemonics', async () => {
    const m1 = await generateMnemonicWords();
    const m2 = await generateMnemonicWords();
    expect(m1).not.toBe(m2);
  });
});

describe('mnemonic validation', () => {
  it('validates a generated mnemonic', async () => {
    const mnemonic = await generateMnemonicWords();
    const valid = await validateMnemonicWords(mnemonic);
    expect(valid).toBe(true);
  });

  it('validates a Chinese mnemonic', async () => {
    // Known valid BIP39 Chinese mnemonic (128-bit entropy)
    const chinese = '候 铜 简 钙 氨 喜 攻 艇 尝 运 邵 吃';
    const valid = await validateMnemonicWords(chinese);
    expect(valid).toBe(true);
  });

  it('rejects invalid mnemonic', async () => {
    const valid = await validateMnemonicWords('not a valid mnemonic phrase at all');
    expect(valid).toBe(false);
  });

  it('rejects invalid Chinese mnemonic', async () => {
    const valid = await validateMnemonicWords('候 铜 简 钙 氨 喜 攻 艇 尝 运 邵 非法');
    expect(valid).toBe(false);
  });

  it('rejects empty string', async () => {
    const valid = await validateMnemonicWords('');
    expect(valid).toBe(false);
  });
});

describe('mnemonic to keypair', () => {
  it('derives a consistent keypair from a mnemonic', async () => {
    const mnemonic = await generateMnemonicWords();
    const kp1 = await mnemonicToKeyPair(mnemonic);
    const kp2 = await mnemonicToKeyPair(mnemonic);

    expect(kp1.publicKeyBytes).toEqual(kp2.publicKeyBytes);
    expect(kp1.privateKeyBytes).toEqual(kp2.privateKeyBytes);
    expect(kp1.publicKeyBech32).toBe(kp2.publicKeyBech32);
    expect(kp1.publicSigningKeyBytes).toEqual(kp2.publicSigningKeyBytes);
    expect(kp1.privateSigningKeyBytes).toEqual(kp2.privateSigningKeyBytes);
    expect(kp1.publicSigningKeyBech32).toBe(kp2.publicSigningKeyBech32);
  });

  it('produces valid bech32 public key', async () => {
    const mnemonic = await generateMnemonicWords();
    const kp = await mnemonicToKeyPair(mnemonic);
    expect(kp.publicKeyBech32).toMatch(new RegExp(`^${PUBLIC_KEY_PREFIX}1`));
    expect(kp.publicKeyBytes).toHaveLength(32);
    expect(kp.privateKeyBytes).toHaveLength(32);
    expect(kp.publicSigningKeyBytes).toHaveLength(32);
    expect(kp.privateSigningKeyBytes).toHaveLength(32);
    expect(kp.publicSigningKeyBech32).toMatch(/^hajimisig1/);
  });

  it('different mnemonics produce different keypairs', async () => {
    const m1 = await generateMnemonicWords();
    const m2 = await generateMnemonicWords();
    const kp1 = await mnemonicToKeyPair(m1);
    const kp2 = await mnemonicToKeyPair(m2);
    expect(kp1.publicKeyBytes).not.toEqual(kp2.publicKeyBytes);
  });

  it('derives keypair from Chinese mnemonic', async () => {
    const chinese = '候 铜 简 钙 氨 喜 攻 艇 尝 运 邵 吃';
    const kp = await mnemonicToKeyPair(chinese);
    expect(kp.publicKeyBytes).toHaveLength(32);
    expect(kp.privateKeyBytes).toHaveLength(32);
    expect(kp.publicKeyBech32).toMatch(new RegExp(`^${PUBLIC_KEY_PREFIX}1`));
  });

  it('Chinese and English mnemonics produce different keypairs', async () => {
    const chinese = '候 铜 简 钙 氨 喜 攻 艇 尝 运 邵 吃';
    // Known valid BIP39 English mnemonic
    const english = 'abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about';

    const kpCn = await mnemonicToKeyPair(chinese);
    const kpEn = await mnemonicToKeyPair(english);

    expect(kpCn.publicKeyBytes).not.toEqual(kpEn.publicKeyBytes);
  });

  it('throws on invalid mnemonic', async () => {
    await expect(mnemonicToKeyPair('invalid words here')).rejects.toThrow('助记词无效');
  });
});
