<#
  Runs build prompts back to back, one clean Claude Code session each.

  Each prompt runs as its own `claude -p` call, so every session starts with an
  empty context. That is the same as /clear, and nothing carries over except
  files. After each prompt the script:
    - checks that the prompt ticked itself under Progress in CLAUDE.md, and
      stops if it didn't (the session hit a blocker or a failing check);
    - pauses so you can review the diff and commit. Pass -NoPause to skip this.
  After T2 it also runs the full data backfill itself, which takes about an hour
  and is too long for a Claude session.

  Usage, from the repo root:
    .\scripts\run-prompts.ps1                          # E6.11, T1-T6, then E7 (T7 is opt-in)
    .\scripts\run-prompts.ps1 -Prompts T3,T4           # just these
    .\scripts\run-prompts.ps1 -Prompts T1 -Model opus  # pick a model
    .\scripts\run-prompts.ps1 -NoPause                 # no review stops

  Logs go to .claude-runs\ (gitignored by T1).
#>
param(
  [string[]]$Prompts = @('E6.11', 'T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'E7'),
  [string]$Model = '',
  [switch]$NoPause
)

$ErrorActionPreference = 'Stop'
# UTF-8 in the console and the logs (Windows PowerShell defaults to UTF-16 logs and a legacy code page).
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$OutputEncoding = [System.Text.Encoding]::UTF8
$repo = Split-Path $PSScriptRoot -Parent
Set-Location $repo

if (-not (Get-Command claude -ErrorAction SilentlyContinue)) {
  throw 'claude is not on PATH. Install Claude Code first.'
}

# What a session may do without asking. In -p mode anything else is denied,
# so the session reports it instead of hanging.
$allowed = @(
  'Read', 'Edit', 'Write', 'Glob', 'Grep',
  'Bash(npm run *)', 'Bash(npm test*)', 'Bash(npx playwright *)', 'Bash(npx vitest *)',
  'Bash(npx eslint *)', 'Bash(npx prettier *)', 'Bash(npx tsc *)',
  'Bash(node *)', 'Bash(ls *)', 'Bash(mkdir *)', 'Bash(npm start*)', 'Bash(npx next *)',
  'Bash(curl -s* http://localhost*)', 'Bash(curl -s* http://127.0.0.1*)', 'Bash(netstat *)',
  'Bash(git status*)', 'Bash(git diff*)', 'Bash(git log*)', 'Bash(git ls-files*)',
  'WebFetch(domain:api.congress.gov)', 'WebFetch(domain:www.congress.gov)',
  'WebFetch(domain:github.com)', 'WebFetch(domain:raw.githubusercontent.com)',
  'WebFetch(domain:clerk.house.gov)', 'WebFetch(domain:www.senate.gov)',
  'WebFetch(domain:web.archive.org)', 'WebFetch(domain:docs.github.com)'
)
# Never, whatever a prompt says (CLAUDE.md section 8 plus the API key).
$denied = @(
  'Bash(git commit*)', 'Bash(git push*)', 'Bash(git checkout*)', 'Bash(git reset*)',
  'Bash(git branch*)', 'Bash(cat .env*)', 'Read(./.env*)', 'Edit(./.env*)'
)

New-Item -ItemType Directory -Force -Path '.claude-runs' | Out-Null

function Test-Ticked([string]$id) {
  $pattern = '^- \[x\] ' + [regex]::Escape($id) + ':'
  return [bool](Select-String -Path 'CLAUDE.md' -Pattern $pattern -Quiet)
}

foreach ($id in $Prompts) {
  if (Test-Ticked $id) { Write-Host "$id is already ticked. Skipping." -ForegroundColor DarkGray; continue }

  $stamp = Get-Date -Format 'yyyyMMdd-HHmm'
  $log = ".claude-runs\$id-$stamp.md"
  $task = "Run the build prompt under the heading '## ${id}:' in docs/build-prompts.md. " +
          "It's the fenced block right after that heading; follow it exactly as written. " +
          "It's this session's whole task. If you're blocked, stop and explain why in your final message instead of guessing."

  $cliArgs = @('-p', $task, '--permission-mode', 'acceptEdits', '--allowedTools') + $allowed + @('--disallowedTools') + $denied
  if ($Model) { $cliArgs += @('--model', $Model) }

  Write-Host "`n=== $id ($log) ===" -ForegroundColor Cyan
  $output = & claude @cliArgs
  $code = $LASTEXITCODE
  $output | Out-File -FilePath $log -Encoding utf8
  $output
  if ($code -ne 0) { throw "$id exited with code $code. See $log." }

  if (-not (Test-Ticked $id)) {
    Write-Host "$id did not tick itself under Progress. Read $log, fix it, then rerun from $id." -ForegroundColor Yellow
    exit 1
  }

  if ($id -eq 'T2') {
    Write-Host "`nRunning the full tracker backfill (about an hour; resumable, so rerun it if it stops)..." -ForegroundColor Cyan
    npm run tracker:backfill
    if ($LASTEXITCODE -ne 0) { throw 'The backfill failed. Rerun: npm run tracker:backfill' }
  }

  if (-not $NoPause -and $id -ne $Prompts[-1]) {
    Read-Host "`n$id is done. Review the diff (git diff), commit, then press Enter for the next prompt (Ctrl+C to stop)"
  }
}
Write-Host "`nAll done." -ForegroundColor Green
