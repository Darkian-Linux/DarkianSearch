"use client";

import { Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

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

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = value.trim();
    if (!q) return;
    router.push(`/search?q=${encodeURIComponent(q)}`);
  }

  return (
    <form onSubmit={submit} className="flex w-full max-w-2xl gap-2">
      <div className="relative flex-1">
        <Search className="text-muted-foreground absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2" />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Search the web..."
          className={`border-border bg-card shadow-lg placeholder:text-muted-foreground pl-12 ${
            large ? "h-14 rounded-full text-lg" : "h-11 rounded-full text-base"
          }`}
          autoFocus={!large}
        />
      </div>
      <Button
        type="submit"
        className={large ? "h-14 rounded-full px-8 text-base" : "h-11 rounded-full px-6"}
      >
        Search
      </Button>
    </form>
  );
}
