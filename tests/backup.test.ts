import assert from "node:assert/strict";
import { test } from "node:test";
import { resolveBackup } from "../src/lib/products";

type P = { id: string; status: string; isVisible: boolean; backupProductId: string | null };
const p = (id: string, status: string, backup: string | null = null, isVisible = true): P => ({
  id, status, isVisible, backupProductId: backup,
});
const map = (...items: P[]) => new Map(items.map((i) => [i.id, i]));

test("returns the chosen backup when it is available", () => {
  const a = p("a", "SOLD_OUT", "b");
  assert.equal(resolveBackup(a, map(a, p("b", "AVAILABLE")))?.id, "b");
});

test("follows a chain of sold-out backups", () => {
  const a = p("a", "SOLD_OUT", "b");
  assert.equal(resolveBackup(a, map(a, p("b", "SOLD_OUT", "c"), p("c", "AVAILABLE")))?.id, "c");
});

test("stops on cycles", () => {
  const a = p("a", "SOLD_OUT", "b");
  assert.equal(resolveBackup(a, map(a, p("b", "SOLD_OUT", "a"))), null);
});

test("skips hidden backups and gives up after 3 hops", () => {
  const a = p("a", "SOLD_OUT", "b");
  assert.equal(resolveBackup(a, map(a, p("b", "AVAILABLE", null, false))), null);
  const chain = map(a, p("b", "SOLD_OUT", "c"), p("c", "SOLD_OUT", "d"), p("d", "SOLD_OUT", "e"), p("e", "AVAILABLE"));
  assert.equal(resolveBackup(a, chain), null);
});
