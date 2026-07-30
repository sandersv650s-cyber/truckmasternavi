import assert from "node:assert/strict";
import test from "node:test";
import { classifyHereError } from "./here-error";

test("classifies offline errors as retryable", () => {
  assert.deepEqual(classifyHereError(new Error("failed"), false), {
    kind: "offline",
    message: "Geen internetverbinding. Controleer je verbinding en probeer opnieuw.",
    retryable: true,
  });
});

test("does not retry rejected API keys", () => {
  const info = classifyHereError(new Error("HERE routing fout (403)"));
  assert.equal(info.kind, "unauthorized");
  assert.equal(info.retryable, false);
});

test("marks rate limits and server errors as retryable", () => {
  assert.equal(classifyHereError(new Error("HERE routing fout (429)")).kind, "rate-limit");
  assert.equal(classifyHereError(new Error("HERE routing fout (503)")).kind, "server");
  assert.equal(classifyHereError(new Error("HERE routing fout (503)")).retryable, true);
});

test("recognizes network and timeout errors", () => {
  assert.equal(classifyHereError(new Error("Failed to fetch")).kind, "network");
  assert.equal(classifyHereError(new Error("Request timeout")).retryable, true);
});

test("keeps an unknown useful message", () => {
  const info = classifyHereError(new Error("Geen route beschikbaar"));
  assert.equal(info.kind, "unknown");
  assert.equal(info.message, "Geen route beschikbaar");
  assert.equal(info.retryable, false);
});
