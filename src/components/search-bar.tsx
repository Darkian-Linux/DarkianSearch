"use client";

import { ArrowUp, Clock, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { addHistory, getHistory, type HistoryEntry } from "@/lib/history";

export function SearchBar({
  defaultValue = "",
  large = false,
  showRecent = false,
}: {
  defaultValue?: string;
  large?: boolean;
  showRecent?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);
  const [recent, setRecent] = useState<HistoryEntry[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  useEffect(() => {
    if (showRecent) setRecent(getHistory());
  }, [showRecent]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(q: string) {
    addHistory(q);
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    go(q);
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-2xl gap-2">
      <div className="relative flex-1" ref={containerRef}>
        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onFocus={() => {
            if (showRecent) {
              setRecent(getHistory());
              setOpen(true);
            }
          }}
          placeholder="Search the web..."
          className={cnInput(large)}
          autoFocus={!large}
        />
        {value ? (
          <button
            type="button"
            onClick={() => setValue("")}
            aria-label="Clear search"
            className="absolute top-1/2 right-2.5 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : (
          showRecent &&
          recent.length > 0 && (
            <button
              type="button"
              onClick={() => setOpen(!open)}
              aria-label="Show search history"
              className="absolute top-1/2 right-2.5 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
            >
              <Clock className="h-3.5 w-3.5" />
            </button>
          )
        )}

        {showRecent && open && recent.length > 0 && (
          <div className="absolute top-full right-0 left-0 z-20 mt-2 overflow-hidden rounded-xl border border-border bg-card shadow-lg">
            <p className="border-b border-border px-4 py-2 text-xs font-medium text-muted-foreground">
              Recent searches
            </p>
            <ul className="max-h-64 overflow-y-auto py-1">
              {recent.map((h) => (
                <li key={`${h.query}-${h.timestamp}`}>
                  <button
                    type="button"
                    onClick={() => {
                      setValue(h.query);
                      go(h.query);
                    }}
                    className="flex w-full items-center gap-3 px-4 py-2 text-left text-sm text-foreground hover:bg-muted"
                  >
                    <Clock className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    <span className="truncate">{h.query}</span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
      <Button
        type="submit"
        aria-label="Search"
        className={
          large
            ? "h-12 w-12 shrink-0 rounded-full"
            : "h-9 w-9 shrink-0 rounded-full"
        }
      >
        <ArrowUp className={large ? "h-5 w-5" : "h-4 w-4"} />
      </Button>
    </form>
  );
}

function cnInput(large: boolean) {
  return `border-border bg-card pr-9 placeholder:text-muted-foreground rounded-full ${
    large ? "h-12 pl-10 text-lg" : "h-9 pl-9 text-sm"
  }`;
}
