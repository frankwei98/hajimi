import type { HybridEnvelope } from '../../lib/crypto/hybrid/types';
import { verifyEnvelopeSender } from '../../lib/crypto/signing';

export function checkRecipientMatch(envelope: HybridEnvelope, kid: string): void {
  const found = envelope.recipients.some((r) => r.kid === kid);
  if (!found) throw new Error('该密文不是发给当前临时公钥的');
}

export function assertSignatureValid(envelope: HybridEnvelope): void {
  if (envelope.sender && !verifyEnvelopeSender(envelope)) {
    throw new Error('发送者签名验证失败');
  }
}
