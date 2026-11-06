import { test } from "node:test";
import assert from "node:assert/strict";
import { Tabs } from "../src/tabs/tabs.ts";
import { Stock } from "../src/stock/stock.ts";
import { Refusal } from "../src/refusal.ts";

const refusedBy = (sid: string) => (e: unknown) => e instanceof Refusal && e.rule === sid;
// A clock a test sets: it gives the instants in turn, and repeats the last.
const clock = (...instants: string[]) => {
  let next = 0;
  return () => instants[Math.min(next++, instants.length - 1)]!;
};
const NOON = "2026-11-01T12:00:00.000Z";
const tabs = () => {
  const t = new Tabs(clock(NOON));
  t.open({ regular: "Doc", limit: 1000 });
  return t;
};
const stock = () => new Stock([
  { name: "whiskey", price: 150, inStock: 4 },
  { name: "beans", price: 80, inStock: 10 },
]);

test("@spec s-t8zhcywbmp5rkbr refuses to open a second tab for a regular, the first kept as it was", () => {
  const t = tabs();
  assert.throws(() => t.open({ regular: "Doc", limit: 5000 }), refusedBy("s-t8zhcywbmp5rkbr"));
  t.charge({ regular: "Doc", amount: 1000 });
  assert.throws(() => t.charge({ regular: "Doc", amount: 1 }), refusedBy("s-n7wmxj35vnsc9uk"));
});

test("@spec s-n7wmxj35vnsc9uk refuses a charge that would take the debt above the limit, and takes one reaching it", () => {
  const t = tabs();
  t.charge({ regular: "Doc", amount: 900 });
  assert.throws(() => t.charge({ regular: "Doc", amount: 101 }), refusedBy("s-n7wmxj35vnsc9uk"));
  assert.equal(t.debtOf("Doc"), 900);
  t.charge({ regular: "Doc", amount: 100 });
  assert.equal(t.debtOf("Doc"), 1000);
});

test("@spec s-n7wmxj35vnsc9uk refuses every charge on a tab whose limit is nothing", () => {
  const t = new Tabs(clock(NOON));
  t.open({ regular: "Kid", limit: 0 });
  assert.throws(() => t.charge({ regular: "Kid", amount: 1 }), refusedBy("s-n7wmxj35vnsc9uk"));
});

test("@spec s-t2a2p5jjest399m refuses a repayment larger than the debt, and takes one equal to it", () => {
  const t = tabs();
  assert.throws(() => t.repay({ regular: "Doc", amount: 1 }), refusedBy("s-t2a2p5jjest399m"));
  t.charge({ regular: "Doc", amount: 300 });
  assert.throws(() => t.repay({ regular: "Doc", amount: 301 }), refusedBy("s-t2a2p5jjest399m"));
  assert.equal(t.debtOf("Doc"), 300);
  t.repay({ regular: "Doc", amount: 300 });
  assert.equal(t.debtOf("Doc"), 0);
});

test("@spec s-7vgppsr73pc8fgn writes every charge and repayment the tabs accept to the regular's journal, and nothing they refuse", () => {
  const t = new Tabs(clock("2026-11-01T12:00:00.000Z", "2026-11-01T13:00:00.000Z"));
  t.open({ regular: "Doc", limit: 1000 });
  t.charge({ regular: "Doc", amount: 400 });
  assert.throws(() => t.charge({ regular: "Doc", amount: 700 }), Refusal);
  t.repay({ regular: "Doc", amount: 150 });
  assert.deepEqual(t.journalOf("Doc"), [
    { regular: "Doc", entryKind: "charge", amount: 400, acceptedAt: "2026-11-01T12:00:00.000Z" },
    { regular: "Doc", entryKind: "repayment", amount: 150, acceptedAt: "2026-11-01T13:00:00.000Z" },
  ]);
});

test("@spec s-r64zmxy6x6bvzyw reads a regular's debt off the journal: its charges less its repayments", () => {
  const t = tabs();
  assert.equal(t.debtOf("Doc"), 0);
  t.charge({ regular: "Doc", amount: 400 });
  t.charge({ regular: "Doc", amount: 250 });
  t.repay({ regular: "Doc", amount: 300 });
  assert.equal(t.debtOf("Doc"), 350);
});

test("@spec s-42z743tznzc48pm prices an order as the sum over its lines of the supply's price times how many the line asks for", () => {
  const t = tabs();
  t.putOrderOnTab({ regular: "Doc", lines: [{ supply: "whiskey", quantity: 2 }, { supply: "beans", quantity: 1 }] }, stock());
  assert.equal(t.debtOf("Doc"), 380);
  t.putOrderOnTab({ regular: "Doc", lines: [{ supply: "whiskey", quantity: 1 }, { supply: "whiskey", quantity: 1 }] }, stock());
  assert.equal(t.debtOf("Doc"), 680);
});

test("@spec s-ghhractkb4sywee puts an order on the tab whole, taking its supplies out of the stock and charging its price, or not at all", () => {
  const t = tabs();
  const s = stock();
  t.putOrderOnTab({ regular: "Doc", lines: [{ supply: "whiskey", quantity: 3 }] }, s);
  assert.equal(s.inStock("whiskey"), 1);
  assert.deepEqual(t.journalOf("Doc").map((e) => [e.entryKind, e.amount]), [["charge", 450]]);
  assert.throws(() => t.putOrderOnTab({ regular: "Doc", lines: [{ supply: "beans", quantity: 7 }] }, s), refusedBy("s-n7wmxj35vnsc9uk"));
  assert.equal(s.inStock("beans"), 10);
  assert.equal(t.journalOf("Doc").length, 1);
});

test("@spec s-xgkgb3kvcbs7x5v refuses what names a regular the tabs keep no tab for, except the tab a request opens", () => {
  const t = tabs();
  assert.throws(() => t.debtOf("Kid"), refusedBy("s-xgkgb3kvcbs7x5v"));
  assert.throws(() => t.journalOf("Kid"), refusedBy("s-xgkgb3kvcbs7x5v"));
  assert.throws(() => t.charge({ regular: "Kid", amount: 1 }), refusedBy("s-xgkgb3kvcbs7x5v"));
  assert.throws(() => t.checkCharge({ regular: "Kid", amount: 1 }), refusedBy("s-xgkgb3kvcbs7x5v"));
  assert.throws(() => t.repay({ regular: "Kid", amount: 1 }), refusedBy("s-xgkgb3kvcbs7x5v"));
  assert.throws(() => t.putOrderOnTab({ regular: "Kid", lines: [{ supply: "beans", quantity: 1 }] }, stock()), refusedBy("s-xgkgb3kvcbs7x5v"));
  t.open({ regular: "Kid", limit: 100 });
  assert.equal(t.debtOf("Kid"), 0);
});

test("@spec s-5mu2qm3u5ue82sk takes each journal entry's instant from the clock, and returns the journal in the order the tabs accepted it", () => {
  const t = new Tabs(clock("2026-11-01T12:00:00.000Z", "2026-11-01T12:30:00.000Z", "2026-11-01T13:00:00.000Z"));
  t.open({ regular: "Doc", limit: 1000 });
  t.charge({ regular: "Doc", amount: 100 });
  t.putOrderOnTab({ regular: "Doc", lines: [{ supply: "beans", quantity: 2 }] }, stock());
  t.repay({ regular: "Doc", amount: 50 });
  assert.deepEqual(t.journalOf("Doc").map((e) => [e.entryKind, e.amount, e.acceptedAt]), [
    ["charge", 100, "2026-11-01T12:00:00.000Z"],
    ["charge", 160, "2026-11-01T12:30:00.000Z"],
    ["repayment", 50, "2026-11-01T13:00:00.000Z"],
  ]);
});

test("@spec s-5mu2qm3u5ue82sk checks a charge as charging it would, and changes nothing", () => {
  const t = tabs();
  t.checkCharge({ regular: "Doc", amount: 1000 });
  assert.throws(() => t.checkCharge({ regular: "Doc", amount: 1001 }), refusedBy("s-n7wmxj35vnsc9uk"));
  assert.equal(t.debtOf("Doc"), 0);
  assert.deepEqual(t.journalOf("Doc"), []);
});

test("@spec s-5mu2qm3u5ue82sk checks an order, then that its regular has a tab, then its lines, then the charge for its price, and refuses at the first that fails", () => {
  const t = tabs();
  const s = stock();
  const tooMuch = [{ supply: "whiskey", quantity: 5 }];
  assert.throws(() => t.putOrderOnTab({ regular: "Kid", lines: [] }, s), refusedBy("s-6dg6rvnzg7xmcm9"));
  assert.throws(() => t.putOrderOnTab({ regular: "Kid", lines: tooMuch }, s), refusedBy("s-xgkgb3kvcbs7x5v"));
  assert.throws(() => t.putOrderOnTab({ regular: "Doc", lines: tooMuch }, s), refusedBy("s-6c6uhutp3355ewu"));
  t.charge({ regular: "Doc", amount: 900 });
  assert.throws(() => t.putOrderOnTab({ regular: "Doc", lines: [{ supply: "whiskey", quantity: 1 }] }, s), refusedBy("s-n7wmxj35vnsc9uk"));
});

test("@spec s-3srstg864vu2eyj refuses a charge above the limit the same way whether it is charged, checked or an order's", () => {
  const t = tabs();
  t.charge({ regular: "Doc", amount: 900 });
  assert.throws(() => t.checkCharge({ regular: "Doc", amount: 150 }), refusedBy("s-n7wmxj35vnsc9uk"));
  assert.throws(() => t.charge({ regular: "Doc", amount: 150 }), refusedBy("s-n7wmxj35vnsc9uk"));
  assert.throws(() => t.putOrderOnTab({ regular: "Doc", lines: [{ supply: "whiskey", quantity: 1 }] }, stock()), refusedBy("s-n7wmxj35vnsc9uk"));
});

test("@spec s-ydfsa5ueshcc56y checks each data record the tabs are given before anything else", () => {
  const t = tabs();
  assert.throws(() => t.open({ regular: "Kid", limit: -1 }), refusedBy("s-6zwzkthktpq6c3c"));
  assert.throws(() => t.charge({ regular: "Doc", amount: 0 }), refusedBy("s-ehcz87hd3ygcjtp"));
  assert.throws(() => t.repay({ regular: "Doc", amount: 0 }), refusedBy("s-gj3c6xu7mtvmgfm"));
  assert.throws(() => t.putOrderOnTab({ regular: "Doc", lines: [{ supply: "whiskey", quantity: 1.5 }] }, stock()), refusedBy("s-6dg6rvnzg7xmcm9"));
});

test("@spec s-vgw3yx6xnkk4gf6 makes every check that could refuse an order before taking anything out of the stock", () => {
  const t = tabs();
  const s = stock();
  t.charge({ regular: "Doc", amount: 950 });
  assert.throws(() => t.putOrderOnTab({ regular: "Doc", lines: [{ supply: "beans", quantity: 1 }] }, s), refusedBy("s-n7wmxj35vnsc9uk"));
  assert.equal(s.inStock("beans"), 10);
});
