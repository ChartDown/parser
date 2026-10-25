# ChartDown conformance cases

The official test cases for the [ChartDown specification](../SPEC.md) (version
0.10, see Appendix B). One file per spec section with parser rules, from
`02-file-structure.md` to `15-grammar.md`, and `C-writing-chartdown.md` for
writers (Appendix C). Each case checks one rule.

## Run them

You need Node.js 18 or later. Nothing to install.

```
node conformance/run.mjs
```

This checks the reference parser in `playground/index.html`. To check another
implementation, write a small adapter module and pass its path:

```js
// my-adapter.mjs
import * as chartdown from "my-chartdown-parser";

// Required: the JSON form of the chart (spec Appendix A).
export const toJSON = (source) => chartdown.toJSON(chartdown.parse(source));

// Optional: the chords as shown, for the display cases of spec 12.
// Without it, those cases are skipped. Returns, for example:
// { homeKey: "A", keys: ["A"], rows: ["A | D | E | F#m"] }
export function display(source, { style, key }) {
  // ...
}

// Optional: the canonical text of a chart's JSON form, for the writer cases
// of spec Appendix C. Without it, those cases are skipped.
export const write = (json) => chartdown.write(json);
```

```
node conformance/run.mjs ./my-adapter.mjs
```

The runner exits with 1 when a case fails, or when a spec section with parser
rules has no case.

## Read a case

````md
### 5.1 Chords inside one bar share it evenly

```chartdown
## A
1 4
```

```json
{
  "chartdown": null,
  "meta": {},
  ...
}
```
````

- The heading starts with the spec section number, then the rule in plain words.
- The `chartdown` block is the input.
- The `json` block is the whole JSON form (Appendix A) a correct parser produces.

**How a result is compared**

- Every field in the `json` block must match. Fields the block does not have are
  ignored, because Appendix A lets producers add their own.
- Arrays must have the same elements in the same order.
- Numbers match within 0.000000001 (a bar of 4 beats split 3 ways gives 1.333...).
- Warnings match by line number only, in any order. Their wording is up to each
  parser (spec 13).

**Display cases (spec 12).** A case with a `display` block checks the chords
as shown instead of the JSON form. The `display` block gives the style
(`numbers` or `letters`) and, optionally, the display key. The `json` block
then has:

- `homeKey`: the key the chart is shown in, such as `A` or `Em`.
- `keys`: the key each row is shown in, one per row.
- `rows`: each row as text: tokens separated by spaces, bars by ` | `. A chord
  is its root, quality and `/bass` as shown; `x`, `%` and `=` stay as written,
  and a riff is `R[ 1 3 5 ]`.

Display cases apply only to renderers. A parser that does not show charts can
skip them.

**Writer cases (spec Appendix C).** A case with a `canonical` block instead of
a `json` block checks the text a writer makes of the chart: the runner reads
the `chartdown` block with `toJSON`, writes it with `write`, and the result
must be the `canonical` block exactly, every line ending with a line feed.
When the chart has no warnings, the runner also reads the text back and checks
that it gives the same JSON form (all but `chartdown` and `meta.chartdown`),
and that writing it again gives the same text.

With a `write` function, every parser case whose chart has no warnings is also
checked this way, so a writer is tested on every rule of the spec.

## Add a case

Every syntax change to the spec adds or updates a case here (see
[CONTRIBUTING.md](../CONTRIBUTING.md)). Put it in the file of its spec section,
under a heading that starts with the section number. Sections without parser
rules have no file: 1 (goals), 4.2 (views), 16 (roadmap), 17 (changelog) and
C.6 (editing, a recommendation that a case can't check).

Cases use original songs only. Lyric landmarks stay at 8 words or fewer, except
in the cases that test that limit.

## License

The cases are released under [CC0 1.0](../LICENSE-SPEC), like the spec.
`run.mjs` is under the [MIT License](../LICENSE), like the playground.
