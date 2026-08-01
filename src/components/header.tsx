"use client";

import { usePathname } from "next/navigation";

import { HomeButton } from "@/components/home-button";
import { SystemClock } from "@/components/system-clock";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  const pathname = usePathname();
  const showHome = pathname?.startsWith("/search") ?? false;

  return (
    <header className="absolute inset-x-0 top-0 flex items-start justify-between p-4">
      <SystemClock />
      <div className="flex items-center gap-1">
        {showHome && <HomeButton />}
        <ThemeToggle />
      </div>
    </header>
  );
}
