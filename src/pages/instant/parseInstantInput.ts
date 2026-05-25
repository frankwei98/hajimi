export type InstantInput =
  | { type: 'message-link'; messageId: string }
  | { type: 'ciphertext'; text: string };

export function parseInstantInput(raw: string): InstantInput {
  const trimmed = raw.trim();
  if (!trimmed) throw new Error('请输入密文或消息链接');

  try {
    const url = trimmed.startsWith('http') ? new URL(trimmed) : new URL(trimmed, 'http://x');
    const match = url.pathname.match(/^\/m\/([^/]+)\/?$/);
    if (match) return { type: 'message-link', messageId: match[1] };
  } catch {
    // not a URL, fall through to ciphertext
  }

  const pathMatch = trimmed.match(/^\/m\/([^/\s]+)\/?$/);
  if (pathMatch) return { type: 'message-link', messageId: pathMatch[1] };

  return { type: 'ciphertext', text: trimmed };
}
