import type { EncodingFormat } from '../../../lib/crypto/hybrid/types';

interface OutputFormatSelectorProps {
  format: EncodingFormat;
  onChange: (format: EncodingFormat) => void;
}

const FORMAT_OPTIONS: { value: EncodingFormat; label: string; desc: string }[] = [
  { value: 'json', label: 'JSON', desc: '标准格式' },
  { value: 'base58', label: 'Base58', desc: '紧凑文本' },
  { value: 'emoji', label: 'Emoji', desc: '表情符号' },
];

export function OutputFormatSelector({ format, onChange }: OutputFormatSelectorProps) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-500">输出格式：</span>
      <div className="flex rounded-md border border-gray-300 overflow-hidden">
        {FORMAT_OPTIONS.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`px-3 py-1 text-xs font-medium transition-colors ${format === opt.value ? 'bg-gray-900 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            title={opt.desc}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}
