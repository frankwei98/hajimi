import { usePinInput } from './usePinInput';

interface PinInputProps {
  value: string;
  onChange: (value: string) => void;
  onEnter?: () => void;
  autoFocus?: boolean;
  disabled?: boolean;
  className?: string;
}

export function PinInput({ value, onChange, onEnter, autoFocus, disabled, className = '' }: PinInputProps) {
  const { inputRef, visibleIndex } = usePinInput(value, autoFocus);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onEnter) { e.preventDefault(); onEnter(); }
  };

  return (
    <div
      className={`relative ${className}`}
      onClick={() => inputRef.current?.focus()}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); inputRef.current?.focus(); } }}
    >
      <input
        ref={inputRef}
        type="password"
        inputMode="numeric"
        autoComplete="one-time-code"
        disabled={disabled}
        value={value}
        onChange={(e) => { const next = e.target.value.replace(/\D/g, '').slice(0, 6); onChange(next); }}
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
              className={`flex h-12 w-12 items-center justify-center rounded-md border-2 transition-all duration-200 ${index === value.length && !disabled ? 'border-gray-900 bg-gray-50 ring-2 ring-gray-200 ring-offset-1' : 'border-gray-200 bg-white'} ${disabled ? 'bg-gray-100 text-gray-400' : 'text-gray-900'}`}
            >
              {isVisible ? <span className="text-2xl font-mono animate-in fade-in zoom-in duration-150">{char}</span>
                : showDot ? <div className="h-3 w-3 rounded-full bg-gray-900 animate-in fade-in duration-200" /> : null}
            </div>
          );
        })}
      </div>
    </div>
  );
}