import { createFileRoute, Link } from "@tanstack/react-router";
import { zodValidator, fallback } from "@tanstack/zod-adapter";
import { z } from "zod";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { ReceiptDetail } from "@/components/receipt-bits";
import { ThreadPanel } from "@/components/ThreadPanel";
import { useDebounced } from "@/hooks/useArchive";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatCount, summary } from "@/lib/data/summary";
import {
  chapters,
  searchReceipts,
  TYPE_META,
  TYPE_ORDER,
  type Receipt,
  type ReceiptType,
  dayKey,
  formatDate,
  formatTime,
  receipts,
} from "@/lib/receipts";

const searchSchema = z.object({
  q: fallback(z.string(), "").default(""),
  type: fallback(z.string(), "").default(""),
  chapter: fallback(z.string(), "").default(""),
  night: fallback(z.boolean(), false).default(false),
});

export const Route = createFileRoute("/explore")({
  validateSearch: zodValidator(searchSchema),
  head: () => ({
    meta: [
      { title: "Explore the archive — Receipts of a Life" },
      {
        name: "description",
        content:
          "Search and filter 5,531 curated life fragments by kind, chapter and hour, then follow the threads between them.",
      },
      { property: "og:title", content: "Explore the archive — Receipts of a Life" },
      {
        property: "og:description",
        content: "Search, filter and follow the threads between thousands of digital-life fragments.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Explore,
});

function Explore() {
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const [page, setPage] = useState(1);
  const [queryInput, setQueryInput] = useState(search["q"]);
  const debouncedQuery = useDebounced(queryInput, 220);
  const lastTrigger = useRef<HTMLElement | null>(null);
  const closeButton = useRef<HTMLButtonElement | null>(null);
  const mobileDialog = useRef<HTMLDivElement | null>(null);
  const isMobile = useIsMobile();

  const types = search["type"] ? [search["type"] as ReceiptType] : [];
  const results = useMemo(
    () => searchReceipts(debouncedQuery, types, search["chapter"] || null, search["night"]),
    [debouncedQuery, search["type"], search["chapter"], search["night"]],
  );
  const [selected, setSelected] = useState<Receipt | null>(null);

  const update = (patch: Partial<typeof search>) => {
    setPage(1);
    void navigate({ to: ".", search: (prev) => ({ ...prev, ...patch }) });
  };

  useEffect(() => {
    if (debouncedQuery === search["q"]) return;
    void navigate({ to: ".", replace: true, search: (prev) => ({ ...prev, q: debouncedQuery }) });
  }, [debouncedQuery, navigate, search]);

  const visible = useMemo(() => results.slice(0, page * 40), [page, results]);
  const clusters = useMemo(() => {
    const grouped = new Map<string, Receipt[]>();
    for (const receipt of visible) {
      const key = dayKey(receipt.ts);
      const list = grouped.get(key);
      if (list) list.push(receipt);
      else grouped.set(key, [receipt]);
    }
    return [...grouped.entries()];
  }, [visible]);

  const closeDetail = useCallback(() => setSelected(null), []);
  useDialogFocus(Boolean(selected) && isMobile, mobileDialog, closeButton, lastTrigger, closeDetail);

  return (
    <div className="relative">
      <header className="surface-dark-base surface-noir">
        <div className="mx-auto max-w-[100rem] px-5 py-20 md:px-10 md:py-28">
          <p className="label-xs text-muted">Threads · curated fragments</p>
          <h1 className="mt-7 display-xl">RECONSTRUCT<br /><span className="text-muted">A MOMENT.</span></h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
             Open one of {formatCount(receipts.length)} curated fragments as evidence, then follow the real dates, places and words that connect it. To inspect all {formatCount(summary.combined.count)} raw source records, open the{" "}
            <Link to="/archive" className="underline decoration-dotted hover:text-cloud">
              full archive
            </Link>
            .
          </p>
        </div>
      </header>
      <div className="relative mx-auto max-w-[100rem] px-5 pb-24 md:px-10">

        {/* controls */}
        <div className="sticky top-[53px] z-30 -mx-5 border-b border-cloud/15 bg-ink/95 px-5 py-5 backdrop-blur-xl md:mx-0">
          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <label className="flex min-w-0 flex-1 items-center gap-3 border-b border-cloud/20 pb-3">
            <Search className="size-4 text-muted" aria-hidden="true" />
            <span className="sr-only">Search curated fragments</span>
            <input
               value={queryInput}
               onChange={(e) => { setQueryInput(e.target.value); setPage(1); }}
              placeholder="Search songs, places, notes, merchants…"
              className="w-full bg-transparent font-mono text-xs text-cloud outline-none placeholder:text-muted"
            />
            </label>
            <div className="flex shrink-0 items-center gap-2">
              <button
                type="button"
                aria-pressed={search["night"]}
                onClick={() => update({ night: !search["night"] })}
                 className={`min-h-11 rounded-md px-4 py-2 font-mono text-[10px] uppercase transition ${
                  search["night"] ? "bg-accent text-ink" : "border border-cloud/20 bg-cloud/5 text-cloud hover:bg-cloud/10"
                }`}
              >
                After midnight
              </button>
              <select
                value={search["chapter"]}
                onChange={(e) => update({ chapter: e.target.value })}
                 aria-label="Filter by chapter"
                 className="min-h-11 rounded-md border border-cloud/15 bg-ink2/80 px-4 py-2 font-mono text-[10px] text-cloud outline-none"
              >
                <option value="">All chapters</option>
                {chapters.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.title}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-4 flex gap-5 overflow-x-auto pb-2">
            <button
              type="button"
              aria-pressed={!search["type"]}
              onClick={() => update({ type: "" })}
               className={`min-h-11 shrink-0 border-b px-1 pb-2 font-mono text-[10px] uppercase transition ${
                !search["type"] ? "border-cloud text-cloud" : "border-transparent text-muted hover:text-cloud"
              }`}
            >
              Everything
            </button>
            {TYPE_ORDER.map((t) => (
              <button
                key={t}
                type="button"
                aria-pressed={search["type"] === t}
                onClick={() => update({ type: search["type"] === t ? "" : t })}
                 className={`min-h-11 shrink-0 border-b px-1 pb-2 font-mono text-[10px] uppercase transition ${
                  search["type"] === t
                    ? `border-current ${TYPE_META[t].text}`
                    : "border-transparent text-muted hover:text-cloud"
                }`}
              >
                <span aria-hidden="true">{TYPE_META[t].glyph}</span> {TYPE_META[t].label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-12">
          {/* list */}
          <div className="lg:col-span-8">
            <p className="label-xs text-muted">{results.length.toLocaleString("en-US")} fragments match · grouped into moments</p>
            <div className="mt-8 space-y-16">
              {clusters.map(([day, items]) => {
                const kinds = new Set(items.map((item) => item.type));
                return (
                  <section key={day} className="grid gap-5 border-t border-cloud/15 pt-5 md:grid-cols-[10rem_1fr]">
                    <header>
                      <h2 className="font-display text-2xl">{formatDate(`${day}T12:00:00`)}</h2>
                      <p className="mt-2 label-xs text-muted">{formatTime(items[0]?.ts ?? `${day}T00:00:00`)} → {formatTime(items[items.length - 1]?.ts ?? `${day}T00:00:00`)}</p>
                      <p className="mt-4 font-mono text-[10px] text-muted">{items.length} fragments · {kinds.size} categories</p>
                    </header>
                    <ol className="relative border-l border-cloud/15 pl-6">
                      {items.map((r) => (
                        <li key={r.id}>
                           <button type="button" aria-current={selected?.id === r.id ? "true" : undefined} onClick={(event) => { lastTrigger.current = event.currentTarget; setSelected(r); }} className="group relative grid min-h-11 w-full grid-cols-[3.5rem_minmax(0,1fr)] gap-3 border-b border-cloud/10 py-4 text-left sm:grid-cols-[4.5rem_minmax(0,1fr)] sm:gap-4">
                            <span className={`absolute -left-[1.72rem] top-6 size-2 rounded-full ${TYPE_META[r.type].bg}`} aria-hidden="true" />
                            <span className="font-mono text-[10px] text-muted">{formatTime(r.ts)}</span>
                            <span className="min-w-0">
                              <span className={`label-xs ${TYPE_META[r.type].text}`}><span aria-hidden="true">{TYPE_META[r.type].glyph}</span> {TYPE_META[r.type].label}</span>
                              <span className="mt-1 block break-words font-display text-xl transition group-hover:translate-x-1">{r.title}</span>
                              {r.subtitle ? <span className="mt-1 block line-clamp-2 break-words text-xs text-muted">{r.subtitle}</span> : null}
                            </span>
                          </button>
                        </li>
                      ))}
                    </ol>
                  </section>
                );
              })}
            </div>
            {visible.length < results.length ? (
              <button
                type="button"
                onClick={() => setPage((p) => p + 1)}
                className="mt-4 w-full rounded-md border border-cloud/15 bg-cloud/5 py-2.5 font-mono text-[10px] uppercase text-cloud transition hover:border-accent/40 hover:text-accent"
              >
                Show more ({(results.length - visible.length).toLocaleString("en-US")} left)
              </button>
            ) : null}
            {!results.length ? (
              <p className="rounded-3xl border border-cloud/12 bg-cloud/[0.03] p-8 text-center text-sm text-muted">
                 No curated fragments match those filters. Try a broader word, another category or all chapters.
              </p>
            ) : null}
          </div>

          {/* detail + thread */}
           <aside className="hidden lg:col-span-4 lg:sticky lg:top-24 lg:block self-start" aria-live="polite">
            {selected ? (
              <div className="flex flex-col gap-4">
                <ReceiptDetail receipt={selected} />
                <ThreadPanel anchor={selected} onSelect={setSelected} />
                <Link
                  to="/chapter/$slug"
                  params={{
                    slug:
                      chapters.find((c) => {
                         const y = Number(selected.ts.slice(0, 4));
                        return y >= c.years[0] && y <= c.years[1];
                      })?.slug ?? chapters[0]!.slug,
                  }}
                  className="rounded-md border border-cloud/15 bg-cloud/5 px-4 py-2.5 text-center font-mono text-[10px] uppercase text-cloud transition hover:border-accent/40 hover:text-accent"
                >
                  Read the chapter this belongs to
                </Link>
              </div>
             ) : <div className="sticky top-28 border-l border-cloud/15 pl-6"><p className="label-xs text-muted">Evidence desk · {formatCount(receipts.length)} curated fragments</p><p className="mt-4 font-display text-3xl">Open a fragment.</p><p className="mt-3 text-sm leading-relaxed text-muted">Choose any item in a reconstructed moment to inspect its type, date, time, source and related evidence.</p></div>}
          </aside>
        </div>
      </div>

      {selected ? (
         <div ref={mobileDialog} tabIndex={-1} className="fixed inset-0 z-[70] bg-noir/55 backdrop-blur-sm lg:hidden" role="dialog" aria-modal="true" aria-label="Selected fragment and its thread">
          <div className="absolute inset-x-0 bottom-0 max-h-[84vh] overflow-y-auto bg-ink px-4 pb-8 pt-3">
              <div className="flex items-center justify-between pb-3"><span className="mx-auto h-1 w-10 rounded-full bg-cloud/25" aria-hidden="true" /><button ref={closeButton} type="button" onClick={closeDetail} aria-label="Close fragment" className="grid size-11 shrink-0 place-items-center"><X className="size-5" aria-hidden="true" /></button></div>
            <ReceiptDetail receipt={selected} />
            <div className="mt-4"><ThreadPanel anchor={selected} onSelect={setSelected} /></div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
