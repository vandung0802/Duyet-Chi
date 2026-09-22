# Sao luu toan bo Firebase Realtime Database cua App Duyet Chi.
# Chay hang ngay boi Windows Task Scheduler (task "DuyetChi-Backup").
# File backup luu CHI O MAY LOCAL trong thu muc backups/ (da .gitignore - KHONG day len repo cong khai).
# Tu xoa backup cu hon 30 ngay de khong day o.

$ErrorActionPreference = 'Stop'
$proj      = 'duyetchi-pva379'
# Thu muc goc = thu muc cha cua scripts/ (tu suy, khong hardcode path co dau tieng Viet)
$root      = Split-Path -Parent $PSScriptRoot
$backupDir = Join-Path $root 'backups'
# Tu 22/09/2026: co OneDrive thi ghi thang vao "Claude code PVA\backups" (dung chung 3 may); khong co thi giu local
if ($env:OneDrive -and (Test-Path (Join-Path $env:OneDrive 'Claude code PVA'))) { $backupDir = Join-Path $env:OneDrive 'Claude code PVA\backups' }
$firebase  = Join-Path $env:APPDATA 'npm\firebase.cmd'

if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir | Out-Null }

$stamp = Get-Date -Format 'yyyy-MM-dd'
$out   = Join-Path $backupDir "backup-$stamp.json"
# 3 may cung chay: may nao lam truoc thi may sau bo qua (file hom nay da co va khong rong)
if ((Test-Path $out) -and ((Get-Item $out).Length -ge 100)) { Write-Output "Bo qua: hom nay da co $out"; exit 0 }

# CHI sao luu nhanh du lieu nghiep vu /duyetchi — KHONG sao luu goc "/".
# Tu 22/09/2026 goc database co them cac nhanh noi bo cua Cloud Functions: fn-secrets, gb-secrets
# (KHOA BI MAT ky thong bao day), fn-state, push-subs... Chep ca goc = khoa bi mat nam dang ro trong
# file backup tren o cung. Khi can khoi phuc: nap file nay vao dung nhanh /duyetchi (khong phai goc).
& $firebase database:get "/duyetchi" --project $proj -o $out
if ($LASTEXITCODE -ne 0) { throw "firebase database:get that bai (exit $LASTEXITCODE)" }

# Kiem tra file co noi dung (khong rong) moi coi la hop le
if ((Get-Item $out).Length -lt 100) { throw "File backup qua nho, co the loi" }

# Don backup cu hon 30 ngay
Get-ChildItem $backupDir -Filter 'backup-*.json' |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } |
  Remove-Item -Force

# SO QUY GIA BINH (project rieng so-quy-gia-binh) — truoc 22/09/2026 KHONG co sao luu nao.
# Loi o day KHONG lam hong ban sao luu 379 o tren (try/catch rieng).
try {
  $outGb = Join-Path $backupDir "backup-giabinh-$stamp.json"
  & $firebase database:get "/duyetchi" --project 'so-quy-gia-binh' -o $outGb
  if ($LASTEXITCODE -ne 0) { throw "exit $LASTEXITCODE" }
  Get-ChildItem $backupDir -Filter 'backup-giabinh-*.json' |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } |
    Remove-Item -Force
  Write-Output "OK: da sao luu Gia Binh -> $outGb"
} catch {
  Write-Output "CANH BAO: sao luu Gia Binh that bai: $_"
}

Write-Output "OK: da sao luu -> $out"
