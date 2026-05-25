const BASE58_ALPHABET = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';

export function bytesToBase58(bytes: Uint8Array): string {
  if (bytes.length === 0) return '';
  let zeros = 0;
  while (zeros < bytes.length && bytes[zeros] === 0) zeros += 1;
  let num = BigInt('0x' + Array.from(bytes).map((b) => b.toString(16).padStart(2, '0')).join(''));
  let encoded = '';
  const base = BigInt(58);
  while (num > 0n) {
    const remainder = Number(num % base);
    encoded = BASE58_ALPHABET[remainder] + encoded;
    num /= base;
  }
  return BASE58_ALPHABET[0].repeat(zeros) + encoded;
}

export function base58ToBytes(input: string): Uint8Array {
  if (input.length === 0) return new Uint8Array(0);
  let zeros = 0;
  while (zeros < input.length && input[zeros] === BASE58_ALPHABET[0]) zeros += 1;
  let num = 0n;
  const base = BigInt(58);
  for (let i = zeros; i < input.length; i += 1) {
    const idx = BASE58_ALPHABET.indexOf(input[i]);
    if (idx < 0) throw new Error('无效的 Base58 字符');
    num = num * base + BigInt(idx);
  }
  if (num === 0n) return new Uint8Array(zeros);
  let hex = num.toString(16);
  if (hex.length % 2 !== 0) hex = '0' + hex;
  const bytes = new Uint8Array(zeros + hex.length / 2);
  for (let i = 0; i < hex.length / 2; i += 1) {
    bytes[zeros + i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}
