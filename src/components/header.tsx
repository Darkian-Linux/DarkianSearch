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
  const onHistory = pathname?.startsWith("/history") ?? false;
  const flat = onSearch || onHistory;

  return (
    <header
      className={cn(
        "flex items-center",
        flat
          ? "relative z-10 border-b border-border p-3 sm:p-4"
          : "absolute inset-x-0 top-0 items-start p-4"
      )}
    >
      {onSearch ? (
        <>
          <div className="flex w-1/3 items-center justify-start">
            <SystemClock />
          </div>
          <div className="flex w-1/3 items-center justify-center">
            <Link
              href="/"
              className="text-base font-bold tracking-tight sm:text-lg"
            >
              Darkian<span className="text-primary">Search</span>
            </Link>
          </div>
          <div className="flex w-1/3 items-center justify-end gap-1">
            <HomeButton />
            <HistoryButton />
            <ThemeToggle />
          </div>
        </>
      ) : onHistory ? (
        <>
          <SystemClock />
          <div className="flex items-center gap-1">
            <HomeButton />
            <HistoryButton disabled />
            <ThemeToggle />
          </div>
        </>
      ) : (
        <>
          <SystemClock />
          <div className="flex items-center gap-1">
            <HistoryButton />
            <ThemeToggle />
          </div>
        </>
      )}
    </header>
  );
}
