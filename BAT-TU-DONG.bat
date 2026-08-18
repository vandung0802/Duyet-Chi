@echo off
REM ============================================
REM  BAT CHE DO TU DONG cho may nay (bam dup 1 LAN DUY NHAT)
REM  Sau do: may tu lay ban moi khi mo may + moi 30 phut, khong can bam gi nua
REM ============================================
setlocal
set "REPO=%~dp0"
if "%REPO:~-1%"=="\" set "REPO=%REPO:~0,-1%"
set "VBS=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup\DuyetChi-TuDongLayBanMoi.vbs"

(
echo ' Tu dong lay ban moi app Duyet Chi ^(chay ngam: luc mo may + moi 30 phut^)
echo Set sh = CreateObject^("Wscript.Shell"^)
echo Set fso = CreateObject^("Scripting.FileSystemObject"^)
echo repo = "%REPO%"
echo logf = sh.ExpandEnvironmentStrings^("%%TEMP%%"^) ^& "\duyetchi_autopull.log"
echo Do
echo   sh.Run "cmd /c git -C """ ^& repo ^& """ pull --rebase origin main", 0, True
echo   On Error Resume Next
echo   Set f = fso.OpenTextFile^(logf, 2, True^)
echo   f.WriteLine "Lan keo gan nhat: " ^& Now
echo   f.Close
echo   On Error Goto 0
echo   WScript.Sleep 1800000
echo Loop
) > "%VBS%"

start "" wscript.exe "%VBS%"
echo.
echo ========================================
echo  XONG! May nay da BAT tu dong.
echo  Tu gio khong can bam LAY-BAN-MOI nua.
echo  (Sua xong van nho bam NOP-LEN.bat)
echo ========================================
pause
