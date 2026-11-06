// The new-poll draft's pictures. The rest of the draft is small text and lives
// in localStorage; pictures are files, which localStorage cannot hold (strings
// only, ~5 MB per site), so they go to IndexedDB, which stores Blobs as they
// are. One record, replaced on every change. Every call fails soft: no
// IndexedDB (private mode, blocked storage) just means the pictures are not
// kept, as before.

const DB_NAME = 'opinio-drafts';
const STORE = 'files';
const KEY = 'add-poll';

export interface DraftImages {
  /** The poll's picture. */
  main: File | null;
  /** One entry per answer, by position. */
  options: (File | null)[];
}

function open(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => req.result.createObjectStore(STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function run<T>(mode: IDBTransactionMode, act: (s: IDBObjectStore) => IDBRequest<T>): Promise<T | undefined> {
  try {
    const db = await open();
    return await new Promise<T>((resolve, reject) => {
      const req = act(db.transaction(STORE, mode).objectStore(STORE));
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    }).finally(() => db.close());
  } catch {
    return undefined;
  }
}

export async function saveDraftImages(images: DraftImages): Promise<void> {
  if (!images.main && !images.options.some(Boolean)) return clearDraftImages();
  await run('readwrite', (s) => s.put(images, KEY));
}

export async function loadDraftImages(): Promise<DraftImages | null> {
  const v = await run<DraftImages | undefined>('readonly', (s) => s.get(KEY));
  if (!v) return null;
  return {
    main: v.main instanceof Blob ? v.main : null,
    options: Array.isArray(v.options) ? v.options.map((f) => (f instanceof Blob ? f : null)) : [],
  };
}

export async function clearDraftImages(): Promise<void> {
  await run('readwrite', (s) => s.delete(KEY));
}
