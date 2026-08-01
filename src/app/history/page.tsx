"use client";

import { Clock, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { clearHistory, getHistory, type HistoryEntry } from "@/lib/history";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupByDay(entries: HistoryEntry[]): { label: string; items: HistoryEntry[] }[] {
  const groups: { label: string; items: HistoryEntry[] }[] = [];
  for (const e of entries) {
    const label = new Date(e.timestamp).toLocaleDateString(undefined, {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const last = groups[groups.length - 1];
    if (last && last.label === label) {
      last.items.push(e);
    } else {
      groups.push({ label, items: [e] });
    }
  }
  return groups;
}

export default function HistoryPage() {
  const [history, setHistory] = useState<HistoryEntry[]>(() => getHistory());

  function handleClear() {
    clearHistory();
    setHistory([]);
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">History</h1>
        </div>
        {history.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClear}
            className="gap-1.5 rounded-full"
          >
            <Trash2 className="h-4 w-4" />
            Clear all
          </Button>
        )}
      </div>

      {history.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-20 text-center text-muted-foreground">
          <Search className="h-10 w-10" />
          <p className="text-lg font-medium">No search history yet.</p>
          <p className="text-sm">Your searches will show up here.</p>
          <Button asChild variant="outline" className="mt-2 rounded-full">
            <Link href="/">Start searching</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-6">
          {groupByDay(history).map((group) => (
            <div key={group.label}>
              <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
                {group.label}
              </h2>
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                {group.items.map((h) => (
                  <li key={`${h.query}-${h.timestamp}`}>
                    <Link
                      href={`/search?q=${encodeURIComponent(h.query)}`}
                      className="group flex items-center justify-between gap-4 px-4 py-3 transition-colors hover:bg-muted"
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate font-medium group-hover:text-primary">
                          {h.query}
                        </span>
                      </span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatDate(h.timestamp)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
