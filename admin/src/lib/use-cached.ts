"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Module-level cache that persists across route changes within the session.
 * Revisiting a page shows the last data instantly while it revalidates in the
 * background (stale-while-revalidate).
 */
const cache = new Map<string, unknown>();

export interface UseCached<T> {
  data: T | null;
  loading: boolean;
  reload: () => Promise<void>;
  setData: (updater: T | ((prev: T | null) => T | null)) => void;
}

/**
 * Returns cached data immediately if present (no spinner on revisit), then
 * refetches in the background and updates. Keeps the first-load spinner when
 * there is no cache yet.
 *
 * `key` should change whenever the fetcher's inputs change (e.g. page/search)
 * so distinct queries get distinct cache entries.
 */
export function useCached<T>(
  key: string,
  fetcher: () => Promise<T>,
): UseCached<T> {
  const cached = (cache.get(key) as T | undefined) ?? null;
  const [data, setDataState] = useState<T | null>(cached);
  const [loading, setLoading] = useState(cached === null);
  const fetcherRef = useRef(fetcher);
  fetcherRef.current = fetcher;

  function setData(updater: T | ((prev: T | null) => T | null)) {
    setDataState((prev) => {
      const next =
        typeof updater === "function"
          ? (updater as (p: T | null) => T | null)(prev)
          : updater;
      if (next !== null) cache.set(key, next);
      return next;
    });
  }

  async function reload() {
    const fresh = await fetcherRef.current();
    cache.set(key, fresh);
    setDataState(fresh);
    setLoading(false);
  }

  useEffect(() => {
    const existing = cache.get(key) as T | undefined;
    if (existing !== undefined) {
      setDataState(existing);
      setLoading(false);
    } else {
      setLoading(true);
    }
    let active = true;
    fetcherRef
      .current()
      .then((fresh) => {
        cache.set(key, fresh);
        if (active) {
          setDataState(fresh);
          setLoading(false);
        }
      })
      .catch(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return { data, loading, reload, setData };
}
