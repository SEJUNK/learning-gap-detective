import { Link } from "@tanstack/react-router";
import { chapters, monthSeries } from "@/lib/receipts";

const ACCENT_BG: Record<string, string> = {
  accent: "bg-accent/70",
  gold: "bg-gold/70",
  mint: "bg-mint/70",
  rose: "bg-rose/70",
  violet: "bg-violet/70",
};

const ACCENT_PILL: Record<string, string> = {
  accent: "bg-accent text-ink",
  gold: "bg-gold text-ink",
  mint: "bg-mint text-ink",
  rose: "bg-rose text-ink",
  violet: "bg-violet text-ink",
};

export function JourneyStrip({ activeSlug }: { activeSlug?: string }) {
  const max = Math.max(...monthSeries.map((m) => m.count));
  const peaks = new Map<string, (typeof chapters)[number]>();
  for (const c of chapters) {
    const inside = monthSeries.filter(
      (m) => Number(m.month.slice(0, 4)) >= c.years[0] && Number(m.month.slice(0, 4)) <= c.years[1],
    );
    const top = inside.slice().sort((a, b) => b.count - a.count)[0];
    if (top) peaks.set(top.month, c);
  }

  return (
    <div className="archive-panel rounded-lg p-5 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">The journey</p>
          <p className="mt-1 text-xl font-bold">
            {monthSeries.length} months of fragments, in one line
          </p>
        </div>
        <div className="hidden flex-wrap gap-1.5 sm:flex">
          {chapters.map((c) => (
            <Link
              key={c.slug}
              to="/chapter/$slug"
              params={{ slug: c.slug }}
              className={`rounded-md px-2 py-1 text-[11px] transition ${
                activeSlug === c.slug ? ACCENT_PILL[c.accent] : "bg-cloud/5 text-muted hover:bg-cloud/10"
              }`}
            >
              {c.years[0] === c.years[1] ? c.years[0] : `${c.years[0]}–${String(c.years[1]).slice(2)}`}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-10 flex h-28 items-end gap-[3px] md:h-36">
        {monthSeries.map((m) => {
          const peak = peaks.get(m.month);
          const chapter = chapters.find(
            (c) => Number(m.month.slice(0, 4)) >= c.years[0] && Number(m.month.slice(0, 4)) <= c.years[1],
          );
          const isActive = activeSlug && chapter?.slug === activeSlug;
          return (
            <div
              key={m.month}
              className="relative flex-1"
              style={{ height: `${Math.max(4, (m.count / max) * 100)}%` }}
              title={`${m.month} · ${m.count} fragments`}
            >
              <div
                className={`h-full w-full rounded-t-sm ${
                  peak ? ACCENT_BG[peak.accent] : isActive ? "bg-cloud/30" : "bg-cloud/10"
                } font-mono`}
              />
              {peak ? (
                <span
                  className={`absolute -top-7 left-1/2 hidden -translate-x-1/2 whitespace-nowrap rounded-full px-2 py-0.5 text-[10px] font-semibold md:block ${ACCENT_PILL[peak.accent]}`}
                >
                  {peak.title}
                </span>
              ) : null}
            </div>
          );
        })}
      </div>
      <div className="mt-3 flex justify-between font-mono text-[9px] text-muted">
        <span>{monthSeries[0]?.month}</span>
        <span>{monthSeries[monthSeries.length - 1]?.month}</span>
      </div>
    </div>
  );
}
