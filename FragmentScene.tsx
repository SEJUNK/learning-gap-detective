import { Link } from "@tanstack/react-router";
import { ArrowDownRight } from "lucide-react";
import { useMemo } from "react";
import { SourceIcon } from "@/components/fragments/SourceMark";
import { FragmentArtifacts } from "@/components/story/FragmentArtifacts";
import { useReveal } from "@/hooks/useReveal";
import { formatCount, formatInr, summary } from "@/lib/data/summary";
import { SOURCE_META, SOURCE_ORDER, type SourceId } from "@/lib/data/types";
import { moments, receipts, type Receipt } from "@/lib/receipts";

const TONE: Record<SourceId, string> = {
  spotify: "var(--accent)",
  household: "var(--gold)",
  india: "var(--mint)",
};

function SourceVisual({ source }: { source: SourceId }) {
  const values = Object.values(summary.sources[source].byMonth);
  const max = Math.max(...values, 1);

  if (source === "spotify") {
    return (
      <div className="flex h-32 items-center gap-[2px]" aria-hidden="true">
        {values.map((value, i) => (
          <span
            key={i}
            className="min-w-[2px] flex-1"
            style={{ height: `${Math.max(2, (value / max) * 100)}%`, background: TONE[source], opacity: 0.35 + (value / max) * 0.65 }}
          />
        ))}
      </div>
    );
  }

  if (source === "household") {
    return (
      <div className="grid h-32 grid-cols-12 content-end gap-1.5" aria-hidden="true">
        {values.map((value, i) => (
          <span
            key={i}
            className="block border-t"
            style={{ height: `${8 + (value / max) * 50}px`, borderColor: TONE[source], opacity: 0.3 + (value / max) * 0.7 }}
          />
        ))}
      </div>
    );
  }

  return (
    <svg viewBox="0 0 100 38" className="h-32 w-full" aria-hidden="true">
      <path d="M2 30 C16 5 28 35 42 18 S68 3 98 22" fill="none" stroke="var(--mint)" strokeOpacity=".38" />
      {values.map((value, i) => {
        const x = 4 + (i / Math.max(1, values.length - 1)) * 92;
        const y = 30 - (value / max) * 24;
        return <circle key={i} cx={x.toFixed(2)} cy={y.toFixed(2)} r={(1 + (value / max) * 2).toFixed(2)} fill="var(--mint)" />;
      })}
    </svg>
  );
}

export function FragmentScene({ onPull }: { onPull: (receipt: Receipt) => void }) {
  const { ref, shown } = useReveal<HTMLDivElement>(0.08);
  const artifacts = useMemo(() => {
    const music = receipts.find((r) => r.type === "music" && (r.meta["plays"] as number) > 20 && r.note);
    const place = receipts.find((r) => r.type === "place" && r.place);
    const note = receipts.find((r) => r.type === "note" && r.title.length > 40);
    return [music, place, note].filter(Boolean) as Receipt[];
  }, []);

  const sourceDetails: Record<SourceId, { value: string; label: string; secondary: string; note: string }> = {
    spotify: {
      value: formatCount(summary.sources.spotify.count),
      label: "plays",
      secondary: `${formatCount(summary.sources.spotify.listeningHours ?? 0)} hours · ${formatCount(summary.sources.spotify.artists ?? 0)} artists`,
      note: `${summary.sources.spotify.from.slice(0, 4)}—${summary.sources.spotify.to.slice(0, 4)}`,
    },
    household: {
      value: formatCount(summary.sources.household.count),
      label: "entries",
      secondary: formatInr(summary.sources.household.spend ?? 0),
      note: `${summary.sources.household.from.slice(0, 4)}—${summary.sources.household.to.slice(0, 4)}`,
    },
    india: {
      value: formatCount(summary.sources.india.count),
      label: "payments",
      secondary: `${formatCount(summary.sources.india.cityCount ?? 0)} places · ${formatInr(summary.sources.india.spend ?? 0)}`,
      note: `${summary.sources.india.from.slice(0, 4)}—${summary.sources.india.to.slice(0, 4)}`,
    },
  };

  return (
    <section ref={ref} id="fragments" className="surface-ivory story-scene archival-grain relative overflow-hidden">
      <div className="story-spine" aria-hidden="true" />
      <div className="mx-auto max-w-[100rem] px-5 py-24 md:px-10 md:py-36">
        <div className={`grid gap-12 md:grid-cols-12 ${shown ? "reveal reveal-in" : "reveal"}`}>
          <p className="label-xs text-muted md:col-span-3">Scene 02 · The fragments</p>
          <div className="md:col-span-9">
            <p className="numeral-mega">{formatCount(summary.combined.count)} raw source records.</p>
            <h2 className="mt-8 display-xl text-muted">
              {formatCount(receipts.length)} became curated, discoverable fragments.
            </h2>
          </div>
        </div>

        <div className="mt-20 grid gap-8 border-y border-cloud/15 py-8 md:grid-cols-4 md:items-center" aria-label="How source records become an interactive story">
          {[
            ["Source records", formatCount(summary.combined.count)],
            ["Curated fragments", formatCount(receipts.length)],
            ["Cross-source connections", "Discovered threads"],
            ["Chapters + patterns", "6 chapters · 7 exhibits"],
          ].map(([label, value], i) => (
            <div key={label} className="flex items-center gap-5">
              <div>
                <p className="label-xs text-muted">{label}</p>
                <p className="mt-2 font-display text-2xl">{value}</p>
              </div>
              {i < 3 ? <ArrowDownRight className="ml-auto size-5 rotate-45 text-muted md:rotate-0" aria-hidden="true" /> : null}
            </div>
          ))}
        </div>

        <p className="mt-8 max-w-2xl text-sm leading-relaxed text-muted">
          Three organizer datasets are normalized in-browser. Source records become curated fragments; inferred fragments preserve clearly labelled interpretations; discovered connections link shared dates, places and details; derived patterns shape moments, threads and chapters.
        </p>

        <div className="mt-28 space-y-24">
          {SOURCE_ORDER.map((source, index) => {
            const meta = SOURCE_META[source];
            const detail = sourceDetails[source];
            return (
              <Link
                key={source}
                to="/archive"
                className={`group grid min-h-[25rem] items-center gap-10 border-t border-cloud/15 px-4 py-12 md:grid-cols-12 md:px-8 ${index === 1 ? "artifact-receipt" : index === 2 ? "evidence-rule" : ""}`}
              >
                <div className={`md:col-span-4 ${index % 2 ? "md:col-start-9 md:order-2" : ""}`}>
                  <p className="label-xs flex items-center gap-2" style={{ color: TONE[source] }}>
                    <SourceIcon source={source} className="size-4" /> {meta.verb}
                  </p>
                  <p className="mt-6 numeral-mega">{detail.value}</p>
                  <p className="mt-3 label-xs" style={{ color: TONE[source] }}>{detail.label}</p>
                  <p className="mt-5 font-display text-2xl">{detail.secondary}</p>
                  <p className="mt-3 label-xs text-muted">{detail.note}</p>
                  <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted">{meta.blurb}</p>
                </div>
                <div className={`md:col-span-7 ${index % 2 ? "md:col-start-1 md:row-start-1" : "md:col-start-6"}`}>
                  <SourceVisual source={source} />
                  <p className="sr-only">Monthly activity from the real {meta.dataset} dataset.</p>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-28">
          <p className="label-xs text-muted">Fragments, as they were recorded</p>
          <div className="mt-10"><FragmentArtifacts items={artifacts} onPull={onPull} /></div>
        </div>
      </div>
    </section>
  );
}