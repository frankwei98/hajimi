import { InstantHeader } from './instant/InstantHeader';
import { PublicKeyCard } from './instant/PublicKeyCard';
import { CipherInputPanel } from './instant/CipherInputPanel';
import { InstantResult } from './instant/InstantResult';
import { useInstantSession } from './instant/useInstantSession';

export function Instant() {
  const {
    keypair, inputText, setInputText,
    isBusy, isGenerating, initError, error, result,
    regenerate, handleDecrypt,
  } = useInstantSession();

  if (isGenerating && !keypair) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <InstantHeader />
        <p className="text-sm text-gray-500 text-center">正在生成临时密钥...</p>
      </div>
    );
  }

  if (initError) {
    return (
      <div className="max-w-xl mx-auto space-y-4">
        <InstantHeader />
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          密钥生成失败：{initError}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto space-y-4">
      <InstantHeader />
      <PublicKeyCard publicKey={keypair!.publicKeyBech32} onRegenerate={regenerate} isGenerating={isGenerating} />
      <CipherInputPanel
        value={inputText}
        onChange={setInputText}
        onDecrypt={handleDecrypt}
        isBusy={isBusy}
      />
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-700">
          {error}
        </div>
      )}
      {result && (
        <InstantResult
          title={result.title}
          content={result.content}
          raw={result.raw}
          matchedKid={result.matchedKid}
        />
      )}
    </div>
  );
}
