/**
 * A small in-memory + session-storage queue for actions the user tried
 * to perform while signed out (e.g. clicking a product). After successful
 * sign-in, the App component reads the pending action and replays it.
 */

export type PendingAuthAction = 'viewProduct';

export interface PendingAuthPayload {
  action: PendingAuthAction;
  payload?: unknown;
}

const STORAGE_KEY = 'mobile-expert:pending-auth';

/** Persist a pending action so it survives a page refresh. */
export const PendingAuth = {
  set(entry: PendingAuthPayload): void {
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entry));
    } catch {
      // sessionStorage might be unavailable (private mode); fall back to memory
      inMemory = entry;
    }
  },

  /** Read the pending action without removing it. */
  peek(): PendingAuthPayload | null {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY);
      if (raw) return JSON.parse(raw) as PendingAuthPayload;
    } catch {
      // ignore
    }
    return inMemory;
  },

  /** Read the pending action and clear it (one-shot). */
  consume(): PendingAuthPayload | null {
    const value = this.peek();
    if (value) this.clear();
    return value;
  },

  clear(): void {
    try {
      sessionStorage.removeItem(STORAGE_KEY);
    } catch {
      // ignore
    }
    inMemory = null;
  },
};

let inMemory: PendingAuthPayload | null = null;
