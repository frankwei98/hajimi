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
  onShare: (token: string, expiryHours: number | null) => void,
  expiryHours: number | null,
): UseShareFlowReturn {
  const [showRaw, setShowRaw] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [isShareInitiated, setIsShareInitiated] = useState(false);
  const turnstileRef = useRef<TurnstileInstance>(null);
  const shareTriggered = useRef(false);

  useEffect(() => {
    if (isShareInitiated && token && !isSharing && !shareUrl && !shareTriggered.current) {
      shareTriggered.current = true;
      onShare(token, expiryHours);
    }
  }, [token, isShareInitiated, isSharing, shareUrl, onShare, expiryHours]);

  const handleShareClick = () => {
    if (isShareInitiated && !token) {
      turnstileRef.current?.reset();
    }
    if (!isSharing) shareTriggered.current = false;
    setIsShareInitiated(true);
  };

  return { token, isShareInitiated, turnstileRef, showRaw, setShowRaw, handleShareClick, setToken };
}