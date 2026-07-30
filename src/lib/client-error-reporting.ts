export type ClientErrorContext = Record<string, unknown>;

/**
 * Platform-neutral client error reporting hook.
 *
 * Errors are always logged locally. Hosting platforms or monitoring tools can
 * subscribe to the `truckmate:client-error` browser event without coupling the
 * application to a specific vendor.
 */
export function reportClientError(error: unknown, context: ClientErrorContext = {}) {
  const responseDetails =
    error instanceof Response
      ? { message: `Response ${error.status}${error.url ? ` at ${error.url}` : ""}` }
      : null;
  const normalized =
    responseDetails ??
    (error instanceof Error
      ? { message: error.message, stack: error.stack }
      : { message: String(error) });

  console.error("[TruckMate] Client error", error, context);

  if (typeof window === "undefined") return;
  window.dispatchEvent(
    new CustomEvent("truckmate:client-error", {
      detail: {
        ...normalized,
        route: window.location.pathname,
        context,
        occurredAt: new Date().toISOString(),
      },
    }),
  );
}
