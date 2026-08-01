import { NextRequest } from "next/server";

import { search, type SearchCategory, type SearchResponse } from "@/lib/search";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const q = sp.get("q")?.trim().slice(0, 200) ?? "";
  const cat = (sp.get("c") ?? "all") as SearchCategory;
  const page = Math.max(0, parseInt(sp.get("page") ?? "0", 10) || 0);

  const valid: SearchCategory[] = ["all", "images", "videos", "news", "shopping"];
  if (!q) {
    return Response.json({ error: "missing query" }, { status: 400 });
  }
  if (!valid.includes(cat)) {
    return Response.json({ error: "invalid category" }, { status: 400 });
  }

  try {
    const { results, hasMore } = await search(q, cat, page);
    return Response.json({ query: q, category: cat, results, hasMore });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "search failed";
    return Response.json({ error: msg, query: q, results: [], hasMore: false }, { status: 502 });
  }
}

export type { SearchResponse };
