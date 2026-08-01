# DarkianSearch

Minimal, privacy-first metasearch engine built with **Next.js 16**, **shadcn/ui**, and **Tailwind CSS v4**. No tracking, no logs — search results are pulled from DuckDuckGo and delivered with Darkian branding.

## Features

- Minimal homepage with large search bar
- Category tabs: **All, Images, Videos, News, Shopping**
- Light / Dark / System theme toggle (next-themes)
- Red accent color scheme
- Custom icon + favicon
- Server-side metasearch API route (DuckDuckGo HTML endpoints)
- Lucide icons + shadcn/ui components

## Tech Stack

- Next.js 16 (App Router, Turbopack)
- React 19
- Tailwind CSS v4
- shadcn/ui
- next-themes
- lucide-react

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command        | Description        |
| -------------- | ------------------ |
| `npm run dev`  | Dev server         |
| `npm run build`| Production build   |
| `npm run start`| Serve production   |
| `npm run lint` | ESLint             |

## Project Structure

```
src/
  app/
    api/search/route.ts   # metasearch API (DuckDuckGo scraping per category)
    search/               # results page + category tabs
    layout.tsx            # root layout, theme provider, header toggle
    page.tsx              # homepage
    globals.css           # theme tokens (red accents), Tailwind v4
  components/
    ui/                   # shadcn components (button, input, dropdown-menu)
    search-bar.tsx
    theme-provider.tsx
    theme-toggle.tsx
  lib/
    search.ts             # per-category DuckDuckGo scrapers
    utils.ts              # cn() helper
```
