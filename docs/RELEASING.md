# Release preparation

The package currently installs from a local directory or tarball. It is not
published, its provisional npm name has not been reserved, and no open-source
license has been selected. `private: true` prevents accidental npm publication.

## Before the first public release

1. Choose an available npm name (optionally scoped), an owner and repository URL.
2. Choose an open-source license and add its LICENSE file; update `license`.
3. Set package metadata (`name`, `repository`, `bugs`, `homepage`) to real values.
4. Initialize the public repository using the supplied `.gitignore`. Do not add
   the original `base_custom_cli.sh` or personal `.sshop.json`.
5. Run the CI matrix and verify native Windows Shopify invocation, real interactive
   authentication, dev shutdown, and a pull/dev workflow against a disposable theme.
6. Run `npm pack --dry-run`, inspect the archive contents, and install that archive
   in a clean environment. The package allowlist includes only runtime, generic
   examples and documentation.
7. Set `private` to false only when ready to publish, then publish a versioned npm
   release from the chosen account. There is no automatic publish workflow.

## Distribution

The primary installation path after release is `npm install -g <chosen-name>`;
`npx <chosen-name> …` can run a published version without a permanent global install.
Before publication, use a local directory or `npm pack` archive.

A CDN can distribute versioned files or archives later. A CLI still runs locally
under Node; downloading one JavaScript entry file is insufficient because this
package has sibling modules. Use npm as the first distribution channel. Add a
version-pinned CDN installer only after there is a stable release URL and a
checksum verification process; no invented CDN links or remote shell installer
are included in this prototype.

## Potential next version

- An interactive setup wizard and shell completion.
- Named theme presets and environment profiles.
- A separately specified Git sync workflow with configurable remote/base branch.
- Optional modules for the non-Shopify tools in the original shell file.
