import { Complaint } from '../types';

const DB_NAME = 'SahaayAI_MetroDB';
const DB_VERSION = 1;
const STORE_COMPLAINTS = 'complaints';
const STORE_META = 'metadata';

class LocalStorageFallback {
  private key = 'sahaay_complaints_backup';

  getAll(): Complaint[] {
    try {
      const data = localStorage.getItem(this.key);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  saveAll(complaints: Complaint[]): void {
    try {
      localStorage.setItem(this.key, JSON.stringify(complaints));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }
}

const fallback = new LocalStorageFallback();

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!window.indexedDB) {
      reject(new Error('IndexedDB not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_COMPLAINTS)) {
        const complaintStore = db.createObjectStore(STORE_COMPLAINTS, { keyPath: 'id' });
        complaintStore.createIndex('by_priority', 'priority', { unique: false });
        complaintStore.createIndex('by_department', 'department', { unique: false });
        complaintStore.createIndex('by_syncStatus', 'syncStatus', { unique: false });
        complaintStore.createIndex('by_createdAt', 'createdAt', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function getAllComplaints(): Promise<Complaint[]> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_COMPLAINTS, 'readonly');
      const store = transaction.objectStore(STORE_COMPLAINTS);
      const request = store.getAll();

      request.onsuccess = () => {
        const result = request.result as Complaint[];
        // keep fallback synced
        fallback.saveAll(result);
        resolve(result);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB read failed, falling back to LocalStorage', err);
    return fallback.getAll();
  }
}

export async function saveComplaint(complaint: Complaint): Promise<Complaint> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_COMPLAINTS, 'readwrite');
      const store = transaction.objectStore(STORE_COMPLAINTS);
      const request = store.put(complaint);

      request.onsuccess = () => {
        // also update fallback
        const current = fallback.getAll();
        const index = current.findIndex((c) => c.id === complaint.id);
        if (index >= 0) {
          current[index] = complaint;
        } else {
          current.unshift(complaint);
        }
        fallback.saveAll(current);
        resolve(complaint);
      };
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.warn('IndexedDB put failed, using LocalStorage fallback', err);
    const current = fallback.getAll();
    const index = current.findIndex((c) => c.id === complaint.id);
    if (index >= 0) {
      current[index] = complaint;
    } else {
      current.unshift(complaint);
    }
    fallback.saveAll(current);
    return complaint;
  }
}

export async function saveBulkComplaints(complaints: Complaint[]): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_COMPLAINTS, 'readwrite');
      const store = transaction.objectStore(STORE_COMPLAINTS);

      for (const item of complaints) {
        store.put(item);
      }

      transaction.oncomplete = () => {
        // sync fallback
        const existing = fallback.getAll();
        const map = new Map<string, Complaint>();
        existing.forEach((e) => map.set(e.id, e));
        complaints.forEach((c) => map.set(c.id, c));
        fallback.saveAll(Array.from(map.values()));
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    });
  } catch (err) {
    console.warn('IndexedDB bulk put failed, using LocalStorage fallback', err);
    const existing = fallback.getAll();
    const map = new Map<string, Complaint>();
    existing.forEach((e) => map.set(e.id, e));
    complaints.forEach((c) => map.set(c.id, c));
    fallback.saveAll(Array.from(map.values()));
  }
}

export async function updateComplaint(id: string, updates: Partial<Complaint>): Promise<Complaint | null> {
  const all = await getAllComplaints();
  const existing = all.find((c) => c.id === id);
  if (!existing) return null;

  const updated: Complaint = {
    ...existing,
    ...updates,
    updatedAt: new Date().toISOString(),
    // if changes were made and not specifically marked synced, mark as Pending Sync
    syncStatus: updates.syncStatus || (existing.syncStatus === 'Synced' ? 'Pending Sync' : existing.syncStatus)
  };

  await saveComplaint(updated);
  return updated;
}

export async function deleteComplaint(id: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_COMPLAINTS, 'readwrite');
      const store = transaction.objectStore(STORE_COMPLAINTS);
      const req = store.delete(id);
      req.onsuccess = () => {
        const current = fallback.getAll().filter((c) => c.id !== id);
        fallback.saveAll(current);
        resolve(true);
      };
      req.onerror = () => resolve(false);
    });
  } catch {
    const current = fallback.getAll().filter((c) => c.id !== id);
    fallback.saveAll(current);
    return true;
  }
}

export async function clearAllComplaints(): Promise<void> {
  try {
    const db = await openDB();
    const transaction = db.transaction(STORE_COMPLAINTS, 'readwrite');
    transaction.objectStore(STORE_COMPLAINTS).clear();
    fallback.saveAll([]);
  } catch {
    fallback.saveAll([]);
  }
}

export async function setMetaItem(key: string, value: any): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_META, 'readwrite');
    tx.objectStore(STORE_META).put({ key, value, timestamp: new Date().toISOString() });
  } catch {
    localStorage.setItem(`sahaay_meta_${key}`, JSON.stringify(value));
  }
}

export async function getMetaItem<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_META, 'readonly');
      const req = tx.objectStore(STORE_META).get(key);
      req.onsuccess = () => resolve(req.result ? req.result.value : null);
      req.onerror = () => resolve(null);
    });
  } catch {
    const val = localStorage.getItem(`sahaay_meta_${key}`);
    return val ? JSON.parse(val) : null;
  }
}
