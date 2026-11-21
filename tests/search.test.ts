import assert from "node:assert/strict";
import { test } from "node:test";
import { parseProductNumber, searchProducts } from "../src/lib/search";

const products = [
  { id: "a", number: 47, name: "Tinted Lip Oil — Cherry", description: "Glossy, not sticky" },
  { id: "b", number: 44, name: "Vitamin C 15% Face Serum", description: "Use mornings" },
  { id: "c", number: 4, name: "Magnetic Knife Strip", description: "Holds 47 knives (not really)" },
  { id: "d", number: 49, name: "Heatless Curling Rod Set", description: "Satin rod" },
];

test("parses product numbers with or without #", () => {
  assert.equal(parseProductNumber("47"), 47);
  assert.equal(parseProductNumber(" #47 "), 47);
  assert.equal(parseProductNumber("# 47"), 47);
  assert.equal(parseProductNumber("lip oil"), null);
  assert.equal(parseProductNumber("47a"), null);
});

test("exact number match comes first", () => {
  const r = searchProducts(products, "#47");
  assert.equal(r.exact?.id, "a");
  assert.equal(r.results[0].id, "a");
});

test("a number never partially matches another number (4 ≠ 47, 44, 49)", () => {
  const r = searchProducts(products, "4");
  assert.equal(r.exact?.id, "c");
  assert.deepEqual(r.results.map((p) => p.id), ["c"]);
});

test("name and partial keyword search, case-insensitive", () => {
  assert.deepEqual(searchProducts(products, "LIP OIL").results.map((p) => p.id), ["a"]);
  assert.deepEqual(searchProducts(products, "heat").results.map((p) => p.id), ["d"]);
  assert.deepEqual(searchProducts(products, "serum").results.map((p) => p.id), ["b"]);
});

test("every term must match", () => {
  assert.equal(searchProducts(products, "lip serum").results.length, 0);
});

test("description matches rank below name matches", () => {
  const r = searchProducts(products, "satin");
  assert.deepEqual(r.results.map((p) => p.id), ["d"]);
});

test("no results for unknown queries", () => {
  const r = searchProducts(products, "#53");
  assert.equal(r.exact, null);
  assert.equal(r.results.length, 0);
});

test("a lone # or punctuation is not a search", () => {
  assert.equal(searchProducts(products, "#").results.length, 0);
  assert.equal(searchProducts(products, " - ").results.length, 0);
});

test("number search also matches numbers inside names, after the exact match", () => {
  const r = searchProducts(products, "15");
  assert.equal(r.exact, null);
  assert.deepEqual(r.results.map((p) => p.id), ["b"]);
});
