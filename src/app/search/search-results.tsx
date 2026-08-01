"use client";

import {
  Globe,
  Image,
  Video,
  Newspaper,
  ShoppingBag,
  Loader2,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { SearchBar } from "@/components/search-bar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { SearchCategory, SearchResult } from "@/lib/search";

const CATEGORIES: { key: SearchCategory; label: string; icon: typeof Globe }[] = [
  { key: "all", label: "All", icon: Globe },
  { key: "images", label: "Images", icon: Image },
  { key: "videos", label: "Videos", icon: Video },
  { key: "news", label: "News", icon: Newspaper },
  { key: "shopping", label: "Shopping", icon: ShoppingBag },
];

export function SearchResults() {
  const sp = useSearchParams();
  const q = sp.get("q") ?? "";
  const cat = (sp.get("c") ?? "all") as SearchCategory;

  const [results, setResults] = useState<SearchResult[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  const doFetch = useCallback(
    async (targetPage: number, signal: AbortSignal) => {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(q)}&c=${cat}&page=${targetPage}`,
        { signal }
      );
      const data = await res.json();
      if (data.error) {
        setError(data.error);
        return;
      }
      setResults((prev) =>
        targetPage === 0 ? data.results : [...prev, ...data.results]
      );
      setHasMore(data.hasMore);
      setError(null);
    },
    [q, cat]
  );

  useEffect(() => {
    if (!q) return;
    setPage(0);
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    doFetch(0, controller.signal)
      .catch((e) => {
        if (e.name !== "AbortError") setError("Search request failed.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [q, cat, doFetch]);

  function loadMore() {
    const next = page + 1;
    setPage(next);
    setLoadingMore(true);
    const controller = new AbortController();
    doFetch(next, controller.signal)
      .catch((e) => {
        if (e.name !== "AbortError") setError("Search request failed.");
      })
      .finally(() => setLoadingMore(false));
  }

  if (!q) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-4">
        <p className="text-muted-foreground">Enter a query to search.</p>
        <div className="w-full max-w-2xl">
          <SearchBar />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <SearchBar defaultValue={q} />

      <nav className="mt-6 flex gap-1 overflow-x-auto border-b border-border">
        {CATEGORIES.map(({ key, label, icon: Icon }) => (
          <a
            key={key}
            href={`/search?q=${encodeURIComponent(q)}&c=${key}`}
            className={cn(
              "flex shrink-0 items-center gap-1.5 rounded-t-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground sm:px-4",
              cat === key &&
                "border-b-2 border-primary text-primary hover:text-primary"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </a>
        ))}
      </nav>

      {loading ? (
        <div className="flex flex-col items-center gap-3 py-24 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Searching for &quot;{q}&quot;...</p>
        </div>
      ) : error ? (
        <div className="py-24 text-center">
          <p className="text-lg font-medium text-destructive">{error}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            Try a different query or try again shortly.
          </p>
        </div>
      ) : results.length === 0 ? (
        <div className="py-24 text-center text-muted-foreground">
          <p className="text-lg font-medium">No results found.</p>
          <p className="mt-2 text-sm">Try different keywords.</p>
        </div>
      ) : (
        <div className="mt-6">
          <p className="mb-4 text-sm text-muted-foreground">
            {results.length} result{results.length === 1 ? "" : "s"} for &quot;{q}&quot;
          </p>

          {cat === "images" ? (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {results.map((r, i) => (
                <a
                  key={i}
                  href={r.url}
                  className="group overflow-hidden rounded-lg border border-border bg-card"
                >
                  <div className="flex h-36 items-center justify-center overflow-hidden bg-muted sm:h-40">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r.thumbnail || r.url}
                      alt={r.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <p className="line-clamp-2 p-2.5 text-xs font-medium text-card-foreground">
                    {r.title}
                  </p>
                </a>
              ))}
            </div>
          ) : (
            <div className="space-y-6">
              {results.map((r, i) => (
                <div key={i}>
                  <a href={r.url} className="group block">
                    <p className="truncate text-xs text-muted-foreground">
                      {r.url.replace(/^https?:\/\//, "")}
                    </p>
                    <h2 className="mt-0.5 text-lg font-medium leading-snug text-foreground group-hover:text-primary group-hover:underline">
                      {r.title}
                    </h2>
                    {r.snippet && (
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {r.snippet}
                      </p>
                    )}
                  </a>
                </div>
              ))}
            </div>
          )}

          {hasMore && (
            <div className="mt-8 flex justify-center">
              <Button
                variant="outline"
                onClick={loadMore}
                disabled={loadingMore}
                className="rounded-full px-8"
              >
                {loadingMore && <Loader2 className="h-4 w-4 animate-spin" />}
                Load more
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
