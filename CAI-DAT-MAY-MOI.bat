@echo off
REM ============================================
REM  CAI DAT APP DUYET CHI LEN MAY MOI (bam dup 1 lan)
REM  Tai app ve D:\DuyetChi (khong co o D thi dung C:\DuyetChi)
REM ============================================
setlocal

REM 1) Kiem tra da cai Git chua
where git >nul 2>nul
if errorlevel 1 (
  echo May nay chua co Git. Dang tu cai Git...
  winget install --id Git.Git -e --accept-source-agreements --accept-package-agreements
  echo.
  echo Cai Git xong. HAY DONG cua so nay va BAM DUP file nay LAN NUA.
  pause
  exit /b
)

REM 2) Chon thu muc dich
set "DICH=D:\DuyetChi"
if not exist "D:\" set "DICH=C:\DuyetChi"

if exist "%DICH%\.git" (
  echo Da co san app o %DICH% - chi lay ban moi nhat...
  cd /d "%DICH%"
  git pull --rebase origin main
) else (
  echo Dang tai app ve %DICH% ...
  git clone https://github.com/vandung0802/Duyet-Chi.git "%DICH%"
)

if errorlevel 1 (
  echo.
  echo !!! CO LOI - nho Claude kiem tra giup !!!
) else (
  echo.
  echo ========================================
  echo  XONG! App nam o: %DICH%
  echo  Tu gio: truoc khi sua bam LAY-BAN-MOI.bat
  echo          sua xong bam NOP-LEN.bat
  echo ========================================
  start "" "%DICH%"
)
pause
