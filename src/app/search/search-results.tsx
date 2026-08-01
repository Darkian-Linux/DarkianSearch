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
import { useEffect, useState } from "react";

import { SearchBar } from "@/components/search-bar";
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!q) return;
    setLoading(true);
    setError(null);
    const controller = new AbortController();
    fetch(`/api/search?q=${encodeURIComponent(q)}&c=${cat}`, {
      signal: controller.signal,
    })
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else setResults(data.results ?? []);
      })
      .catch((e) => {
        if (e.name !== "AbortError") setError("Search request failed.");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [q, cat]);

  if (!q) {
    return (
      <div className="text-muted-foreground flex flex-1 flex-col items-center justify-center gap-4">
        <p>Enter a query to search.</p>
        <div className="w-full max-w-2xl px-4">
          <SearchBar />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
      <SearchBar defaultValue={q} />

      <nav className="border-border mt-6 flex gap-1 overflow-x-auto border-b">
        {CATEGORIES.map(({ key, label, icon: Icon }) => (
          <a
            key={key}
            href={`/search?q=${encodeURIComponent(q)}&c=${key}`}
            className={cn(
              "text-muted-foreground hover:text-foreground flex items-center gap-2 rounded-t-md px-4 py-2 text-sm font-medium transition-colors",
              cat === key &&
                "text-primary border-primary border-b-2 hover:text-primary"
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </a>
        ))}
      </nav>

      {loading ? (
        <div className="text-muted-foreground flex flex-col items-center gap-3 py-24">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm">Searching for &quot;{q}&quot;...</p>
        </div>
      ) : error ? (
        <div className="text-destructive py-24 text-center">
          <p className="text-lg font-medium">{error}</p>
          <p className="text-muted-foreground mt-2 text-sm">
            The upstream search provider may be rate-limiting. Try again shortly.
          </p>
        </div>
      ) : results.length === 0 ? (
        <div className="text-muted-foreground py-24 text-center">
          <p className="text-lg font-medium">No results found.</p>
          <p className="mt-2 text-sm">Try different keywords.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          <p className="text-muted-foreground text-sm">
            {results.length} results for &quot;{q}&quot;
          </p>

          {cat === "images" ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {results.map((r, i) => (
                <a
                  key={i}
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group overflow-hidden rounded-lg border border-border bg-card"
                >
                  <div className="bg-muted flex h-40 items-center justify-center overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={r.thumbnail || r.url}
                      alt={r.title}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-card-foreground line-clamp-2 p-3 text-xs font-medium">
                    {r.title}
                  </p>
                </a>
              ))}
            </div>
          ) : (
            results.map((r, i) => (
              <div key={i}>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  <p className="text-muted-foreground truncate text-xs">
                    {r.url.replace(/^https?:\/\//, "")}
                  </p>
                  <h2 className="group-hover:text-primary text-foreground mt-0.5 text-lg leading-snug font-medium group-hover:underline">
                    {r.title}
                  </h2>
                  {r.snippet && (
                    <p className="text-muted-foreground mt-1 text-sm leading-relaxed">
                      {r.snippet}
                    </p>
                  )}
                </a>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
