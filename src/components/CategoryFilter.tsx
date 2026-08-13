import type { CSSProperties } from "react";
import {
  categories,
  pricingLabels,
  type CategoryId,
  type Pricing,
} from "../data/techWorld";
import "./CategoryFilter.css";

interface CategoryFilterProps {
  active: CategoryId | null;
  pricing: Pricing | null;
  onChange: (id: CategoryId | null) => void;
  onPricingChange: (pricing: Pricing | null) => void;
}

const pricingOptions: (Pricing | null)[] = [null, "free", "freemium", "paid"];

export function CategoryFilter({
  active,
  pricing,
  onChange,
  onPricingChange,
}: CategoryFilterProps) {
  return (
    <div className="cat-filter-wrap">
      <div className="cat-filter" role="toolbar" aria-label="Filter by domain">
        <button
          type="button"
          className={`cat-filter__btn ${active === null ? "is-active" : ""}`}
          onClick={() => onChange(null)}
          aria-pressed={active === null}
        >
          All domains
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`cat-filter__btn ${active === cat.id ? "is-active" : ""}`}
            style={{ "--cat-color": cat.color } as CSSProperties}
            onClick={() => onChange(active === cat.id ? null : cat.id)}
            aria-pressed={active === cat.id}
          >
            <span className="cat-filter__dot" aria-hidden="true" />
            {cat.label}
          </button>
        ))}
      </div>
      <div
        className="cat-filter cat-filter--pricing"
        role="toolbar"
        aria-label="Filter by pricing"
      >
        {pricingOptions.map((opt) => (
          <button
            key={opt ?? "all"}
            type="button"
            className={`cat-filter__btn cat-filter__btn--price ${pricing === opt ? "is-active" : ""}`}
            data-pricing={opt ?? "all"}
            onClick={() => onPricingChange(opt)}
            aria-pressed={pricing === opt}
          >
            {opt === null ? "All pricing" : pricingLabels[opt]}
          </button>
        ))}
      </div>
    </div>
  );
}
