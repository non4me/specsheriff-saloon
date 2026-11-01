/** @spec s-9ax5e2x6xzqzb3q */
export class Refusal extends Error {
  /** The sid of the rule refusing, or of the data record node whose runtime check failed. */
  readonly rule: string;

  constructor(rule: string, message: string) {
    super(message);
    this.name = "Refusal";
    this.rule = rule;
  }
}
