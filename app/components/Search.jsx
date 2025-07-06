import { useState } from "react";
import { useRouter } from "next/router";
import { FaSearchengin } from "react-icons/fa";

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const router = useRouter();

  const handleSearch = (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    // Option 1: Navigate to a results page
    router.push(`/search?q=${encodeURIComponent(query.trim())}`);

    // Option 2 (Alternative): Call an API to fetch results directly here
    // fetch(`/api/search?query=${query}`).then(...)
  };

  return (
    <form
      onSubmit={handleSearch}
      className=""
    >
      <input
        type="search"
        aria-label="search-box"
        name="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="What are you looking for?"
        className="border rounded-l-full border-r-0 pl-5 h-10 w-full"
      />
      <button
        type="submit"
        className="border rounded-r-full w-20 bg-gray-200 hover:bg-gray-300"
      >
        <FaSearchengin className="text-2xl pl-3" />
      </button>
    </form>
  );
}
