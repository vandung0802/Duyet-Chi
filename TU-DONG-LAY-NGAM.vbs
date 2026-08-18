' Tu dong lay ban moi nhat tu GitHub ve may nay (chay NGAM, khong hien cua so)
' Dung cho Task Scheduler: chay luc mo may + moi 30 phut.
' An toan: neu dang co sua do chua nop, git tu tu choi keo de (khong mat gi).
Dim fso, thu_muc
Set fso = CreateObject("Scripting.FileSystemObject")
thu_muc = fso.GetParentFolderName(WScript.ScriptFullName)
CreateObject("Wscript.Shell").Run "cmd /c git -C """ & thu_muc & """ pull --rebase origin main", 0, False
