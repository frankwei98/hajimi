import { useKeyCenter } from '../lib/hooks/useKeyCenter';
import { useKeyVaultStore } from '../lib/state/keyVaultStore';
import { KeyCenterOnboarding } from './key-center/KeyCenterOnboarding';
import { KeyCenterUnlock } from './key-center/KeyCenterUnlock';
import { KeyCenterDashboard } from './key-center/KeyCenterDashboard';

export function KeyCenter() {
  const {
    isGenerating, error, notice, copiedField, pin, newPin, confirmPin,
    revealedKeys, initMode, keys, isLoaded, isUnlocked, keysCountLabel,
    setPin, setNewPin, setConfirmPin, setInitMode, handleUnlock, handleGenerate,
    handleCopy, handleToggleReveal, handleDelete, handleExport, handleImport,
    handleInitCreate, handlePinChange, setRevealedKeys, setError, setNotice,
  } = useKeyCenter();

  const { unlockVault } = useKeyVaultStore();

  if (!isLoaded) {
    return <div className="bg-white shadow sm:rounded-lg p-12 text-center text-gray-500">正在加载密钥库...</div>;
  }

  if (!isUnlocked) {
    if (keys.length === 0) {
      return (
        <KeyCenterOnboarding
          initMode={initMode} pin={pin} confirmPin={confirmPin} error={error} notice={notice}
          onModeChange={(mode) => { setInitMode(mode); setPin(''); setConfirmPin(''); setError(null); setNotice(null); }}
          onPinChange={setPin} onConfirmPinChange={setConfirmPin} onCreate={handleInitCreate}
          onImport={handleImport} onImported={() => { void unlockVault(pin); }}
        />
      );
    }
    return <KeyCenterUnlock pin={pin} error={error} onPinChange={setPin} onUnlock={handleUnlock} />;
  }

  return (
    <KeyCenterDashboard
      pin={pin} keysCountLabel={keysCountLabel} isGenerating={isGenerating} notice={notice} error={error}
      keys={keys} copiedField={copiedField} revealedKeys={revealedKeys} newPin={newPin} confirmPin={confirmPin}
      onPinChange={setPin} onGenerate={handleGenerate} onExport={handleExport} onImport={(file) => handleImport(file)}
      onCopy={handleCopy} onToggleReveal={handleToggleReveal} onDelete={(entryId) => void handleDelete(entryId)}
      onHideRevealed={() => setRevealedKeys({})} onNewPinChange={setNewPin} onConfirmPinChange={setConfirmPin}
      onPinUpdate={handlePinChange}
    />
  );
}