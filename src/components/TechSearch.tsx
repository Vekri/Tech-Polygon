import { useMemo, useState } from "react";
import { nodes, type TechNode } from "../data/techWorld";
import "./TechSearch.css";

interface TechSearchProps {
  onPick: (node: TechNode) => void;
  onQueryChange: (query: string, matches: TechNode[]) => void;
}

export function TechSearch({ onPick, onQueryChange }: TechSearchProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 1) return [];
    return nodes
      .filter(
        (n) =>
          n.name.toLowerCase().includes(q) ||
          n.blurb.toLowerCase().includes(q) ||
          n.category.includes(q),
      )
      .slice(0, 8);
  }, [query]);

  return (
    <div className="tech-search">
      <label className="tech-search__label" htmlFor="tech-search-input">
        Search the IT world
      </label>
      <input
        id="tech-search-input"
        className="tech-search__input"
        type="search"
        placeholder="Banking, FHIR, SCADA, Shopify, Epic…"
        value={query}
        autoComplete="off"
        onChange={(e) => {
          const v = e.target.value;
          setQuery(v);
          setOpen(true);
          const q = v.trim().toLowerCase();
          const next =
            q.length < 1
              ? []
              : nodes
                  .filter(
                    (n) =>
                      n.name.toLowerCase().includes(q) ||
                      n.blurb.toLowerCase().includes(q) ||
                      n.category.includes(q),
                  )
                  .slice(0, 40);
          onQueryChange(v, next);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && matches[0]) {
            onPick(matches[0]);
            setOpen(false);
          }
          if (e.key === "Escape") {
            setQuery("");
            onQueryChange("", []);
            setOpen(false);
          }
        }}
      />
      {open && matches.length > 0 && (
        <ul className="tech-search__list" role="listbox">
          {matches.map((n) => (
            <li key={n.id}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onPick(n);
                  setQuery(n.name);
                  setOpen(false);
                }}
              >
                <span>{n.name}</span>
                <span className="tech-search__meta">{n.category}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
