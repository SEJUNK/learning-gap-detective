import raw from "@/data/receipts.json";

export type ReceiptType =
  | "music"
  | "movie"
  | "place"
  | "purchase"
  | "photo"
  | "message"
  | "search"
  | "event"
  | "note";

export type Receipt = {
  id: string;
  type: ReceiptType;
  ts: string;
  title: string;
  subtitle?: string | null;
  detail?: string | null;
  tags: string[];
  meta: Record<string, unknown>;
  note?: string | null;
  source: string;
  place?: string | null;
  amount?: number | null;
  derived?: boolean;
};

export type Stats = {
  musicPlaysTotal: number;
  musicHoursTotal: number;
  hourHistogram: number[];
  yearPlays: Record<string, number>;
  nightShare: Record<string, number>;
  topArtists: { name: string; plays: number }[];
  topTracks: { name: string; artist: string; plays: number }[];
  topArtistByYear: Record<string, string>;
  minutesByMonth: Record<string, number>;
  spendByMonth: Record<string, number>;
  topCities: { name: string; visits: number }[];
  topMerchants: { name: string; visits: number }[];
  typeCounts: Record<string, number>;
  sources: string[];
};

export const receipts = (raw as { receipts: Receipt[] }).receipts;
export const stats = (raw as unknown as { stats: Stats }).stats;
const receiptPosition = new Map(receipts.map((receipt, index) => [receipt.id, index]));
const byType = new Map<ReceiptType, Receipt[]>();
const byYear = new Map<number, Receipt[]>();
const searchText = new Map<string, string>();

for (const receipt of receipts) {
  const typed = byType.get(receipt.type);
  if (typed) typed.push(receipt);
  else byType.set(receipt.type, [receipt]);

  const year = Number(receipt.ts.slice(0, 4));
  const yearly = byYear.get(year);
  if (yearly) yearly.push(receipt);
  else byYear.set(year, [receipt]);

  searchText.set(
    receipt.id,
    `${receipt.title} ${receipt.subtitle ?? ""} ${receipt.detail ?? ""} ${receipt.place ?? ""} ${receipt.tags.join(" ")}`.toLowerCase(),
  );
}

export const TYPE_META: Record<
  ReceiptType,
  { label: string; glyph: string; tone: string; text: string; bg: string; ring: string }
> = {
  music: { label: "Music", glyph: "♪", tone: "rose", text: "text-rose", bg: "bg-rose/15", ring: "ring-rose/30" },
  movie: { label: "Watched", glyph: "▣", tone: "violet", text: "text-violet", bg: "bg-violet/15", ring: "ring-violet/30" },
  place: { label: "Places", glyph: "◎", tone: "accent", text: "text-accent", bg: "bg-accent/15", ring: "ring-accent/30" },
  purchase: { label: "Purchases", glyph: "₹", tone: "gold", text: "text-gold", bg: "bg-gold/15", ring: "ring-gold/30" },
  photo: { label: "Photos", glyph: "✎", tone: "gold", text: "text-gold", bg: "bg-gold/15", ring: "ring-gold/30" },
  message: { label: "Messages", glyph: "✉", tone: "mint", text: "text-mint", bg: "bg-mint/15", ring: "ring-mint/30" },
  search: { label: "Searches", glyph: "⌕", tone: "accent", text: "text-accent", bg: "bg-accent/15", ring: "ring-accent/30" },
  event: { label: "Events", glyph: "◆", tone: "mint", text: "text-mint", bg: "bg-mint/15", ring: "ring-mint/30" },
  note: { label: "Notes", glyph: "✦", tone: "rose", text: "text-rose", bg: "bg-rose/15", ring: "ring-rose/30" },
};

export const TYPE_ORDER: ReceiptType[] = [
  "music",
  "movie",
  "place",
  "purchase",
  "photo",
  "message",
  "search",
  "event",
  "note",
];

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function formatDate(ts: string) {
  const d = new Date(ts);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

export function formatTime(ts: string) {
  const d = new Date(ts);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const suffix = h < 12 ? "AM" : "PM";
  const hh = h % 12 === 0 ? 12 : h % 12;
  return `${hh}:${m} ${suffix}`;
}

export function dayKey(ts: string) {
  return ts.slice(0, 10);
}

export function isNight(ts: string) {
  const h = Number(ts.slice(11, 13));
  return h < 5 || h >= 23;
}

/* ------------------------------ chapters ------------------------------ */

export type Chapter = {
  slug: string;
  index: number;
  title: string;
  kicker: string;
  years: [number, number];
  from: string;
  to: string;
  headline: string;
  narration: string;
  signature: string;
  accent: "accent" | "gold" | "mint" | "rose" | "violet";
};

const CHAPTER_DEFS: Omit<Chapter, "index" | "headline" | "narration" | "signature" | "from" | "to">[] = [
  {
    slug: "first-signals",
    title: "First Signals",
    kicker: "The account wakes up",
    years: [2013, 2014],
    accent: "accent",
  },
  {
    slug: "finding-a-sound",
    title: "Finding a Sound",
    kicker: "Taste under construction",
    years: [2015, 2016],
    accent: "violet",
  },
  { slug: "the-loud-year", title: "The Loud Year", kicker: "Everything at once", years: [2017, 2017], accent: "gold" },
  {
    slug: "small-expenses",
    title: "Milk, Trains, Tuesdays",
    kicker: "A life measured in receipts",
    years: [2018, 2019],
    accent: "mint",
  },
  {
    slug: "the-inside-years",
    title: "The Inside Years",
    kicker: "Rooms got smaller, playlists got longer",
    years: [2020, 2021],
    accent: "rose",
  },
  {
    slug: "moving-again",
    title: "Moving Again",
    kicker: "Cities return to the ledger",
    years: [2022, 2024],
    accent: "accent",
  },
];

function inChapter(r: Receipt, years: [number, number]) {
  const y = Number(r.ts.slice(0, 4));
  return y >= years[0] && y <= years[1];
}

export function receiptsInChapter(chapter: Chapter) {
  return receipts.filter((r) => inChapter(r, chapter.years));
}

function sum(nums: number[]) {
  return nums.reduce((a, b) => a + b, 0);
}

export const chapters: Chapter[] = CHAPTER_DEFS.map((def, i) => {
  const items: Receipt[] = [];
  for (let year = def.years[0]; year <= def.years[1]; year += 1) {
    items.push(...(byYear.get(year) ?? []));
  }
  const plays = sum(
    Object.entries(stats.yearPlays)
      .filter(([y]) => Number(y) >= def.years[0] && Number(y) <= def.years[1])
      .map(([, v]) => v),
  );
  const nightShares = Object.entries(stats.nightShare)
    .filter(([y]) => Number(y) >= def.years[0] && Number(y) <= def.years[1])
    .map(([, v]) => v);
  const nightAvg = nightShares.length ? Math.round(sum(nightShares) / nightShares.length) : 0;
  const spend = Math.round(
    sum(
      Object.entries(stats.spendByMonth)
        .filter(([m]) => Number(m.slice(0, 4)) >= def.years[0] && Number(m.slice(0, 4)) <= def.years[1])
        .map(([, v]) => v),
    ),
  );
  const artist = stats.topArtistByYear[String(def.years[1])] ?? stats.topArtistByYear[String(def.years[0])] ?? "—";
  const places = new Set(items.filter((r) => r.place).map((r) => r.place as string)).size;

  const headlines = [
    "A handful of plays, a web player, and nobody watching.",
    `${plays.toLocaleString("en-US")} plays later, a taste starts to hold its shape.`,
    "The single loudest stretch in eleven years of records.",
    `₹${spend.toLocaleString("en-IN")} of ordinary days — milk, autos, snacks, a train ticket.`,
    `${nightAvg}% of listening happened after midnight. The days blurred.`,
    `${places} places re-enter the ledger. The music gets quieter, the map gets wider.`,
  ];
  const narrations = [
    "The earliest fragments are thin: a few dozen songs on a borrowed web player in mid-2013, then almost nothing for a year. Whoever this is, they weren't recording their life yet — they were just pressing play.",
    "Two years of steady growth. Listening rises from a trickle to thousands of plays, artists repeat for the first time, and the first genuine favourites appear. Nothing else in the archive is moving yet — no spending, no places. Only sound.",
    "Everything spikes here. This is the peak listening year of the entire archive, and the other datasets wake up alongside it: a ledger of purchases begins, subscriptions appear, trains start showing up. The life gets busier and louder in the same breath.",
    "The most human stretch in the data. Hundreds of tiny expenses — milk, tea, idli, an auto, a mobile top-up — sit beside playlists and a Netflix subscription. The receipts are small, which is exactly why they add up to a portrait.",
    "Then the ledger stops almost entirely. For two years, the archive is dominated by music, much of it after midnight. There are no train or city records and barely a purchase slip. The absence of other receipts is the story here.",
    "The last chapter reverses the recorded pattern: fewer plays every year, alongside more cities, travel swipes and geotagged photos.",
  ];
  const signatures = [
    `${items.length} fragments · web player era`,
    `Signature artist: ${artist}`,
    `Peak year · ${plays.toLocaleString("en-US")} plays`,
    `${items.filter((r) => r.type === "purchase").length} purchase receipts`,
    `${nightAvg}% after midnight`,
    `${places} distinct places`,
  ];

  const sorted = items.map((r) => r.ts).sort();
  return {
    ...def,
    index: i,
    from: sorted[0] ?? `${def.years[0]}-01-01`,
    to: sorted[sorted.length - 1] ?? `${def.years[1]}-12-31`,
    headline: headlines[i] ?? "",
    narration: narrations[i] ?? "",
    signature: signatures[i] ?? "",
  };
});

export function chapterOf(ts: string) {
  const y = Number(ts.slice(0, 4));
  return chapters.find((c) => y >= c.years[0] && y <= c.years[1]) ?? chapters[chapters.length - 1];
}

const byChapterSlug = new Map<string, Receipt[]>();
for (const chapter of chapters) {
  const items: Receipt[] = [];
  for (let year = chapter.years[0]; year <= chapter.years[1]; year += 1) {
    items.push(...(byYear.get(year) ?? []));
  }
  byChapterSlug.set(chapter.slug, items);
}

/* ---------------------------- connections ---------------------------- */

export type Link = {
  receipt: Receipt;
  reason: string;
  strength: number;
};

const byDay = new Map<string, Receipt[]>();
const byPlace = new Map<string, Receipt[]>();
const bySubtitleAndType = new Map<string, Receipt[]>();
const byTag = new Map<string, Receipt[]>();
for (const r of receipts) {
  const k = dayKey(r.ts);
  const list = byDay.get(k);
  if (list) list.push(r);
  else byDay.set(k, [r]);
  if (r.place) {
    const placeItems = byPlace.get(r.place);
    if (placeItems) placeItems.push(r);
    else byPlace.set(r.place, [r]);
  }
  if (r.subtitle) {
    const subtitleKey = `${r.type}\u0000${r.subtitle}`;
    const subtitleItems = bySubtitleAndType.get(subtitleKey);
    if (subtitleItems) subtitleItems.push(r);
    else bySubtitleAndType.set(subtitleKey, [r]);
  }
  for (const tag of r.tags) {
    if (tag.length <= 2) continue;
    const tagItems = byTag.get(tag);
    if (tagItems) tagItems.push(r);
    else byTag.set(tag, [r]);
  }
}

export function findConnections(anchor: Receipt, limit = 8): Link[] {
  const links = new Map<string, Link>();
  const anchorTime = new Date(anchor.ts).getTime();
  const anchorTags = new Set(anchor.tags);

  const consider = (r: Receipt, reason: string, strength: number) => {
    if (r.id === anchor.id) return;
    const existing = links.get(r.id);
    if (!existing || existing.strength < strength) links.set(r.id, { receipt: r, reason, strength });
  };

  // same day, different type — the strongest signal of "one moment"
  const dateOnly = (r: Receipt) => r.ts.endsWith("T00:00:00");
  for (const r of byDay.get(dayKey(anchor.ts)) ?? []) {
    const hours = Math.abs(new Date(r.ts).getTime() - anchorTime) / 3600000;
    const vague = dateOnly(r) || dateOnly(anchor);
    if (r.type !== anchor.type) {
      const close = !vague && hours < 4;
      consider(r, close ? `Same hours — ${Math.round(hours * 60)} min apart` : "Same day", close ? 10 : 7);
    } else {
      consider(r, "Same day, same kind", 4);
    }
  }

  // neighbouring days
  const d = new Date(anchor.ts);
  for (const offset of [-1, 1]) {
    const nd = new Date(d.getTime() + offset * 86400000);
    for (const r of byDay.get(nd.toISOString().slice(0, 10)) ?? []) {
      if (r.type !== anchor.type) consider(r, offset < 0 ? "The day before" : "The day after", 5);
    }
  }

  // same place
  if (anchor.place) {
    for (const r of byPlace.get(anchor.place) ?? []) consider(r, `Also in ${anchor.place}`, 6);
  }

  // same artist / merchant / title
  if (anchor.subtitle) {
    for (const r of bySubtitleAndType.get(`${anchor.type}\u0000${anchor.subtitle}`) ?? []) {
      consider(r, `Same ${anchor.type === "music" ? "artist" : "category"}`, 3);
    }
  }

  // shared tags
  const tagCandidates = new Set<Receipt>();
  for (const tag of anchor.tags) {
    if (tag.length <= 2) continue;
    for (const r of byTag.get(tag) ?? []) tagCandidates.add(r);
  }
  for (const r of tagCandidates) {
    const shared = r.tags.filter((tag) => tag.length > 2 && anchorTags.has(tag));
    if (shared.length >= 2) consider(r, `Shares ${shared.slice(0, 2).join(" + ")}`, 3 + shared.length);
  }

  // keep the thread varied: at most two links of any one kind
  const perType = new Map<ReceiptType, number>();
  const out: Link[] = [];
  for (const l of [...links.values()].sort(
    (a, b) => b.strength - a.strength || a.receipt.ts.localeCompare(b.receipt.ts),
  )) {
    const n = perType.get(l.receipt.type) ?? 0;
    if (n >= 2) continue;
    perType.set(l.receipt.type, n + 1);
    out.push(l);
    if (out.length >= limit) break;
  }
  return out;
}

/** A "moment": a day where at least 3 different receipt types co-occur. */
export type Moment = {
  day: string;
  items: Receipt[];
  types: ReceiptType[];
  headline: string;
};

export const moments: Moment[] = (() => {
  const out: Moment[] = [];
  for (const [day, items] of byDay) {
    const types = [...new Set(items.map((r) => r.type))];
    if (types.length < 4) continue;
    const spend = sum(items.map((r) => r.amount ?? 0));
    const music = items.find((r) => r.type === "music");
    const place = items.find((r) => r.place)?.place;
    const headline = [
      music ? `“${music.title}”` : null,
      place ? `in ${place}` : null,
      spend ? `· ₹${Math.round(spend).toLocaleString("en-IN")} spent` : null,
    ]
      .filter(Boolean)
      .join(" ");
    out.push({ day, items: items.slice().sort((a, b) => a.ts.localeCompare(b.ts)), types, headline });
  }
  return out
    .sort((a, b) => b.types.length - a.types.length || b.items.length - a.items.length)
    .slice(0, 40)
    .sort((a, b) => a.day.localeCompare(b.day));
})();

/* ------------------------------ patterns ------------------------------ */

export type Pattern = {
  id: string;
  label: string;
  value: string;
  body: string;
  accent: "accent" | "gold" | "mint" | "rose" | "violet";
  bars?: { label: string; value: number }[];
};

export const patterns: Pattern[] = (() => {
  const hours = stats.hourHistogram;
  const total = sum(hours);
  const nightTotal = sum(hours.slice(0, 5)) + (hours[23] ?? 0);
  const peakHour = hours.indexOf(Math.max(...hours));
  const nightPct = Math.round((nightTotal / total) * 100);
  const weekday: number[] = new Array(7).fill(0) as number[];
  for (const r of receipts) {
    const d = new Date(r.ts).getDay();
    weekday[d] = (weekday[d] ?? 0) + 1;
  }
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const foodTags = receipts.filter((r) => r.tags.includes("food")).length;
  const milk = receipts.filter((r) => r.tags.includes("milk")).length;
  const autos = receipts.filter((r) => r.tags.includes("auto")).length;

  const years = Object.keys(stats.yearPlays).sort();
  const firstHalf = sum(years.slice(0, 6).map((y) => stats.yearPlays[y] ?? 0));
  const secondHalf = sum(years.slice(6).map((y) => stats.yearPlays[y] ?? 0));

  return [
    {
      id: "after-midnight",
      label: "The 2 AM habit",
      value: `${nightPct}%`,
      body: `Of every song ever played, this share landed between 11 PM and 5 AM. The single busiest listening hour across eleven years is ${peakHour}:00.`,
      accent: "accent",
      bars: hours.map((v, i) => ({ label: `${i}:00`, value: v })),
    },
    {
      id: "small-things",
      label: "A life of small amounts",
      value: `${foodTags.toLocaleString("en-US")}`,
      body: `Food receipts outnumber every other kind of spending — including ${milk} separate entries for milk and ${autos} auto rides. Nothing dramatic ever happens, and that is the portrait.`,
      accent: "gold",
    },
    {
      id: "attention-shift",
      label: "Attention moved",
      value: `${secondHalf > firstHalf ? "+" : "−"}${Math.abs(Math.round(((secondHalf - firstHalf) / firstHalf) * 100))}%`,
       body: `Listening in the later years (2019–2024) compared with the earlier years (2013–2018). Travel records also become more frequent later in the archive.`,
      accent: "violet",
    },
    {
      id: "week-shape",
      label: "The shape of a week",
      value: dayNames[weekday.indexOf(Math.max(...weekday))] ?? "",
      body: "Every fragment in the archive, sorted by weekday. The bars barely move: this life ran at almost exactly the same volume seven days a week, weekend or not.",
      accent: "mint",
      bars: weekday.map((v, i) => ({ label: dayNames[i] ?? "", value: v })),
    },
    {
      id: "loyalty",
      label: "Loyalty over novelty",
      value: `${(stats.topArtists[0]?.plays ?? 0).toLocaleString("en-US")}×`,
      body: `${stats.topArtists[0]?.name ?? "One artist"} alone accounts for that many plays. The top twelve artists repeat endlessly while thousands of others are heard once and dropped.`,
      accent: "rose",
      bars: stats.topArtists.slice(0, 8).map((a) => ({ label: a.name, value: a.plays })),
    },
    {
      id: "returning-places",
      label: "Places that keep returning",
      value: `${stats.topCities[0]?.visits ?? 0}×`,
      body: `${stats.topCities[0]?.name ?? "One city"} is the most revisited place in the ledger. A handful of cities absorb most of the travel; the rest are visited exactly once.`,
      accent: "accent",
      bars: stats.topCities.slice(0, 8).map((c) => ({ label: c.name, value: c.visits })),
    },
  ];
})();

/* ------------------------------ searching ------------------------------ */

export function searchReceipts(
  query: string,
  types: ReceiptType[],
  chapterSlug: string | null,
  nightOnly: boolean,
) {
  const q = query.trim().toLowerCase();
  const chapterItems = chapterSlug ? byChapterSlug.get(chapterSlug) : undefined;
  const typeItems = types.length === 1 ? byType.get(types[0] as ReceiptType) : undefined;
  let candidates = receipts;

  if (chapterItems && typeItems) {
    const allowed = new Set(chapterItems.length <= typeItems.length ? chapterItems : typeItems);
    candidates = (chapterItems.length <= typeItems.length ? typeItems : chapterItems)
      .filter((receipt) => allowed.has(receipt))
      .sort((a, b) => (receiptPosition.get(a.id) ?? 0) - (receiptPosition.get(b.id) ?? 0));
  } else if (chapterItems) {
    candidates = chapterItems;
  } else if (typeItems) {
    candidates = typeItems;
  }

  return candidates.filter((r) => {
    if (types.length && !types.includes(r.type)) return false;
    if (nightOnly && !isNight(r.ts)) return false;
    if (!q) return true;
    return searchText.get(r.id)?.includes(q) ?? false;
  });
}

export const monthSeries = (() => {
  const counts = new Map<string, number>();
  for (const r of receipts) {
    const k = r.ts.slice(0, 7);
    counts.set(k, (counts.get(k) ?? 0) + 1);
  }
  return [...counts.entries()].sort().map(([month, count]) => ({ month, count }));
})();
