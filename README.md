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

## Shopify command cheat sheet

### Rules

- Run theme commands from your theme project folder.
- Replace `<store_abr>` with your configured store abbreviation.
- Select the current store once with `si <store_abr>`. After it succeeds, omit `<store_abr>` in commands such as `sl`, `sd "My Theme"`, `sp -p`, `sp -d`, and `si -j`.
- Run `si` to check the current store; specify another abbreviation to switch.
- Store aliases are still required when adding or removing aliases.

### Flags

- `-g` = `--global` for `sinit`, `sstores add/remove`, and `simport`.
- `-d` = `--development` for `sp`, `spl`, `spa`, and `si`.
- Both long and short forms work.

### Important

- A configured `defaultStore` overrides the remembered Shopify store. `si` does not change `defaultStore`; clear it or set it to the intended store.
- The selected store is not permanently bound to your project.
- `si --dry-run` does not select a store.
- `sinit` creates configuration only.

This follows Shopify's [connecting-to-a-store behavior](https://shopify.dev/docs/storefronts/themes/tools/cli#connecting-to-a-store).

### Commands

| Command | What it does |
| --- | --- |
| `si <store_abr>` | Select the current Shopify store and show theme information; omit `<store_abr>` in later theme commands |
| `sl` | List all themes |
| `sd "Theme Name"` or `sd Theme_Name` | Start development on a named theme with editor sync |
| `sd` | Start development using a Shopify development theme |
| `sp "Theme Name"` or `sp theme_name` | Pull a named theme; preserve unmatched local files |
| `sp` | Pull the live theme; preserve unmatched local files |
| `sp -p` | Pull only live template/config JSON |
| `spl "My Theme"` | Pull only template/config JSON from a named theme |
| `spa` | Pull the live theme; may delete unmatched local files |
| `sp -d` | Pull the development theme |
| `sc` | Check theme code for issues |
| `sf` | Automatically fix supported theme issues |
| `lo` | Log out of Shopify |

### Store aliases and setup

| Command | What it does |
| --- | --- |
| `sstores` | List available store aliases |
| `sstores add <store_abr> example-store -g` | Add/update a personal store alias |
| `sstores remove <store_abr> -g` | Remove a personal store alias |
| `sconfig` | Show effective settings and config locations |
| `sinit` | Create a project-specific config |
| `sinit -g` | Create a personal config; refuses to overwrite |
| `simport ./base_custom_cli.sh -g` | Import aliases from the original file |
| `shelp` | Show command help |

### Useful options

| Example | What it does |
| --- | --- |
| `sd "My Theme" --dry-run` | Preview the command without running Shopify |
| `sd -s <store_abr> -t "My Theme"` | Explicitly select store and theme |
| `sd -p 9293` | Use a different development port |
| `sl -j` | Return the theme list as JSON |
| `sd --config "./custom.json"` | Use a specific configuration file |

### Remember

- Quotes are required for theme names containing spaces. Use straight quotes (`"`) when copying commands into your terminal.
- Pull (`sp`) overwrites matching local files. Preserving unmatched files does not prevent existing files from being overwritten.
- Dev (`sd`) uploads and continuously syncs changes to the selected remote theme.
- `sd <store_abr> -p 9293` sets the development port; `sp <store_abr> -p` pulls only template/config JSON.
- `si <store_abr> -j` returns theme information as JSON; `sl <store_abr> -j` returns the theme list as JSON.
- `sf` modifies local files. Use `--dry-run` to inspect command targeting before running Shopify.

### Argument handling and compatibility

All commands above work without an `sshop` prefix. The prefixed equivalents
remain supported, for example `sshop dev`, `sshop pull`, and `sshop sd`.

A single positional argument to `sd`/`sp` is a store if it matches a configured
alias or looks like a URL/domain; otherwise it is a theme. With two positional
arguments, they mean store and theme. Use `--store` for an unmapped prefix with
no theme; use `--theme` when a theme name matches an alias.

Wrapper flags use separate values (`--store demo`, not `--store=demo`). Additional
Shopify flags go after `--`. Put targeting flags and `--dry-run` before `--`.
The original `sd -- --port 9293` and `sl -- --json` forms remain supported;
`--port` and `--json` also work directly. Nodelete/editor-sync defaults are
configured in the dotfile.

`--dry-run` prints the command without starting Shopify and redacts password
values. Arguments are forwarded as an array, without `eval` or shell expansion.
Normal commands inherit Shopify's interactive terminal and exit code.
Shopify's live-theme protections remain in place.

## Shell setup

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
