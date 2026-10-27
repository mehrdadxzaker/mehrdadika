import { ChevronDown, Search } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import { useAtlas } from "../atlas/context";
import { faNumber, normalizeSearch, wordCount } from "../i18n";

export function Categories({
  selected,
  onSelect,
  expanded = false,
}: {
  selected?: string;
  onSelect: (id: string | undefined) => void;
  expanded?: boolean;
}) {
  const atlas = useAtlas();
  const [query, setQuery] = useState("");
  const panel = useRef<HTMLDetailsElement>(null);
  const choose = (id: string | undefined) => {
    onSelect(id);
    if (!expanded && panel.current) {
      panel.current.open = false;
      panel.current.querySelector("summary")?.focus();
    }
  };
  const counts = useMemo(() => {
    const values = new Map<string, number>();
    for (const word of atlas.words)
      for (const id of word.domainIds ?? [atlas.topics[word.topic]?.[0]])
        values.set(id, (values.get(id) ?? 0) + 1);
    return values;
  }, [atlas]);
  const domains = atlas.domains ?? [];
  const current = domains.find((d) => d.id === selected);
  const match = (text: string) =>
    normalizeSearch(text).includes(normalizeSearch(query));
  return (
    <details
      ref={panel}
      className="category-picker"
      open={expanded || undefined}
    >
      <summary>
        <span>
          {current?.labelFa ?? "همهٔ موضوع‌ها"}{" "}
          <small>{faNumber(domains.length)} حوزه</small>
        </span>
        <ChevronDown size={17} />
      </summary>
      <div className="category-browser">
        <label className="search">
          <Search size={17} />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="جست‌وجوی موضوع؛ مثلاً آشپزی"
            dir="auto"
            aria-label="جست‌وجوی موضوع"
          />
        </label>
        <button
          className={`chip-btn ${!selected ? "is-on" : ""}`}
          onClick={() => choose(undefined)}
        >
          همهٔ واژه‌های منتشرشده
        </button>
        {(atlas.discoveryGroups ?? []).map((group) => {
          const list = domains.filter(
            (d) =>
              group.domainIds.includes(d.id) &&
              (!query ||
                match(
                  d.labelFa +
                    " " +
                    d.labelEn +
                    " " +
                    [...d.subcategories, ...(d.subcategoryLabelsFa ?? [])].join(
                      " ",
                    ),
                )),
          );
          if (!list.length) return null;
          return (
            <section className="category-group" key={group.id}>
              <h3>{group.labelFa}</h3>
              <div className="category-grid">
                {list.map((d) => (
                  <button
                    key={d.id}
                    className={`category-option ${selected === d.id ? "is-on" : ""}`}
                    onClick={() => choose(d.id)}
                  >
                    <span>
                      <b>{d.labelFa}</b>
                      <small>{d.labelEn}</small>
                    </span>
                    <em>
                      {counts.get(d.id)
                        ? wordCount(counts.get(d.id)!)
                        : "به‌زودی"}
                    </em>
                  </button>
                ))}
              </div>
            </section>
          );
        })}
        {query &&
          !domains.some((d) =>
            match(
              d.labelFa +
                " " +
                d.labelEn +
                " " +
                [...d.subcategories, ...(d.subcategoryLabelsFa ?? [])].join(
                  " ",
                ),
            ),
          ) && (
            <p className="muted">
              موضوعی پیدا نشد. عبارت دیگری را امتحان کنید.
            </p>
          )}
      </div>
    </details>
  );
}
