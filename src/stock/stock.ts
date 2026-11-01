import { checked } from "../checks.ts";
import type { OrderLine, Supply } from "../generated/types.ts";
import { Refusal } from "../refusal.ts";

/**
 * @spec s-pcxc2kjytq2fvdc
 * @spec s-6c6uhutp3355ewu
 * @spec s-xgkgb3kvcbs7x5v
 * @spec s-vgw3yx6xnkk4gf6
 */
export class Stock {
  readonly #supplies = new Map<string, Supply>();

  constructor(supplies: readonly Supply[]) {
    const given = supplies.map((supply) => checked("Supply", supply));
    for (const supply of given) {
      if (this.#supplies.has(supply.name)) throw new Refusal("s-pcxc2kjytq2fvdc", `the list names the supply ${supply.name} twice`);
      this.#supplies.set(supply.name, { ...supply });
    }
  }

  inStock(name: string): number {
    return this.#held(name).inStock;
  }

  priceOf(name: string): number {
    return this.#held(name).price;
  }

  checkTaking(lines: readonly OrderLine[]): void {
    this.#wanted(lines);
  }

  take(lines: readonly OrderLine[]): void {
    for (const [name, quantity] of this.#wanted(lines)) this.#held(name).inStock -= quantity;
  }

  #held(name: string): Supply {
    const supply = this.#supplies.get(name);
    if (!supply) throw new Refusal("s-xgkgb3kvcbs7x5v", `the stock holds no supply ${name}`);
    return supply;
  }

  // How many of each supply the lines ask for together, every check that could refuse the taking made first and in
  // the order §s-pcxc2kjytq2fvdc gives: the lines' runtime checks, then that each supply is held, then how many of each are.
  #wanted(lines: readonly OrderLine[]): Map<string, number> {
    const given = lines.map((line) => checked("OrderLine", line));
    for (const line of given) this.#held(line.supply);
    const wanted = new Map<string, number>();
    for (const line of given) wanted.set(line.supply, (wanted.get(line.supply) ?? 0) + line.quantity);
    for (const [name, quantity] of wanted) {
      const held = this.#held(name).inStock;
      if (quantity > held) throw new Refusal("s-6c6uhutp3355ewu", `the lines ask for ${quantity} of ${name}, and the stock holds ${held}`);
    }
    return wanted;
  }
}
