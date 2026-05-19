import type { StoredKey } from './types';
import { DB_NAME, DB_VERSION } from './constants';

const STORE_NAME = 'keys';

let dbInstance: IDBDatabase | null = null;

export async function openDb(): Promise<IDBDatabase> {
  if (dbInstance) {
    return Promise.resolve(dbInstance);
  }
  
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      const tx = (event.target as IDBOpenDBRequest).transaction!;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
        store.createIndex('publicKeyBech32', 'publicKeyBech32', { unique: false });
      } else {
        const store = tx.objectStore(STORE_NAME);
        if (!store.indexNames.contains('publicKeyBech32')) {
          store.createIndex('publicKeyBech32', 'publicKeyBech32', { unique: false });
        }
      }
      if (!db.objectStoreNames.contains('contacts')) {
        const contactStore = db.createObjectStore('contacts', { keyPath: 'id' });
        contactStore.createIndex('publicKeyBech32', 'publicKeyBech32', { unique: true });
        contactStore.createIndex('handle', 'handle', { unique: false });
      }
    };
    request.onsuccess = () => {
      dbInstance = request.result;
      resolve(dbInstance);
    };
    request.onerror = () => reject(request.error ?? new Error('IndexedDB 打开失败'));
    request.onblocked = () => {
      dbInstance = null;
      reject(new Error('IndexedDB 被阻塞'));
    };
  });
}

export async function listKeys(): Promise<StoredKey[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result as StoredKey[]);
    request.onerror = () => reject(request.error ?? new Error('读取密钥失败'));
  });
}

export async function addKey(entry: StoredKey): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.put(entry);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('写入密钥失败'));
  });
}

export async function updateKey(entry: StoredKey): Promise<void> {
  return addKey(entry);
}

export async function putKeys(entries: StoredKey[]): Promise<void> {
  if (entries.length === 0) return;
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    entries.forEach((entry) => store.put(entry));
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('批量写入密钥失败'));
  });
}

export async function deleteKey(entryId: string): Promise<void> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    store.delete(entryId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('删除密钥失败'));
  });
}

export async function getKeyByPublicKey(publicKeyBech32: string): Promise<StoredKey | null> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('publicKeyBech32');
    const request = index.get(publicKeyBech32);
    request.onsuccess = () => resolve((request.result as StoredKey | undefined) ?? null);
    request.onerror = () => reject(request.error ?? new Error('查找密钥失败'));
  });
}
