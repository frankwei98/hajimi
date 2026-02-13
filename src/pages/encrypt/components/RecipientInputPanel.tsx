import { Key } from 'lucide-react';

interface RecipientInputPanelProps {
  value: string;
  onChange: (value: string) => void;
  recipientCount: number;
  formatWarning: string;
}

export function RecipientInputPanel({ value, onChange, recipientCount, formatWarning }: RecipientInputPanelProps) {
  return (
    <div>
      <label htmlFor="public-key" className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-1">
        <Key className="w-4 h-4" />
        收件人公钥（可多行）
      </label>
      <div className="mt-1">
        <textarea
          id="public-key"
          rows={4}
          className="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md p-3 border resize-none font-mono text-xs"
          placeholder="每行一个 hajimi... 公钥"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      <p className="mt-1 text-xs text-gray-500">
        当前 {recipientCount} 个收件人。{formatWarning}
      </p>
    </div>
  );
}
