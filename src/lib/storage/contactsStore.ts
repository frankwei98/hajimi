import type { Contact } from './types';
import { openDb } from './keyStore';

const STORE_NAME = 'contacts';

export async function listContacts(): Promise<Contact[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as Contact[]);
    request.onerror = () => reject(request.error ?? new Error('读取联系人失败'));
  });
}

export async function addContact(contact: Contact): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(contact);
    tx.oncomplete = () => {
      window.dispatchEvent(new CustomEvent('hajimi:contactsChanged'));
      resolve();
    };
    tx.onerror = () => reject(tx.error ?? new Error('写入联系人失败'));
  });
}

export async function deleteContact(contactId: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(contactId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('删除联系人失败'));
  });
}

export async function getContactByPublicKey(publicKeyBech32: string): Promise<Contact | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('publicKeyBech32');
    const request = index.get(publicKeyBech32);
    request.onsuccess = () => resolve((request.result as Contact | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error('查找联系人失败'));
  });
}
