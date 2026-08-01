"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { HomeButton } from "@/components/home-button";
import { HistoryButton } from "@/components/history-button";
import { SystemClock } from "@/components/system-clock";
import { ThemeToggle } from "@/components/theme-toggle";
import { cn } from "@/lib/utils";

export function Header() {
  const pathname = usePathname();
  const onSearch = pathname?.startsWith("/search") ?? false;

  return (
    <header
      className={cn(
        "flex items-center justify-between",
        onSearch
          ? "relative z-10 border-b border-border p-3 sm:p-4"
          : "absolute inset-x-0 top-0 items-start p-4"
      )}
    >
      {onSearch ? (
        <Link
          href="/"
          className="flex items-center gap-2 text-base font-bold tracking-tight text-primary sm:text-lg"
        >
          Darkian
          <span className="text-foreground">Search</span>
        </Link>
      ) : (
        <SystemClock />
      )}

      <div className="flex shrink-0 items-center gap-1">
        <HistoryButton />
        {onSearch && <HomeButton />}
        <ThemeToggle />
      </div>
    </header>
  );
}
