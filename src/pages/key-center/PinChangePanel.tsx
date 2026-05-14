import { PinInput } from '../../components/PinInput';

type PinChangePanelProps = {
  newPin: string;
  confirmPin: string;
  onNewPinChange: (value: string) => void;
  onConfirmPinChange: (value: string) => void;
  onSubmit: () => void;
};

export function PinChangePanel({
  newPin,
  confirmPin,
  onNewPinChange,
  onConfirmPinChange,
  onSubmit,
}: PinChangePanelProps) {
  return (
    <div className="rounded-md border border-gray-200 bg-gray-50 p-4 space-y-3">
      <div className="text-sm font-semibold text-gray-800">PIN 修改</div>
      <div className="flex flex-wrap items-center gap-3">
        <PinInput value={newPin} onChange={onNewPinChange} />
        <PinInput value={confirmPin} onChange={onConfirmPinChange} onEnter={onSubmit} />
        <button
          type="button"
          onClick={onSubmit}
          className="inline-flex items-center rounded-md bg-gray-900 px-3 py-2 text-xs font-semibold text-white shadow hover:bg-gray-800"
        >
          更新 PIN
        </button>
      </div>
      <div className="text-xs text-gray-500">更新 PIN 会重新加密全部私钥，过程可能需要几秒。</div>
    </div>
  );
}
