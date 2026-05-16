import { useState, useMemo } from "react";
import { isHajimiPublicKey } from "../../../lib/crypto/x25519";

export function useRecipientManager(recipientKeyText: string) {
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);

  const recipientCount = useMemo(() => {
    const manualCount = recipientKeyText
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean).length;
    return manualCount + selectedRecipients.length;
  }, [recipientKeyText, selectedRecipients]);

  const formatWarning = useMemo(() => {
    const firstLine = recipientKeyText.split(/[\n,]+/)[0]?.trim();
    if (firstLine && !isHajimiPublicKey(firstLine)) {
      return "检测到可能的格式问题，请确认前缀为 hajimi";
    }
    return "";
  }, [recipientKeyText]);

  const toggleRecipient = (publicKey: string) => {
    setSelectedRecipients((prev) =>
      prev.includes(publicKey)
        ? prev.filter((kid) => kid !== publicKey)
        : [...prev, publicKey],
    );
  };

  return { selectedRecipients, recipientCount, formatWarning, toggleRecipient };
}