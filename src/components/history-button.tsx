import Link from "next/link";
import { Clock } from "lucide-react";

import { Button } from "@/components/ui/button";

export function HistoryButton() {
  return (
    <Button variant="ghost" size="icon" asChild>
      <Link href="/history" aria-label="View search history">
        <Clock className="h-5 w-5" />
      </Link>
    </Button>
  );
}
