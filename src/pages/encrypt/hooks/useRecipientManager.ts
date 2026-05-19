import { useState, useMemo, useEffect } from "react";
import { isHajimiPublicKey } from "../../../lib/crypto/x25519";
import { listContacts } from "../../../lib/storage/contactsStore";
import type { Contact } from "../../../lib/storage/types";

export function useRecipientManager(recipientKeyText: string) {
  const [selectedRecipients, setSelectedRecipients] = useState<string[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);

  useEffect(() => {
    listContacts().then(setContacts).catch(() => undefined);
    const handler = () => { listContacts().then(setContacts).catch(() => undefined); };
    window.addEventListener('hajimi:contactsChanged', handler);
    return () => window.removeEventListener('hajimi:contactsChanged', handler);
  }, []);

  const recipientCount = useMemo(() => {
    const manualKeys = recipientKeyText
      .split(/[\n,]+/)
      .map((item) => item.trim())
      .filter(Boolean)
      .filter(isHajimiPublicKey);
    const allKeys = new Set([...manualKeys, ...selectedRecipients]);
    return allKeys.size;
  }, [recipientKeyText, selectedRecipients]);

  const formatWarning = useMemo(() => {
    const firstLine = recipientKeyText.split(/[\n,]+/)[0]?.trim();
    if (firstLine && !isHajimiPublicKey(firstLine)) {
      return "检测到可能的格式问题，请确认前缀为 hajimi";
    }
    const lines = recipientKeyText.split(/[\n,]+/).map((l) => l.trim()).filter(Boolean);
    const validCount = lines.filter(isHajimiPublicKey).length;
    if (lines.length > 0 && validCount < lines.length) {
      return `${lines.length - validCount} 个无效公钥已被忽略`;
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

  return { selectedRecipients, recipientCount, formatWarning, toggleRecipient, contacts };
}