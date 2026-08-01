import Link from "next/link";
import { House } from "lucide-react";

import { Button } from "@/components/ui/button";

export function HomeButton() {
  return (
    <Button variant="ghost" size="icon" asChild>
      <Link href="/" aria-label="Go to homepage">
        <House className="h-5 w-5" />
      </Link>
    </Button>
  );
}
