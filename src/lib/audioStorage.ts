const DB_NAME = "FavoleMagicheAudioDB";
const STORE_NAME = "recordings";
const DB_VERSION = 1;

function isIndexedDbSupported(): boolean {
  return typeof indexedDB !== "undefined";
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isIndexedDbSupported()) {
      reject(new Error("IndexedDB is not supported on this platform"));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
}

export async function saveAudioRecording(
  storyId: string,
  pageIndex: number,
  readerType: string,
  blob: Blob
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const key = `${storyId}_${pageIndex}_${readerType}`;
    const request = store.put(blob, key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getAudioRecording(
  storyId: string,
  pageIndex: number,
  readerType: string
): Promise<Blob | null> {
  if (!isIndexedDbSupported()) {
    return null;
  }

  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const key = `${storyId}_${pageIndex}_${readerType}`;
      const request = store.get(key);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result || null);
    });
  } catch (e) {
    console.error("Error reading audio from IndexedDB:", e);
    return null;
  }
}

export async function deleteAudioRecording(
  storyId: string,
  pageIndex: number,
  readerType: string
): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    const key = `${storyId}_${pageIndex}_${readerType}`;
    const request = store.delete(key);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

export async function getStoryRecordingsMap(
  storyId: string,
  _totalPages: number
): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  const readerTypes = ["user"];

  if (!isIndexedDbSupported()) {
    return map;
  }

  for (const reader of readerTypes) {
    const blob = await getAudioRecording(storyId, -1, reader);
    if (blob) {
      map[reader] = URL.createObjectURL(blob);
    }
  }

  return map;
}
