import { checked } from "../checks.ts";
import type { Charge, JournalEntry, Order, Repayment, Tab } from "../generated/types.ts";
import { Refusal } from "../refusal.ts";
import type { Stock } from "../stock/stock.ts";

/**
 * @spec s-5mu2qm3u5ue82sk
 * @spec s-3srstg864vu2eyj
 * @spec s-t8zhcywbmp5rkbr
 * @spec s-n7wmxj35vnsc9uk
 * @spec s-t2a2p5jjest399m
 * @spec s-7vgppsr73pc8fgn
 * @spec s-42z743tznzc48pm
 * @spec s-r64zmxy6x6bvzyw
 * @spec s-xgkgb3kvcbs7x5v
 * @spec s-ghhractkb4sywee
 * @spec s-vgw3yx6xnkk4gf6
 */
export class Tabs {
  readonly #clock: () => string;
  readonly #tabs = new Map<string, { limit: number; journal: JournalEntry[] }>();

  constructor(clock: () => string) {
    this.#clock = clock;
  }

  open(tab: Tab): void {
    const given = checked("Tab", tab);
    if (this.#tabs.has(given.regular)) throw new Refusal("s-t8zhcywbmp5rkbr", `the tabs already keep a tab for ${given.regular}`);
    this.#tabs.set(given.regular, { limit: given.limit, journal: [] });
  }

  debtOf(regular: string): number {
    let debt = 0;
    for (const entry of this.#tab(regular).journal) debt += entry.entryKind === "charge" ? entry.amount : -entry.amount;
    return debt;
  }

  journalOf(regular: string): JournalEntry[] {
    return this.#tab(regular).journal.map((entry) => ({ ...entry }));
  }

  repay(repayment: Repayment): void {
    const given = checked("Repayment", repayment);
    const debt = this.debtOf(given.regular);
    if (given.amount > debt) throw new Refusal("s-t2a2p5jjest399m", `a repayment of ${given.amount} is larger than the debt of ${given.regular}, ${debt}`);
    this.#write(given.regular, "repayment", given.amount);
  }

  checkCharge(charge: Charge): void {
    const given = checked("Charge", charge);
    const debt = this.debtOf(given.regular);
    const { limit } = this.#tab(given.regular);
    if (debt + given.amount > limit) throw new Refusal("s-n7wmxj35vnsc9uk", `a charge of ${given.amount} would take the debt of ${given.regular}, ${debt}, above the limit of ${limit}`);
  }

  charge(charge: Charge): void {
    this.checkCharge(charge);
    this.#write(charge.regular, "charge", charge.amount);
  }

  putOrderOnTab(order: Order, stock: Stock): void {
    const given = checked("Order", order);
    this.#tab(given.regular);
    stock.checkTaking(given.lines);
    let price = 0;
    for (const line of given.lines) price += stock.priceOf(line.supply) * line.quantity;
    this.checkCharge({ regular: given.regular, amount: price });
    stock.take(given.lines);
    this.#write(given.regular, "charge", price);
  }

  #tab(regular: string): { limit: number; journal: JournalEntry[] } {
    const tab = this.#tabs.get(regular);
    if (!tab) throw new Refusal("s-xgkgb3kvcbs7x5v", `the tabs keep no tab for ${regular}`);
    return tab;
  }

  #write(regular: string, entryKind: JournalEntry["entryKind"], amount: number): void {
    this.#tab(regular).journal.push({ regular, entryKind, amount, acceptedAt: this.#clock() });
  }
}
