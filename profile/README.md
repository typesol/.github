<p align="center">
  <img alt="TypeSOL" src="https://raw.githubusercontent.com/typesol/typesol/main/assets/readme/header.png" width="440">
</p>

<h3 align="center">Write Solana programs in TypeScript. Ship native SBF.</h3>

<p align="center">
  <a href="https://typesol.com">Website</a> ·
  <a href="https://typesol.com/docs/">Docs</a> ·
  <a href="https://github.com/typesol/typesol">Compiler</a> ·
  <a href="https://typesol.com/docs/changelog/">Changelog</a> ·
  <a href="https://www.npmjs.com/package/@typesol/cli">npm</a> ·
  <a href="https://x.com/type_sol">X</a>
</p>

TypeSOL compiles a TypeScript subset straight to Solana bytecode: no interpreter, no generated Rust. Every build also
writes an Anchor-compatible IDL, so existing Solana tooling keeps working.

```sh
npx @typesol/cli init my-app
```

```ts
export function increment(authority: Signer, counter: Mut<Counter>, by: u64): void {
  require(counter.authority === authority.key, CounterError.Unauthorized);
  counter.count += by; // overflow-checked
}
```

<p align="center">
  <a href="https://github.com/typesol/typesol#numbers">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/typesol/typesol/main/assets/readme/benchmarks-dark.svg">
      <img alt="Benchmark summary: compute units and binary size of TypeSOL, Pinocchio, native Rust and Anchor" src="https://raw.githubusercontent.com/typesol/typesol/main/assets/readme/benchmarks-light.svg" width="760">
    </picture>
  </a>
</p>

| Repository | |
| --- | --- |
| [typesol](https://github.com/typesol/typesol) | The compiler, runtime and CLI (MIT), on npm as [`@typesol/cli`](https://www.npmjs.com/package/@typesol/cli) |

<!-- stats:start (generated daily by scripts/stats.mjs; edit outside the markers) -->
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/typesol/.github/main/profile/stats-dark.svg">
    <img alt="2 public repositories, 0 stars, 0 forks" src="https://raw.githubusercontent.com/typesol/.github/main/profile/stats-light.svg" width="800">
  </picture>
</p>
<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/typesol/.github/main/profile/repos-dark.svg">
    <img alt="Stars and forks per repository" src="https://raw.githubusercontent.com/typesol/.github/main/profile/repos-light.svg" width="800">
  </picture>
</p>
<p align="center"><sub>Public repositories only. Checked daily; redrawn when a number changes.</sub></p>
<!-- stats:end -->

### Contributing

- **Try it and report what breaks.** [Open an issue](https://github.com/typesol/typesol/issues/new) with the program
  (or the smallest part of it) and the compiler's message: a construct TypeSOL refuses is a feature request too.
- **Send a pull request.** [CONTRIBUTING.md](https://github.com/typesol/typesol/blob/main/CONTRIBUTING.md) covers the
  setup, the test suite (LiteSVM, no validator needed) and what a change needs before it is merged.
- **Port an example.** [test/ports](https://github.com/typesol/typesol/blob/main/test/ports/README.md) tracks every
  program in solana-developers/program-examples; the NOT ATTEMPTED ones are open.
- **Security issues** go to the private channel in [SECURITY.md](https://github.com/typesol/typesol/blob/main/SECURITY.md),
  not to public issues.

**Status:** pre-1.0, not yet audited by an independent firm. Releases follow [one versioning policy](https://github.com/typesol/.github/blob/main/VERSIONING.md) across the organization.
