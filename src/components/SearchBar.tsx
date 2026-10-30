import { useEffect, useMemo, useRef, useState } from "react";
import { searchJobs } from "../lib/derive";
import type { Job } from "../types";
import { fieldById } from "../data/dataset";

export function SearchBar({ onSelect }: { onSelect: (job: Job) => void }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const boxRef = useRef<HTMLDivElement>(null);
  const results = useMemo(() => searchJobs(q), [q]);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (!boxRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  const choose = (job: Job) => {
    onSelect(job);
    setQ(job.title);
    setOpen(false);
  };

  return (
    <div className="search" ref={boxRef}>
      <label htmlFor="job-search" className="sr-only">
        Search your job title
      </label>
      <input
        id="job-search"
        type="search"
        autoComplete="off"
        placeholder="Search your job — e.g. paralegal, nurse, developer…"
        value={q}
        role="combobox"
        aria-expanded={open && results.length > 0}
        aria-controls="search-results"
        onChange={(e) => {
          setQ(e.target.value);
          setOpen(true);
          setActive(0);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown") {
            e.preventDefault();
            setActive((a) => Math.min(a + 1, results.length - 1));
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            setActive((a) => Math.max(a - 1, 0));
          } else if (e.key === "Enter" && results[active]) {
            choose(results[active]);
          } else if (e.key === "Escape") setOpen(false);
        }}
      />
      {open && q.trim() && (
        <ul id="search-results" className="search-results" role="listbox">
          {results.length === 0 && <li className="search-empty">No match yet — the dataset grows with every release.</li>}
          {results.map((j, i) => (
            <li
              key={j.id}
              role="option"
              aria-selected={i === active}
              className={i === active ? "active" : ""}
              onMouseEnter={() => setActive(i)}
              onMouseDown={(e) => {
                e.preventDefault();
                choose(j);
              }}
            >
              <span>{j.title}</span>
              <small>{fieldById(j.fieldId)?.name}</small>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
