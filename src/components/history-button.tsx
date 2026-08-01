import Link from "next/link";
import { Clock } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function HistoryButton({ disabled = false }: { disabled?: boolean }) {
  if (disabled) {
    return (
      <Button
        variant="ghost"
        size="icon"
        aria-label="Search history"
        disabled
        className={cn("cursor-not-allowed opacity-40")}
      >
        <Clock className="h-5 w-5" />
      </Button>
    );
  }
  return (
    <Button variant="ghost" size="icon" asChild>
      <Link href="/history" aria-label="View search history">
        <Clock className="h-5 w-5" />
      </Link>
    </Button>
  );
}
