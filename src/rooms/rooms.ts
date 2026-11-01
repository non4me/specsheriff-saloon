import { checked } from "../checks.ts";
import type { Booking, Room } from "../generated/types.ts";
import { Refusal } from "../refusal.ts";
import type { Tabs } from "../tabs/tabs.ts";

/**
 * @spec s-nr4w6vmrb664y2c
 * @spec s-mv5krsy8q6c9vre
 * @spec s-5f774mswy72x3gh
 * @spec s-xgkgb3kvcbs7x5v
 * @spec s-vgw3yx6xnkk4gf6
 */
export class Rooms {
  // The hours a booking holds its room for, in milliseconds.
  static readonly #LET_FOR = 24 * 60 * 60 * 1000;
  readonly #clock: () => string;
  readonly #rooms = new Map<number, Room>();
  readonly #bookings: Booking[] = [];

  constructor(clock: () => string, rooms: readonly Room[]) {
    this.#clock = clock;
    const given = rooms.map((room) => checked("Room", room));
    for (const room of given) {
      if (this.#rooms.has(room.number)) throw new Refusal("s-nr4w6vmrb664y2c", `the list names the room ${room.number} twice`);
      this.#rooms.set(room.number, { ...room });
    }
  }

  book(room: number, regular: string, tabs: Tabs): void {
    const booking = checked("Booking", { room, madeAt: this.#clock(), regular });
    const roomLet = this.#room(booking.room);
    const at = Date.parse(booking.madeAt);
    for (const kept of this.#bookings) {
      if (kept.room === booking.room && at < Date.parse(kept.madeAt) + Rooms.#LET_FOR) {
        throw new Refusal("s-mv5krsy8q6c9vre", `room ${booking.room} is let from ${kept.madeAt} for 24 hours`);
      }
    }
    const charge = { regular: booking.regular, amount: roomLet.price };
    tabs.checkCharge(charge);
    this.#bookings.push(booking);
    tabs.charge(charge);
  }

  bookingsOf(room: number): Booking[] {
    this.#room(room);
    return this.#bookings.filter((booking) => booking.room === room).map((booking) => ({ ...booking }));
  }

  #room(number: number): Room {
    const room = this.#rooms.get(number);
    if (!room) throw new Refusal("s-xgkgb3kvcbs7x5v", `the rooms let no room ${number}`);
    return room;
  }
}
