# Cài Apps Script cho app Công nợ — bản sao Google Sheets + tải file lên Google Drive

Làm **một lần**, bằng tài khoản Google `vandung0802@gmail.com`, trên máy tính. Mất khoảng 5 phút.

Sau khi cài xong:
- App tự chép số liệu sang một file Google Sheets (18 sheet) sau mỗi lần nhập / sửa — kế toán mở Sheets ra xem, **không sửa trong Sheets** (sửa ở đó không vào app).
- Ở mỗi hạn mức / khoản vay / thư bảo lãnh / tài sản có nút **"📤 Tải file lên"**: file scan được cất vào Google Drive, thư mục `Cong No PVA-379-279` / tên ngân hàng / tên hợp đồng, ai có link đều xem được.

## Bước 1 — Tạo dự án Apps Script

1. Mở <https://script.google.com> (đăng nhập `vandung0802@gmail.com`).
2. Bấm **Dự án mới** (góc trên bên trái).
3. Bấm vào chữ "Dự án không có tiêu đề" ở trên cùng, đổi tên thành `Cong No PVA-379-279`.

## Bước 2 — Dán mã

1. Mở file mã: <https://github.com/vandung0802/Duyet-Chi/blob/main/AppsScript_CongNo.gs> → bấm nút **Copy raw file** (hình hai ô vuông chồng nhau, góc trên bên phải của khung mã).
2. Quay lại trang Apps Script: bấm vào khung soạn mã, nhấn **Ctrl + A** rồi **Ctrl + V** (xoá hết mã cũ, dán mã mới).
3. Nhấn **Ctrl + S** để lưu.

## Bước 3 — Chạy `khoiTao` (tạo file Sheets + thư mục Drive)

1. Ở thanh phía trên khung mã có ô chọn tên hàm: chọn **khoiTao**.
2. Bấm **▶ Chạy**.
3. Google hỏi quyền: bấm **Xem xét quyền** → chọn tài khoản `vandung0802@gmail.com` → nếu hiện "Google chưa xác minh ứng dụng này" thì bấm **Nâng cao** → **Đi tới Cong No PVA-379-279 (không an toàn)** → **Cho phép**.
   *(Đây là script của chính anh, chạy trong tài khoản của anh; nó xin quyền tạo file Sheets, tạo thư mục Drive và gọi ra Firebase để kiểm tra người đăng nhập.)*
4. Chạy xong, phần **Nhật ký thực thi** bên dưới hiện 2 dòng link: file Google Sheets và thư mục Drive. Chia sẻ file Sheets cho kế toán nếu cần (quyền **Người xem**).

## Bước 4 — Triển khai thành ứng dụng web

1. Góc trên bên phải: **Triển khai** → **Tùy chọn triển khai mới**.
2. Bấm bánh răng cạnh "Chọn loại" → chọn **Ứng dụng web**.
3. **Thực thi dưới tên**: *Tôi*. **Ai có quyền truy cập**: *Bất kỳ ai*.
4. Bấm **Triển khai**. Chép **URL ứng dụng web** (dạng `https://script.google.com/macros/s/…/exec`).

## Bước 5 — Dán địa chỉ vào app

1. Mở app Công nợ → nút **⚙️ Khác** (góc dưới bên phải).
2. Ở thẻ **"🔄 Bản sao Google Sheets & thư mục Google Drive"**: dán URL vào ô **Địa chỉ Apps Script** → bấm **Lưu**.
3. Vài giây sau thẻ hiện link **Mở Google Sheets**, **Mở thư mục Drive** là đã nối được. Bấm **🔄 Đồng bộ Google Sheets ngay** để chép lần đầu.

Nếu thẻ báo lỗi màu đỏ: chụp màn hình gửi Claude.

## Về sau: sửa mã Apps Script

Khi file `AppsScript_CongNo.gs` trong repo đổi: dán lại mã (bước 2), rồi **Triển khai → Quản lý các tùy chọn triển khai → ✏️ Sửa → Phiên bản: Phiên bản mới → Triển khai**. Làm vậy thì URL **giữ nguyên**, không phải dán lại vào app.

## An toàn

- URL `/exec` ai cũng gọi được, nhưng script chỉ làm việc khi yêu cầu kèm **mã đăng nhập Firebase** của một người đang đăng nhập app và **đã được duyệt** trong app Duyệt Chi. Không có mật khẩu hay khoá bí mật nào nằm trong mã.
- Trong app, chỉ giám đốc sửa được ô địa chỉ, và app chỉ nhận địa chỉ dạng `https://script.google.com/macros/s/…/exec`.
- File tải lên Drive đặt quyền "ai có link đều xem" (đúng yêu cầu ban đầu). Tài liệu cần kín thì đừng tải qua nút này — dán link có giới hạn quyền.
