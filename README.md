# Simplified Shopify CLI

Short commands for Shopify themes: `sd` to develop, `sp` to pull, and `sl` to list themes. The customizable store abreviations mapping lets you assign short aliases to your Shopify stores for even quicker switching and command usage.

[Download the one-page cheat sheet (PDF)](https://github.com/deanschulz4/Shopify-CLI-Simplified/raw/refs/heads/main/output/pdf/shopify-command-cheat-sheet.pdf)

## 1. Install

Install **Node.js 22.12 or newer**, then run:

```sh
npm install -g @shopify/cli simplified-shopify-cli
```

Works on macOS, Linux, and Windows. No extra setup for macOS/zsh.

**PowerShell:** use `npm.cmd` and commands such as `si.cmd` and `sp.cmd`,
or enable [short commands](#shell-setup).

## 2. Add your store

```sh
sinit -g
sstores add demo example-store -g
```

- `demo`: your chosen store abbreviation.
- `example-store`: the prefix of your `example-store.myshopify.com` address.
- Repeat `sstores add` for each store.

`-g` saves settings for all projects. Skip `sinit -g` if already configured.

## 3. Start working

Open your theme project folder in a terminal, then select your store:

```sh
si demo
```

Log in if prompted. Then omit the store abbreviation:

```sh
sl
sd "My Theme"
```

Use `si` to check the store or `si another-alias` to switch.
**Check the store when switching projects.** A configured `defaultStore` overrides
the remembered store; see [configuration](#configuration).

## Command cheat sheet

Run theme commands from your theme project folder. Put quotes around theme names
with spaces. `<store_abr>` means the short name you configured, such as `demo`.

| Command | What it does |
| --- | --- |
| `si <store_abr>` | Select a store |
| `si` | Show current store and theme |
| `sl` | List themes |
| `sd` | Start a development theme |
| `sd "My Theme"` | Develop a named theme with editor sync |
| `sp` | Pull the live theme |
| `sp "My Theme"` | Pull a named theme |
| `sp -p` | Pull only live template/config JSON |
| `spl "My Theme"` | Pull named theme template/config JSON |
| `sp -d` | Pull the development theme |
| `spa` | Pull live; may delete unmatched local files |
| `sc` | Check theme code |
| `sf` | Fix supported code issues |
| `lo` | Log out of Shopify |
| `shelp` | Show help |

### Options

| Option | Example | Meaning |
| --- | --- | --- |
| `-g` / `--global` | `sinit -g` | Personal config (setup commands) |
| `-d` / `--development` | `sp -d` | Development theme (`sp`, `spl`, `spa`, `si`) |
| `-p PORT` / `--port PORT` | `sd -p 9293` | Change the development port |
| `-p` / `--json-only` | `sp -p` | Pull only template/config JSON |
| `-j` / `--json` | `sl -j` | JSON output (`sl`, `si`) |
| `--dry-run` | `sd "My Theme" --dry-run` | Preview without running |
| `-s` and `-t` | `sd -s demo -t "My Theme"` | Choose store and theme |

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
| `sinit -g` | Create personal config (never overwrites) |
| `simport ./base_custom_cli.sh -g` | Import legacy store aliases |

`sinit` creates config. `si` selects a store.
Keep credentials out of `.sshop.json`. Keep personal project configs out of Git.

## Shell setup

<details>
<summary>Windows PowerShell: use commands without .cmd</summary>

If your PowerShell profile allows scripts, add:

```powershell
. ([scriptblock]::Create((sshop.cmd shell powershell | Out-String)))
```

This replaces PowerShell aliases such as `sp`, `sl`, and `si`.
To undo, remove the line and restart PowerShell.

Command Prompt needs no setup. For WSL, install Node and both CLIs inside WSL.

</details>

<details>
<summary>macOS/zsh or Bash: replace older Shopify aliases</summary>

If old Shopify aliases override these commands, remove them or add this
after them in your shell profile:

```sh
eval "$(sshop shell)"
```

Restart your terminal.

</details>

## Configuration

<details>
<summary>Optional settings</summary>

- Personal config: `~/.sshop.json` (macOS/Linux) or `%USERPROFILE%\.sshop.json` (Windows).
- Project config: `.sshop.json`; overrides personal settings. Omit `-g` to edit it.
- Run `sconfig` to see your settings.

Set `defaultStore` to an alias for a fixed store, or `null` to use the remembered
store. `si` does not change this setting. [Example config](examples/sshop.example.json).

Use `sd --config "./custom.json"` to load a specific config file.

If a theme name matches a store alias, use `-t "Theme Name"`.
Use `-s STORE` for an unconfigured store prefix.

Put extra Shopify options after `--`: `sd -- --verbose`.
Keep store/theme options and `--dry-run` before `--`.


</details>

## Uninstall

```sh
npm uninstall -g simplified-shopify-cli
```

Remove any optional shell profile line too. Your config files are kept.

[MIT License](LICENSE)
