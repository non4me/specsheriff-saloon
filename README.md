# The saloon

The worked example of [SpecSheriff](https://github.com/non4me/SpecSheriff): the saloon of a frontier
town — its stock, the tabs its regulars run, and the rooms upstairs — specified, tested and built by
the method, set up the way any project takes it up.

The saloon is small on purpose; what it shows is the trail. Every rule of its specification was read
and confirmed by its owner one node at a time. Every symbol of its code carries a SpecTag naming the
rules it implements, every test opens its name with the SpecTag of the rule it is written from and
was written before the code, and every commit names the rules it serves and went through the git
hooks and an independent reviewer. [The recorded run](recorded-run/README.md) shows a change that
every test and every deterministic check let through, and that the reviewer refused.

## What it does

| Domain | Level | What it keeps |
|---|---|---|
| stock | goods | how many of each supply the saloon holds and what each costs, never taking out more than it holds |
| tabs | service | each regular's tab: one for a regular, a limit on the debt, a journal of every charge and repayment, orders priced by their lines and put on the tab whole or not at all |
| rooms | service | the rooms upstairs, each let for 24 hours from the instant its booking is made and never twice for the same hours, the booking charged to the tab as one operation |

It is a library in TypeScript on Node, with everything it holds kept in memory. Money is counted in
whole cents.

```ts
import { Rooms } from "./src/rooms/rooms.ts";
import { Stock } from "./src/stock/stock.ts";
import { Tabs } from "./src/tabs/tabs.ts";

const clock = () => new Date().toISOString();
const stock = new Stock([{ name: "whiskey", price: 150, inStock: 4 }, { name: "beans", price: 80, inStock: 10 }]);
const tabs = new Tabs(clock);
const rooms = new Rooms(clock, [{ number: 3, price: 300 }]);

tabs.open({ regular: "Doc", limit: 1000 });
tabs.putOrderOnTab({ regular: "Doc", lines: [{ supply: "whiskey", quantity: 2 }, { supply: "beans", quantity: 1 }] }, stock);
rooms.book(3, "Doc", tabs);
tabs.debtOf("Doc"); // 680
tabs.putOrderOnTab({ regular: "Doc", lines: [{ supply: "beans", quantity: 5 }] }, stock);
// throws a Refusal whose rule is s-n7wmxj35vnsc9uk:
// a charge of 400 would take the debt of Doc, 680, above the limit of 1000
```

## Where things are

| Path | What it holds |
|---|---|
| `specs/_guidelines/project.json` | the project's own guidelines: the levels of the domains, and the rules of the stack no symbol carries |
| `specs/contracts/` | the terms the domains share and the rules that hold between them |
| `specs/stock/`, `specs/tabs/`, `specs/rooms/` | each domain: its header in `00-*.json`, then its rules and data records |
| `specs/tech/` | the technical appendix: the stack, and how each domain is built |
| `specs/_confirmations.jsonl` | the owner's confirmation of each node |
| `src/` | the code; `src/generated/` holds the types and runtime checks generated from the data records |
| `test/` | the tests |
| `recorded-run/` | the recorded run |

## Reading it

Start from a rule and follow it. The rule on the limit, s-n7wmxj35vnsc9uk, is in
`specs/tabs/tabs.json`, with its reason, its links and the lists of the code and the tests bound to
it; the class `Tabs` in `src/tabs/tabs.ts` carries its SpecTag, and the tests in
`test/tabs.test.ts` that open with its SpecTag are written from it. `git log` reads in the order the work went: the specification,
then the stack, then each domain with its tests.

## Running it

With Node 24 or later:

```sh
npm install
npm test
```

`npm test` checks the code with the TypeScript compiler, then runs the tests.

## Changing it

Install the plugin of SpecSheriff as [its guide](https://github.com/non4me/SpecSheriff/blob/main/skills/claude-code/README.md)
says, and open Claude Code in your clone: `.claude/settings.json` offers the plugin once you trust
the folder, and the first session turns on the git hooks in `.githooks/`. From then on every commit
is checked as the ones in the history were. A change begins in the specification: ask the agent
for the change you want, and it proposes the rule, puts it to the owner, and only then writes its
test and its code.

## License

[Apache License 2.0](LICENSE).
