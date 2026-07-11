"use client";

import { useEffect } from "react";

/**
 * Route-level error boundary. If a page (e.g. /shop) fails to render — most
 * often a transient backend/Neon cold-start — show a friendly in-app retry
 * screen instead of the browser's broken "This page couldn't load" page.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Surface the real cause in the console for debugging.
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-cream-card text-brand">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          className="h-8 w-8"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z"
          />
        </svg>
      </div>
      <h1 className="mt-5 font-serif text-2xl font-bold text-espresso">
        We couldn&apos;t load this page
      </h1>
      <p className="mt-2 max-w-md text-sm text-coffee/75">
        This is usually a brief hiccup while our server wakes up. Please try
        again in a moment.
      </p>
      <div className="mt-6 flex items-center gap-3">
        <button
          onClick={reset}
          className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:brightness-105"
        >
          Try again
        </button>
        <a
          href="/"
          className="rounded-full border border-line px-6 py-2.5 text-sm font-semibold text-coffee transition hover:border-brand hover:text-brand"
        >
          Go home
        </a>
      </div>
    </div>
  );
}
