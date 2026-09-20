import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { useMemo, useState } from "react";
import { CategoryWall } from "@/components/story/CategoryWall";
import { ChapterJourney } from "@/components/story/ChapterJourney";
import { DensityTimeline } from "@/components/story/DensityTimeline";
import { FragmentScene } from "@/components/story/FragmentScene";
import { HeroField } from "@/components/story/HeroField";
import { PatternWall } from "@/components/story/PatternWall";
import { ThreadStory } from "@/components/story/ThreadStory";
import { formatCount, summary } from "@/lib/data/summary";
import { moments, receipts, type Receipt } from "@/lib/receipts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Receipts of a Life — eleven years told by 161,738 records" },
      {
        name: "description",
        content:
          "Listening history, a household ledger and card activity, read as one life: three windows on the same eleven years, assembled entirely in the browser.",
      },
      { property: "og:title", content: "Receipts of a Life" },
      {
        property: "og:description",
        content: "Three datasets, eleven years, one story told through fragments.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Overture,
});

function Overture() {
  const featuredMoment = useMemo(
    () => moments.slice().sort((a, b) => b.types.length - a.types.length)[0],
    [],
  );
  const [anchor, setAnchor] = useState<Receipt>(
    () =>
      featuredMoment?.items.find((r) => r.type === "music") ?? featuredMoment?.items[0] ?? receipts[0]!,
  );

  const pullThread = (rec: Receipt) => {
    setAnchor(rec);
    const target = document.getElementById("thread-title");
    target?.scrollIntoView({ behavior: "smooth", block: "start" });
    target?.focus({ preventScroll: true });
  };

  return (
    <div>
      {/* DARK HERO */}
      <HeroField />

      <FragmentScene onPull={pullThread} />

      {/* SCENE 03 · CONNECTION */}
      <div id="thread">
        <ThreadStory anchor={anchor} onSelect={setAnchor} />
      </div>

      {/* SCENE 04 · TIME */}
      <DensityTimeline />

      {/* WARM CHAPTERS */}
      <ChapterJourney />

      {/* DARK PATTERNS */}
      <PatternWall />

      {/* LIGHT EXPLORE */}
      <CategoryWall />

      {/* DARK CLOSING */}
      <section className="surface-dark-base surface-night">
        <div className="mx-auto max-w-[100rem] px-5 py-24 md:px-10 md:py-32">
          <p className="label-xs text-muted">The end of the archive</p>
          <h2 className="mt-8 display-xl">
            {formatCount(receipts.length)} FRAGMENTS,
            <span className="block" style={{ color: "color-mix(in oklab, var(--cloud) 42%, transparent)" }}>
              ONE LIFE.
            </span>
          </h2>
          <div className="mt-12 flex flex-wrap items-center gap-4">
            <Link
              to="/archive"
              className="group inline-flex min-h-14 items-center gap-3 bg-cloud px-8 label-xs text-ink transition hover:gap-5"
            >
              Read the whole archive
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              to="/patterns"
              className="inline-flex min-h-14 items-center border-b border-cloud/40 px-2 label-xs text-muted transition hover:border-cloud hover:text-cloud"
            >
              See every pattern
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
