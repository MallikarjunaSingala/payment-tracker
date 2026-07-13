"use client";

import { useMemo, useState } from "react";
import ContractorCard from "./ContractorCard";
import EmptyState from "./EmptyState";

export default function SearchBar({ items }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return items;
    return items.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q)
    );
  }, [items, query]);

  return (
    <div>
      <div className="mb-6">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search contractors by name or phone..."
          className="w-full sm:w-96 rounded-lg border border-slate-300 px-4 py-2 text-sm shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
        />
      </div>
      {filtered.length === 0 ? (
        <EmptyState message="No contractors match your search." />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => (
            <ContractorCard key={c.name} contractor={c} />
          ))}
        </div>
      )}
    </div>
  );
}
