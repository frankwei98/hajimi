type RevealPanelProps = {
  revealedKeys: Record<string, string>;
  onHideAll: () => void;
};

export function RevealPanel({ revealedKeys, onHideAll }: RevealPanelProps) {
  const entries = Object.entries(revealedKeys);
  if (entries.length === 0) return null;

  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-4 space-y-2">
      <div className="text-xs text-gray-700">已解锁私钥（hex）</div>
      {entries.map(([id, value]) => (
        <div key={id} className="break-all font-mono text-sm text-gray-900">
          {value}
        </div>
      ))}
      <button
        type="button"
        onClick={onHideAll}
        className="text-xs font-medium text-gray-800 hover:text-black transition-colors"
      >
        一键隐藏
      </button>
    </div>
  );
}
