import { createFileRoute } from "@tanstack/react-router";
import { Loader2, Search, ShieldCheck, X } from "lucide-react";
import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { CoverageTimeline } from "@/components/fragments/CoverageTimeline";
import { FragmentDetail, FragmentLine } from "@/components/fragments/FragmentLine";
import { SourceIcon } from "@/components/fragments/SourceMark";
import { useArchive, useDebounced } from "@/hooks/useArchive";
import { useDialogFocus } from "@/hooks/useDialogFocus";
import { useIsMobile } from "@/hooks/use-mobile";
import { filterArchive } from "@/lib/data/archive";
import { YEARS, formatCount, summary } from "@/lib/data/summary";
import { SOURCE_META, SOURCE_ORDER, type Fragment, type SourceId } from "@/lib/data/types";

export const Route = createFileRoute("/archive")({
  head: () => ({
    meta: [
      { title: "The Archive — 161,738 records, one chronological story" },
      {
        name: "description",
        content:
          "Browse every record from three datasets as a single chronological archive: listening history, household spending and card activity, normalized in your browser.",
      },
      { property: "og:title", content: "The Archive — one chronological story" },
      {
        property: "og:description",
        content:
          "Every listening, spending and card record from 2013 to 2024, normalized into one browsable timeline.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: ArchivePage,
});

const ROW_HEIGHT = 92;
const OVERSCAN = 8;

function ArchivePage() {
  const { archive, loading, error } = useArchive();
  const [rawQuery, setRawQuery] = useState("");
  const query = useDebounced(rawQuery, 220);
  const [sources, setSources] = useState<SourceId[]>([]);
  const [year, setYear] = useState<number | null>(null);
  const [nightOnly, setNightOnly] = useState(false);
  const [selected, setSelected] = useState<Fragment | null>(null);
  const lastTrigger = useRef<HTMLElement | null>(null);
  const closeButton = useRef<HTMLButtonElement | null>(null);
  const mobileDialog = useRef<HTMLDivElement | null>(null);
  const scrollFrame = useRef<number | null>(null);
  const isMobile = useIsMobile();

  const scroller = useRef<HTMLDivElement | null>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewport, setViewport] = useState(700);

  const filterKey = `${query}|${sources.join(",")}|${year ?? ""}|${nightOnly}`;
  const deferredKey = useDeferredValue(filterKey);

  const matches = useMemo(() => {
    if (!archive) return null;
    return filterArchive(archive, {
      query,
      sources,
      ...(year ? { yearFrom: year, yearTo: year } : {}),
      nightOnly,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [archive, deferredKey]);

  useEffect(() => {
    scroller.current?.scrollTo({ top: 0 });
    setScrollTop(0);
  }, [deferredKey]);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    const measure = () => setViewport(el.clientHeight || 700);
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [archive]);

  const closeDetail = useCallback(() => setSelected(null), []);
  useDialogFocus(Boolean(selected) && isMobile, mobileDialog, closeButton, lastTrigger, closeDetail);

  useEffect(() => () => {
    if (scrollFrame.current !== null) cancelAnimationFrame(scrollFrame.current);
  }, []);

  const handleScroll = useCallback((nextScrollTop: number) => {
    if (scrollFrame.current !== null) return;
    scrollFrame.current = requestAnimationFrame(() => {
      setScrollTop(nextScrollTop);
      scrollFrame.current = null;
    });
  }, []);

  const total = matches?.length ?? 0;
  const first = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - OVERSCAN);
  const last = Math.min(total, Math.ceil((scrollTop + viewport) / ROW_HEIGHT) + OVERSCAN);
  const visible: { key: number; fragment: Fragment; top: number }[] = [];
  if (archive && matches) {
    for (let i = first; i < last; i += 1) {
      const pos = matches[i];
      if (pos === undefined) continue;
      visible.push({ key: pos, fragment: archive.at(pos), top: i * ROW_HEIGHT });
    }
  }

  const toggleSource = (s: SourceId) =>
    setSources((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]));

  const anyFilter = Boolean(query || sources.length || year || nightOnly);

  return (
    <div className="pb-24">
      {/* Editorial title band */}
      <header className="surface-dark-base surface-noir">
        <div className="mx-auto grid max-w-[100rem] gap-10 px-5 pb-20 pt-16 md:grid-cols-12 md:px-10 md:pb-24">
          <div className="md:col-span-7">
            <p className="label-xs text-muted">The archive</p>
            <h1 className="mt-7 display-xl">
              {formatCount(summary.combined.count)} RECORDS,
              <span className="display-fade block italic">
                READ END TO END.
              </span>
            </h1>
          </div>
          <div className="flex flex-col justify-end md:col-span-4 md:col-start-9">
            <p className="text-sm leading-relaxed text-muted">
              Three datasets — listening history, a household ledger and card activity — normalized into one
              kind of thing: a fragment. Everything below is loaded, searched and filtered inside your browser.
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[100rem] px-4 md:px-10">
        <div className="grid gap-5 lg:grid-cols-[1fr_24rem]">
        <div className="min-w-0">
          {/* Controls — stay in reach while the archive scrolls */}
          <div className="sticky top-[53px] z-30 -mx-4 border-b border-cloud/12 bg-ink/95 px-4 py-4 backdrop-blur-xl md:mx-0 md:px-5">
            <label className="flex items-center gap-2 border-b border-cloud/12 pb-3">
              <Search className="size-4 text-muted" aria-hidden="true" />
              <span className="sr-only">Search the archive</span>
              <input
                value={rawQuery}
                onChange={(e) => setRawQuery(e.target.value)}
                placeholder="Search a song, an artist, a merchant, a note…"
                className="w-full bg-transparent font-mono text-sm outline-none placeholder:text-muted"
              />
              {rawQuery ? (
                <button type="button" onClick={() => setRawQuery("")} aria-label="Clear search" className="grid size-11 shrink-0 place-items-center">
                  <X className="size-4 text-muted transition hover:text-cloud" aria-hidden="true" />
                </button>
              ) : null}
            </label>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              {SOURCE_ORDER.map((s) => {
                const on = sources.includes(s);
                return (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={on}
                    onClick={() => toggleSource(s)}
                    className={`inline-flex min-h-11 items-center gap-1.5 rounded-sm border px-3 py-1.5 font-mono text-[11px] uppercase transition ${
                      on ? "border-cloud/40 bg-cloud/8 text-cloud" : "border-cloud/12 text-muted hover:text-cloud"
                    }`}
                  >
                    <SourceIcon source={s} className="size-3.5" />
                    {SOURCE_META[s].verb}
                  </button>
                );
              })}
              <button
                type="button"
                aria-pressed={nightOnly}
                onClick={() => setNightOnly((v) => !v)}
                className={`min-h-11 rounded-sm border px-3 py-1.5 font-mono text-[11px] uppercase transition ${
                  nightOnly ? "border-cloud/40 bg-cloud/8 text-cloud" : "border-cloud/12 text-muted hover:text-cloud"
                }`}
              >
                After midnight
              </button>
              <label className="ml-auto flex items-center gap-2 font-mono text-[11px] uppercase tracking-[0.1em] text-muted">
                Year
                <select
                  value={year ?? ""}
                  onChange={(e) => setYear(e.target.value ? Number(e.target.value) : null)}
                  className="min-h-11 rounded-sm border border-cloud/15 bg-transparent px-2 py-1.5 text-cloud"
                >
                  <option value="">All</option>
                  {YEARS.map((y) => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-cloud/12 pt-3 font-mono text-[11px] text-muted">
               <span aria-live="polite" role="status">
                {loading ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="size-3.5 animate-spin" aria-hidden="true" /> Reading three datasets…
                  </span>
                ) : (
                  `${formatCount(total)} records match`
                )}
              </span>
              {anyFilter ? (
                <button
                  type="button"
                  className="underline decoration-dotted transition hover:text-cloud"
                  onClick={() => {
                    setRawQuery("");
                    setSources([]);
                    setYear(null);
                    setNightOnly(false);
                  }}
                >
                  Reset filters
                </button>
              ) : null}
            </div>
          </div>

          {/* Virtualized chronological list */}
          <div className="archive-panel mt-4 overflow-hidden rounded-md">
            {error ? (
              <p className="p-6 text-sm text-rose">{error}</p>
            ) : (
              <div
                ref={scroller}
                 onScroll={(e) => handleScroll(e.currentTarget.scrollTop)}
                   className="h-[min(62vh,46rem)] min-h-[420px] overflow-y-auto"
                tabIndex={0}
                aria-label="Chronological fragments"
              >
                {loading ? (
                  <ul className="divide-y divide-cloud/10">
                    {Array.from({ length: 8 }).map((_, i) => (
                      <li key={i} className="flex h-[78px] animate-pulse items-center gap-3 px-4">
                        <span className="size-1.5 rounded-full bg-cloud/20" />
                        <span className="h-3 w-1/3 rounded bg-cloud/10" />
                        <span className="ml-auto h-3 w-24 rounded bg-cloud/10" />
                      </li>
                    ))}
                  </ul>
                ) : total === 0 ? (
                  <p className="p-8 text-center text-sm text-muted">
                    Nothing in the archive matches that. Try a broader search.
                  </p>
                ) : (
                  <div style={{ height: total * ROW_HEIGHT, position: "relative" }}>
                    {visible.map((v) => (
                      <div
                        key={v.key}
                        style={{ position: "absolute", top: v.top, left: 0, right: 0, height: ROW_HEIGHT }}
                      >
                        <FragmentLine
                          fragment={v.fragment}
                          selected={selected?.id === v.fragment.id}
                           onSelect={(fragment) => {
                             lastTrigger.current = document.activeElement as HTMLElement | null;
                             setSelected(fragment);
                           }}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
          <p className="mt-2 font-mono text-[10px] uppercase tracking-[0.12em] text-muted">
            Only the rows in view are rendered · {formatCount(summary.sources.spotify.count)} listening records stay
            columnar until needed
          </p>
        </div>

        {/* Aside: selection + privacy + coverage */}
        <aside className="hidden flex-col gap-4 lg:flex">
          {selected ? (
            <FragmentDetail fragment={selected} />
          ) : (
           <div className="border-l border-cloud/15 pl-5">
               <h2 className="eyebrow">Fragment</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted">
                Pick any line on the left to open it. A fragment keeps its original fields — platform, mode,
                subcategory, merchant — so the raw record stays readable.
              </p>
            </div>
          )}

           <div className="border-l border-cloud/15 pl-5">
             <h2 className="flex items-center gap-2 eyebrow">
              <ShieldCheck className="size-3.5" aria-hidden="true" /> Handled with care
             </h2>
            <p className="mt-2 text-xs leading-relaxed text-muted">
              Card numbers, names, dates of birth, street addresses, customer ids and precise coordinates are
              removed before anything reaches this page. Card records show a category, an amount and a city.
            </p>
          </div>

           <div className="border-l border-cloud/15 pl-5">
             <h2 className="eyebrow">By source</h2>
            <ul className="mt-3 space-y-3">
              {SOURCE_ORDER.map((s) => {
                const src = summary.sources[s];
                return (
                  <li key={s} className="flex items-baseline justify-between gap-3 border-b border-cloud/10 pb-2">
                    <span className="flex items-center gap-2 text-sm">
                      <SourceIcon source={s} className="size-3.5" />
                      {SOURCE_META[s].label}
                    </span>
                    <span className="font-mono text-xs text-muted">
                      {formatCount(src.count)} · {src.from.slice(0, 4)}–{src.to.slice(0, 4)}
                    </span>
                  </li>
                );
              })}
            </ul>
            {summary.sources.india.undated ? (
              <p className="mt-3 text-[11px] leading-relaxed text-muted">
                {formatCount(summary.sources.india.undated)} card rows arrive without a timestamp, so they sit
                outside the timeline — counted, not invented.
              </p>
            ) : null}
          </div>
        </aside>
      </div>

        <div className="mt-6">
          <CoverageTimeline onPickYear={(y) => setYear((prev) => (prev === y ? null : y))} />
        </div>
      </div>

      {/* Mobile: the opened fragment arrives as a bottom sheet */}
      {selected ? (
         <div ref={mobileDialog} tabIndex={-1} className="fixed inset-0 z-50 bg-noir/45 backdrop-blur-sm lg:hidden" role="dialog" aria-modal="true" aria-label="Fragment detail">
          <div className="absolute inset-x-0 bottom-0 max-h-[72vh] overflow-y-auto border-t border-cloud/20 bg-ink/98 px-4 pb-6 pt-3 backdrop-blur-xl">
            <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-cloud/25" aria-hidden="true" />
            <FragmentDetail fragment={selected} />
             <div className="mt-4 border-t border-cloud/15 pt-4">
               <p className="flex items-center gap-2 label-xs text-muted"><ShieldCheck className="size-3.5" aria-hidden="true" /> Privacy-safe record</p>
               <p className="mt-2 text-xs leading-relaxed text-muted">Personal identifiers and precise coordinates were removed before this archive reached the page.</p>
             </div>
            <button
               ref={closeButton}
              type="button"
               onClick={closeDetail}
              className="mt-4 min-h-11 w-full border border-cloud/25 label-xs transition hover:bg-cloud/5"
            >
              Close fragment
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
