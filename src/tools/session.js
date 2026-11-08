import { useEffect, useRef } from 'react';

const PREFIX = 'rb-tools';
const VERSION = 1;
const DB_NAME = 'rb-tools-session';
const STORE = 'files';
const MAX_AGE = 24 * 60 * 60 * 1000;

const storage = () => {
  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
};

const stateKey = tool => `${PREFIX}:${tool}:v${VERSION}`;

export function sessionId() {
  const store = storage();
  if (!store) return 'none';
  try {
    let id = store.getItem(`${PREFIX}:session`);
    if (!id) {
      id = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
      store.setItem(`${PREFIX}:session`, id);
    }
    return id;
  } catch {
    return 'none';
  }
}

export function readSession(tool) {
  try {
    const raw = storage()?.getItem(stateKey(tool));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeSession(tool, value) {
  try {
    const store = storage();
    if (!store) return false;
    if (value == null) store.removeItem(stateKey(tool));
    else store.setItem(stateKey(tool), JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

let dbPromise = null;

function openDb() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise(resolve => {
    try {
      if (!window.indexedDB) return resolve(null);
      const request = window.indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE)) db.createObjectStore(STORE, { keyPath: 'key' });
      };
      request.onsuccess = () => {
        const db = request.result;
        prune(db);
        resolve(db);
      };
      request.onerror = () => resolve(null);
      request.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

function prune(db) {
  try {
    const current = sessionId();
    const cutoff = Date.now() - MAX_AGE;
    const tx = db.transaction(STORE, 'readwrite');
    const cursor = tx.objectStore(STORE).openCursor();
    cursor.onsuccess = () => {
      const entry = cursor.result;
      if (!entry) return;
      const value = entry.value;
      if (value.session !== current && (value.updated || 0) < cutoff) entry.delete();
      entry.continue();
    };
  } catch {
    return;
  }
}

function run(mode, action) {
  return openDb().then(
    db =>
      new Promise(resolve => {
        if (!db) return resolve(null);
        try {
          const tx = db.transaction(STORE, mode);
          const request = action(tx.objectStore(STORE));
          tx.oncomplete = () => resolve(request ? request.result : true);
          tx.onerror = () => resolve(null);
          tx.onabort = () => resolve(null);
        } catch {
          resolve(null);
        }
      })
  );
}

const fileKey = (tool, slot) => `${sessionId()}:${tool}:${slot}`;

export function saveFile(tool, slot, blob, meta = {}) {
  if (!blob) return Promise.resolve(null);
  return run('readwrite', store =>
    store.put({ key: fileKey(tool, slot), session: sessionId(), tool, slot, blob, meta, updated: Date.now() })
  );
}

export function loadFile(tool, slot) {
  return run('readonly', store => store.get(fileKey(tool, slot))).then(record =>
    record && record.blob ? { blob: record.blob, meta: record.meta || {} } : null
  );
}

export function removeFile(tool, slot) {
  return run('readwrite', store => store.delete(fileKey(tool, slot)));
}

export function clearFiles(tool, keep = []) {
  const prefix = `${sessionId()}:${tool}:`;
  return run('readwrite', store => {
    const cursor = store.openCursor();
    cursor.onsuccess = () => {
      const entry = cursor.result;
      if (!entry) return;
      if (String(entry.key).startsWith(prefix) && !keep.includes(entry.value.slot)) entry.delete();
      entry.continue();
    };
    return null;
  });
}

export function clearSession(tool) {
  writeSession(tool, null);
  return clearFiles(tool);
}

export function useSessionSave(tool, value, { delay = 250, enabled = true } = {}) {
  const latest = useRef(value);
  const armed = useRef(enabled);
  latest.current = value;
  armed.current = enabled;

  useEffect(() => {
    if (!enabled) return undefined;
    const id = window.setTimeout(() => writeSession(tool, latest.current), delay);
    return () => window.clearTimeout(id);
  }, [tool, value, delay, enabled]);

  useEffect(() => {
    const flush = () => {
      if (armed.current) writeSession(tool, latest.current);
    };
    window.addEventListener('pagehide', flush);
    return () => {
      window.removeEventListener('pagehide', flush);
      flush();
    };
  }, [tool]);
}
