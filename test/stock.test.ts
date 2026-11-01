import { test } from "node:test";
import assert from "node:assert/strict";
import { Stock } from "../src/stock/stock.ts";
import { Refusal } from "../src/refusal.ts";

const supplies = () => [
  { name: "whiskey", price: 150, inStock: 4 },
  { name: "beans", price: 80, inStock: 10 },
];
const refusedBy = (sid: string) => (e: unknown) => e instanceof Refusal && e.rule === sid;

test("s-pcxc2kjytq2fvdc is created from the supplies the saloon holds, and tells how many of each it holds and what each costs", () => {
  const stock = new Stock(supplies());
  assert.equal(stock.inStock("whiskey"), 4);
  assert.equal(stock.priceOf("whiskey"), 150);
  assert.equal(stock.inStock("beans"), 10);
  assert.equal(stock.priceOf("beans"), 80);
});

test("s-pcxc2kjytq2fvdc refuses a list naming one supply twice", () => {
  assert.throws(() => new Stock([...supplies(), { name: "whiskey", price: 200, inStock: 1 }]), refusedBy("s-pcxc2kjytq2fvdc"));
});

test("s-pcxc2kjytq2fvdc takes what the lines ask for, and checking first changes nothing", () => {
  const stock = new Stock(supplies());
  const lines = [{ supply: "whiskey", quantity: 3 }, { supply: "beans", quantity: 2 }];
  stock.checkTaking(lines);
  assert.equal(stock.inStock("whiskey"), 4);
  stock.take(lines);
  assert.equal(stock.inStock("whiskey"), 1);
  assert.equal(stock.inStock("beans"), 8);
});

test("s-pcxc2kjytq2fvdc takes lines naming the same supply as one, their quantities added up", () => {
  const stock = new Stock(supplies());
  const both = [{ supply: "whiskey", quantity: 2 }, { supply: "whiskey", quantity: 3 }];
  assert.throws(() => stock.checkTaking(both), refusedBy("s-6c6uhutp3355ewu"));
  assert.throws(() => stock.take(both), refusedBy("s-6c6uhutp3355ewu"));
  stock.take([{ supply: "whiskey", quantity: 2 }, { supply: "whiskey", quantity: 2 }]);
  assert.equal(stock.inStock("whiskey"), 0);
});

test("s-pcxc2kjytq2fvdc checks the lines, then that each supply is held, then how many of each are held, and refuses at the first that fails", () => {
  const stock = new Stock(supplies());
  const malformed = { supply: "whiskey", quantity: 0 };
  const unknown = { supply: "gin", quantity: 1 };
  const tooMany = { supply: "beans", quantity: 11 };
  assert.throws(() => stock.checkTaking([tooMany, unknown, malformed]), refusedBy("s-vugzkbduqu86uhr"));
  assert.throws(() => stock.checkTaking([tooMany, unknown]), refusedBy("s-xgkgb3kvcbs7x5v"));
  assert.throws(() => stock.checkTaking([tooMany]), refusedBy("s-6c6uhutp3355ewu"));
});

test("s-6c6uhutp3355ewu refuses to take out more of a supply than the stock holds, and takes out all it holds", () => {
  const stock = new Stock(supplies());
  assert.throws(() => stock.take([{ supply: "whiskey", quantity: 5 }]), refusedBy("s-6c6uhutp3355ewu"));
  stock.take([{ supply: "whiskey", quantity: 4 }]);
  assert.equal(stock.inStock("whiskey"), 0);
  assert.throws(() => stock.take([{ supply: "whiskey", quantity: 1 }]), refusedBy("s-6c6uhutp3355ewu"));
});

test("s-xgkgb3kvcbs7x5v refuses a supply the stock does not hold, whether read, priced or taken", () => {
  const stock = new Stock(supplies());
  assert.throws(() => stock.inStock("gin"), refusedBy("s-xgkgb3kvcbs7x5v"));
  assert.throws(() => stock.priceOf("gin"), refusedBy("s-xgkgb3kvcbs7x5v"));
  assert.throws(() => stock.take([{ supply: "gin", quantity: 1 }]), refusedBy("s-xgkgb3kvcbs7x5v"));
});

test("s-j3b7zs9299nj5fr leaves the stock as it was when taking is refused", () => {
  const stock = new Stock(supplies());
  assert.throws(() => stock.take([{ supply: "whiskey", quantity: 2 }, { supply: "gin", quantity: 1 }]), Refusal);
  assert.equal(stock.inStock("whiskey"), 4);
});

test("s-vgw3yx6xnkk4gf6 makes every check that could refuse the taking before taking anything out", () => {
  const stock = new Stock(supplies());
  assert.throws(() => stock.take([{ supply: "whiskey", quantity: 2 }, { supply: "beans", quantity: 11 }]), refusedBy("s-6c6uhutp3355ewu"));
  assert.equal(stock.inStock("whiskey"), 4);
  assert.equal(stock.inStock("beans"), 10);
});
