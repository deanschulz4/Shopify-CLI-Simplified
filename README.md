# Simplified Shopify CLI

Short Shopify theme commands with store aliases you configure in a JSON dotfile.
Installing the package provides **`sd`, `sp`, `sl`, `si`, `spl`, `spa`, `sc`, `sf`,
and `lo` directly**. The `sshop` command remains available for compatibility.

This is the **0.1.0 release candidate**, licensed under MIT, with no runtime
dependencies. Source: [deanschulz4/Shopify-CLI-Simplified](https://github.com/deanschulz4/Shopify-CLI-Simplified).

The npm package is not published yet. Publication remains disabled until the
final release checks are complete. See [release preparation](docs/RELEASING.md).

## Install locally

Requires Node.js 22.12+ and Shopify CLI on your PATH. Authentication remains
managed by Shopify CLI. Install Shopify CLI if you do not already have it:

```sh
npm install -g @shopify/cli
```

From this project directory:

```sh
npm install -g .
sshop --help
```

Or try it without a global installation:

```sh
node bin/sshop.js --help
node bin/sshop.js --config examples/sshop.example.json sd demo "My Theme" --dry-run
```

## Configure your stores

Create a personal config usable from any project:

```sh
sshop init --global
sshop stores add demo example-store --global
sshop stores add sandbox example-sandbox.myshopify.com --global
sshop stores
```

This creates `~/.sshop.json`. For project-specific configuration, run the same
commands without `--global` from the project root. Example:

```json
{
  "version": 1,
  "stores": {
    "demo": "example-store.myshopify.com",
    "sandbox": "example-sandbox.myshopify.com"
  },
  "defaultStore": "sandbox",
  "defaults": {
    "nodelete": true,
    "themeEditorSync": true
  }
}
```

Store values accept Shopify store prefixes, full `myshopify.com` domains, or
their HTTPS URLs. Custom storefront domains are not accepted. Config is data;
it cannot contain shell commands. Keep authentication tokens in Shopify's normal
authentication flow or environment variables, outside this file.

### Config precedence

1. Built-in defaults: preserve unmatched local files during pull; enable Theme Editor sync during dev.
2. Personal `~/.sshop.json`.
3. The nearest `.sshop.json`, searching upward from your current directory.

Project aliases override personal aliases with the same name. Other aliases
remain available. Set `defaultStore` to `null` to clear an inherited default.
With no configured default or explicit store, Shopify resolves its own store.

`sshop --config /path/to/config.json …` or `SSHOP_CONFIG` selects a single isolated
config instead of merging. An explicit missing config is an error.
`sshop config` shows the effective settings and exact source files.

Writes always target the current directory, or the personal file with `--global`,
or the explicitly selected file. They never silently modify an ancestor's config.
`init` refuses to overwrite an existing file. `stores add` explicitly replaces
an existing alias; `stores remove ALIAS` removes it only from the selected file.
Removing a project override can expose the personal alias again.

Add `.sshop.json` to each theme project's `.gitignore` if it contains personal
store mappings. This package excludes local configuration and legacy source
from its distributable archive.

## Theme commands

| Command | Shortcut | Behavior |
| --- | --- | --- |
| `sshop list [store]` | `sl` | Show the complete theme list |
| `sshop info [store]` | `si` | Show theme environment information |
| `sshop dev [store] [theme]` | `sd` | Develop with Theme Editor sync |
| `sshop pull [store] [theme]` | `sp` | Pull with `--nodelete`; default to live theme |
| `sshop pull-json [store] [theme]` | `spl` | Pull templates/config JSON with `--nodelete` |
| `sshop pull-all [store] [theme]` | `spa` | Pull without `--nodelete` |
| `sshop check` | `sc` | Run Theme Check |
| `sshop fix` | `sf` | Auto-correct Theme Check findings |
| `sshop logout` | `lo` | Run Shopify auth logout |

Short names also work directly: `sshop sd demo "My Theme"`.

```sh
sshop dev sandbox "My Theme"
sshop pull demo "My Theme" -p
sshop pull demo --development
sshop dev --store new-store --theme "Theme with spaces"
sshop dev sandbox -p 9293
sshop list demo -j
sshop pull demo -p --dry-run
```

A single positional argument to `dev`/`pull` is a store if it matches a configured
alias or looks like a URL/domain; otherwise it is a theme. With two positional
arguments, they mean store and theme. Use `--store` for an unmapped prefix with
no theme; use `--theme` when a theme name matches an alias. Quote names with spaces.
Without a theme, `dev` uses Shopify's development theme behavior.

Wrapper flags use separate values (`--store demo`, not `--store=demo`). Additional
Shopify flags go after `--`. Targeting flags belong before `--` to avoid duplicate
store/theme selection. Nodelete/editor-sync defaults are configured in the dotfile.

`--dry-run` prints the command without starting Shopify. It redacts password
values. Arguments are forwarded as an array, without `eval` or shell expansion.
Normal commands inherit Shopify's interactive terminal and exit code.

**Effects:** Pull overwrites matching local files; `--nodelete` only protects files
absent remotely. `spa` can also remove unmatched local files. Dev uploads and
continues syncing changes to the selected theme. Shopify's live-theme protections
remain in place. `sf` modifies local files. Use `--dry-run` to inspect targeting.

## Direct commands: no prefix required

Install or reinstall the updated package from this project directory:

```sh
npm install -g .
sd demo "My Theme" --dry-run
sp demo -p --dry-run
sl demo
```

| Command | Purpose |
| --- | --- |
| `sd demo "My Theme"` | Start development with editor sync |
| `sp demo "My Theme"` | Pull theme files, preserving unmatched local files |
| `spl demo` | Pull live template/config JSON |
| `spa demo` | Pull live theme without preserving unmatched local files |
| `sl demo` | List themes |
| `si demo` | Show theme information |
| `sc` | Check theme code |
| `sf` | Auto-correct theme issues |
| `lo` | Log out of Shopify |
| `sinit --global` | Create personal config |
| `sstores add demo example-store --global` | Add/update a store alias |
| `sstores` | List store aliases |
| `sconfig` | Show effective config |
| `simport ./base_custom_cli.sh --global` | Import original store aliases |
| `shelp` | Show help |

All direct theme commands accept the same options as their prefixed equivalents.
For a specific config, put it first: `sd --config "./custom.json" demo --dry-run`.
The earlier `sshop …` examples remain supported.

Use `sd <store_abr> -p 9293` (or `--port 9293`) to set the development port.
For pull commands, `-p` still means JSON-only: `sp <store_abr> -p`.
The longer `sd <store_abr> -- --port 9293` form also remains supported.

Use `sl <store_abr> -j` or `si <store_abr> -j` for JSON output. `--json` is also
accepted directly; the original `-- --json` form remains supported. This controls
output formatting, whereas `sp <store_abr> -p` selects which files to pull.

### macOS / Bash / Zsh

No shell setup is needed for the installed executable commands. If you still load
old aliases/functions from `base_custom_cli.sh`, they take precedence over
executables. Remove the old Shopify definitions, or load the compatibility
functions after the old file using `eval "$(sshop shell)"` in your shell profile.
Restart the shell. General helpers in the original file are unaffected.

### Windows Command Prompt and PowerShell

Install with `npm.cmd install -g .`. Command Prompt can use `sd`, `sp`, etc.
In PowerShell, use `sd.cmd`, `sp.cmd`, `sl.cmd`, etc. to avoid conflicts with
built-in aliases and npm PowerShell script execution policy restrictions:

```powershell
sinit.cmd --global
sstores.cmd add demo example-store --global
sd.cmd demo "My Theme" --dry-run
```

For exactly `sd`, `sp`, `sl`, etc. in PowerShell, add this one-time setup to your
PowerShell profile (provided profile scripts are permitted in your environment):

```powershell
. ([scriptblock]::Create((sshop.cmd shell powershell | Out-String)))
```

It replaces matching PowerShell aliases with functions forwarding to the installed
`.cmd` commands. This includes `sp`, `sl`, and `si`; their normal PowerShell
meanings will change in that session. Remove the profile line and restart to
restore the original behavior. No execution-policy changes are made by this package.

Personal config on Windows is `%USERPROFILE%\.sshop.json`. Shopify CLI must be
installed globally with npm. In WSL, install Node and both CLIs inside WSL and
follow the Bash instructions.

**Verification:** the [initial CI run](https://github.com/deanschulz4/Shopify-CLI-Simplified/actions/runs/34994515508)
passed the Node 22/24 matrix on macOS, Linux, and Windows, including installed
commands, real Shopify CLI help invocation, and Windows PowerShell shortcuts.
Each subsequent change must pass its own CI run. Live Shopify login/pull/dev
workflows remain a separate pre-release check.

## Migrate the original file

```sh
sshop import ./base_custom_cli.sh --global
```

Import reads literal entries from `map_store()` without sourcing the shell file.
Identical duplicate mappings are collapsed; conflicting duplicates or existing
aliases with different destinations stop the import. Other shell logic is ignored.
Use a local import first if you want to inspect the result before changing your
personal config.

The original file stays unchanged as a local reference. General terminal,
Node/nvm, BigCommerce, and NopCommerce helpers remain there; this first package
focuses on Shopify. The old `sync` helper remains there too: its hard-coded
`origin/master` merge and checkout behavior needs a separate configurable design.
It is not installed by this package. The old `fix` permissions alias and `gitfix`
are also not exported. `clis` is still the ordinary Shopify installation command.

## Development and verification

```sh
npm run release:check
npm pack
```

Tests cover config resolution, migration, argument handling, shell forwarding,
and subprocess exit codes using a fake Shopify executable. They do not contact
stores. The CI workflow checks Node 22/24 on macOS, Linux, and Windows and runs
`npm run release:check` to inspect and install the actual npm archive.
Native Windows dispatch supports the global npm installation of Shopify CLI.

Shopify command behavior follows the official [theme pull](https://shopify.dev/docs/api/shopify-cli/theme/theme-pull)
and [theme dev](https://shopify.dev/docs/api/shopify-cli/theme/theme-dev) documentation.

## Uninstall

```sh
npm uninstall -g simplified-shopify-cli
```

Remove the optional shell startup line and restart your shell. Config files stay
in place for reuse; remove them yourself when no longer needed.

## License

[MIT](LICENSE). The copyright attribution is public; personal store configuration is excluded from the npm package.
