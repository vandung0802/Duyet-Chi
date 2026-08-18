@echo off
REM Bam dup file nay TRUOC KHI bat dau sua (lay ban moi nhat tu GitHub ve may nay)
cd /d "%~dp0"
echo Dang lay ban moi nhat ve...
git pull --rebase origin main
if errorlevel 1 (
  echo.
  echo !!! CO LOI - dung sua voi, nho Claude kiem tra giup !!!
) else (
  echo.
  echo OK - May nay da co ban MOI NHAT. Bat dau sua duoc roi.
)
pause
