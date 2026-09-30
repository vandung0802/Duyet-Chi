# BANGIAO — nhật ký bàn giao app Hợp Đồng PVA-379-279

> Phiên sau đọc file này (và `CLAUDE.md` cùng thư mục) trước khi sửa `hopdong.html`. Ghi ngắn: đã làm gì, còn gì, chỗ nào đang lỗi, câu nào đang chờ anh Dũng chốt.

## Tình trạng chung (30/09/2026)

- App chạy thật tại `https://vandung0802.github.io/Duyet-Chi/hopdong.html` (repo `Duyet-Chi`, file `hopdong.html`, **bản v8 = viết lại theo spec**). Anh Dũng chốt 30/09 ("cứ làm"): giữ chỗ hiện tại, giữ đăng nhập email + mật khẩu, công thức đúng nguyên văn spec, giữ ô "chưa thi công", "đang thực hiện" = mọi trạng thái trừ Đã xong và Bị chấm dứt.
- Firebase: dùng **chung project `duyetchi-pva379`** với app Duyệt Chi. Dữ liệu theo mục 4.3, tất cả dưới `hopdong/`: `hopDong`, `phuLuc/{hdId}`, `tamUng/{hdId}`, `thanhToan/{hdId}`, `hoanTra/{hdId}`, `baoLanh/{hdId}`, `nhacNho`, `yeuCauXoa`, `lichSu`, `congTy`, `nguoiDung`. Luật trong `database.rules.json` (repo Duyet-Chi) tự deploy bằng GitHub Actions khi gộp vào main.
- Dữ liệu cũ của bản v1–v7 (`hopdong/contracts`, `hopdong/log`, chỉ có hợp đồng thử) không còn được đọc; muốn dọn thì xoá tay trong Firebase Console.

## Bảng đối chiếu mã hiện có với spec (mục 1.2) — làm ngày 29/09/2026

| Hạng mục theo spec | Tình trạng | Ghi chú |
|---|---|---|
| 1 file HTML, PWA, GitHub Pages, Firebase RTDB | Đã có | Đang là `hopdong.html` trong repo Duyet-Chi, không phải `index.html` ở repo riêng |
| 3 công ty PVA/379/279, lọc theo công ty, cộng "cả 3" | Đã có | Chưa loại hợp đồng nội bộ khi cộng cả 3; chưa có MST, người đại diện |
| Hợp đồng: số HĐ, ngày ký, chủ đầu tư, tên gói thầu, công trình, giá trị | Đã có | Thiếu: tên dự án, loại HĐ, giá trước thuế/thuế/sau thuế, thời gian thực hiện, ngày khởi công, ngày hoàn thành HĐ, liên danh, nội bộ, file scan, 7 trạng thái |
| Phụ lục cộng/trừ giá trị | Đã có | Thiếu gia hạn thời gian (ngày hoàn thành mới), loại phụ lục |
| Tạm ứng nhiều đợt | Đã có | Thiếu bảo lãnh tạm ứng kèm mỗi đợt |
| Thanh toán từng đợt: giá trị, trừ TƯ, giữ BH, giữ QT, thực nhận | Đã có | Thiếu: tách giá trị nghiệm thu / số đề nghị, ngày nghiệm thu, ngày tiền về, file. Thực nhận đang tự tính (spec: kế toán nhập) |
| Hoàn trả tiền giữ BH / QT | Có, làm khác | Đang là "loại thanh toán"; spec là bảng `hoanTra` riêng có lý do, nối bảo lãnh |
| Quyết toán: ngày duyệt, giá trị duyệt → doanh thu theo QT | Đã có | Thiếu ngày nộp hồ sơ, đã nhận đủ, còn nợ |
| Bảo hành: ngày bàn giao + số tháng → ngày hết BH | Đã có | Thiếu hình thức (giữ tiền / bảo lãnh / cả hai), tự tạo hoàn trả khi phát hành bảo lãnh BH |
| Bảo lãnh 3 loại + nhắc gia hạn | Thiếu | Chưa có gì |
| Nhắc hạn | Có, làm khác | Đang nhắc trước 10 ngày, chỉ 2 mốc (bàn giao, hết BH), chỉ khi mở app. Spec: 4 mốc, trước 30 ngày, lặp 5 ngày, nút Đã xong, push khi không mở app (GitHub Actions 7:00) |
| Kế hoạch tiền về theo tháng, dòng tiền tháng/quý, biểu đồ | Thiếu | Chưa có gì (Chart.js chưa nạp) |
| Dashboard 6 ô | Có một phần | Có bảng Tổng hợp nhưng số liệu theo công thức cũ; sẽ thay bằng TINH_TOAN |
| Bảng danh sách dạng cột, lọc/sắp xếp từng cột | Làm khác | Đang là thẻ (card) |
| Chi tiết HĐ dạng 9 tab | Làm khác | Đang là các khối xếp dọc |
| Xoá phải giám đốc duyệt, yêu cầu xoá | Đã có | Luật Firebase cũng chặn; chưa có màn Quản trị gom yêu cầu xoá |
| Lịch sử ai sửa gì | Có một phần | Đang ghi dòng chữ; spec cần trường / giá trị cũ / mới cho MỌI lần ghi |
| Người dùng chung Duyệt Chi | Đã có | Qua Firebase Auth email + mật khẩu (spec ghi tên + PIN — sai với Duyệt Chi thật, xem câu hỏi 2) |
| Nhập / xuất Excel, file mẫu | Đã có | Phải làm lại theo trường mới; file mẫu để `mau/mau-nhap-hop-dong.xlsx` |
| File đính kèm (Drive qua Apps Script, link OneDrive) | Thiếu | Cần Apps Script `apps-script/Code.gs`, anh Dũng deploy 1 lần |
| Đồng bộ Google Sheets + sheet TongHop | Thiếu | Cùng Apps Script trên |
| Thông báo đẩy (web push) + GitHub Actions nhắc 7:00 | Thiếu | Có thể dùng hạ tầng VAPID sẵn của project Duyệt Chi |
| Quản trị: người dùng, công ty, yêu cầu xoá | Thiếu | |
| Bố cục 16 khối, tên biến tiếng Việt không dấu | Thiếu | Đã đánh dấu khối 1, 3, 4/5, 6; tên biến còn tiếng Anh, sẽ đổi ở bước đổi cấu trúc |
| Công thức mục 1.5 | **Đã làm** | Khối `6. TINH_TOAN` + `test-hopdong-tinhtoan.js` (48 phép tính). Giao diện đã nối vào từ v8 |
| Tài liệu: README, huong-dan-su-dung, cai-dat-firebase | Thiếu | |

**Thừa so với spec** (đang có trong app, spec không nhắc):

- Ô "Khối lượng đã thực hiện" nhập tay → "còn lại chưa thi công" (anh Dũng yêu cầu sáng 29/09) — câu hỏi 4.
- Trường "Bên B" (nhà thầu) — spec chỉ có chủ đầu tư vì bên B luôn là công ty ký → sẽ bỏ.
- Nút "Chờ quyết toán" riêng → gộp vào trạng thái `choQuyetToan`.
- Thông báo trình duyệt khi mở app → giữ tạm tới khi push thật chạy.

## Câu hỏi đang chờ anh Dũng chốt (gom một lượt — quy tắc 26)

1. **Chỗ để mã**: spec nói repo riêng `hop-dong-pva-379-279` + `index.html`. Hiện app ở `Duyet-Chi/hopdong.html` đang chạy, đăng nhập chung, luật tự deploy. Đề nghị: **giữ chỗ hiện tại**; xong app rồi muốn tách repo thì chuyển 1 file (Firebase vẫn dùng chung project). Nếu anh chốt tách ngay, tôi tạo repo và anh bật GitHub Pages 1 lần.
2. **Đăng nhập**: spec ghi "tên + PIN như Duyệt Chi", nhưng Duyệt Chi thật dùng **email + mật khẩu Firebase**. PIN không bảo vệ được dữ liệu trên Firebase (ai cũng đọc được). Đề nghị: **giữ email + mật khẩu chung Duyệt Chi**, sửa lại dòng đó trong spec.
3. **Công thức khi hoàn trả tiền giữ** (mục 1.5): `tienDaVe = tạm ứng + thực nhận` và `conPhaiThu = nghiệm thu − thu hồi TƯ − thực nhận` đều **không tính khoản hoàn trả**. Ví dụ hợp đồng thử: bên A trả lại 150 triệu tiền giữ bảo hành → theo spec "tiền đã về" không tăng và "còn phải thu" vẫn còn 150 triệu ở mục "khác". Tôi nghĩ đúng phải cộng 150 triệu vào tiền đã về và trừ khỏi còn phải thu. Đang làm **đúng nguyên văn spec** (chưa có số liệu hoàn trả nên chưa sai). Anh chốt cách nào?
4. **"Còn lại chưa thi công"** (KL thực hiện nhập tay): giữ hay bỏ? Đề nghị giữ, không ảnh hưởng công thức khác.
5. **"Tổng giá trị hợp đồng đang thực hiện"** (ô số 1 dashboard) tính trạng thái nào? Đang tạm: tất cả trừ `daXong` và `biChamDut`.

Mặc định nếu anh Dũng nói "cứ làm": 1 giữ chỗ hiện tại, 2 giữ email + mật khẩu, 3 giữ nguyên văn spec, 4 giữ, 5 như đang tạm.

## Đã làm 30/09/2026 (phiên 2 — viết lại theo spec, bản v8)

`hopdong.html` viết lại theo bố cục 16 khối mục 4.2, tên biến tiếng Việt không dấu, chú thích tiếng Việt có dấu:

- **Dữ liệu** theo mục 4.3 (xem trên). Mọi lần ghi đều qua `luuBanGhi()` → ghi `lichSu` từng trường (cũ → mới) trong cùng một lần ghi. Xoá chỉ giám đốc (`xoaBanGhi`), người khác `yeuCauXoa` → giám đốc duyệt ở tab Khác. Luật Firebase chặn tương ứng (xoá cả bản ghi = role `dung`; `lichSu` chỉ thêm; `congTy` chỉ GD).
- **Dashboard**: lọc Cả 3 (trừ nội bộ)/PVA/379/279; ô: tổng giá trị HĐ đang thực hiện, đã nghiệm thu, tiền đã về, còn phải thu, đang giữ BH, đang giữ QT, việc đang nhắc, còn lại chưa thi công; dòng tiền tháng/quý (bảng + biểu đồ Chart.js) kế hoạch vs thực tế; danh sách chờ quyết toán kèm tiền còn đọng; xuất Excel tổng hợp.
- **Danh sách**: bảng đúng cột spec, bấm tiêu đề cột để sắp xếp, lọc công ty/trạng thái/tìm kiếm, dòng cộng; xuất Excel (sheet HopDong + ThanhToan).
- **Chi tiết 9 tab**: Thông tin (đủ trường spec + bảng tài chính mục 1.5 + KL thực hiện), Phụ lục (±, gia hạn), Tạm ứng (kèm bảo lãnh tạm ứng → tự tạo bản ghi `baoLanh` loại `tamUng`, nối `baoLanhId`), Thanh toán (nghiệm thu / đề nghị / thu hồi TƯ / giữ BH / giữ QT / thực nhận nhập tay, gợi ý = đề nghị − các khoản trừ / ngày tiền về), Bảo lãnh (3 loại; nộp thư BH → hỏi đã nhận lại tiền giữ chưa → tự ghi `hoanTra`), BH & Quyết toán (hình thức, bàn giao + số tháng → hết BH; ngày nộp/duyệt/giá trị duyệt/đã nhận đủ/còn nợ; bảng hoàn trả), Kế hoạch tiền về (12 tháng/năm), File (dán link OneDrive/Drive), Lịch sử.
- **Nhắc hạn**: `nhacNho` tự đồng bộ từ `TINH_TOAN.cacMoc` (hết BH, hết bảo lãnh, đến hạn hoàn thành) + mốc tự thêm; hiện khi còn ≤ 30 ngày, nút Đã xong (ghi tên/giờ), mở lại được; badge + ô đếm trên dashboard; thông báo trên máy khi mở app (tạm).
- **Quản trị (tab Khác)**: yêu cầu xoá, thông tin 3 công ty (MST, người đại diện — GD sửa), người dùng (tự ghi khi đăng nhập), danh sách dự án/công trình chung Duyệt Chi.
- **Nhập Excel**: file mẫu do app xuất, xem trước + báo dòng lỗi, xác nhận mới ghi (trùng công ty + số HĐ → cập nhật).
- Kiểm tra: `node test-hopdong-tinhtoan.js` 48 phép tính đúng; kịch bản Chromium 13 bước (tạo HĐ, phụ lục ±, tạm ứng + bảo lãnh, thanh toán, hoàn trả tự tạo, bảo hành/quyết toán, kế hoạch, dashboard, sắp xếp, lịch sử, xin xoá → duyệt, Excel) đạt hết; 0 lỗi JS.

**Chưa làm (theo thứ tự)**: push thật lên màn hình khoá + GitHub Actions 7:00 (`scripts/nhac-han.js`, cần lưu pushTokens) → Apps Script (Google Sheets + tải file lên Drive) → tài liệu README/hướng dẫn → cân nhắc tách repo riêng khi app ổn.

**Khác spec, đã chốt**: bảo lãnh tạm ứng lưu ở bảng `baoLanh` (loại `tamUng`, có `tamUngId`) thay vì lồng trong `tamUng.baoLanh` — để nhắc gia hạn dùng chung 1 chỗ; `tamUng.baoLanhId` trỏ sang.

## Đã làm 29/09/2026 (phiên 1 theo spec)

- Đọc spec, đối chiếu, lập bảng trên.
- Viết khối **`6. TINH_TOAN`** trong `hopdong.html` (từ dòng `// ===== 6. TINH_TOAN` đến `// ===== HẾT 6. TINH_TOAN`): `tinhHopDong`, `tinhTongHop` (loại nội bộ khi cộng cả 3), `dongTien` (kế hoạch/thực tế theo tháng, quý), `cacMoc` (mốc nhắc), cộng tháng đúng lịch (31/01 + 1 tháng = 28/02), tên biến tiếng Việt không dấu theo đúng mục 1.5 và 4.3.
- Viết `test-hopdong-tinhtoan.js` (ở gốc repo, cùng kiểu `test-candoi.js`): 1 hợp đồng thử "MẪU" có 2 phụ lục (+/−), 2 tạm ứng, 2 đợt thanh toán, 1 hoàn trả, quyết toán, bảo lãnh — 45 phép tính đúng. Chạy: `node test-hopdong-tinhtoan.js`.
- Đánh dấu các khối 1, 3, 4/5 đã có bằng dòng `// ===== n. TEN_KHOI =====` để tìm bằng Ctrl+F. **Giao diện chưa đổi**, số liệu người dùng thấy chưa thay đổi (calc() cũ còn nguyên, có chú thích "TẠM").

## Việc tiếp theo (theo thứ tự, mỗi bước một việc)

1. Chờ 5 câu trả lời (hoặc "cứ làm" → mặc định). Nếu chốt tách repo: tạo repo, chuyển file, bật Pages.
2. **Đổi cấu trúc dữ liệu theo mục 4.3** (việc lớn — cần anh Dũng gật): `hopdong/contracts` → `hopDong`, `phuLuc`, `tamUng`, `thanhToan`, `hoanTra`, `baoLanh`, `nhacNho`, `yeuCauXoa`, `lichSu` (dưới gốc `hopdong/` của project chung); đổi tên trường tiếng Việt; sửa luật Firebase tương ứng (báo trước, có bản sao lưu); nối giao diện vào `TINH_TOAN`, bỏ `calc()/sumOf()`.
3. Bổ sung trường hợp đồng (loại HĐ, thuế, thời gian, khởi công, hoàn thành, liên danh, nội bộ, trạng thái), phụ lục gia hạn, tạm ứng có bảo lãnh, thanh toán đủ trường (nghiệm thu/đề nghị/thực nhận/ngày tiền về).
4. Bảo lãnh 3 loại; bảo hành hình thức; hoàn trả bảng riêng + hỏi khi phát hành bảo lãnh BH.
5. Lịch sử theo trường (cũ/mới) cho mọi lần ghi; màn Quản trị (người dùng, công ty, yêu cầu xoá).
6. Dashboard 6 ô + kế hoạch tiền về + dòng tiền tháng/quý + biểu đồ (Chart.js) + chờ quyết toán; bảng danh sách dạng cột; chi tiết dạng tab.
7. Nhắc hạn 30/5 ngày + nút Đã xong; push thật + GitHub Actions 7:00.
8. Excel theo trường mới + file mẫu `mau/`; Apps Script (Sheets + Drive); tài liệu.

## Chỗ đang lỗi

- Không có lỗi đã biết. Chưa kiểm tra trên iPhone thật (mới mô phỏng 390px).
