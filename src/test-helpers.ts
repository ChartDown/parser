import { readFileSync } from "node:fs";

export const EXAMPLES = ["lantern-bay", "open-road", "syntax-tour"] as const;

/** The ChartDown 0.6 examples of the Language repository, in `fixtures/0.6`. */
export const EXAMPLES_06 = ["lantern-bay", "northbound", "open-road", "syntax-tour"] as const;

/** The ChartDown 0.7 examples of github.com/ChartDown/spec at 1e103c9, in `fixtures/0.7`. */
export const EXAMPLES_07 = ["lantern-bay", "northbound", "open-road", "syntax-tour"] as const;

/** The ChartDown 0.8 examples of github.com/ChartDown/spec at 732dc25, in `fixtures/0.8`. */
export const EXAMPLES_08 = ["lantern-bay", "northbound", "open-road", "syntax-tour"] as const;

/** The ChartDown 0.9 examples of github.com/ChartDown/spec at cf868c1, in `fixtures/0.9`. */
export const EXAMPLES_09 = ["lantern-bay", "northbound", "open-road", "syntax-tour"] as const;

/** The ChartDown 0.10 examples of github.com/ChartDown/spec at d9a6768, in `fixtures/0.10`. */
export const EXAMPLES_10 = ["lantern-bay", "northbound", "open-road", "syntax-tour"] as const;

export function fixture10(name: string): string {
  return readFileSync(new URL(`../fixtures/0.10/${name}.chartdown`, import.meta.url), "utf8");
}

export function fixture09(name: string): string {
  return readFileSync(new URL(`../fixtures/0.9/${name}.chartdown`, import.meta.url), "utf8");
}

export function fixture08(name: string): string {
  return readFileSync(new URL(`../fixtures/0.8/${name}.chartdown`, import.meta.url), "utf8");
}

export function fixture07(name: string): string {
  return readFileSync(new URL(`../fixtures/0.7/${name}.chartdown`, import.meta.url), "utf8");
}

export function fixture06(name: string): string {
  return readFileSync(new URL(`../fixtures/0.6/${name}.chartdown`, import.meta.url), "utf8");
}

export function fixture(name: string): string {
  return readFileSync(new URL(`../fixtures/${name}.chartdown`, import.meta.url), "utf8");
}
