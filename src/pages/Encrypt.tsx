import { useEncryptComposer } from './encrypt/hooks/useEncryptComposer';
import { TITLE_LIMIT, CONTENT_LIMIT } from './encrypt/constants';
import { EncryptHeader } from './encrypt/components/EncryptHeader';
import { RecipientInputPanel } from './encrypt/components/RecipientInputPanel';
import { RecipientKeyPicker } from './encrypt/components/RecipientKeyPicker';
import { MessageEditor } from './encrypt/components/MessageEditor';
import { EncryptOutputPanel } from './encrypt/components/EncryptOutputPanel';
import { ErrorAlert } from '../components/ErrorAlert';

export function Encrypt() {
  const {
    recipientKeyText,
    setRecipientKeyText,
    selectedRecipients,
    title,
    content,
    output,
    error,
    isEncrypting,
    isSharing,
    shareUrl,
    keys,
    recipientCount,
    formatWarning,
    outputFormat,
    setOutputFormat,
    contacts,
    expiryHours,
    setExpiryHours,
    handleTitleChange,
    handleContentChange,
    toggleRecipient,
    encrypt,
    share,
    copyOutput,
    copyShareUrl,
  } = useEncryptComposer();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white shadow sm:rounded-lg overflow-hidden">
        <EncryptHeader />

        <div className="p-6 space-y-6">
          <RecipientInputPanel
            value={recipientKeyText}
            onChange={setRecipientKeyText}
            recipientCount={recipientCount}
            formatWarning={formatWarning}
          />

          <RecipientKeyPicker
            keys={keys}
            contacts={contacts}
            selectedRecipients={selectedRecipients}
            onToggle={toggleRecipient}
          />

          <MessageEditor
            title={title}
            content={content}
            onTitleChange={handleTitleChange}
            onContentChange={handleContentChange}
            titleLimit={TITLE_LIMIT}
            contentLimit={CONTENT_LIMIT}
          />

          <ErrorAlert error={error} />

          <EncryptOutputPanel
            output={output}
            onCopy={copyOutput}
            onShare={share}
            onEncrypt={encrypt}
            onCopyShareUrl={copyShareUrl}
            isEncrypting={isEncrypting}
            isSharing={isSharing}
            shareUrl={shareUrl}
            outputFormat={outputFormat}
            onOutputFormatChange={setOutputFormat}
            expiryHours={expiryHours}
            onExpiryHoursChange={setExpiryHours}
          />
        </div>
      </div>
    </div>
  );
}
