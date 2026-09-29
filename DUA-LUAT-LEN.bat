@echo off
REM Bam dup file nay de DUA LUAT FIREBASE (database.rules.json) LEN MAY CHU.
REM Can lam moi khi Claude sua database.rules.json (them app moi: Thiet bi, Hop dong...).
REM Chi can chay 1 lan tren 1 may - luat nam tren may chu Firebase, dung chung cho moi nguoi.
cd /d "%~dp0"
echo ==============================================
echo   DUA LUAT FIREBASE LEN MAY CHU (duyetchi-pva379)
echo ==============================================
echo.
echo [1/3] Lay ban moi nhat tu GitHub...
git pull --rebase origin main
if errorlevel 1 goto LOI_GIT
echo.
echo [2/3] Kiem tra cong cu Firebase...
set FB=%APPDATA%\npm\firebase.cmd
if exist "%FB%" goto CO_FB
echo Chua co cong cu Firebase, dang cai (can mang, cho 1-2 phut)...
call npm install -g firebase-tools
if not exist "%FB%" goto LOI_CAI
:CO_FB
echo Da co: %FB%
echo.
echo [3/3] Dua luat len may chu Firebase...
call "%FB%" deploy --only database --project duyetchi-pva379
if errorlevel 1 goto LOI_DEPLOY
echo.
echo ==============================================
echo   OK - LUAT DA LEN. Tai lai app (F5) la doc duoc du lieu.
echo ==============================================
goto HET

:LOI_GIT
echo.
echo LOI: Khong lay duoc ban moi tu GitHub. Kiem tra mang, hoac nho Claude.
goto HET

:LOI_CAI
echo.
echo LOI: Cai firebase-tools that bai. Can cai Node.js truoc (bam CAI-MAY.bat), roi chay lai.
goto HET

:LOI_DEPLOY
echo.
echo LOI: CHUA DUA LUAT LEN DUOC.
echo   - Neu o tren bao chua dang nhap / not logged in / login:
echo       mo cmd, go:  firebase login   roi dang nhap vandung0802@gmail.com, sau do bam dup lai file nay.
echo   - Loi khac: chup man hinh cua so nay gui Claude.
goto HET

:HET
echo.
echo (Bam phim bat ky de dong cua so nay)
pause >nul
