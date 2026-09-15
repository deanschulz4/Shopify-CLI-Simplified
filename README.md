# Simplified Shopify CLI

Short commands for Shopify theme development. Use `sd` to develop, `sp` to pull,
and `sl` to list themes. No `sshop` prefix needed.

## 1. Install

Install **Node.js 22.12 or newer**, then run:

```sh
npm install -g @shopify/cli simplified-shopify-cli
```

Works on macOS, Linux, and Windows. On macOS/zsh, no extra shell setup is needed.
**PowerShell users:** use `npm.cmd` to install and add `.cmd` to commands below
(for example, `sinit.cmd`, `si.cmd`, and `sp.cmd`). See [shell setup](#shell-setup)
for commands without `.cmd`.

## 2. Add your store

```sh
sinit -g
sstores add demo example-store -g
```

Replace `demo` with any short name you want. Replace `example-store` with the
first part of your store's `example-store.myshopify.com` address—not its custom
website domain. Repeat the second command to add more stores.

`-g` saves your stores in your personal `.sshop.json`, available from any project.
If you already have this file, skip `sinit -g`.

## 3. Start working

Open your theme project folder in a terminal, then select your store:

```sh
si demo
```

Complete Shopify's login prompt if asked. After this succeeds, you can omit the
store name:

```sh
sl
sd "My Theme"
```

Run `si` to check the current store, or `si another-alias` to switch.
The selected store is **not tied to your project folder**, so check it when
switching projects. A configured `defaultStore` takes priority over the remembered
store; see [advanced configuration](#advanced-configuration).

## Command cheat sheet

Run theme commands from your theme project folder. Put quotes around theme names
with spaces. `<store_abr>` means the short name you configured, such as `demo`.

| Command | What it does |
| --- | --- |
| `si <store_abr>` | Select a store and show theme information |
| `si` | Check the current store/theme information |
| `sl` | List themes |
| `sd` | Start development using a Shopify development theme |
| `sd "My Theme"` | Develop on a named theme with editor sync |
| `sp` | Pull the live theme |
| `sp "My Theme"` | Pull a named theme |
| `sp -p` | Pull only live template/config JSON |
| `spl "My Theme"` | Pull only a named theme's template/config JSON |
| `sp -d` | Pull the development theme |
| `spa` | Pull the live theme and allow deletion of unmatched local files |
| `sc` | Check theme code |
| `sf` | Fix supported code issues |
| `lo` | Log out of Shopify |
| `shelp` | Show help |

### Options

| Option | Example | Meaning |
| --- | --- | --- |
| `-g` / `--global` | `sinit -g` | Use personal config; also works with alias add/remove and import |
| `-d` / `--development` | `sp -d` | Select the development theme; works with `sp`, `spl`, `spa`, and `si` |
| `-p PORT` / `--port PORT` | `sd -p 9293` | Change the development port |
| `-p` / `--json-only` | `sp -p` | Pull only template/config JSON |
| `-j` / `--json` | `sl -j` | Return JSON; also works with `si` |
| `--dry-run` | `sd "My Theme" --dry-run` | Preview a command without running it |
| `-s` and `-t` | `sd -s demo -t "My Theme"` | Explicitly select a store and theme |

**Before running commands:** `sp` overwrites matching local files; `spa` can also
delete unmatched files. `sd` uploads and continuously syncs changes to the selected
remote theme. `sf` changes local code. Use `--dry-run` to check your target first.

## Manage your stores

| Command | What it does |
| --- | --- |
| `sstores` | List store aliases |
| `sstores add <store_abr> example-store -g` | Add or update an alias |
| `sstores remove <store_abr> -g` | Remove an alias |
| `sconfig` | Show settings and config locations |
| `sinit` | Create a project config |
| `sinit -g` | Create a personal config without overwriting one |
| `simport ./base_custom_cli.sh -g` | Import store aliases from the original script |

`sinit` creates configuration; it does not select or log into a store.
Keep credentials out of `.sshop.json`. Keep personal project configs out of Git.

## Shell setup

<details>
<summary>Windows PowerShell: use commands without .cmd</summary>

Add this to your PowerShell profile, if profile scripts are permitted:

```powershell
. ([scriptblock]::Create((sshop.cmd shell powershell | Out-String)))
```

This replaces conflicting aliases such as `sp`, `sl`, and `si` in that session.
Remove the line and restart PowerShell to restore their original meanings.
The package does not change your execution policy.

Command Prompt can use the short commands directly. In WSL, install Node and
both CLIs inside WSL and follow the Linux instructions.

</details>

<details>
<summary>macOS/zsh or Bash: replace older Shopify aliases</summary>

If you load the old `base_custom_cli.sh`, its aliases may override these commands.
Remove its Shopify aliases, or add this after the old file in your shell profile:

```sh
eval "$(sshop shell)"
```

Restart your terminal. Other helpers in the original script are unaffected.

</details>

## Advanced configuration

<details>
<summary>Config files, default stores, and extra Shopify options</summary>

Personal config: `~/.sshop.json` on macOS/Linux or `%USERPROFILE%\.sshop.json`
on Windows. The nearest project `.sshop.json` overrides personal settings.
Omit `-g` when adding/removing aliases to update the current folder's config.

See the [example configuration](examples/sshop.example.json). Set `defaultStore`
to an alias for a fixed default, or `null` to use Shopify's remembered store.
`si` does not change this setting, and `si --dry-run` does not select a store.

Use `sd --config "./custom.json"` or `SSHOP_CONFIG` to load one config file instead
of merging personal and project settings. `sconfig` shows which files are used.

If a theme name matches a store alias, use `-t "Theme Name"`. Use `-s STORE` for
an unconfigured store prefix. Give option values separately: `-s demo`.

Additional Shopify options go after `--`, for example `sd -- --verbose`.
Put store/theme options and `--dry-run` before that separator.
The `sshop` command and long option names remain supported.

Import reads literal store aliases without executing the original shell script.
Conflicting aliases stop the import; unrelated shell functions are not imported.

</details>

## Contributing

From a source checkout, run `npm install -g .` to install locally and
`npm run release:check` to test and inspect the package.

Automated checks cover macOS, Linux, and Windows. Live store login, pull, and
sync are not covered by those tests. See [release details](docs/RELEASING.md).

## Uninstall

```sh
npm uninstall -g simplified-shopify-cli
```

Remove any optional shell profile line too. Your config files are kept.

[MIT License](LICENSE)
