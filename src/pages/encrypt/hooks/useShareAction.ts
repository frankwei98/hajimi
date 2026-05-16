import { useAction } from 'convex/react';
import { api } from '../../../../convex/_generated/api';
import { parseEnvelope } from '../../../lib/crypto/hybrid';

export function useShareAction() {
  const upload = useAction(api.messages.uploadMessage);

  const share = async (output: string, captchaToken: string) => {
    const envelope = parseEnvelope(output);
    const messageId = await upload({
      token: captchaToken,
      message: { body: envelope },
    });
    return `${window.location.origin}/m/${messageId}`;
  };

  return { share };
}