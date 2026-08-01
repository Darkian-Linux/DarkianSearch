import { NextRequest } from "next/server";

import {
  searchAll,
  searchImages,
  searchNews,
  searchShopping,
  searchVideos,
  type SearchCategory,
  type SearchResult,
} from "@/lib/search";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 30;

const handlers: Record<SearchCategory, (q: string, s?: AbortSignal) => Promise<SearchResult[]>> = {
  all: searchAll,
  images: searchImages,
  videos: searchVideos,
  news: searchNews,
  shopping: searchShopping,
};

export async function GET(request: NextRequest) {
  const sp = request.nextUrl.searchParams;
  const q = sp.get("q")?.trim().slice(0, 200) ?? "";
  const cat = (sp.get("c") ?? "all") as SearchCategory;

  if (!q) {
    return Response.json({ error: "missing query" }, { status: 400 });
  }
  if (!(cat in handlers)) {
    return Response.json({ error: "invalid category" }, { status: 400 });
  }

  try {
    const results = await handlers[cat](q);
    return Response.json({ query: q, category: cat, results });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "search failed";
    return Response.json({ error: msg, query: q, results: [] }, { status: 502 });
  }
}
