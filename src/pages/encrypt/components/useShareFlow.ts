import { useState, useRef, useEffect } from 'react';
import type { TurnstileInstance } from '@marsidev/react-turnstile';

interface UseShareFlowReturn {
  token: string | null;
  isShareInitiated: boolean;
  turnstileRef: React.RefObject<TurnstileInstance | null>;
  showRaw: boolean;
  setShowRaw: React.Dispatch<React.SetStateAction<boolean>>;
  handleShareClick: () => void;
  setToken: (v: string | null) => void;
}

export function useShareFlow(
  shareUrl: string | null,
  isSharing: boolean,
  onShare: (token: string) => void,
): UseShareFlowReturn {
  const [showRaw, setShowRaw] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isShareInitiated, setIsShareInitiated] = useState(false);
  const turnstileRef = useRef<TurnstileInstance>(null);

  useEffect(() => {
    if (isShareInitiated && token && !isSharing && !shareUrl) {
      onShare(token);
    }
  }, [token, isShareInitiated, isSharing, shareUrl, onShare]);

  const handleShareClick = () => {
    setIsShareInitiated(true);
    if (!token) {
      turnstileRef.current?.reset();
    }
  };

  return { token, isShareInitiated, turnstileRef, showRaw, setShowRaw, handleShareClick, setToken };
}