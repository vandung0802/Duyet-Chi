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
