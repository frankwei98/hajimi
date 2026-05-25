import { api } from '../../../../convex/_generated/api';
import { parseAnyEnvelope } from '../../../lib/crypto/hybrid';
import { requireBackend } from '../../../lib/backend/convexClient';

export function useShareAction() {
  const share = async (output: string, captchaToken: string, removeAt?: number) => {
    const envelope = parseAnyEnvelope(output);
    const messageId = await requireBackend().action(api.messages.uploadMessage, {
      token: captchaToken,
      message: { body: envelope },
      removeAt,
    });
    return `${window.location.origin}/m/${messageId}`;
  };

  return { share };
}
