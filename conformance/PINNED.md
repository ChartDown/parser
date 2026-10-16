# Pinned copy of the official ChartDown conformance suite

Everything in this folder except this file is copied verbatim from
[github.com/ChartDown/spec](https://github.com/ChartDown/spec), folder `conformance/`, at commit
`732dc254f57f859b8c8e2b65e284e35e1f9d2811` (ChartDown 0.8, spec Appendix B; moved from `1e103c9`, ChartDown 0.7). Do not edit those
files here: change them in the spec repository, then copy the folder again at the new commit and
update the commit above, in a pull request of its own (owner's decision, October 13, 2026; T-1712).

The cases are CC0 like the spec; `run.mjs` is MIT, © 2026 ChartDown contributors.

`src/conformance.test.ts` builds the package and runs `node conformance/run.mjs` against the
adapter in `src/conformance.ts`.
