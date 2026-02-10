type RevealPanelProps = {
  revealedKeys: Record<string, string>;
  onHideAll: () => void;
};

export function RevealPanel({ revealedKeys, onHideAll }: RevealPanelProps) {
  const entries = Object.entries(revealedKeys);
  if (entries.length === 0) return null;

  return (
    <div className="rounded-md border border-amber-200 bg-amber-50 p-4 space-y-2">
      <div className="text-xs text-amber-700">已解锁私钥（hex）</div>
      {entries.map(([id, value]) => (
        <div key={id} className="break-all font-mono text-sm text-amber-900">
          {value}
        </div>
      ))}
      <button
        type="button"
        onClick={onHideAll}
        className="text-xs font-medium text-amber-800 hover:text-amber-900"
      >
        一键隐藏
      </button>
    </div>
  );
}
