# Release 0.1.0

## Prepared

- Package: `simplified-shopify-cli` (npm lookup returned 404 on 2026-09-15;
  this does not reserve the name or guarantee that npm will accept it).
- License: MIT, matching the repository LICENSE.
- Repository: https://github.com/deanschulz4/Shopify-CLI-Simplified
- Public npm registry/access configured. `private: true` still blocks publication.
- Initial Node 22/24 CI matrix passed on macOS, Linux, and Windows, including
  native PowerShell shortcuts. New changes require their own passing run.
- `npm run release:check` builds and installs an archive in an isolated folder,
  validates its file allowlist, checks known credential formats/private store
  domains, exercises all executable entry points, and verifies flag forwarding.

The LICENSE contains the owner's chosen public copyright attribution. Personal
`.sshop.json` and legacy `base_custom_cli.sh` are ignored and excluded from npm.
Pattern checks reduce leakage risk; they are not a complete security audit.

## Still required before publication

1. Run the current commit's CI workflow successfully.
2. Validate login, pull, development sync, and Ctrl+C shutdown against an explicitly
   authorized disposable store/theme and a disposable local theme directory.
   Check named themes, JSON-only pulls, port selection, and `sl -j` / `si -j`.
   Never use a production/live theme for this release check.
3. Run `npm login --registry=https://registry.npmjs.org/` locally and complete the
   account/2FA prompts, then `npm whoami --registry=https://registry.npmjs.org/`.
   The account lookup during preparation returned 401. Do not commit credentials.
4. Once those checks pass, remove `private: true` from package.json, commit the
   change, and require the resulting commit's CI run to pass.
5. Run `npm run release:check`, then `npm publish --dry-run` and inspect the file
   list. Publish the reviewed release using `npm publish --access public` from
   the authenticated owner's terminal. Nothing here publishes automatically.
6. Verify `npm view simplified-shopify-cli@0.1.0 dist.integrity`, install that
   exact published version in a clean environment, then tag the released commit
   `v0.1.0` and create the GitHub release.

npm versions are immutable. Use a new version for any correction after publishing.

## Distribution

After publication, users can run `npm install -g simplified-shopify-cli` and use
`sd`, `sp`, `sl`, and the other commands. Before publication, use the GitHub source
or an npm pack archive. A CDN is not required for this Node-based CLI.

## Release summary

Initial release: configurable store aliases, personal/project JSON configuration,
portable direct commands, optional Bash/Zsh and PowerShell integration, literal
legacy-alias import, dry-run output, development port shorthand (`sd -p`), and
JSON output shorthand (`sl -j`, `si -j`).
