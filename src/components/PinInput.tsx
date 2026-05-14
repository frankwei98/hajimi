import { useEffect, useRef, useState } from 'react';

interface PinInputProps {
  value: string;
  onChange: (value: string) => void;
  onEnter?: () => void;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
}

export function PinInput({
  value,
  onChange,
  onEnter,
  autoFocus,
  disabled,
  className = '',
}: PinInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [visibleIndex, setVisibleIndex] = useState<number | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const prevValueLength = useRef(value.length);

  useEffect(() => {
    if (autoFocus) {
      // Small delay to ensure the element is mounted and ready
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [autoFocus]);

  useEffect(() => {
    // If value length increased, show the last character temporarily
    if (value.length > prevValueLength.current) {
      const lastIndex = value.length - 1;
      // Use setTimeout to avoid synchronous state update warning, although in this case it's actually fine
      // because we want to trigger a re-render to show the char.
      // But strictly speaking, we can just set it directly. The linter warning is about cascading renders,
      // which is what we intentionally want here (render 1: update value, render 2: set visible index).
      // However, we can optimize by checking if it's already set? No, it's a new index.
      
      // Let's just wrap in a minimal timeout or keep it as is if it's just a warning.
      // But to be clean, let's use a ref for the index if we don't need it for render? 
      // No, we need it for render.
      
      // Better approach: Derived state? No, it's transient.
      // Let's suppress or ignore, or just use requestAnimationFrame.
      
      requestAnimationFrame(() => {
        setVisibleIndex(lastIndex);
      });

      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }

      timeoutRef.current = window.setTimeout(() => {
        setVisibleIndex(null);
      }, 1200);
    } else if (value.length < prevValueLength.current) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisibleIndex(null);
    }

    prevValueLength.current = value.length;

    return () => {
      if (timeoutRef.current) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, [value]);

  const handleClick = () => {
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onEnter) {
      e.preventDefault();
      onEnter();
    }
  };

  return (
    <div
      className={`relative ${className}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          inputRef.current?.focus();
        }
      }}
    >
      <input
        ref={inputRef}
        type="password"
        inputMode="numeric"
        autoComplete="one-time-code"
        disabled={disabled}
        value={value}
        onChange={(e) => {
          const next = e.target.value.replace(/\D/g, '').slice(0, 6);
          onChange(next);
        }}
        onKeyDown={handleKeyDown}
        className="absolute inset-0 h-full w-full opacity-0 cursor-text disabled:cursor-not-allowed"
      />
      <div className="flex gap-3 justify-center">
        {Array.from({ length: 6 }).map((_, index) => {
          const char = value[index];
          const isVisible = index === visibleIndex;
          const showDot = char && !isVisible;

          return (
            <div
              key={index}
              className={`flex h-12 w-12 items-center justify-center rounded-md border-2 transition-all duration-200 ${
                index === value.length && !disabled
                  ? 'border-gray-900 bg-gray-50 ring-2 ring-gray-200 ring-offset-1' // Active/Focus state hint
                  : 'border-gray-200 bg-white'
              } ${disabled ? 'bg-gray-100 text-gray-400' : 'text-gray-900'}`}
            >
              {isVisible ? (
                <span className="text-2xl font-mono animate-in fade-in zoom-in duration-150">
                  {char}
                </span>
              ) : showDot ? (
                <div className="h-3 w-3 rounded-full bg-gray-900 animate-in fade-in duration-200" />
              ) : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}
