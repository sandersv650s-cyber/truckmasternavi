import assert from "node:assert/strict";
import test from "node:test";
import {
  changeRoutePointLabel,
  isValidCoordinate,
  validateRoutePoints,
} from "./route-input";

test("accepts valid coordinates and rejects placeholders", () => {
  assert.equal(isValidCoordinate(52.0907, 5.1214), true);
  assert.equal(isValidCoordinate(0, 0), false);
  assert.equal(isValidCoordinate(91, 5), false);
  assert.equal(isValidCoordinate(-91, 5), false);
  assert.equal(isValidCoordinate(52, 181), false);
  assert.equal(isValidCoordinate(52, -181), false);
  assert.equal(isValidCoordinate(Number.NaN, 5), false);
  assert.equal(isValidCoordinate(52, Number.POSITIVE_INFINITY), false);
});

test("clears stale coordinates when an address label changes", () => {
  const point = { label: "Utrecht", lat: 52.0907, lng: 5.1214, key: "a" };
  const changed = changeRoutePointLabel(point, "Rotterdam");

  assert.deepEqual(changed, {
    label: "Rotterdam",
    lat: 0,
    lng: 0,
    key: "a",
  });
});

test("keeps coordinates when the label is unchanged", () => {
  const point = { label: "Utrecht", lat: 52.0907, lng: 5.1214 };
  assert.equal(changeRoutePointLabel(point, "Utrecht"), point);
});

test("requires both a departure point and destination", () => {
  const issues = validateRoutePoints([
    { label: "Utrecht", lat: 52.0907, lng: 5.1214 },
  ]);

  assert.deepEqual(issues, [
    {
      index: -1,
      message: "Voeg minimaal een vertrekpunt en bestemming toe.",
    },
  ]);
});

test("reports an empty departure point before checking coordinates", () => {
  const issues = validateRoutePoints([
    { label: "   ", lat: 0, lng: 0 },
    { label: "Rotterdam", lat: 51.9244, lng: 4.4777 },
  ]);

  assert.equal(issues.length, 1);
  assert.equal(issues[0]?.index, 0);
  assert.equal(issues[0]?.message, "Vertrekpunt is leeg.");
});

test("reports missing and unselected route points", () => {
  const issues = validateRoutePoints([
    { label: "Utrecht", lat: 52.0907, lng: 5.1214 },
    { label: "Rotterdam", lat: 0, lng: 0 },
  ]);

  assert.equal(issues.length, 1);
  assert.equal(issues[0]?.index, 1);
  assert.match(issues[0]?.message ?? "", /Bestemming/);
});

test("identifies an unselected intermediate stop", () => {
  const issues = validateRoutePoints([
    { label: "Utrecht", lat: 52.0907, lng: 5.1214 },
    { label: "Gouda", lat: 0, lng: 0 },
    { label: "Rotterdam", lat: 51.9244, lng: 4.4777 },
  ]);

  assert.deepEqual(issues, [
    {
      index: 1,
      message: "Tussenstop 1 is nog niet geselecteerd uit de adresresultaten.",
    },
  ]);
});

test("accepts a complete route including a selected stop", () => {
  const issues = validateRoutePoints([
    { label: "Utrecht", lat: 52.0907, lng: 5.1214 },
    { label: "Gouda", lat: 52.0116, lng: 4.7105 },
    { label: "Rotterdam", lat: 51.9244, lng: 4.4777 },
  ]);

  assert.deepEqual(issues, []);
});
