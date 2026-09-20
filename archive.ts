import { normalizeHousehold, type HouseholdPayload } from "./sources/household";
import { normalizeIndia, type IndiaPayload } from "./sources/india";
import { normalizeSpotify, type SpotifyPayload } from "./sources/spotify";
import type { Fragment, SourceId } from "./types";

/**
 * The archive is built entirely in the browser.
 *
 * The two small ledgers (household, card activity) are normalized eagerly.
 * The 149,860 listening records stay in their compact columnar form and are
 * turned into Fragments only when a view actually needs one, so the timeline
 * can hold every record without ever materializing 150k objects.
 */

const MINUTE = 60_000;
const SRC_CODE: Record<SourceId, number> = { spotify: 0, household: 1, india: 2 };
const CODE_SRC: SourceId[] = ["spotify", "household", "india"];

export type Archive = {
  /** Total records normalized, across all three datasets. */
  total: number;
  /** Chronological index over every record: parallel arrays, ascending time. */
  index: { ts: Float64Array; source: Uint8Array; pos: Int32Array; night: Uint8Array };
  counts: Record<SourceId, number>;
  range: { from: number; to: number };
  /** Materialize the fragment at a position in the chronological index. */
  at: (i: number) => Fragment;
  /** Lowercased haystack for a position, used by search. */
  haystack: (i: number) => string;
};

let cache: Promise<Archive> | null = null;

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Could not load ${url} (${res.status})`);
  return (await res.json()) as T;
}

export function loadArchive(): Promise<Archive> {
  if (cache) return cache;
  cache = (async () => {
    const [spotify, household, india] = await Promise.all([
      fetchJson<SpotifyPayload>("/data/spotify.json"),
      fetchJson<HouseholdPayload>("/data/household.json"),
      fetchJson<IndiaPayload>("/data/india.json"),
    ]);

    const ledgers: Record<1 | 2, Fragment[]> = {
      1: normalizeHousehold(household),
      2: normalizeIndia(india),
    };

    const spTimes = spotify.cols.t;
    const total = spTimes.length + ledgers[1].length + ledgers[2].length;

    // Merge three already-sorted streams into one chronological index.
    const ts = new Float64Array(total);
    const source = new Uint8Array(total);
    const pos = new Int32Array(total);
    const night = new Uint8Array(total);
    let a = 0;
    let b = 0;
    let c = 0;
    for (let k = 0; k < total; k += 1) {
      const ta = a < spTimes.length ? (spTimes[a] ?? 0) * MINUTE : Infinity;
      const tb = b < ledgers[1].length ? (ledgers[1][b]?.timestamp ?? 0) : Infinity;
      const tc = c < ledgers[2].length ? (ledgers[2][c]?.timestamp ?? 0) : Infinity;
      if (ta <= tb && ta <= tc) {
        ts[k] = ta;
        source[k] = SRC_CODE.spotify;
        pos[k] = a;
        a += 1;
      } else if (tb <= tc) {
        ts[k] = tb;
        source[k] = SRC_CODE.household;
        pos[k] = b;
        b += 1;
      } else {
        ts[k] = tc;
        source[k] = SRC_CODE.india;
        pos[k] = c;
        c += 1;
      }
      const hour = new Date(ts[k] ?? 0).getHours();
      night[k] = hour < 5 || hour >= 23 ? 1 : 0;
    }

    // Search haystacks: built once per dictionary entry, not per record.
    const trackLc = spotify.dict.tracks.map((s) => s.toLowerCase());
    const artistLc = spotify.dict.artists.map((s) => s.toLowerCase());
    const ledgerHay: Record<1 | 2, string[]> = {
      1: ledgers[1].map((f) => `${f.title} ${f.description} ${f.category}`.toLowerCase()),
      2: ledgers[2].map((f) =>
        `${f.title} ${f.description} ${f.location ?? ""}`.toLowerCase(),
      ),
    };

    const spotifyCache = new Map<number, Fragment>();

    const at = (i: number): Fragment => {
      const code = source[i] ?? 0;
      const p = pos[i] ?? 0;
      if (code === 0) {
        const hit = spotifyCache.get(p);
        if (hit) return hit;
        // Normalize a one-record slice through the same source normalizer.
        const slice = normalizeSpotify({
          ...spotify,
          count: 1,
          cols: {
            t: [spotify.cols.t[p] ?? 0],
            track: [spotify.cols.track[p] ?? 0],
            artist: [spotify.cols.artist[p] ?? 0],
            album: [spotify.cols.album[p] ?? 0],
            ms: [spotify.cols.ms[p] ?? 0],
            platform: [spotify.cols.platform[p] ?? 0],
            flags: [spotify.cols.flags[p] ?? 0],
          },
        })[0]!;
        const fragment = { ...slice, id: `spotify-${p}` };
        if (spotifyCache.size >= 4000) {
          const oldest = spotifyCache.keys().next().value;
          if (oldest !== undefined) spotifyCache.delete(oldest);
        }
        spotifyCache.set(p, fragment);
        return fragment;
      }
      return ledgers[code as 1 | 2][p]!;
    };

    const haystack = (i: number): string => {
      const code = source[i] ?? 0;
      const p = pos[i] ?? 0;
      if (code === 0) {
        return `${trackLc[spotify.cols.track[p] ?? 0] ?? ""} ${artistLc[spotify.cols.artist[p] ?? 0] ?? ""}`;
      }
      return ledgerHay[code as 1 | 2][p] ?? "";
    };

    return {
      total,
      index: { ts, source, pos, night },
      counts: {
        spotify: spTimes.length,
        household: ledgers[1].length,
        india: ledgers[2].length,
      },
      range: { from: ts[0] ?? 0, to: ts[total - 1] ?? 0 },
      at,
      haystack,
    } satisfies Archive;
  })();
  return cache;
}

export type FragmentQuery = {
  query: string;
  sources: SourceId[];
  yearFrom?: number;
  yearTo?: number;
  nightOnly?: boolean;
  minAmount?: number;
};

/** Filter the chronological index. Returns positions, newest last. */
export function filterArchive(archive: Archive, q: FragmentQuery): Int32Array {
  const { ts, source, night } = archive.index;
  const needle = q.query.trim().toLowerCase();
  const wanted = new Set(q.sources.map((s) => SRC_CODE[s]));
  const from = q.yearFrom ? Date.UTC(q.yearFrom, 0, 1) : -Infinity;
  const to = q.yearTo ? Date.UTC(q.yearTo + 1, 0, 1) : Infinity;
  const out = new Int32Array(ts.length);
  let n = 0;
  for (let i = 0; i < ts.length; i += 1) {
    if (wanted.size && !wanted.has(source[i] ?? 0)) continue;
    const t = ts[i] ?? 0;
    if (t < from || t >= to) continue;
    if (q.nightOnly) {
      if (!night[i]) continue;
    }
    if (needle && !archive.haystack(i).includes(needle)) continue;
    if (q.minAmount) {
      const amount = archive.at(i).amount ?? 0;
      if (amount < q.minAmount) continue;
    }
    out[n] = i;
    n += 1;
  }
  return out.subarray(0, n);
}

export function sourceOf(code: number): SourceId {
  return CODE_SRC[code] ?? "spotify";
}
