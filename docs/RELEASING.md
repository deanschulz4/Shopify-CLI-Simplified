# Release 0.1.0

Initial release: configurable store aliases, personal/project JSON configuration,
direct commands, optional Bash/Zsh and PowerShell integration, literal legacy
alias import, dry-run output, development port shorthand (`sd -p`), JSON output
(`sl -j`, `si -j`), global configuration (`-g`), and development selection (`-d`).

## Verification

- Node 22/24 CI on macOS, Linux, and Windows checks the installed archive,
  command entry points, real Shopify CLI help, and PowerShell shortcuts.
- `npm run release:check` checks syntax, runs tests, builds and installs an
  isolated archive, and scans for known credential formats and private domains.
- Live Shopify login, pull, development sync, and Ctrl+C against a disposable
  store/theme have not been verified as part of this release. Automated tests
  exercise argument forwarding without modifying stores.

Personal `.sshop.json` and legacy `base_custom_cli.sh` are ignored and excluded
from npm. The LICENSE contains the owner's public copyright attribution.
Pattern checks reduce leakage risk; they are not a complete security audit.

## Publishing procedure

1. Update the version and documentation; run `npm run release:check`.
2. Commit and require the current commit's CI run to pass.
3. Build an archive with `npm pack`, inspect `npm publish ARCHIVE --dry-run`,
   then publish that archive with `npm publish ARCHIVE --access public`.
4. Verify registry integrity, install the exact released version, and tag its
   source commit. npm versions are immutable; corrections need a new version.

## Install

```sh
npm install -g simplified-shopify-cli
```

Use `sd`, `sp`, `sl`, and the other commands directly. A CDN is not required
for this Node-based CLI. Authentication remains managed by Shopify CLI.
