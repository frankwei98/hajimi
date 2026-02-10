import { PinInput } from '../../components/PinInput';

type KeyCenterUnlockProps = {
  pin: string;
  error: string | null;
  onPinChange: (value: string) => void;
  onUnlock: () => void;
};

export function KeyCenterUnlock({ pin, error, onPinChange, onUnlock }: KeyCenterUnlockProps) {
  return (
    <div className="bg-white shadow sm:rounded-lg p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">🔐 密钥中心已锁定</h2>
        <p className="text-gray-500">检测到本地存储了密钥，请输入 PIN 以解锁。</p>
      </div>

      <div className="flex flex-col items-center gap-6 py-8">
        <PinInput value={pin} onChange={onPinChange} onEnter={onUnlock} autoFocus />

        {error && <div className="text-sm text-red-600 font-medium animate-pulse">{error}</div>}

        <button
          type="button"
          onClick={onUnlock}
          className="inline-flex items-center justify-center rounded-md bg-gray-900 px-8 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900"
        >
          立即解锁
        </button>
      </div>
    </div>
  );
}
