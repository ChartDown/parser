# Pinned copy of the official ChartDown conformance suite

Everything in this folder except this file is copied verbatim from
[github.com/ChartDown/spec](https://github.com/ChartDown/spec), folder `conformance/`, at commit
`cf868c1065b1c6e8a8bd2972cfabb664eee8fe76` (ChartDown 0.9, spec Appendix B; moved from `732dc25`, ChartDown 0.8). Do not edit those
files here: change them in the spec repository, then copy the folder again at the new commit and
update the commit above, in a pull request of its own (owner's decision, October 13, 2026; T-1712).

The cases are CC0 like the spec; `run.mjs` is MIT, © 2026 ChartDown contributors.

`src/conformance.test.ts` builds the package and runs `node conformance/run.mjs` against the
adapter in `src/conformance.ts`.
