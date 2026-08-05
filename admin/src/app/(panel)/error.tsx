"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui";

/**
 * Panel-level error boundary. If a page throws while rendering, show a friendly
 * in-app retry inside the admin shell (sidebar stays) instead of the browser's
 * raw dark "This page couldn't load" screen.
 */
export default function PanelError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-6 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-copper/15 text-copper-light">
        <AlertTriangle size={30} />
      </div>
      <h1 className="mt-5 text-xl font-semibold tracking-tight">
        Something went wrong
      </h1>
      <p className="mt-2 max-w-md text-sm text-muted">
        This page hit an unexpected error. It&apos;s usually a brief hiccup —
        try again in a moment.
      </p>
      <div className="mt-6">
        <Button onClick={reset}>Try again</Button>
      </div>
    </div>
  );
}
