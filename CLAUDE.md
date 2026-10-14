# chartdown

The reference parser for **ChartDown**, published on npm as `chartdown` (MIT). It lives in the ChartDown organization next to the language: github.com/ChartDown/spec holds the spec, the playground and the official conformance suite.

## How we work

- The spec is the source of truth (`SPEC.md` in ChartDown/spec). A change to the language starts there; the parser follows a merged version of it.
- The conformance suite is a verbatim copy in `conformance/`, pinned to a commit of ChartDown/spec (`conformance/PINNED.md`). Update the copy and the pin together, never edit the cases.
- Requirements come from SPEC-00 of ChartDown App (R-00.x). A test that covers one names it, e.g. `R-00.13 an alias takes its canonical form`.
- No runtime dependencies. Example charts are original songs only, never lyrics.
- Every release: version and `CHANGELOG.md` in one pull request; after it merges the owner publishes with `npm publish --auth-type=web` (the build runs on `prepublishOnly`).

## Commands

npm install · npm run typecheck · npm test · npm run format:check
