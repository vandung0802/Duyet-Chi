# App Duyệt Chi PVA 379 — quy tắc làm việc (repo này được sửa song song trên NHIỀU MÁY)

## BẮT BUỘC mỗi phiên làm việc
1. **TRƯỚC KHI sửa bất kỳ file nào**: chạy `git pull --rebase origin main` để lấy bản mới nhất (máy khác có thể vừa sửa).
2. **SAU MỖI thay đổi hoàn chỉnh**: tự test cú pháp, rồi commit + `git pull --rebase` + push ngay — KHÔNG hỏi lại user (user đã đồng ý auto-push). Không để thay đổi nằm dở trên máy.
3. Repo này **PUBLIC** + là trang GitHub Pages đang chạy thật cho cả công ty: TUYỆT ĐỐI không commit dữ liệu/backup/file cá nhân — chỉ commit `app3.html`, `sw.js`, `version.txt`, `database.rules.json`, file .bat/.md hướng dẫn.

## App này là gì
- `app3.html` = toàn bộ app (1 file, ~8000 dòng) — app duyệt chi tài chính công ty Phúc Vinh An, chạy tại https://vandung0802.github.io/Duyet-Chi/app3.html
- Firebase RTDB/Auth/Storage (project `duyetchi-pva379`, region asia-southeast1) + Google Sheets qua Apps Script (JSONP).
- **KHÔNG được làm hỏng tính năng đang chạy** — tiền cả công ty đi qua app này. Sửa cẩn thận từng bước, test trước khi push.

## Quy trình phát hành (2 giai đoạn — QUAN TRỌNG)
1. **Deploy âm thầm**: bump `APP_VERSION` trong app3.html, GIỮ NGUYÊN `version.txt` + `sw.js` → push. Chỉ D (user) tải lại thấy bản mới để duyệt.
2. **User nói "phát hành"** mới bump `version.txt` + `VERSION` trong sw.js = APP_VERSION → push → mọi người thấy banner cập nhật.

## Test tối thiểu trước khi push app3.html
```
node -e "const fs=require('fs'),vm=require('vm');const h=fs.readFileSync('app3.html','utf8');const re=/<script(?![^>]*\bsrc=)[^>]*>([\s\S]*?)<\/script>/gi;let m,i=0,bad=0;while((m=re.exec(h))){i++;try{new vm.Script(m[1])}catch(e){bad++;console.log('SCRIPT#'+i+' LOI:'+e.message)}}console.log(i+' script, loi: '+bad)"
```

## Người dùng
- User là "D" (Dũng, vandung0802@gmail.com) — không rành kỹ thuật, trả lời bằng tiếng Việt, ngắn gọn, không hiện suy nghĩ dài dòng.
- 2 file `LAY-BAN-MOI.bat` (= git pull) và `NOP-LEN.bat` (= commit+push) là để user tự bấm đúp khi không dùng Claude.

## Dùng chung 3 máy (từ 22/09/2026) — đường dẫn repo MỖI MÁY KHÁC NHAU, đừng ghi cứng
- Code: chỉ qua GitHub (repo này + `tien-do-pva-379` lồng bên trong + `vandung0802.github.io`). Máy này ở đâu thì dùng `cwd` hiện tại, không đoán ổ đĩa.
- Mọi thứ KHÔNG phải code nằm ở OneDrive `%OneDrive%\Claude code PVA\` (tên có dấu cách → luôn bọc ngoặc kép):
  - `brain\` = trí nhớ Claude (bản chính, trỏ bằng `autoMemoryDirectory` trong `~/.claude/settings.json`). Đừng ghi vào `~/.claude/projects/*/memory` cũ.
  - `skills\` = BẢN CHÍNH 3 skill cầu đường. Sửa skill thì sửa ở đây, rồi bảo D bấm lại `CAI-MAY.bat` trên máy khác.
  - `tai-lieu\` = Excel mẫu, .lsp AutoCAD, Apps Script, ghi chú. File mới không phải app → để vào đây, KHÔNG để trong repo.
  - `backups\` = backup DB hằng ngày 12:30 (tác vụ `PVA-Backup`, script `scripts/backup-db.ps1`, bỏ qua nếu hôm nay đã có). `env\` = khóa app Tiến độ.
  - `CAI-MAY.bat` (cài máy mới: Git/Node/clone/skill/trí nhớ) và `CAI-BACKUP.bat` (tạo tác vụ backup, cần đăng nhập Firebase 1 lần).
- Nếu phiên này thấy `autoMemoryDirectory` chưa trỏ vào OneDrive hoặc thiếu skill → bảo D bấm đúp `CAI-MAY.bat`, không tự sửa settings.
- Bẫy đã gặp: Task Scheduler + đường dẫn có dấu cách (`C:\Users\Vo Van Dung`) → tác vụ chết im lặng; file gọi phải ở `C:\Users\Public\PVA\`.
- Mật khẩu: KHÔNG có file mật khẩu trong repo hay OneDrive; không tạo, không chép. Chi tiết đầy đủ: trí nhớ `project_dong_bo_3_may.md`.
