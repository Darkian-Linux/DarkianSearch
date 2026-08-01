export type HistoryEntry = {
  query: string;
  timestamp: number;
};

const STORAGE_KEY = "darkian-search-history";
const MAX_ENTRIES = 200;

function isClient(): boolean {
  return typeof window !== "undefined";
}

export function getHistory(): HistoryEntry[] {
  if (!isClient()) return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as HistoryEntry[];
    return Array.isArray(parsed)
      ? parsed.sort((a, b) => b.timestamp - a.timestamp)
      : [];
  } catch {
    return [];
  }
}

export function addHistory(query: string): HistoryEntry[] {
  const q = query.trim();
  if (!q) return getHistory();
  const history = getHistory().filter(
    (h) => h.query.toLowerCase() !== q.toLowerCase()
  );
  history.unshift({ query: q, timestamp: Date.now() });
  const trimmed = history.slice(0, MAX_ENTRIES);
  if (isClient()) {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
    } catch {
      // storage full or unavailable
    }
  }
  return trimmed;
}

export function clearHistory(): void {
  if (!isClient()) return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}

function save(history: HistoryEntry[]): void {
  if (!isClient()) return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(history));
  } catch {
    // storage full or unavailable
  }
}

export function removeHistory(query: string): HistoryEntry[] {
  const history = getHistory().filter(
    (h) => h.query.toLowerCase() !== query.trim().toLowerCase()
  );
  save(history);
  return history;
}

export function removeHistoryMany(queries: string[]): HistoryEntry[] {
  const lower = new Set(queries.map((q) => q.trim().toLowerCase()));
  const history = getHistory().filter((h) => !lower.has(h.query.toLowerCase()));
  save(history);
  return history;
}
