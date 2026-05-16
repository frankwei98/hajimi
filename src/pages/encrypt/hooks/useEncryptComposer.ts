import { useState, useEffect } from "react";
import { useKeyVaultStore } from "../../../lib/state/keyVaultStore";
import { decodeBech32PublicKey } from "../../../lib/crypto/x25519";
import { encryptForRecipients, envelopeToText } from "../../../lib/crypto/hybrid";
import { utf8ToBytes } from "../../../lib/crypto/hybrid/encoding";
import { parseRecipients, mergeRecipients, validateEncryptInput } from "../utils/recipients";
import { TITLE_LIMIT, CONTENT_LIMIT } from "../constants";
import { useShareAction } from "./useShareAction";
import { useRecipientManager } from "./useRecipientManager";

export function useEncryptComposer() {
  const [recipientKeyText, setRecipientKeyText] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [output, setOutput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);

  const { keys, loadKeys } = useKeyVaultStore();
  const { share: shareAction } = useShareAction();
  const { selectedRecipients, recipientCount, formatWarning, toggleRecipient } = useRecipientManager(recipientKeyText);

  useEffect(() => { loadKeys().catch(() => undefined); }, [loadKeys]);

  const handleTitleChange = (val: string) => { if (val.length <= TITLE_LIMIT) setTitle(val); };
  const handleContentChange = (val: string) => { if (val.length <= CONTENT_LIMIT) setContent(val); };

  const encrypt = async () => {
    setError(null);
    setOutput("");
    setShareUrl(null);
    try {
      const manual = parseRecipients(recipientKeyText);
      const selected = selectedRecipients.map((kid) => ({ kid, publicKeyBytes: decodeBech32PublicKey(kid) }));
      const recipients = mergeRecipients(manual, selected);
      const validationError = validateEncryptInput(recipients, title, content);
      if (validationError) throw new Error(validationError);
      setIsEncrypting(true);
      const payload = { title: title.trim(), content: content.trim(), createdAt: new Date().toISOString() };
      const plaintext = utf8ToBytes(JSON.stringify(payload));
      const envelope = await encryptForRecipients(plaintext, recipients);
      setOutput(envelopeToText(envelope));
    } catch (err) {
      setError(err instanceof Error ? err.message : "加密失败");
    } finally {
      setIsEncrypting(false);
    }
  };

  const share = async (captchaToken: string) => {
    if (!output) return;
    setError(null);
    setIsSharing(true);
    try {
      const url = await shareAction(output, captchaToken);
      setShareUrl(url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "上传分享失败");
    } finally {
      setIsSharing(false);
    }
  };

  const copyOutput = async () => { if (output) await navigator.clipboard.writeText(output); };
  const copyShareUrl = async () => { if (shareUrl) await navigator.clipboard.writeText(shareUrl); };

  return {
    recipientKeyText, setRecipientKeyText, selectedRecipients,
    title, content, output, error, isEncrypting, isSharing, shareUrl,
    keys, recipientCount, formatWarning,
    handleTitleChange, handleContentChange, toggleRecipient,
    encrypt, share, copyOutput, copyShareUrl,
  };
}