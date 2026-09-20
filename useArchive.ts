import { useEffect, useState } from "react";
import { loadArchive, type Archive } from "@/lib/data/archive";

type State = { archive: Archive | null; loading: boolean; error: string | null };

/**
 * Loads and normalizes the three datasets in the browser, once per session.
 * Runs after hydration so server rendering stays static.
 */
export function useArchive(): State {
  const [state, setState] = useState<State>({ archive: null, loading: true, error: null });

  useEffect(() => {
    let alive = true;
    loadArchive()
      .then((archive) => {
        if (alive) setState({ archive, loading: false, error: null });
      })
      .catch((err: unknown) => {
        if (alive)
          setState({
            archive: null,
            loading: false,
            error: err instanceof Error ? err.message : "Could not read the archive",
          });
      });
    return () => {
      alive = false;
    };
  }, []);

  return state;
}

/** Debounce any fast-changing value (used for the archive search field). */
export function useDebounced<T>(value: T, delay = 250): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}
