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
  image?: string;
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

const SERPER_KEY = process.env.SERPER_API_KEY;

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

async function tavilySearchCompat(
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
        q,
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
      const items = await tavilySearch(
        q,
        "news",
        offset + pageSize + 1,
        false,
        signal
      );
      const all = newsResults(items);
      const results = all.slice(offset, offset + pageSize);
      return { results, hasMore: results.length === pageSize };
    }
    case "shopping": {
      const items = await tavilySearch(
        q,
        "general",
        offset + pageSize + 1,
        true,
        signal
      );
      const all = webResults(items);
      const results = all.slice(offset, offset + pageSize);
      return { results, hasMore: results.length === pageSize };
    }
    default: {
      const items = await tavilySearch(
        q,
        "general",
        offset + pageSize + 1,
        false,
        signal
      );
      const all = webResults(items);
      const results = all.slice(offset, offset + pageSize);
      return { results, hasMore: results.length === pageSize };
    }
  }
}

type SerperItem = {
  title?: string;
  link?: string;
  snippet?: string;
  date?: string;
  source?: string;
  price?: string;
  channel?: string;
  imageUrl?: string;
  thumbnailUrl?: string;
  domain?: string;
};

function serperResults(cat: SearchCategory, data: Record<string, unknown>): SearchResult[] {
  const items = (data[serperKey(cat)] ?? []) as SerperItem[];

  switch (cat) {
    case "images":
      return items.map((r) => ({
        title: r.title ?? r.source ?? "",
        url: r.link ?? "",
        snippet: r.source ?? r.domain ?? "",
        thumbnail: r.thumbnailUrl ?? r.imageUrl,
        image: r.imageUrl ?? r.thumbnailUrl,
      }));
    case "videos":
      return items.map((r) => ({
        title: r.title ?? "",
        url: r.link ?? "",
        snippet: [r.channel, r.date].filter(Boolean).join(" · "),
        thumbnail: r.imageUrl,
      }));
    case "news":
      return items.map((r) => ({
        title: r.title ?? "",
        url: r.link ?? "",
        snippet: r.snippet ?? "",
        thumbnail: r.imageUrl,
      }));
    case "shopping":
      return items.map((r) => ({
        title: r.title ?? "",
        url: r.link ?? "",
        snippet: [r.price, r.source].filter(Boolean).join(" · "),
        thumbnail: r.imageUrl ?? r.thumbnailUrl,
      }));
    default:
      return items.map((r) => ({
        title: r.title ?? "",
        url: r.link ?? "",
        snippet: r.snippet ?? "",
      }));
  }
}

function serperKey(cat: SearchCategory): string {
  switch (cat) {
    case "images":
      return "images";
    case "videos":
      return "videos";
    case "news":
      return "news";
    case "shopping":
      return "shopping";
    default:
      return "organic";
  }
}

const SERPER_PAGE_SIZE: Record<SearchCategory, number> = {
  all: 10,
  images: 20,
  videos: 10,
  news: 10,
  shopping: 40,
};

async function serperSearch(
  q: string,
  cat: SearchCategory,
  page: number,
  signal?: AbortSignal
): Promise<SearchResponse> {
  if (!SERPER_KEY) throw new Error("SERPER_API_KEY not set");

  const endpoints: Record<SearchCategory, string> = {
    all: "https://google.serper.dev/search",
    images: "https://google.serper.dev/images",
    videos: "https://google.serper.dev/videos",
    news: "https://google.serper.dev/news",
    shopping: "https://google.serper.dev/shopping",
  };

  const pageSize = SERPER_PAGE_SIZE[cat];
  const body: Record<string, unknown> = {
    q,
    num: pageSize,
    page: page + 1,
  };

  const res = await fetch(endpoints[cat], {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-KEY": SERPER_KEY,
    },
    body: JSON.stringify(body),
    signal,
    cache: "no-store",
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`Serper HTTP ${res.status} ${detail.slice(0, 200)}`);
  }
  const data = (await res.json()) as Record<string, unknown>;
  const results = serperResults(cat, data);
  const hasMore = results.length >= pageSize;
  return { results, hasMore };
}

export async function search(
  q: string,
  cat: SearchCategory,
  page: number,
  signal?: AbortSignal
): Promise<SearchResponse> {
  if (SERPER_KEY) {
    try {
      return await serperSearch(q, cat, page, signal);
    } catch (e) {
      console.warn("Serper search failed, falling back to Tavily:", e);
    }
  }
  return tavilySearchCompat(q, cat, page, signal);
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
