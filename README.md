# chartdown

The parser for **ChartDown**, a plain-text notation for Nashville Number System charts: sections,
bars, numbers, keys, dynamics and notes for each instrument. It implements the
[ChartDown spec 0.9](https://github.com/ChartDown/spec), and reads charts written for 0.3 to
0.9 without a warning. It has no runtime dependencies and runs the same in the browser and in Node.

```sh
npm install chartdown
```

```ts
import { chordFormatter, parse } from "chartdown";

const chart = parse(`---
key: G
---
## Chorus
> MD: Open it up a little.
> MD drums: Light groove, hi-hat.
{mf} 4 | 1 | 5 | 6m
`);

chart.sections[0]?.name; // "Chorus"
chart.warnings; // [] — problems are reported by line, never thrown

// Numbers, or letters in any key.
const letters = chordFormatter(chart, { style: "letters", key: { root: "A", minor: false } });
```

## The JSON form and the play order

`toJSON(chart)` gives the chart in the JSON form of Appendix A of the spec, so apps, converters
and tests agree on what a chart means. `playOrder(chart)` lists the bars in the order they are
played, after repeats, endings and navigation (D.S., D.C., coda, fine).

```ts
import { parse, playOrder, toJSON } from "chartdown";

const chart = parse("## A\n{segno} 1 | 4 {to coda} | 5 {D.S. al coda}\n## B\n{coda} 6m | 1");
playOrder(chart); // [{ section: 0, bar: 1, pass: 1 }, ...]
toJSON(chart).sections[0]?.rows[0]?.bars[0]?.nav; // ["segno"]
```

Roles in the JSON form are the instrument ids of the catalog you pass in `parse(source, { instruments })`,
and `everyone` for the whole band.

Also exported: `transposeKey`, `keyName` and `parseKeyName` for keys; `sectionLength`; `layoutBeats`
for the share of a bar each token takes; and the music director's layer format (`parseLayer`,
`formatLayer`, `placeLayer`), which keeps a band's notes apart from the chart. See the
[changelog](CHANGELOG.md) for what changed from 0.1.

## Tempo and its beat unit

A tempo can say what one beat is (spec 11.3): `tempo: 58 q.`, `@tempo 87 q`, or `58 ?` when it
isn't known yet. `row.tempo` is the number, `row.tempoUnit` the unit written, and
`rowBeatUnit(row)` what the tempo counts, written or from the meter (the dotted quarter in 6/8,
9/8 and 12/8). To play or compare tempos, `eighthsPerMinute(58, "q.")` is 174.

```ts
import { eighthsPerMinute, parse, rowBeatUnit } from "chartdown";

const row = parse("---\nmeter: 6/8\ntempo: 58\n---\n## A\n1 | 4").sections[0].rows[0];
const unit = rowBeatUnit(row); // "q."
const epm = eighthsPerMinute(row.tempo, unit); // 174
```

## Conformance

The spec defines a compatible parser as one that passes its conformance suite (`conformance/` in
[github.com/ChartDown/spec](https://github.com/ChartDown/spec), Appendix B). This package passes it,
and ships the adapter the suite's runner expects as `chartdown/conformance`: `toJSON(source)` for
the JSON form and `display(source, { style, key })` for the chords as shown. In a clone of the spec
repository, with `chartdown` installed:

```sh
echo 'export * from "chartdown/conformance";' > adapter.mjs
node conformance/run.mjs ./adapter.mjs
```

## Contributing

Issues and pull requests are welcome at
[github.com/ChartDown/parser](https://github.com/ChartDown/parser). The language itself, its
playground and its conformance suite live in [github.com/ChartDown/spec](https://github.com/ChartDown/spec);
a change to the language starts there.

```sh
npm install
npm run typecheck
npm test          # unit tests, the pinned conformance suite and a packed install
npm run format:check
```

## License

MIT. The ChartDown spec itself is public domain (CC0).
