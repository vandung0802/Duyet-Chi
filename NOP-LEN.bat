@echo off
REM Bam dup file nay SAU KHI sua xong (nop ban sua len GitHub cho may kia dung)
cd /d "%~dp0"
echo Dang nop ban sua len GitHub...
git add app3.html sw.js version.txt database.rules.json 2>nul
git commit -m "Sua tren may (%COMPUTERNAME%) - %date% %time%"
git pull --rebase origin main
git push origin main
if errorlevel 1 (
  echo.
  echo !!! CO LOI - chua nop duoc, nho Claude kiem tra giup !!!
) else (
  echo.
  echo OK - Da nop xong. May kia bam LAY-BAN-MOI.bat la co ban nay.
)
pause
