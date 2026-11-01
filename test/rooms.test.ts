import { test } from "node:test";
import assert from "node:assert/strict";
import { Rooms } from "../src/rooms/rooms.ts";
import { Tabs } from "../src/tabs/tabs.ts";
import { Refusal } from "../src/refusal.ts";

const refusedBy = (sid: string) => (e: unknown) => e instanceof Refusal && e.rule === sid;
// A clock a test sets by hand: it gives the instant last set.
const settable = (start: string) => {
  let now = start;
  const clock = () => now;
  return { clock, set: (instant: string) => void (now = instant) };
};
const EIGHT_PM = "2026-11-01T20:00:00.000Z";
const saloon = () => {
  const time = settable(EIGHT_PM);
  const tabs = new Tabs(time.clock);
  tabs.open({ regular: "Doc", limit: 1000 });
  tabs.open({ regular: "Kate", limit: 1000 });
  const rooms = new Rooms(time.clock, [{ number: 3, price: 300 }, { number: 4, price: 250 }]);
  return { time, tabs, rooms };
};

test("s-mv5krsy8q6c9vre refuses a booking of a room earlier than 24 hours after a booking of it was made, whoever asks, and takes one at the 24th hour", () => {
  const { time, tabs, rooms } = saloon();
  rooms.book(3, "Doc", tabs);
  assert.throws(() => rooms.book(3, "Kate", tabs), refusedBy("s-mv5krsy8q6c9vre"));
  assert.throws(() => rooms.book(3, "Doc", tabs), refusedBy("s-mv5krsy8q6c9vre"));
  time.set("2026-11-02T19:59:59.999Z");
  assert.throws(() => rooms.book(3, "Kate", tabs), refusedBy("s-mv5krsy8q6c9vre"));
  time.set("2026-11-02T20:00:00.000Z");
  rooms.book(3, "Kate", tabs);
  assert.deepEqual(rooms.bookingsOf(3).map((b) => [b.regular, b.madeAt]), [["Doc", EIGHT_PM], ["Kate", "2026-11-02T20:00:00.000Z"]]);
});

test("s-mv5krsy8q6c9vre lets another room at any instant, and refuses a booking at an instant before one it keeps", () => {
  const { time, tabs, rooms } = saloon();
  rooms.book(3, "Doc", tabs);
  rooms.book(4, "Kate", tabs);
  time.set("2026-11-01T08:00:00.000Z");
  assert.throws(() => rooms.book(3, "Kate", tabs), refusedBy("s-mv5krsy8q6c9vre"));
});

test("s-5f774mswy72x3gh lets the room and writes the room's price to the regular's tab as a charge, as one operation", () => {
  const { tabs, rooms } = saloon();
  rooms.book(3, "Doc", tabs);
  assert.deepEqual(tabs.journalOf("Doc").map((e) => [e.entryKind, e.amount]), [["charge", 300]]);
  tabs.charge({ regular: "Kate", amount: 800 });
  assert.throws(() => rooms.book(4, "Kate", tabs), refusedBy("s-n7wmxj35vnsc9uk"));
  assert.deepEqual(rooms.bookingsOf(4), []);
  assert.equal(tabs.debtOf("Kate"), 800);
});

test("s-xgkgb3kvcbs7x5v refuses a room the rooms do not let, and a regular the tabs keep no tab for", () => {
  const { tabs, rooms } = saloon();
  assert.throws(() => rooms.book(7, "Doc", tabs), refusedBy("s-xgkgb3kvcbs7x5v"));
  assert.throws(() => rooms.bookingsOf(7), refusedBy("s-xgkgb3kvcbs7x5v"));
  assert.throws(() => rooms.book(3, "Kid", tabs), refusedBy("s-xgkgb3kvcbs7x5v"));
  assert.deepEqual(rooms.bookingsOf(3), []);
});

test("s-nr4w6vmrb664y2c is created with a clock and the rooms the saloon lets, and refuses a list naming one room twice", () => {
  const { clock } = settable(EIGHT_PM);
  assert.throws(() => new Rooms(clock, [{ number: 3, price: 300 }, { number: 3, price: 400 }]), refusedBy("s-nr4w6vmrb664y2c"));
});

test("s-nr4w6vmrb664y2c makes each booking at the clock's instant, and returns a room's bookings in the order they were made", () => {
  const { time, tabs, rooms } = saloon();
  rooms.book(3, "Doc", tabs);
  time.set("2026-11-03T09:15:00.000Z");
  rooms.book(3, "Kate", tabs);
  assert.deepEqual(rooms.bookingsOf(3), [
    { room: 3, madeAt: EIGHT_PM, regular: "Doc" },
    { room: 3, madeAt: "2026-11-03T09:15:00.000Z", regular: "Kate" },
  ]);
});

test("s-nr4w6vmrb664y2c checks the booking, then the room, then the hours it is let for, then the charge, and refuses at the first that fails", () => {
  const { tabs, rooms } = saloon();
  rooms.book(3, "Doc", tabs);
  tabs.charge({ regular: "Kate", amount: 1000 });
  assert.throws(() => rooms.book(0, "Kate", tabs), refusedBy("s-sypqtqmjnaadg9g"));
  assert.throws(() => rooms.book(7, "Kate", tabs), refusedBy("s-xgkgb3kvcbs7x5v"));
  assert.throws(() => rooms.book(3, "Kate", tabs), refusedBy("s-mv5krsy8q6c9vre"));
  assert.throws(() => rooms.book(4, "Kate", tabs), refusedBy("s-n7wmxj35vnsc9uk"));
});

test("s-ydfsa5ueshcc56y checks each room the rooms are created from before anything else", () => {
  const { clock } = settable(EIGHT_PM);
  assert.throws(() => new Rooms(clock, [{ number: 3, price: 0 }]), refusedBy("s-pnwehzrzuhuem8y"));
  assert.throws(() => new Rooms(clock, [{ number: 3, price: 300 }, { number: 3, price: 0 }]), refusedBy("s-pnwehzrzuhuem8y"));
});

test("s-j3b7zs9299nj5fr leaves the rooms and the tab as they were when a booking is refused", () => {
  const { tabs, rooms } = saloon();
  tabs.charge({ regular: "Doc", amount: 900 });
  assert.throws(() => rooms.book(3, "Doc", tabs), Refusal);
  assert.deepEqual(rooms.bookingsOf(3), []);
  assert.equal(tabs.debtOf("Doc"), 900);
  rooms.book(3, "Kate", tabs);
});

test("s-vgw3yx6xnkk4gf6 makes every check that could refuse a booking before letting the room", () => {
  const { tabs, rooms } = saloon();
  tabs.charge({ regular: "Doc", amount: 900 });
  assert.throws(() => rooms.book(3, "Doc", tabs), refusedBy("s-n7wmxj35vnsc9uk"));
  assert.deepEqual(rooms.bookingsOf(3), []);
});
