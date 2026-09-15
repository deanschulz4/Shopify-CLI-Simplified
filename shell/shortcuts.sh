# Optional Bash/Zsh shortcuts. Source after your previous aliases to replace these names.
# Remove this source line to uninstall shortcuts. Requires the installed commands on PATH.
unalias sl si sp sd spl spa sc sf lo 2>/dev/null || :
function sl { command sl "$@"; }
function si { command si "$@"; }
function sp { command sp "$@"; }
function sd { command sd "$@"; }
function spl { command spl "$@"; }
function spa { command spa "$@"; }
function sc { command sc "$@"; }
function sf { command sf "$@"; }
function lo { command lo "$@"; }
