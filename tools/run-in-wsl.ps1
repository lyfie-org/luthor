param(
  [Parameter(Mandatory = $true)][string]$Workdir,
  [Parameter(Mandatory = $true)][string]$RunCommand
)

$resolved = (Resolve-Path $Workdir).Path
$normalized = $resolved -replace '\\', '/'
if ($normalized -notmatch '^([A-Za-z]):/(.*)$') {
  throw "Could not parse Windows path: $resolved"
}

$drive = $Matches[1].ToLowerInvariant()
$tail = $Matches[2]
$candidateA = "/mnt/$drive/$tail"
$candidateB = "/mnt/host/$drive/$tail"
$wslPath = (wsl.exe sh -lc "if [ -d '$candidateA' ]; then printf '%s' '$candidateA'; elif [ -d '$candidateB' ]; then printf '%s' '$candidateB'; fi" | Select-Object -Last 1).Trim()
if (-not $wslPath) {
  throw "Could not convert path to WSL format: $resolved"
}

wsl.exe sh -lc "cd '$wslPath' && (corepack enable >/dev/null 2>&1 || true) && (command -v pnpm >/dev/null 2>&1 || (command -v corepack >/dev/null 2>&1 && corepack prepare pnpm@10.4.1 --activate >/dev/null 2>&1)) && command -v pnpm >/dev/null 2>&1 || { echo 'pnpm is not available in WSL. Install Node.js (with corepack) in your distro.' >&2; exit 127; }; $RunCommand"
exit $LASTEXITCODE
