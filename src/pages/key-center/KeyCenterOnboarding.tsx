import { useRef } from 'react';
import { PinInput } from '../../components/PinInput';

type InitMode = 'create' | 'import';

type KeyCenterOnboardingProps = {
  initMode: InitMode;
  pin: string;
  confirmPin: string;
  error: string | null;
  notice: string | null;
  onModeChange: (mode: InitMode) => void;
  onPinChange: (value: string) => void;
  onConfirmPinChange: (value: string) => void;
  onCreate: () => void;
  onImport: (file: File, onSuccess?: () => void) => Promise<void> | void;
  onImported: () => void;
};

export function KeyCenterOnboarding({
  initMode,
  pin,
  confirmPin,
  error,
  notice,
  onModeChange,
  onPinChange,
  onConfirmPinChange,
  onCreate,
  onImport,
  onImported,
}: KeyCenterOnboardingProps) {
  const importInputRef = useRef<HTMLInputElement | null>(null);

  return (
    <div className="bg-white shadow sm:rounded-lg p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">👋 欢迎使用密钥中心</h2>
        <p className="text-gray-500">
          请设置一个 PIN 码用于加密您的私钥，或导入已有备份。
        </p>
      </div>

      <div className="flex border-b border-gray-200">
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            initMode === 'create'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => onModeChange('create')}
        >
          创建新库
        </button>
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium border-b-2 ${
            initMode === 'import'
              ? 'border-gray-900 text-gray-900'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => onModeChange('import')}
        >
          恢复备份
        </button>
      </div>

      {initMode === 'create' ? (
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="space-y-4 w-full max-w-xs">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                设置 6 位 PIN
              </label>
              <PinInput value={pin} onChange={onPinChange} autoFocus />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                确认 PIN
              </label>
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
      ) : (
        <div className="flex flex-col items-center gap-6 py-4">
          <div className="space-y-4 w-full max-w-xs">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                输入备份文件的 PIN
              </label>
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
                      if (importInputRef.current) {
                        importInputRef.current.value = '';
                      }
                    });
                  }
                }}
              />
              <button
                type="button"
                onClick={() => {
                  importInputRef.current?.click();
                }}
                className="inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
              >
                选择备份文件并导入
              </button>
            </div>
          </div>

          {error && <div className="text-sm text-red-600 font-medium animate-pulse">{error}</div>}
          {notice && <div className="text-sm text-gray-600 font-medium">{notice}</div>}
        </div>
      )}
    </div>
  );
}
