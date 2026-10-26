"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

// Shown when the whole app crashes (it replaces the root layout, so no
// translations or fonts are loaded here). The error is reported to Sentry.
export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="fr">
      <body
        style={{
          margin: 0,
          minHeight: "100vh",
          display: "grid",
          placeItems: "center",
          background: "#f4f2ef",
          color: "#0f172a",
          fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
          padding: 16,
        }}
      >
        <main style={{ maxWidth: 440, textAlign: "center" }}>
          <p style={{ fontSize: 13, fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "#d62828" }}>
            AfrikWholesaler
          </p>
          <h1 style={{ fontSize: 28, margin: "12px 0 8px" }}>Une erreur est survenue</h1>
          <p style={{ color: "#64748b", margin: 0 }}>
            Notre équipe a été prévenue. Réessayez dans un instant.
            <br />
            Something went wrong — our team has been notified.
          </p>
          <button
            onClick={() => reset()}
            style={{
              marginTop: 24,
              height: 48,
              padding: "0 28px",
              border: 0,
              borderRadius: 999,
              background: "#d62828",
              color: "#fff",
              fontSize: 15,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Réessayer · Try again
          </button>
          {error.digest && <p style={{ marginTop: 16, fontSize: 12, color: "#94a3b8" }}>Ref. {error.digest}</p>}
        </main>
      </body>
    </html>
  );
}
