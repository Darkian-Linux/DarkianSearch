import { SearchBar } from "@/components/search-bar";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <h1 className="mb-2 text-6xl font-extrabold tracking-tight sm:text-7xl">
        Darkian<span className="text-primary">Search</span>
      </h1>
      <p className="text-muted-foreground mb-8 text-center text-sm sm:text-base">
        Minimal, private metasearch. No tracking. No logs.
      </p>
      <SearchBar large />
    </div>
  );
}
