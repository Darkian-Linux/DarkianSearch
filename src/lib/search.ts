export type SearchCategory =
  | "all"
  | "images"
  | "videos"
  | "news"
  | "shopping";

export type SearchResult = {
  title: string;
  url: string;
  snippet: string;
  thumbnail?: string;
};

export type SearchResponse = {
  results: SearchResult[];
  hasMore: boolean;
};

type TavilyResult = Record<string, unknown> & {
  title?: string;
  url?: string;
  content?: string;
  published_date?: string;
  images?: string[];
};

async function tavilySearch(
  query: string,
  topic: "general" | "news",
  maxResults: number,
  includeImages: boolean,
  signal?: AbortSignal,
  includeDomains?: string[]
): Promise<TavilyResult[]> {
  const res = await fetch("https://api.tavily.com/search", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Tavily-Access-Mode": "keyless",
    },
    body: JSON.stringify({
      query,
      topic,
      max_results: maxResults,
      include_images: includeImages,
      include_domains: includeDomains,
      search_depth: "basic",
    }),
    signal,
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Tavily HTTP ${res.status} ${detail.slice(0, 200)}`);
  }
  const data = (await res.json()) as { results?: TavilyResult[] };
  return data.results ?? [];
}

function webResults(items: TavilyResult[]): SearchResult[] {
  return items.map((r) => ({
    title: r.title ?? "",
    url: r.url ?? "",
    snippet: r.content ?? "",
  }));
}

function imageResults(items: TavilyResult[]): SearchResult[] {
  const out: SearchResult[] = [];
  for (const r of items) {
    const urls = r.images ?? [];
    if (urls.length === 0) continue;
    out.push({
      title: r.title ?? "",
      url: r.url ?? "",
      snippet: "",
      thumbnail: urls[0],
    });
  }
  return out;
}

function videoResults(items: TavilyResult[]): SearchResult[] {
  return items.map((r) => {
    const url = r.url ?? "";
    const id = url.match(/[?&]v=([\w-]{6,})/)?.[1] ?? "";
    const thumbnail = id
      ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg`
      : undefined;
    return {
      title: r.title ?? "",
      url,
      snippet: r.content ?? "",
      thumbnail,
    };
  });
}

function newsResults(items: TavilyResult[]): SearchResult[] {
  return items.map((r) => ({
    title: r.title ?? "",
    url: r.url ?? "",
    snippet: r.content ?? "",
  }));
}

export async function search(
  q: string,
  cat: SearchCategory,
  page: number,
  signal?: AbortSignal
): Promise<SearchResponse> {
  const pageSize = 10;
  const offset = page * pageSize;

  switch (cat) {
    case "images": {
      const items = await tavilySearch(q, "general", 20, true, signal);
      const results = imageResults(items);
      return { results, hasMore: false };
    }
    case "videos": {
      const items = await tavilySearch(
        `${q}`,
        "general",
        10,
        false,
        signal,
        ["youtube.com", "vimeo.com", "dailymotion.com", "youtube-nocookie.com"]
      );
      const results = videoResults(items);
      return { results, hasMore: false };
    }
    case "news": {
      const items = await tavilySearch(q, "news", offset + pageSize + 1, false, signal);
      const all = newsResults(items);
      const results = all.slice(offset, offset + pageSize);
      return { results, hasMore: results.length === pageSize };
    }
    case "shopping": {
      const items = await tavilySearch(q, "general", offset + pageSize + 1, true, signal);
      const all = webResults(items);
      const results = all.slice(offset, offset + pageSize);
      return { results, hasMore: results.length === pageSize };
    }
    default: {
      const items = await tavilySearch(q, "general", offset + pageSize + 1, false, signal);
      const all = webResults(items);
      const results = all.slice(offset, offset + pageSize);
      return { results, hasMore: results.length === pageSize };
    }
  }
}

export const CATEGORY_META: Record<
  SearchCategory,
  { label: string; matcher: string }
> = {
  all: { label: "All", matcher: "search" },
  images: { label: "Images", matcher: "search" },
  videos: { label: "Videos", matcher: "search" },
  news: { label: "News", matcher: "search" },
  shopping: { label: "Shopping", matcher: "search" },
};
