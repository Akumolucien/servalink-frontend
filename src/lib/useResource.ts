import { useCallback, useEffect, useRef, useState } from "react";

export interface Resource<T> {
  data: T | undefined;
  error: Error | undefined;
  loading: boolean;
  reload: () => Promise<void>;
  setData: (value: T) => void;
}

/** Minimal fetch hook: refetches when `deps` change, ignores stale responses. */
export function useResource<T>(fetcher: () => Promise<T>, deps: unknown[] = []): Resource<T> {
  const [data, setData] = useState<T>();
  const [error, setError] = useState<Error>();
  const [loading, setLoading] = useState(true);
  const run = useRef(0);
  const fetchRef = useRef(fetcher);
  fetchRef.current = fetcher;

  const load = useCallback(async () => {
    const id = ++run.current;
    setLoading(true);
    try {
      const value = await fetchRef.current();
      if (id === run.current) { setData(value); setError(undefined); }
    } catch (caught) {
      if (id === run.current) setError(caught instanceof Error ? caught : new Error("Request failed"));
    } finally {
      if (id === run.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    return () => { run.current++; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  return { data, error, loading, reload: load, setData };
}
