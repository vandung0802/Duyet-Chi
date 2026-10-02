# BANGIAO — nhật ký bàn giao app Hợp Đồng PVA-379-279

> Phiên sau đọc file này (và `CLAUDE.md` cùng thư mục — bản 02/10/2026, kèm `CLAUDE-cong-no.md` của app Công Nợ) trước khi sửa `hopdong.html`. Ghi ngắn: đã làm gì, còn gì, chỗ nào đang lỗi, câu nào đang chờ anh Dũng chốt.

## Tình trạng chung (02/10/2026)

- App chạy thật tại `https://vandung0802.github.io/Duyet-Chi/hopdong.html` (repo `Duyet-Chi`, file `hopdong.html`, **bản v15**). Đăng nhập email + mật khẩu Firebase chung với app Duyệt Chi (chốt 30/09).
- Firebase: chung project `duyetchi-pva379`. Mọi nhánh của app nằm dưới **`hopdong/`**: `hopDong`, `phuLuc/{hdId}`, `tamUng/{hdId}`, `thanhToan/{hdId}`, `hoanTra/{hdId}`, **`baoLanh/{id}` (phẳng, có `hopDongId`, từ v12)**, `nhacNho`, `yeuCauXoa`, `lichSu`, `congTy`, `nguoiDung/{uid}`. Đọc thêm `duyetchi/userRoles` (quyền) và `duyetchi/meta/sites` (danh sách công trình).
- Luật Firebase: `database.rules.json` khối `hopdong`, tự deploy bằng GitHub Actions khi gộp vào `main`.
- Test: `node test-hopdong-tinhtoan.js` (51), `node test-nhac-han-hopdong.js` (13), `node test-hopdong-excel.js` (15) + 4 test Chromium với Firebase giả (`test-hopdong-v8.js`, `test-nhap-excel.js`, `test-don-baolanh.js` — nằm ngoài repo, trong thư mục làm việc của Claude; chép lại từ nhật ký phiên nếu mất).

## Bảng đối chiếu với spec 02/10 (mục 1.2) — làm ngày 02/10/2026

| Mục spec | Đã có | Thiếu / làm khác | Xử lý |
|---|---|---|---|
| 1.5 Công thức TINH_TOAN | Đủ, đúng nguyên văn; 48 kiểm tra | Chỉ cần đọc được bảng bảo lãnh phẳng | **Xong v12**: `baoLanhCua()` lọc theo `hopDongId`, bỏ dự thầu |
| 4.3 `baoLanh` phẳng, dùng chung | Có 3 loại, nhắc hạn, nối tạm ứng | Đang treo dưới `baoLanh/{hdId}/{id}`; thiếu `app`, `hopDongId`, `congTyId`, `soThu`, `duThau`, `nganHangId` | **Xong v12**: bảng phẳng; giám đốc mở app là tự dọn dữ liệu cũ; sửa thư của Công Nợ không mất `phi`/`kyQuy`; xoá hợp đồng chỉ xoá thư do app này tạo |
| 17b `app = "hopDong"` ở `lichSu`/`nhacNho`/`yeuCauXoa` | Chưa có | Thiếu | **Xong v12**; app chỉ hiện/đồng bộ dòng của mình, không đụng dòng app Công Nợ |
| `nguoiDung` dùng chung | Có (`ten`, `email`, `vaiTro`, `dangHoatDong`) | Thiếu `pinHash`, `boPhan`, `nhanThongBaoCongNo` | Chỉ **thêm** `app/hopDong`; PIN không làm (xem câu hỏi 2) |
| Không đọc/ghi `congNo/`, không đổi tên `thuHoiTamUng` | Đúng | — | Giữ |
| 1.2 File mẫu Excel theo file kế toán Đại Thành (3 sheet) + đọc file gốc kiểu khối | Mẫu 1 sheet `NhapLieu` (v11) + nhập 7 sheet | **Chưa làm** — chưa có file `docs/Theo-doi-cong-trinh-Dai-Thanh.xls` trong repo/upload | Chờ anh Dũng gửi file (câu hỏi 3) |
| 1.3 Push thật (FCM) + GitHub Actions 7:00; Apps Script Sheets/Drive | Thông báo trên máy khi mở app; stub Sheets | Thiếu | Việc tiếp theo |
| Thừa | — | `conLaiChuaThiCong`, `khoiLuongDaThucHien` (anh Dũng yêu cầu 29/09, chốt giữ 30/09) | Giữ |

## Câu hỏi đang chờ anh Dũng chốt

- Không còn. 3 câu ngày 02/10 anh Dũng trả lời "cứ làm" → chốt: (1) app Công Nợ dùng nhánh chung tại `hopdong/...`; (2) đăng nhập email + mật khẩu; (3) chờ anh gửi file Excel Đại Thành. Đã ghi vào `CLAUDE.md` mục 1.6 và đầu `CLAUDE-cong-no.md`.
- Anh Dũng chốt thêm 02/10: **không có gì mới thì app không thông báo** (kịch bản 07:00 im lặng khi không có mốc đến hạn).

## Đã làm 03/10/2026 (cùng đợt rà lỗi 4 app)

- `scripts/nhac-han-hopdong.js` không in tên gói thầu/nội dung mốc ra log GitHub Actions (repo công khai) — chỉ in số lượng.

## Đã làm 02/10/2026 tối (phiên 3c — rà lỗi toàn app, bản v15)

Anh Dũng yêu cầu rà toàn bộ app tìm lỗi làm app hỏng khi chạy và tự sửa. Cách làm: 3 lượt đọc mã độc lập theo khối (1–6, 7–9, 10–16) + kịch bản bấm thử mọi màn hình/nút/form với dữ liệu xấu, 2 vai GD/NV (`test-smoke.js`, ngoài repo). Đã sửa 20 điểm:

- **Nhắc hạn**: đồng bộ `nhacNho` chỉ chạy khi 4 bảng (hopDong, phuLuc, baoLanh, nhacNho) đã tải xong — trước đây mạng chậm có thể ghi đè cờ "Đã xong" và xoá/tạo lại mốc. Mốc có `loai` lạ (app Công Nợ) không làm vỡ màn; danh sách "Đã xong" chỉ của app này.
- **Nhập Excel**: dòng "Loại dòng" sai không làm vỡ cả xem trước; bấm "Ghi" lại sau lỗi giữa chừng không tạo hợp đồng đôi; nhập lại file có ô trống không xoá dữ liệu đã nhập tay (cả bảng con); mặc định trạng thái/loại HĐ chỉ áp cho hợp đồng mới; cột tháng kế hoạch bị Excel đổi thành ngày vẫn đọc đúng; ngày kiểu Mỹ `1/15/2026` bị loại; tiền dạng chữ có phần lẻ (`,36`) không bị nhân 100. Bỏ cú pháp `??`/`?.` (iOS cũ trắng màn).
- **Chi tiết hợp đồng**: mở hợp đồng khác khi đang ở tab Kế hoạch không còn hiện nhầm hợp đồng cũ (xoá DOM khi đổi id); đổi năm kế hoạch khi đang gõ dở thì hỏi trước.
- **Form tạm ứng**: trường tạm `_baoLanh` không còn bị ghi vào bản ghi tamUng / lịch sử; bấm Lưu lại sau khi bước phụ (bảo lãnh) lỗi thì là sửa, không tạo đợt trùng; không TypeError khi nhánh tamUng trống.
- **Khác**: ô tiền có `onInput` định dạng khi gõ (trước bị 2 thuộc tính oninput); Chart.js không chèn `<script>` lặp khi CDN bị chặn; yêu cầu xoá / rút / duyệt báo lỗi khi Firebase từ chối; đăng ký push báo lỗi thay vì treo; CSS `inset` có dự phòng cho iOS < 14.5.
- Test mới: `test-hopdong-excel.js` (15 kiểm tra đọc ô Excel); thêm kiểm tra hồi quy vào test v8 và test nhập Excel (file có dòng sai + tháng kiểu Date). Tất cả test đạt.

## Đã làm 02/10/2026 tối (bản v14 — sửa lỗi đăng xuất rồi đăng nhập lại)

- Lỗi: đăng xuất rồi đăng nhập lại trong cùng tab → `ketNoiDuLieu()` thoát sớm vì `_daKetNoi` vẫn `true`, trong khi Firebase đã huỷ hết listener lúc thoát → màn hình giữ dữ liệu của phiên trước, không tự cập nhật. Sửa: trong `onAuthStateChanged`, hễ mất đăng nhập mà đã từng kết nối thì `location.reload()` — bắt cả trường hợp bấm Đăng xuất lẫn bị thoát do đăng xuất ở tab khác (Duyệt Chi / Công nợ chung tài khoản). Chưa thử trên trình duyệt thật (cần tài khoản).

## Đã làm 02/10/2026 chiều (phiên 3b — nhắc hạn 07:00 + push, bản v13)

- `sw-hopdong.js`: service worker riêng (scope `hopdong`), chỉ nhận push và mở app; không cache. Không đụng `sw.js` của Duyệt Chi.
- Khối 14 `hopdong.html`: bật thông báo → đăng ký web push (khoá VAPID công khai chung với Duyệt Chi) → lưu `hopdong/pushSubs/{uid}/{khoá}`; đăng ký lại mỗi lần mở app; nhắc tại chỗ chỉ còn cho máy không nhận được push.
- Luật: `hopdong/pushSubs/$uid/$khoa` (chỉ ghi dưới uid của mình, kiểm endpoint/keys như `push-subs`).
- `scripts/nhac-han-hopdong.js` (+ `scripts/package.json` web-push): đọc Firebase bằng `firebase database:get` (FIREBASE_TOKEN), nạp TINH_TOAN từ `hopdong.html`, đồng bộ `nhacNho` (như app), chọn mốc ≤ 30 ngày chưa xong và cách lần nhắc trước ≥ 5 ngày, gửi push tới mọi máy đã đăng ký (tối đa 6 thông báo, dư thì gộp), ghi `soLanDaNhac`, `lanNhacCuoi`, `ngayNhacTiep`; xoá đăng ký chết (404/410). Không có việc → không gửi. `--thu` = chạy thử.
- `.github/workflows/nhac-han-hopdong.yml`: cron `0 0 * * *` UTC = 07:00 VN + chạy tay (có ô "chạy thử").
- Test: `node test-nhac-han-hopdong.js` (13 kiểm tra) + 4 bộ test cũ.
- Đã chạy thử tác vụ trên GitHub (run #2, chế độ "chạy thử"): đọc Firebase OK, thấy 1 hợp đồng, 1 mốc quá hạn, nội dung đúng quy tắc 20. Lần 1 đỏ vì firebase-tools in cảnh báo trước JSON → đã sửa đọc qua file tạm (PR #16). Chưa kiểm push trên điện thoại thật: cần anh Dũng bật thông báo trong app (tab Khác) rồi chạy tay workflow (bỏ tích "chạy thử") để xem có nhận không.

## Đã làm 02/10/2026 (phiên 3 — theo spec 02/10, bản v12)

- Chép spec 02/10 vào `docs/hopdong/CLAUDE.md`, spec app Công Nợ vào `docs/hopdong/CLAUDE-cong-no.md` (để tham khảo cấu trúc dùng chung).
- Bước 1 TINH_TOAN: thêm `baoLanhCua(du)` (lọc thư theo `hopDongId`, bỏ `duThau`), `cacMoc` dùng nó; +3 kiểm tra.
- Bước 2 bảng `baoLanh` phẳng: `baoLanhCuaHD`, `bangCuaHD`, `gan1BanGhi`; `luuBanGhi` ghi `baoLanh/{id}` kèm `app`, `hopDongId`, `congTyId`, giữ nguyên trường app khác ghi; sửa bản ghi con giữ trường không có trên form (sửa lỗi cũ: sửa tạm ứng làm mất `baoLanhId`); `xoaBanGhi`; tab Bảo lãnh hiện số thư / nguồn Công Nợ / mã ngân hàng; form có ô Số thư; `donBaoLanhCu()` dọn dữ liệu cũ một lần (giám đốc). Luật `baoLanh/$id`. Mỗi bản ghi con đưa vào TINH_TOAN có `id` → mỗi thư một mốc nhắc riêng (trước đây các thư cùng hợp đồng gộp 1 mốc).
- Bước 3: `app:'hopDong'` cho `lichSu`, `nhacNho`, `yeuCauXoa`; danh sách nhắc / yêu cầu xoá / lịch sử chỉ lấy dòng của app này; `nguoiDung` thêm `app/hopDong`.
- Test: tinhtoan 51 ✅, UI v8 ✅, nhập Excel ✅, dọn bảo lãnh (mới, 13 kiểm tra) ✅.

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
- **Nhập Excel** (v11, 01/10): file mẫu tải về là **1 sheet `NhapLieu`** (anh Dũng yêu cầu), cột A "Loại dòng" tách thành 7 nhóm (`docSheetMot`), rồi dùng chung phần kiểm tra/ghi; file 7 sheet cũ vẫn đọc được. Lưu ý so khớp tên cột đúng chữ trước dấu ngoặc (tránh "Loại" trúng "Loại dòng").
- **Nhập Excel** (v9, 30/09): file mẫu 7 sheet do app xuất (HopDong, PhuLuc, TamUng, ThanhToan, BaoLanh, HoanTra, KeHoach + HuongDan), sheet con nối bằng Công ty + Số HĐ; xem trước từng sheet, báo dòng lỗi, xác nhận mới ghi; nhập lại → cập nhật theo khoá (số PL / đợt / loại+hết hạn / loại+ngày+tiền / tháng), không tạo đôi; bảo lãnh tạm ứng trong sheet TamUng → tự tạo `baoLanh` loại tamUng. Kiểm tra: `scratchpad/test-nhap-excel.js` (14 bước). Sửa lỗi tab Kế hoạch bị vẽ đè khi đang gõ.
- Kiểm tra: `node test-hopdong-tinhtoan.js` 48 phép tính đúng; kịch bản Chromium 13 bước (tạo HĐ, phụ lục ±, tạm ứng + bảo lãnh, thanh toán, hoàn trả tự tạo, bảo hành/quyết toán, kế hoạch, dashboard, sắp xếp, lịch sử, xin xoá → duyệt, Excel) đạt hết; 0 lỗi JS.

**Chưa làm (theo thứ tự)**: push thật lên màn hình khoá + GitHub Actions 7:00 (`scripts/nhac-han.js`, cần lưu pushTokens) → Apps Script (Google Sheets + tải file lên Drive) → tài liệu README/hướng dẫn → cân nhắc tách repo riêng khi app ổn.

**Khác spec, đã chốt**: bảo lãnh tạm ứng lưu ở bảng `baoLanh` (loại `tamUng`, có `tamUngId`) thay vì lồng trong `tamUng.baoLanh` — để nhắc gia hạn dùng chung 1 chỗ; `tamUng.baoLanhId` trỏ sang.

## Đã làm 29/09/2026 (phiên 1 theo spec)

- Đọc spec, đối chiếu, lập bảng trên.
- Viết khối **`6. TINH_TOAN`** trong `hopdong.html` (từ dòng `// ===== 6. TINH_TOAN` đến `// ===== HẾT 6. TINH_TOAN`): `tinhHopDong`, `tinhTongHop` (loại nội bộ khi cộng cả 3), `dongTien` (kế hoạch/thực tế theo tháng, quý), `cacMoc` (mốc nhắc), cộng tháng đúng lịch (31/01 + 1 tháng = 28/02), tên biến tiếng Việt không dấu theo đúng mục 1.5 và 4.3.
- Viết `test-hopdong-tinhtoan.js` (ở gốc repo, cùng kiểu `test-candoi.js`): 1 hợp đồng thử "MẪU" có 2 phụ lục (+/−), 2 tạm ứng, 2 đợt thanh toán, 1 hoàn trả, quyết toán, bảo lãnh — 45 phép tính đúng. Chạy: `node test-hopdong-tinhtoan.js`.
- Đánh dấu các khối 1, 3, 4/5 đã có bằng dòng `// ===== n. TEN_KHOI =====` để tìm bằng Ctrl+F. **Giao diện chưa đổi**, số liệu người dùng thấy chưa thay đổi (calc() cũ còn nguyên, có chú thích "TẠM").

## Việc tiếp theo (theo thứ tự, mỗi bước một việc)

1. Anh Dũng thử push trên điện thoại: mở app → Khác → "Bật thông báo"; rồi GitHub → Actions → "Nhac han Hop dong" → Run workflow. Lỗi thì xem log tác vụ.
2. Nhận file Đại Thành → mẫu `mau/mau-nhap-hop-dong.xlsx` 3 sheet (hợp đồng / đợt nghiệm thu / tiền về) + bộ đọc file gốc kiểu khối nhiều dòng có xem trước ghép tiền về vào đợt.
3. Apps Script (`apps-script/Code.gs`): đồng bộ Sheets một chiều + tải file lên Drive; URL vào `CAU_HINH`.
4. `docs/huong-dan-su-dung.md`, `docs/cai-dat-firebase.md`.

## Chỗ đang lỗi

- Không có lỗi đã biết. Chưa kiểm tra trên iPhone thật (mới mô phỏng 390px). Thư bảo lãnh nhập từ app Công Nợ chỉ hiện mã ngân hàng (`nganHangId`) vì app này không đọc `congNo/nganHang` (quy tắc 17b).
