# Optional: dot-source from your PowerShell profile to use bare names such as sp.
# PowerShell has built-in aliases for some of these names. Replace those aliases
# in the current session only; removing the profile line and restarting restores them.
foreach ($shortcutName in @('sl', 'si', 'sp', 'sd', 'spl', 'spa', 'sc', 'sf', 'lo')) {
    Remove-Item "Alias:$shortcutName" -Force -ErrorAction SilentlyContinue
}
function global:sl { & sl.cmd @args }
function global:si { & si.cmd @args }
function global:sp { & sp.cmd @args }
function global:sd { & sd.cmd @args }
function global:spl { & spl.cmd @args }
function global:spa { & spa.cmd @args }
function global:sc { & sc.cmd @args }
function global:sf { & sf.cmd @args }
function global:lo { & lo.cmd @args }
