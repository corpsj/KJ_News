type ErrorContext = Record<string, unknown>;

/**
 * Central server-side error sink. Today it emits a structured console error
 * (visible in Vercel logs). This is the single integration point for an error
 * monitoring service — to enable Sentry:
 *   1) npm i @sentry/nextjs && npx @sentry/wizard@latest -i nextjs
 *   2) set SENTRY_DSN / NEXT_PUBLIC_SENTRY_DSN
 *   3) forward `payload` here to Sentry.captureException.
 * Routing all reporting through this helper means that's a one-file change.
 */
export function reportError(error: unknown, context?: ErrorContext): void {
  const payload = {
    message: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
    ...context,
  };
  console.error("[error]", JSON.stringify(payload));
}
