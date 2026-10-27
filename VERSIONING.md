# Versioning and releases

One policy for every repository in the TypeSOL organization: the compiler, and the tools, libraries and content around
it. Each repository links here from its README or CONTRIBUTING.

## Version numbers

[Semantic Versioning](https://semver.org/). Before 1.0:

- **Minor** (`0.10.x` → `0.11.0`): new features, and any change to the language, generated code, IDL layout, error
  codes, CLI or a public API that existing users must react to. The CHANGELOG says what changed and how to adapt.
- **Patch** (`0.11.0` → `0.11.1`): fixes and internal changes only.
- **1.0** for the compiler comes after an external security audit is published. Other repositories reach 1.0 when their
  public interface is stable.

## Changelog

Every repository keeps a `CHANGELOG.md` with an `## Unreleased` section at the top. Each change lands with its entry,
under Added, Changed, Fixed, Performance, Security or Breaking. A release renames `## Unreleased` to
`## <version> — <YYYY-MM-DD>`.

## Releasing

1. Work lands on `develop` and reaches `main` through a pull request with green CI.
2. A release commit on `main` sets the version (`package.json`, `Cargo.toml`, …) and dates the CHANGELOG section.
3. The commit is tagged `v<version>` (annotated tag), and a GitHub Release is created from the tag with that CHANGELOG
   section as its notes.
4. Tags and GitHub Releases never publish packages. Publishing to a registry (npm, crates.io, the VS Code Marketplace,
   …) is a separate, manually started workflow, run only when the maintainers decide to publish that version.

## Repositories that depend on each other

- A repository that builds on the compiler states the compiler versions it supports (a dependency range, or a
  "Compatibility" table in its README) and is updated in the same release cycle as a breaking compiler minor.
- Results that depend on a compiler build (benchmarks, generated examples) record the compiler version and commit
  they were produced with.
- typesol.com reads versions, CHANGELOGs and numbers from the repositories; nothing on the site is updated by hand.
