"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";
import { useT } from "@/i18n/client";

// A failing admin page shows this inside the admin shell, so the sidebar keeps working.
export default function AdminError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useT();
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <p className="max-w-sm text-sm text-text-secondary">{t.common.pageFailed}</p>
      <button
        onClick={() => reset()}
        className="rounded-[var(--radius-sm)] bg-brand px-4 py-2 text-sm font-medium text-white hover:opacity-90"
      >
        {t.common.tryAgain}
      </button>
    </div>
  );
}
