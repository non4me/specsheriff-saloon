import { Ajv2020 } from "ajv/dist/2020.js";
import formats from "ajv-formats";
import checks from "./generated/checks.json" with { type: "json" };
import type { Booking, Charge, JournalEntry, Order, OrderLine, Repayment, Room, Supply, Tab } from "./generated/types.ts";
import { Refusal } from "./refusal.ts";

/** @spec s-hvqpka9xadrdhxp */
type Records = {
  Supply: Supply;
  OrderLine: OrderLine;
  Tab: Tab;
  JournalEntry: JournalEntry;
  Charge: Charge;
  Repayment: Repayment;
  Order: Order;
  Room: Room;
  Booking: Booking;
};

/** @spec s-9ax5e2x6xzqzb3q */
const RECORD_SIDS: { [name in keyof Records]: string } = {
  Supply: "s-f3kv8352za6w2un",
  OrderLine: "s-vugzkbduqu86uhr",
  Tab: "s-6zwzkthktpq6c3c",
  JournalEntry: "s-2896rux5emnnwpy",
  Charge: "s-ehcz87hd3ygcjtp",
  Repayment: "s-gj3c6xu7mtvmgfm",
  Order: "s-6dg6rvnzg7xmcm9",
  Room: "s-pnwehzrzuhuem8y",
  Booking: "s-sypqtqmjnaadg9g",
};

/**
 * @spec s-rrvpxyz6pa53sa6
 * @spec s-hvqpka9xadrdhxp
 */
const ajv = new Ajv2020({ allErrors: true });
formats.default(ajv);
ajv.addSchema(checks, "checks");

/**
 * @spec s-ydfsa5ueshcc56y
 * @spec s-9ax5e2x6xzqzb3q
 */
export function checked<N extends keyof Records>(record: N, value: unknown): Records[N] {
  const validate = ajv.getSchema(`checks#/$defs/${record}`)!;
  if (!validate(value)) throw new Refusal(RECORD_SIDS[record], `${record} fails its runtime check: ${ajv.errorsText(validate.errors)}`);
  return value as Records[N];
}
