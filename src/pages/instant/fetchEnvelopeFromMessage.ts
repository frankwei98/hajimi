import type { Id } from '../../../convex/_generated/dataModel';
import { api } from '../../../convex/_generated/api';
import { hasBackend, requireBackend } from '../../lib/backend/convexClient';
import { parseEnvelope } from '../../lib/crypto/hybrid';
import type { HybridEnvelope } from '../../lib/crypto/hybrid/types';

export async function fetchEnvelopeFromMessage(messageId: string): Promise<HybridEnvelope> {
  if (!hasBackend) throw new Error('未配置后端地址，无法读取链接消息');

  const result = await requireBackend().query(api.messages.getMessage, {
    messageId: messageId as Id<'message'>,
  });
  if (!result) throw new Error('消息不存在或已过期');

  const cleanData = JSON.stringify((result as { body: unknown }).body, (_key, value) => {
    if (typeof _key === 'string' && _key.startsWith('_')) return undefined;
    return value;
  });
  return parseEnvelope(cleanData);
}
