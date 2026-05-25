import { useEffect, useRef, useState } from 'react';

export function usePinInput(value: string, autoFocus?: boolean) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [visibleIndex, setVisibleIndex] = useState<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const prevValueLength = useRef(value.length);

  useEffect(() => {
    if (autoFocus) {
      const timer = setTimeout(() => { inputRef.current?.focus(); }, 50);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  useEffect(() => {
    if (value.length > prevValueLength.current) {
      const lastIndex = value.length - 1;
      requestAnimationFrame(() => { setVisibleIndex(lastIndex); });
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
      timeoutRef.current = window.setTimeout(() => { setVisibleIndex(null); }, 1200);
    } else if (value.length < prevValueLength.current) {
      requestAnimationFrame(() => { setVisibleIndex(null); });
    }
    prevValueLength.current = value.length;
    return () => { if (timeoutRef.current) window.clearTimeout(timeoutRef.current); };
  }, [value]);

  return { inputRef, visibleIndex };
}
