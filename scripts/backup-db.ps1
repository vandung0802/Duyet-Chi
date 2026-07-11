# Sao luu toan bo Firebase Realtime Database cua App Duyet Chi.
# Chay hang ngay boi Windows Task Scheduler (task "DuyetChi-Backup").
# File backup luu CHI O MAY LOCAL trong thu muc backups/ (da .gitignore - KHONG day len repo cong khai).
# Tu xoa backup cu hon 30 ngay de khong day o.

$ErrorActionPreference = 'Stop'
$proj      = 'duyetchi-pva379'
# Thu muc goc = thu muc cha cua scripts/ (tu suy, khong hardcode path co dau tieng Viet)
$root      = Split-Path -Parent $PSScriptRoot
$backupDir = Join-Path $root 'backups'
$firebase  = Join-Path $env:APPDATA 'npm\firebase.cmd'

if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir | Out-Null }

$stamp = Get-Date -Format 'yyyy-MM-dd'
$out   = Join-Path $backupDir "backup-$stamp.json"

& $firebase database:get "/" --project $proj -o $out
if ($LASTEXITCODE -ne 0) { throw "firebase database:get that bai (exit $LASTEXITCODE)" }

# Kiem tra file co noi dung (khong rong) moi coi la hop le
if ((Get-Item $out).Length -lt 100) { throw "File backup qua nho, co the loi" }

# Don backup cu hon 30 ngay
Get-ChildItem $backupDir -Filter 'backup-*.json' |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } |
  Remove-Item -Force

Write-Output "OK: da sao luu -> $out"
