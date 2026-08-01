"use client";

import { Clock, Search, Trash2, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  clearHistory,
  getHistory,
  removeHistory,
  removeHistoryMany,
  type HistoryEntry,
} from "@/lib/history";
import { cn } from "@/lib/utils";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function groupByDay(
  entries: HistoryEntry[]
): { label: string; items: HistoryEntry[] }[] {
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
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (query: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(query)) {
        next.delete(query);
      } else {
        next.add(query);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === history.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(history.map((h) => h.query)));
    }
  };

  function removeOne(query: string) {
    setHistory(removeHistory(query));
    setSelected((prev) => {
      const next = new Set(prev);
      next.delete(query);
      return next;
    });
  }

  function removeSelected() {
    setHistory(removeHistoryMany([...selected]));
    setSelected(new Set());
  }

  function clearAll() {
    clearHistory();
    setHistory([]);
    setSelected(new Set());
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-6">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Clock className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">History</h1>
          {selected.size > 0 && (
            <span className="text-sm text-muted-foreground">
              {selected.size} selected
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          {selected.size > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={removeSelected}
              className="gap-1.5 rounded-full"
            >
              <Trash2 className="h-4 w-4" />
              Delete
            </Button>
          )}
          {history.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              className="gap-1.5 rounded-full"
            >
              <Trash2 className="h-4 w-4" />
              Clear all
            </Button>
          )}
        </div>
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
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAll}
              className="gap-1.5 rounded-full text-sm text-muted-foreground"
            >
              <input
                type="checkbox"
                checked={history.length > 0 && selected.size === history.length}
                onChange={toggleAll}
                className="h-4 w-4 accent-primary"
              />
              Select all
            </Button>
          </div>
          {groupByDay(history).map((group) => (
            <div key={group.label}>
              <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
                {group.label}
              </h2>
              <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                {group.items.map((h) => {
                  const isSelected = selected.has(h.query);
                  return (
                    <li
                      key={`${h.query}-${h.timestamp}`}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 transition-colors",
                        isSelected && "bg-muted"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggle(h.query)}
                        aria-label={`Select ${h.query}`}
                        className="h-4 w-4 shrink-0 accent-primary"
                      />
                      <Link
                        href={`/search?q=${encodeURIComponent(h.query)}`}
                        className="flex min-w-0 flex-1 items-center gap-3"
                      >
                        <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                        <span className="truncate font-medium hover:text-primary">
                          {h.query}
                        </span>
                      </Link>
                      <span className="hidden shrink-0 text-xs text-muted-foreground sm:block">
                        {formatDate(h.timestamp)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeOne(h.query)}
                        aria-label={`Remove ${h.query} from history`}
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted-foreground/20 hover:text-foreground"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
