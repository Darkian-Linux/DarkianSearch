import { SearchBar } from "@/components/search-bar";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4">
      <h1 className="mb-10 text-5xl font-bold tracking-tight sm:text-6xl">
        Darkian<span className="text-primary">Search</span>
      </h1>
      <SearchBar large showRecent />
    </div>
  );
}
