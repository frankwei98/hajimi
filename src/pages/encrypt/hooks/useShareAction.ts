import { useAction } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { parseAnyEnvelope } from '../../../lib/crypto/hybrid';

export function useShareAction() {
  const upload = useAction(api.messages.uploadMessage);

  const share = async (output: string, captchaToken: string, removeAt?: number) => {
    const envelope = parseAnyEnvelope(output);
    const messageId = await upload({
      token: captchaToken,
      message: { body: envelope },
      removeAt,
    });
    return `${window.location.origin}/m/${messageId}`;
  };

  return { share };
}