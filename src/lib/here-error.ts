export type HereErrorKind =
  | "aborted"
  | "offline"
  | "unauthorized"
  | "rate-limit"
  | "server"
  | "network"
  | "unknown";

export type HereErrorInfo = {
  kind: HereErrorKind;
  message: string;
  retryable: boolean;
};

export function classifyHereError(error: unknown, online = true): HereErrorInfo {
  if (!online) {
    return {
      kind: "offline",
      message: "Geen internetverbinding. Controleer je verbinding en probeer opnieuw.",
      retryable: true,
    };
  }

  if (error instanceof DOMException && error.name === "AbortError") {
    return {
      kind: "aborted",
      message: "De routeberekening is geannuleerd.",
      retryable: false,
    };
  }

  const message = error instanceof Error ? error.message : String(error ?? "");
  const statusMatch = message.match(/\b(401|403|429|5\d\d)\b/);
  const status = statusMatch ? Number(statusMatch[1]) : undefined;

  if (status === 401 || status === 403) {
    return {
      kind: "unauthorized",
      message: "HERE heeft de API-sleutel geweigerd. Controleer de sleutel en domeinrestricties.",
      retryable: false,
    };
  }

  if (status === 429) {
    return {
      kind: "rate-limit",
      message: "HERE ontvangt tijdelijk te veel aanvragen. Wacht even en probeer opnieuw.",
      retryable: true,
    };
  }

  if (status != null && status >= 500) {
    return {
      kind: "server",
      message: "De routedienst van HERE is tijdelijk niet beschikbaar. Probeer het opnieuw.",
      retryable: true,
    };
  }

  if (/network|netwerk|failed to fetch|timeout|timed out/i.test(message)) {
    return {
      kind: "network",
      message: "HERE kon niet worden bereikt. Controleer je verbinding en probeer opnieuw.",
      retryable: true,
    };
  }

  return {
    kind: "unknown",
    message: message || "De route kon niet worden berekend.",
    retryable: false,
  };
}
