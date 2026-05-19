import { CreateMode, ImportMode } from './OnboardingModes';

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
  onImport: (file: File, onSuccess?: (usedPin: string) => void) => Promise<void> | void;
  onImported: (usedPin: string) => void;
};

export function KeyCenterOnboarding({
  initMode, pin, confirmPin, error, notice,
  onModeChange, onPinChange, onConfirmPinChange, onCreate, onImport, onImported,
}: KeyCenterOnboardingProps) {
  return (
    <div className="bg-white shadow sm:rounded-lg p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">👋 欢迎使用密钥中心</h2>
        <p className="text-gray-500">请设置一个 PIN 码用于加密您的私钥，或导入已有备份。</p>
      </div>

      <div className="flex border-b border-gray-200">
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium border-b-2 ${initMode === 'create' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          onClick={() => onModeChange('create')}
        >
          创建新库
        </button>
        <button
          type="button"
          className={`px-4 py-2 text-sm font-medium border-b-2 ${initMode === 'import' ? 'border-gray-900 text-gray-900' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}`}
          onClick={() => onModeChange('import')}
        >
          恢复备份
        </button>
      </div>

      {initMode === 'create' ? (
        <CreateMode pin={pin} confirmPin={confirmPin} error={error} onPinChange={onPinChange} onConfirmPinChange={onConfirmPinChange} onCreate={onCreate} />
      ) : (
        <ImportMode pin={pin} error={error} notice={notice} onPinChange={onPinChange} onImport={onImport} onImported={onImported} />
      )}
    </div>
  );
}