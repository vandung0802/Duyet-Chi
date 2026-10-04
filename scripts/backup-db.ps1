# Sao luu du lieu nghiep vu cua cac app PVA: Duyet Chi 379, So Quy Gia Binh, Hop dong, Cong no, Thiet bi.
# Chay boi Windows Task Scheduler (task "PVA-Backup": 12:30 va 17:00 chay bu; may tat thi chay ngay khi bat may).
# File backup luu o OneDrive "Claude code PVA\backups" (neu co) hoac backups/ cua repo - KHONG day len repo cong khai.
# Moi file kiem rieng: hom nay da co thi bo qua (3 may cung chay, may nao lam truoc thi may sau bo qua).
# Tu xoa backup cu hon 30 ngay de khong day o.

$ErrorActionPreference = 'Stop'
# Thu muc goc = thu muc cha cua scripts/ (tu suy, khong hardcode path co dau tieng Viet)
$root      = Split-Path -Parent $PSScriptRoot
$backupDir = Join-Path $root 'backups'
if ($env:OneDrive -and (Test-Path (Join-Path $env:OneDrive 'Claude code PVA'))) { $backupDir = Join-Path $env:OneDrive 'Claude code PVA\backups' }
$firebase  = Join-Path $env:APPDATA 'npm\firebase.cmd'
if (-not (Test-Path $backupDir)) { New-Item -ItemType Directory -Path $backupDir | Out-Null }
$stamp = Get-Date -Format 'yyyy-MM-dd'

# CHI sao luu cac nhanh du lieu nghiep vu - KHONG sao luu goc "/": goc con fn-secrets, gb-secrets (KHOA BI MAT
# ky thong bao day), fn-state, push-subs... Khi can khoi phuc: nap file vao DUNG nhanh ghi o 'nhanh' (khong phai goc).
# 04/10/2026: them hopdong / congNo / thietbi - truoc do 3 app nay CHUA TUNG duoc sao luu.
$viec = @(
  @{ ten = 'backup';         proj = 'duyetchi-pva379'; nhanh = '/duyetchi'; chinh = $true  },
  @{ ten = 'backup-giabinh'; proj = 'so-quy-gia-binh'; nhanh = '/duyetchi'; chinh = $false },
  @{ ten = 'backup-hopdong'; proj = 'duyetchi-pva379'; nhanh = '/hopdong';  chinh = $false },
  @{ ten = 'backup-congno';  proj = 'duyetchi-pva379'; nhanh = '/congNo';   chinh = $false },
  @{ ten = 'backup-thietbi'; proj = 'duyetchi-pva379'; nhanh = '/thietbi';  chinh = $false }
)

$hongChinh = $false
foreach ($v in $viec) {
  $out = Join-Path $backupDir ("{0}-{1}.json" -f $v.ten, $stamp)
  if ((Test-Path $out) -and ((Get-Item $out).Length -ge 5)) { Write-Output "Bo qua: hom nay da co $out"; continue }
  try {
    & $firebase database:get $v.nhanh --project $v.proj -o $out
    if ($LASTEXITCODE -ne 0) { throw "firebase database:get that bai (exit $LASTEXITCODE)" }
    # Nhanh chua co du lieu (vd. app Thiet bi chua nhap) -> firebase ghi "null": bo file, lan sau thu lai
    if ((Get-Item $out).Length -le 6 -and ([IO.File]::ReadAllText($out)).Trim() -in @('', 'null')) {
      Remove-Item -LiteralPath $out -Force
      Write-Output "Trong: $($v.nhanh) ($($v.proj)) chua co du lieu"
      continue
    }
    if ($v.chinh -and (Get-Item $out).Length -lt 100) { throw "File backup qua nho, co the loi" }
    Write-Output "OK: $($v.nhanh) ($($v.proj)) -> $out"
  } catch {
    if ($v.chinh) { $hongChinh = $true; Write-Output "LOI: sao luu $($v.nhanh) ($($v.proj)) that bai: $_" }
    else { Write-Output "CANH BAO: sao luu $($v.nhanh) ($($v.proj)) that bai: $_" }
  }
}

# Don backup cu hon 30 ngay (moi loai file backup-*.json)
Get-ChildItem $backupDir -Filter 'backup-*.json' |
  Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-30) } |
  Remove-Item -Force

Write-Output "XONG $(Get-Date -Format 'HH:mm:ss')"
if ($hongChinh) { exit 1 }
