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
    headers: {
      "User-Agent": UA,
      Accept:
        "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "Accept-Language": "en-US,en;q=0.9",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
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

async function tryEach<T>(
  fns: ((signal?: AbortSignal) => Promise<T>)[],
  signal?: AbortSignal
): Promise<T> {
  let lastErr: unknown = null;
  for (const fn of fns) {
    try {
      const out = await fn(signal);
      if (Array.isArray(out) && out.length === 0) {
        lastErr = new Error("empty results");
        continue;
      }
      return out;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("all providers failed");
}

function parseDdgHtml(html: string, max = 12): SearchResult[] {
  const results: SearchResult[] = [];
  const re = /<div[^>]*class="result[^"]*"[^>]*>([\s\S]*?)(?=<div[^>]*class="result|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null && results.length < max) {
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

function parseDdgLite(html: string, max = 12): SearchResult[] {
  const results: SearchResult[] = [];
  const re =
    /<a[^>]*rel="nofollow"[^>]*href="([^"]+)"[^>]*>(?:<b>)?([\s\S]*?)(?:<\/b>)?<\/a>[\s\S]*?<td[^>]*class='result-snippet'[^>]*>([\s\S]*?)<\/td>/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null && results.length < max) {
    results.push({
      title: decodeHtml(m[2]).trim(),
      url: extractUrl(m[1]),
      snippet: decodeHtml(m[3]).trim(),
    });
  }
  return results;
}

function bingUrl(raw: string): string {
  if (!raw.includes("bing.com/ck/a")) return raw;
  const m = raw.match(/[?&]u=a1([^&]+)/);
  if (!m) return raw;
  try {
    const pad = m[1].length % 4 === 0 ? "" : "=".repeat(4 - (m[1].length % 4));
    return atob(m[1] + pad);
  } catch {
    return raw;
  }
}

function parseBing(html: string, max = 12): SearchResult[] {
  const results: SearchResult[] = [];
  const re = /<li class="b_algo"[\s\S]*?<h2[^>]*><a[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a><\/h2>[\s\S]*?(?:<p[^>]*>([\s\S]*?)<\/p>)?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html)) !== null && results.length < max) {
    results.push({
      title: decodeHtml(m[2]).trim(),
      url: bingUrl(m[1]),
      snippet: m[3] ? decodeHtml(m[3]).trim() : "",
    });
  }
  return results;
}

const ddg = (q: string, extra = "") => (signal?: AbortSignal) =>
  fetchText(
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q)}${extra}`,
    signal
  ).then((h) => parseDdgHtml(h));

const lite = (q: string, extra = "") => (signal?: AbortSignal) =>
  fetchText(
    `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(q)}${extra}`,
    signal
  ).then((h) => parseDdgLite(h));

const bing = (q: string, extra = "") => (signal?: AbortSignal) =>
  fetchText(
    `https://www.bing.com/search?q=${encodeURIComponent(q)}${extra}`,
    signal
  ).then((h) => parseBing(h));

export async function searchAll(
  q: string,
  signal?: AbortSignal
): Promise<SearchResult[]> {
  return tryEach([ddg(q), lite(q), bing(q)], signal);
}

export async function searchImages(
  q: string,
  signal?: AbortSignal
): Promise<SearchResult[]> {
  try {
    const html = await fetchText(
      `https://duckduckgo.com/?q=${encodeURIComponent(q)}&iax=images&ia=images`,
      signal
    );
    const m = html.match(/vqd=([^&"]+)/);
    if (m) {
      const json = await fetchText(
        `https://duckduckgo.com/i.js?l=us-en&o=json&q=${encodeURIComponent(
          q
        )}&vqd=${m[1]}`,
        signal
      );
      const data = JSON.parse(json);
      const results = (data.results ?? []).slice(0, 12).map((r: Record<string, string>) => ({
        title: r.title ?? "",
        url: r.image ?? "",
        snippet: r.width ? `${r.width} × ${r.height}` : "",
        thumbnail: r.thumbnail ?? r.image ?? "",
      }));
      if (results.length > 0) return results;
    }
  } catch {
    // fall through to Bing
  }
  const html = await fetchText(
    `https://www.bing.com/images/search?q=${encodeURIComponent(q)}`,
    signal
  );
  const results: SearchResult[] = [];
  const re =
    /<a[^>]*class="iusc"[^>]*m="([^"]+)"[\s\S]*?<img[^>]*src="([^"]+)"/g;
  let m2: RegExpExecArray | null;
  while ((m2 = re.exec(html)) !== null && results.length < 12) {
    try {
      const meta = JSON.parse(m2[1]);
      const t = /<h2[^>]*>([\s\S]*?)<\/h2>/.exec(html);
      results.push({
        title: meta.t ?? meta.m ?? (t ? decodeHtml(t[1]) : ""),
        url: meta.purl ?? meta.murl ?? m2[2],
        snippet: "",
        thumbnail: m2[2],
      });
    } catch {
      // skip malformed
    }
  }
  return results;
}

export async function searchVideos(
  q: string,
  signal?: AbortSignal
): Promise<SearchResult[]> {
  try {
    const html = await fetchText(
      `https://duckduckgo.com/?q=${encodeURIComponent(q)}&iax=videos&ia=videos`,
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
    if (results.length > 0) return results;
  } catch {
    // fall through
  }
  return searchAll(`${q} video`, signal);
}

export async function searchNews(
  q: string,
  signal?: AbortSignal
): Promise<SearchResult[]> {
  return tryEach([ddg(q, "&iar=news"), lite(q, "&iar=news"), bing(q, "&setmkt=en-us&qft=interval%3d%227%22")], signal);
}

export async function searchShopping(
  q: string,
  signal?: AbortSignal
): Promise<SearchResult[]> {
  return tryEach(
    [ddg(q + " buy", "&iar=products"), bing(q + " buy"), lite(q + " buy")],
    signal
  );
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
