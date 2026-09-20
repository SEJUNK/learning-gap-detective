import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, ArrowRight, Network, Sparkles } from "lucide-react";
import { JourneyStrip } from "@/components/JourneyStrip";
import { ThreadPanel } from "@/components/ThreadPanel";
import { FragmentRow, ReceiptDetail } from "@/components/receipt-bits";
import {
  chapters,
  formatDate,
  moments,
  receiptsInChapter,
  stats,
  TYPE_META,
  type Receipt,
} from "@/lib/receipts";

export const Route = createFileRoute("/chapter/$slug")({
  loader: ({ params }) => {
    const chapter = chapters.find((c) => c.slug === params.slug);
    if (!chapter) throw notFound();
    return { slug: chapter.slug };
  },
  head: ({ loaderData }) => {
    const chapter = chapters.find((c) => c.slug === loaderData?.slug);
    if (!chapter) {
      return { meta: [{ title: "Chapter not found" }, { name: "robots", content: "noindex" }] };
    }
    return {
      meta: [
        { title: `${chapter.title} — Receipts of a Life` },
        { name: "description", content: chapter.headline },
        { property: "og:title", content: `${chapter.title} — Receipts of a Life` },
        { property: "og:description", content: chapter.headline },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ChapterPage,
  notFoundComponent: ChapterMissing,
});

function ChapterMissing() {
  return (
    <div className="mx-auto max-w-2xl px-6 py-24 text-center">
      <h1 className="font-display text-3xl">That chapter isn&apos;t in the archive</h1>
      <Link to="/" className="mt-6 inline-block rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-ink">
        Back to the start
      </Link>
    </div>
  );
}

const ACCENT_TEXT: Record<string, string> = {
  accent: "text-accent",
  gold: "text-gold",
  mint: "text-mint",
  rose: "text-rose",
  violet: "text-violet",
};

function ChapterPage() {
  const { slug } = Route.useLoaderData();
  const [anchor, setAnchor] = useState<Receipt | null>(null);
  const chapter = chapters.find((c) => c.slug === slug);
  if (!chapter) return <ChapterMissing />;
  const items = receiptsInChapter(chapter);

  const typeCounts = items.reduce<Record<string, number>>((acc, r) => {
    acc[r.type] = (acc[r.type] ?? 0) + 1;
    return acc;
  }, {});
  const chapterMoments = moments.filter(
    (m) => Number(m.day.slice(0, 4)) >= chapter.years[0] && Number(m.day.slice(0, 4)) <= chapter.years[1],
  );
  const picked = new Map<string, (typeof items)[number]>();
  for (const r of [
    ...items.filter((r) => r.note).slice(0, 3),
    ...items.filter((r) => r.type === "note").slice(0, 2),
    ...items.filter((r) => r.place).slice(0, 2),
  ])
    picked.set(r.id, r);
  // pad with one fragment per kind, then spread through the chapter, so no chapter looks empty
  for (const t of Object.keys(typeCounts)) {
    const r = items.find((x) => x.type === t && !picked.has(x.id));
    if (r && picked.size < 6) picked.set(r.id, r);
  }
  const step = Math.max(1, Math.floor(items.length / 6));
  for (let i = 0; picked.size < 6 && i < items.length; i += step) {
    const r = items[i];
    if (r) picked.set(r.id, r);
  }
  const highlights = [...picked.values()]
    .sort((a, b) => a.ts.localeCompare(b.ts))
    .slice(0, 6);
  const prev = chapters[chapter.index - 1];
  const next = chapters[chapter.index + 1];
  const topArtist = stats.topArtistByYear[String(chapter.years[1])] ?? stats.topArtistByYear[String(chapter.years[0])];
  const rankedTypes = Object.entries(typeCounts).sort((a, b) => b[1] - a[1]);
  const primaryFragment = anchor ?? highlights[0] ?? null;

  return (
    <div className="relative pb-16">
      {/* Full-bleed chapter title page */}
      <header className="surface-dark-base surface-night relative overflow-hidden">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -right-4 -top-10 select-none font-display font-black leading-none opacity-[0.07]"
          style={{ fontSize: "clamp(14rem,34vw,30rem)" }}
        >
          {String(chapter.index + 1).padStart(2, "0")}
        </span>
        <div className="relative mx-auto grid max-w-[100rem] gap-10 px-5 pb-20 pt-16 md:grid-cols-12 md:px-10 md:pb-28">
          <div className="md:col-span-8">
            <p className={`label-xs ${ACCENT_TEXT[chapter.accent]}`}>
              Chapter {String(chapter.index + 1).padStart(2, "0")} · {chapter.years[0]} — {chapter.years[1]}
            </p>
            <h1 className="mt-7 display-xl">
              {chapter.title.split(" ").map((w) => (
                <span key={w} className="block">
                  {w.toUpperCase()}
                </span>
              ))}
            </h1>
          </div>
          <div className="flex flex-col justify-end gap-6 md:col-span-4">
            <p className="text-base leading-relaxed">{chapter.headline}</p>
            <p className="numeral text-[clamp(2.2rem,5vw,3.4rem)]">{items.length.toLocaleString("en-US")}</p>
            <p className="label-xs text-muted">fragments in this chapter</p>
            <div className="flex gap-2">
              {prev ? <Link aria-label={`Previous chapter: ${prev.title}`} to="/chapter/$slug" params={{ slug: prev.slug }} className="grid size-11 place-items-center border border-cloud/20 text-muted transition hover:border-cloud/60 hover:text-cloud"><ArrowLeft className="size-4" /></Link> : null}
              {next ? <Link aria-label={`Next chapter: ${next.title}`} to="/chapter/$slug" params={{ slug: next.slug }} className="grid size-11 place-items-center border border-cloud/20 text-muted transition hover:border-cloud/60 hover:text-cloud"><ArrowRight className="size-4" /></Link> : null}
            </div>
          </div>
        </div>
      </header>
      <div className="relative mx-auto max-w-7xl px-4 md:px-10">
        <section className="fragment-in mt-10 overflow-hidden border-y border-cloud/15">
          <div className="grid divide-y divide-cloud/10 lg:grid-cols-3 lg:divide-x lg:divide-y-0">
            <aside className="p-6 md:p-8">
               <h2 className="eyebrow">Chapter index</h2>
              <div className="mt-5 space-y-5">{rankedTypes.slice(0, 5).map(([t, n]) => { const meta = TYPE_META[t as Receipt["type"]]; const share = Math.round((n / items.length) * 100); return <div key={t}><div className="flex justify-between font-mono text-[10px]"><span className={meta.text}><span aria-hidden="true">{meta.glyph}</span> {meta.label}</span><span className="text-muted">{share}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-cloud/5"><div className={`h-full ${meta.bg.replace("/15", "/70")}`} style={{ width: `${share}%` }} /></div></div>; })}</div>
               <div className="mt-8 border-y border-cloud/10 py-4"><p className="font-mono text-[9px] uppercase text-muted">Chapter signal</p><p className="mt-2 font-display text-3xl">{items.length.toLocaleString("en-US")} <span className="font-mono text-xs text-mint">fragments</span></p><p className="mt-1 truncate text-xs text-muted">Signature: {topArtist}</p></div>
              <p className="mt-6 text-sm leading-relaxed text-muted">{chapter.narration}</p>
            </aside>
            <div className="p-6 md:p-8 lg:col-span-2">
                <div className="flex items-center justify-between gap-4"><div><h2 className="eyebrow">Evidence spread</h2><p className="mt-1 font-display text-xl">{chapter.kicker}</p></div><span className="shrink-0 font-mono text-[9px] text-muted">{chapterMoments.length} DENSE DAYS</span></div>
              <div className="mt-7 space-y-2">{highlights.map((r, index) => <button key={r.id} type="button" aria-pressed={primaryFragment?.id === r.id} onClick={() => setAnchor(r)} className={`group relative min-h-11 w-full border-l px-5 py-3 text-left transition ${primaryFragment?.id === r.id ? "border-violet bg-violet/5" : "border-cloud/10 hover:border-accent hover:bg-cloud/[0.025]"}`}><span className="absolute -left-1 top-5 size-2 rounded-full bg-current text-cloud/30 group-hover:text-accent" aria-hidden="true" /><div className="flex items-start justify-between gap-4"><div className="min-w-0"><p className={`font-mono text-[9px] ${TYPE_META[r.type].text}`}>{String(index + 1).padStart(2, "0")} // {formatDate(r.ts).toUpperCase()}</p><p className="mt-1 break-words font-semibold group-hover:text-accent">{r.title}</p><p className="mt-1 line-clamp-2 break-words text-xs text-muted">{r.detail ?? r.subtitle ?? r.note}</p></div><span aria-hidden="true" className={`shrink-0 rounded p-2 font-mono text-xs ${TYPE_META[r.type].bg} ${TYPE_META[r.type].text}`}>{TYPE_META[r.type].glyph}</span></div></button>)}</div>
              <div className="mt-8 grid grid-cols-3 gap-4 border-t border-dashed border-cloud/10 pt-6 font-mono"><div><span className="block text-[9px] uppercase text-muted">Record kinds</span><strong className="text-xl">{Object.keys(typeCounts).length}</strong></div><div><span className="block text-[9px] uppercase text-muted">Dense days</span><strong className="text-xl">{chapterMoments.length}</strong></div><div><span className="block text-[9px] uppercase text-muted">Year span</span><strong className="text-xl">{chapter.years[1] - chapter.years[0] + 1}</strong></div></div>
            </div>
          </div>
        </section>
        {primaryFragment ? <section className="mt-5 grid gap-5 lg:grid-cols-12"><div className="lg:col-span-5"><ReceiptDetail receipt={primaryFragment} /></div><div className="lg:col-span-7"><ThreadPanel anchor={primaryFragment} onSelect={setAnchor} limit={5} /></div></section> : null}

        <section className="mt-8">
          <JourneyStrip activeSlug={chapter.slug} />
        </section>

        {chapterMoments.length ? (
          <section className="mt-8">
            <p className="eyebrow flex items-center gap-2"><Sparkles className="size-3" /> Dense days inside this chapter</p>
            <h2 className="mt-1 text-2xl font-bold">
              When four kinds of record land on one date
            </h2>
            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
              {chapterMoments.slice(0, 4).map((m) => (
                <div key={m.day} className="archive-panel rounded-lg p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-mono text-sm font-bold">{formatDate(`${m.day}T12:00:00`)}</p>
                    <span className="text-[11px] text-muted">{m.items.length} fragments</span>
                  </div>
                  {m.headline ? <p className="mt-1 text-xs text-muted">{m.headline}</p> : null}
                  <div className="mt-3 flex flex-col gap-2">
                    {m.items.slice(0, 4).map((r) => (
                      <FragmentRow key={r.id} receipt={r} active={anchor?.id === r.id} onSelect={setAnchor} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        <nav className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-cloud/10 pt-6">
          {prev ? (
            <Link
              to="/chapter/$slug"
              params={{ slug: prev.slug }}
              className="inline-flex items-center gap-2 rounded-md border border-cloud/15 px-4 py-2.5 text-xs text-cloud transition hover:border-accent/40 hover:text-accent"
            >
              <ArrowLeft className="size-4" /> {prev.title}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link
              to="/chapter/$slug"
              params={{ slug: next.slug }}
              className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-xs font-semibold text-ink transition hover:brightness-110"
            >
              {next.title} <ArrowRight className="size-4" />
            </Link>
          ) : (
            <Link
              to="/patterns"
              className="inline-flex items-center gap-2 rounded-md bg-accent px-4 py-2.5 text-xs font-semibold text-ink transition hover:brightness-110"
            >
              What it all means →
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
