import { useRef } from 'react';

interface ImportExportActionsProps {
  onExport: () => void;
  onImport: (file: File) => Promise<void> | void;
}

export function ImportExportActions({ onExport, onImport }: ImportExportActionsProps) {
  const importInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={onExport}
        className="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
      >
        导出密钥包
      </button>
      <input
        ref={importInputRef}
        type="file"
        accept="application/json"
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) {
            Promise.resolve(onImport(file)).finally(() => {
              if (importInputRef.current) importInputRef.current.value = '';
            });
          }
        }}
      />
      <button
        type="button"
        onClick={() => importInputRef.current?.click()}
        className="inline-flex items-center rounded-md border border-gray-300 px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
      >
        导入密钥包
      </button>
    </div>
  );
}