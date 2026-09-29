@echo off
REM CHI LAM 1 LAN: lay chia khoa de GitHub TU DONG dua luat Firebase len may chu (khoi phai bam DUA-LUAT-LEN.bat nua).
REM Sau khi chay: copy dong chia khoa (bat dau bang 1//) roi dan vao GitHub:
REM   github.com/vandung0802/Duyet-Chi -> Settings -> Secrets and variables -> Actions -> New repository secret
REM   Name: FIREBASE_TOKEN    Secret: (dan chia khoa)    -> Add secret
cd /d "%~dp0"
set FB=%APPDATA%\npm\firebase.cmd
if exist "%FB%" goto CO_FB
echo Chua co cong cu Firebase, dang cai (cho 1-2 phut)...
call npm install -g firebase-tools
:CO_FB
echo ==============================================
echo  Trinh duyet se mo ra - dang nhap vandung0802@gmail.com va bam Cho phep.
echo  Xong quay lai day, CHIA KHOA hien o dong bat dau bang  1//
echo ==============================================
echo.
call "%FB%" login:ci
echo.
echo ==============================================
echo  BOI DEN dong chia khoa o tren (bat dau bang 1//), bam Enter de copy,
echo  roi dan vao GitHub theo huong dan Claude gui (ten secret: FIREBASE_TOKEN).
echo  KHONG gui chia khoa nay cho ai, khong dan vao repo.
echo ==============================================
echo.
echo (Bam phim bat ky de dong)
pause >nul
