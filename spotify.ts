import type { Fragment } from "../types";

/** Columnar payload written from `archive/spotify_history.csv`. */
export type SpotifyPayload = {
  source: "spotify";
  count: number;
  dict: { tracks: string[]; artists: string[]; albums: string[]; platforms: string[] };
  cols: {
    t: number[];
    track: number[];
    artist: number[];
    album: number[];
    ms: number[];
    platform: number[];
    flags: number[];
  };
};

const MINUTE = 60_000;

/** Normalize listening history into Fragments. One play = one fragment. */
export function normalizeSpotify(payload: SpotifyPayload): Fragment[] {
  const { dict, cols } = payload;
  const out: Fragment[] = new Array(cols.t.length);
  for (let i = 0; i < cols.t.length; i += 1) {
    const track = dict.tracks[cols.track[i] ?? 0] ?? "Unknown track";
    const artist = dict.artists[cols.artist[i] ?? 0] ?? "Unknown artist";
    const album = dict.albums[cols.album[i] ?? 0] ?? "";
    const platform = dict.platforms[cols.platform[i] ?? 0] ?? "";
    const ms = cols.ms[i] ?? 0;
    const flags = cols.flags[i] ?? 0;
    out[i] = {
      id: `spotify-${i}`,
      source: "spotify",
      timestamp: (cols.t[i] ?? 0) * MINUTE,
      category: "Listening",
      title: track,
      description: artist,
      metadata: {
        artist,
        album,
        platform,
        secondsPlayed: Math.round(ms / 1000),
        shuffle: (flags & 1) === 1,
        skipped: (flags & 2) === 2,
      },
    };
  }
  return out;
}
