<p align="center">
  <img alt="TypeSOL" src="https://raw.githubusercontent.com/typesol/typesol/main/assets/readme/header.png" width="440">
</p>

<h3 align="center">Write Solana programs in TypeScript. Ship native SBF.</h3>

<p align="center">
  <a href="https://typesol.com">Website</a> ·
  <a href="https://typesol.com/docs/">Docs</a> ·
  <a href="https://github.com/typesol/typesol">Compiler</a> ·
  <a href="https://typesol.com/docs/changelog/">Changelog</a> ·
  <a href="https://x.com/type_sol">X</a>
</p>

TypeSOL compiles a TypeScript subset straight to Solana bytecode: no interpreter, no generated Rust. Every build also
writes an Anchor-compatible IDL, so existing Solana tooling keeps working.

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
| [typesol](https://github.com/typesol/typesol) | The compiler, runtime and CLI (MIT) |

**Status:** 0.10 release candidate, not yet audited by an independent firm. Contributions and issues are welcome in
[typesol/typesol](https://github.com/typesol/typesol).
