"use client";

const DB_NAME = "voicenotes-local";
const STORE_NAME = "audio";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === "undefined") {
      reject(new Error("indexeddb_unavailable"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("indexeddb_open_failed"));
  });
}

function runRequest<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, mode);
        const request = operation(transaction.objectStore(STORE_NAME));
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error ?? new Error("indexeddb_request_failed"));
        transaction.oncomplete = () => db.close();
        transaction.onerror = () => {
          db.close();
          reject(transaction.error ?? new Error("indexeddb_transaction_failed"));
        };
      }),
  );
}

export async function saveLocalAudio(id: string, blob: Blob): Promise<void> {
  await runRequest("readwrite", (store) => store.put(blob, id));
}

export async function getLocalAudio(id: string): Promise<Blob | null> {
  const result = await runRequest<Blob | undefined>("readonly", (store) =>
    store.get(id),
  );
  return result ?? null;
}

export async function deleteLocalAudio(id: string): Promise<void> {
  await runRequest("readwrite", (store) => store.delete(id));
}
