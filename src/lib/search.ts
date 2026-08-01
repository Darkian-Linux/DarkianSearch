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

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36";

async function fetchText(url: string, signal?: AbortSignal): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "*/*" },
    signal,
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.text();
}

function decodeHtml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/<[^>]+>/g, "");
}

function extractUrl(raw: string): string {
  const m = raw.match(/uddg=([^&]+)/);
  if (m) {
    try {
      return decodeURIComponent(m[1]);
    } catch {
      return m[1];
    }
  }
  return raw;
}

export async function searchAll(
  q: string,
  signal?: AbortSignal
): Promise<SearchResult[]> {
  const html = await fetchText(
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}`,
    signal
  );
  const results: SearchResult[] = [];
  const re = /<div[^>]*class="result[^"]*"[^>]*>([\s\S]*?)(?=<div[^>]*class="result|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null && results.length < 12) {
    const block = m[1];
    const t = block.match(
      /class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/
    );
    const s = block.match(
      /class="result__snippet"[^>]*>([\s\S]*?)<\/a>/
    );
    if (!t) continue;
    results.push({
      title: decodeHtml(t[2]),
      url: extractUrl(t[1]),
      snippet: s ? decodeHtml(s[1]).trim() : "",
    });
  }
  return results;
}

export async function searchImages(
  q: string,
  signal?: AbortSignal
): Promise<SearchResult[]> {
  const html = await fetchText(
    `https://duckduckgo.com/?q=${encodeURIComponent(
      q
    )}&iax=images&ia=images`,
    signal
  );
  const m = html.match(/vqd=([^&"]+)/);
  if (!m) return [];
  const json = await fetchText(
    `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(
      q
    )}&vqd=${m[1]}`,
    signal
  );
  const data = JSON.parse(json);
  return (data.results ?? []).slice(0, 12).map((r: Record<string, string>) => ({
    title: r.title ?? "",
    url: r.image ?? "",
    snippet: r.width ? `${r.width} × ${r.height}` : "",
    thumbnail: r.thumbnail ?? r.image ?? "",
  }));
}

export async function searchVideos(
  q: string,
  signal?: AbortSignal
): Promise<SearchResult[]> {
  const html = await fetchText(
    `https://duckduckgo.com/?q=${encodeURIComponent(
      q
    )}&iax=videos&ia=videos`,
    signal
  );
  const results: SearchResult[] = [];
  const re =
    /data-tn="([^"]+)"[^>]*>[\s\S]*?<a[^>]*href="([^"]+)"[^>]*>[\s\S]*?<img[^>]*src="([^"]+)"/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null && results.length < 12) {
    results.push({
      title: decodeHtml(m[1]),
      url: extractUrl(m[2]),
      snippet: "",
      thumbnail: m[3],
    });
  }
  if (results.length === 0) return searchAll(`${q} video`, signal);
  return results;
}

export async function searchNews(
  q: string,
  signal?: AbortSignal
): Promise<SearchResult[]> {
  const html = await fetchText(
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(
      q
    )}&iar=news`,
    signal
  );
  const results: SearchResult[] = [];
  const re = /<div[^>]*class="result[^"]*"[^>]*>([\s\S]*?)(?=<div[^>]*class="result|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null && results.length < 12) {
    const block = m[1];
    const t = block.match(
      /class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/
    );
    const s = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);
    if (!t) continue;
    results.push({
      title: decodeHtml(t[2]),
      url: extractUrl(t[1]),
      snippet: s ? decodeHtml(s[1]).trim() : "",
    });
  }
  return results;
}

export async function searchShopping(
  q: string,
  signal?: AbortSignal
): Promise<SearchResult[]> {
  const html = await fetchText(
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(
      q + " buy"
    )}&iar=products`,
    signal
  );
  const results: SearchResult[] = [];
  const re = /<div[^>]*class="result[^"]*"[^>]*>([\s\S]*?)(?=<div[^>]*class="result|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null && results.length < 12) {
    const block = m[1];
    const t = block.match(
      /class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/
    );
    const s = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\/a>/);
    if (!t) continue;
    results.push({
      title: decodeHtml(t[2]),
      url: extractUrl(t[1]),
      snippet: s ? decodeHtml(s[1]).trim() : "",
    });
  }
  return results;
}

export const CATEGORY_META: Record<
  SearchCategory,
  { label: string; matcher: string }
> = {
  all: { label: "All", matcher: "searchAll" },
  images: { label: "Images", matcher: "searchImages" },
  videos: { label: "Videos", matcher: "searchVideos" },
  news: { label: "News", matcher: "searchNews" },
  shopping: { label: "Shopping", matcher: "searchShopping" },
};
