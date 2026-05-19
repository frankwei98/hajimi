import { useRef } from 'react';
import { PinInput } from '../../components/PinInput';

interface CreateModeProps {
  pin: string;
  confirmPin: string;
  error: string | null;
  onPinChange: (v: string) => void;
  onConfirmPinChange: (v: string) => void;
  onCreate: () => void;
}

export function CreateMode({ pin, confirmPin, error, onPinChange, onConfirmPinChange, onCreate }: CreateModeProps) {
  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="space-y-4 w-full max-w-xs">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">设置 6 位 PIN</label>
          <PinInput value={pin} onChange={onPinChange} autoFocus />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">确认 PIN</label>
          <PinInput value={confirmPin} onChange={onConfirmPinChange} onEnter={onCreate} />
        </div>
      </div>
      {error && <div className="text-sm text-red-600 font-medium animate-pulse">{error}</div>}
      <button
        type="button"
        onClick={onCreate}
        className="inline-flex items-center justify-center rounded-md bg-gray-900 px-8 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"
      >
        创建加密库
      </button>
    </div>
  );
}

interface ImportModeProps {
  pin: string;
  error: string | null;
  notice: string | null;
  onPinChange: (v: string) => void;
  onImport: (file: File, onSuccess?: (usedPin: string) => void) => Promise<void> | void;
  onImported: (usedPin: string) => void;
}

export function ImportMode({ pin, error, notice, onPinChange, onImport, onImported }: ImportModeProps) {
  const importInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="flex flex-col items-center gap-6 py-4">
      <div className="space-y-4 w-full max-w-xs">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">输入备份文件的 PIN</label>
          <PinInput value={pin} onChange={onPinChange} autoFocus />
        </div>
        <div className="text-center pt-2">
          <input
            ref={importInputRef}
            type="file"
            accept="application/json"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) {
                Promise.resolve(onImport(file, onImported)).finally(() => {
                  if (importInputRef.current) importInputRef.current.value = '';
                });
              }
            }}
          />
          <button
            type="button"
            onClick={() => { importInputRef.current?.click(); }}
            className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            选择备份文件并导入
          </button>
        </div>
      </div>
      {error && <div className="text-sm text-red-600 font-medium animate-pulse">{error}</div>}
      {notice && <div className="text-sm text-gray-600 font-medium">{notice}</div>}
    </div>
  );
}