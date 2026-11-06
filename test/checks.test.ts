import { test } from "node:test";
import assert from "node:assert/strict";
import { checked } from "../src/checks.ts";
import { Refusal } from "../src/refusal.ts";
import { Stock } from "../src/stock/stock.ts";

const refusedBy = (sid: string) => (e: unknown) => e instanceof Refusal && e.rule === sid;

test("@spec s-hvqpka9xadrdhxp holds each data record to the runtime check generated from its node", () => {
  const order = { regular: "Doc", lines: [{ supply: "whiskey", quantity: 1 }] };
  assert.deepEqual(checked("Order", order), order);
  assert.throws(() => checked("Order", { regular: "Doc", lines: [] }), refusedBy("s-6dg6rvnzg7xmcm9"));
  assert.throws(() => checked("Order", { ...order, paid: true }), refusedBy("s-6dg6rvnzg7xmcm9"));
  assert.throws(() => checked("Order", { regular: "Doc", lines: [{ supply: "whiskey", quantity: 0 }] }), refusedBy("s-6dg6rvnzg7xmcm9"));
});

test("@spec s-rrvpxyz6pa53sa6 checks every format in full, the days each month has included", () => {
  const booking = { room: 3, madeAt: "2026-11-01T20:00:00.000Z", regular: "Doc" };
  assert.deepEqual(checked("Booking", booking), booking);
  assert.throws(() => checked("Booking", { ...booking, madeAt: "2026-02-30T20:00:00.000Z" }), refusedBy("s-sypqtqmjnaadg9g"));
  assert.throws(() => checked("Booking", { ...booking, madeAt: "the first of November" }), refusedBy("s-sypqtqmjnaadg9g"));
});

test("@spec s-ydfsa5ueshcc56y checks each data record a constructor is given before anything else, and refuses one that fails", () => {
  assert.throws(() => new Stock([{ name: "whiskey", price: 0, inStock: 4 }]), refusedBy("s-f3kv8352za6w2un"));
  assert.throws(() => new Stock([{ name: "whiskey", price: 150, inStock: 4 }, { name: "whiskey", price: 150, inStock: -1 }]), refusedBy("s-f3kv8352za6w2un"));
});

test("@spec s-9ax5e2x6xzqzb3q throws a Refusal, an error whose rule holds the sid of the rule refusing or of the data record whose check failed", () => {
  const caught = (act: () => unknown): unknown => {
    try {
      act();
    } catch (e) {
      return e;
    }
    return undefined;
  };
  const byRule = caught(() => new Stock([]).inStock("gin"));
  assert.ok(byRule instanceof Refusal && byRule instanceof Error);
  assert.equal(byRule.rule, "s-xgkgb3kvcbs7x5v");
  const byRecord = caught(() => checked("Supply", { name: "gin" }));
  assert.ok(byRecord instanceof Refusal);
  assert.equal(byRecord.rule, "s-f3kv8352za6w2un");
});
