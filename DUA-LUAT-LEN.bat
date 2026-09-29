@echo off
REM Bam dup file nay de DUA LUAT FIREBASE (database.rules.json) LEN MAY CHU.
REM Can lam moi khi Claude sua database.rules.json (vi du: them app moi nhu Thiet bi, Hop dong).
REM Chi can chay 1 lan tren 1 may bat ky - luat nam tren may chu Firebase, dung chung cho moi nguoi.
cd /d "%~dp0"
echo [1/3] Lay ban moi nhat tu GitHub...
git pull --rebase origin main
if errorlevel 1 (
  echo !!! Khong lay duoc ban moi - kiem tra mang, hoac nho Claude !!!
  pause & exit /b 1
)
echo.
echo [2/3] Kiem tra cong cu Firebase...
set "FB=%APPDATA%\npm\firebase.cmd"
if not exist "%FB%" (
  echo Chua co cong cu Firebase, dang cai (can mang, cho 1-2 phut)...
  call npm install -g firebase-tools
  if errorlevel 1 (
    echo !!! Cai firebase-tools that bai. Can cai Node.js truoc (bam CAI-MAY.bat) !!!
    pause & exit /b 1
  )
)
echo.
echo [3/3] Dua luat len may chu Firebase (project duyetchi-pva379)...
call "%FB%" deploy --only database --project duyetchi-pva379
if errorlevel 1 (
  echo.
  echo !!! CHUA LEN DUOC. Neu bao chua dang nhap / not logged in:
  echo     - Go lenh:  firebase login   ^(mo trinh duyet, dang nhap vandung0802@gmail.com^)
  echo     - Roi bam dup lai file nay.
  echo     Loi khac: chup man hinh gui Claude.
) else (
  echo.
  echo OK - LUAT DA LEN. Mo lai app tren dien thoai/may tinh la doc duoc du lieu.
)
pause
