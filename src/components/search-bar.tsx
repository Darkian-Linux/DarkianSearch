"use client";

import { ArrowUp, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function SearchBar({
  defaultValue = "",
  large = false,
}: {
  defaultValue?: string;
  large?: boolean;
}) {
  const router = useRouter();
  const [value, setValue] = useState(defaultValue);

  useEffect(() => {
    setValue(defaultValue);
  }, [defaultValue]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-2xl gap-2">
      <div className="relative flex-1">
        <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search the web..."
          className={cnInput(large)}
          autoFocus={!large}
        />
        {value && (
          <button
            type="button"
            onClick={() => setValue("")}
            aria-label="Clear search"
            className="absolute top-1/2 right-2.5 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
          </button>
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
