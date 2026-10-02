# BANGIAO — nhật ký bàn giao app Công Nợ Ngân Hàng PVA-379-279

> Phiên sau đọc file này + spec `docs/hopdong/CLAUDE-cong-no.md` (bản chốt 02/10/2026) + `docs/hopdong/CLAUDE.md` mục 4.3 trước khi sửa `congno.html`. Ghi ngắn: đã làm gì, còn gì, chỗ nào khác spec, câu nào chờ anh Dũng chốt.

## Tình trạng chung (02/10/2026)

- App ở `congno.html` trong repo `Duyet-Chi` (cùng chỗ với `hopdong.html`, `thietbi.html`), chạy tại `https://vandung0802.github.io/Duyet-Chi/congno.html`. **Bản v2**. Kèm `manifest-congno.json`, `version-congno.txt`.
- **Đã xong bước 1 và bước 2** của mục 1.2 (khung app + danh mục ngân hàng/công ty; hạn mức → khế ước → lãi suất → trả nợ → lịch trả).
- Kiểm tra công thức: `node test-congno-tinhtoan.js` (48 phép tính, có khoản thử 2 lần giải ngân, 2 giai đoạn lãi suất, 1 lần trả trước hạn — khớp số tính tay).
- Chạy thử giao diện không cần đăng nhập thật: máy chủ thử + Firebase giả (`serve-congno.js`, `fb-stub.js`) nằm ngoài repo, trong thư mục làm việc của Claude; mất thì viết lại theo nhật ký phiên (stub mô phỏng `ref().on/get/update/push`, `orderByChild().equalTo()`, auth, luật "xoá chỉ giám đốc").

## Khác spec — làm theo thực tế app Hợp Đồng (anh Dũng dặn "dùng lại y nguyên, không viết cách mới")

| Spec ghi | Thực tế đã làm | Lý do |
|---|---|---|
| Repo riêng `cong-no-pva-379-279`, file `index.html` | `Duyet-Chi/congno.html` | App Hợp Đồng cũng nằm trong repo này; cùng tên miền nên đăng nhập một lần dùng cho cả bộ; luật Firebase tự deploy sẵn. Muốn tách repo sau thì chuyển 1 file. |
| Đăng nhập tên + PIN | Email + mật khẩu Firebase (chung tài khoản Duyệt Chi), quyền theo `duyetchi/userRoles` (`approved`, role `dung` = giám đốc) | Y nguyên `hopdong.html` (chốt 30/09). |
| Bảng dùng chung ở gốc Firebase (`congTy`, `nguoiDung`, `yeuCauXoa`, `lichSu`…) | Ở `hopdong/…` (`CAU_HINH.GOC_CHUNG`) | App Hợp Đồng đang để ở đó; không chuyển dữ liệu đang chạy. |
| Dữ liệu riêng `congNo/` | Đúng spec: gốc `congNo/` (`CAU_HINH.GOC`) | Khối luật riêng `congNo` trong `database.rules.json`. |
| Apps Script, web push | Chưa làm — app Hợp Đồng cũng chưa có (mới có thông báo tạm khi mở app) | Bước 8 (nhắc hạn) và đồng bộ Sheets sẽ làm một lần cho đúng. |

## Đã làm 02/10/2026 (phiên 1 — bước 1 + 2, bản v1)

- **Khung app**: CSS, form dùng chung (`moForm/docForm/veO`), đăng nhập, kiểm tra bản mới — chép từ `hopdong.html`. Tông màu xám đá. 4 tab dưới: Hạn mức · Lịch trả · Ngân hàng · Khác.
- **Ghi dữ liệu**: mọi lần ghi qua `soanLuu()` → dữ liệu + dòng `lichSu` (có `app:"congNo"`, thêm trường `chaId` = id bản ghi cha) trong **một** lần `update` nhiều đường dẫn. Xoá: chỉ giám đốc (`xoaBanGhi`); người khác `yeuCauXoa` (bảng chung, `app:"congNo"`, thêm trường `duongBang`) → giám đốc duyệt ở tab Khác. `nguoiDung/{uid}` chỉ thêm `app/congNo`.
- **Ngân hàng** (`congNo/nganHang`): tên, chi nhánh, loại, cán bộ tín dụng, nhiều số tài khoản theo công ty (`taiKhoan/{id}`); chi tiết có bảng hạn mức tại ngân hàng. **Công ty**: chỉ xem (đọc `hopdong/congTy`), sửa ở app Hợp Đồng.
- **Hạn mức** (`congNo/hanMuc`): đủ trường mục 4.3; danh sách có thanh đã dùng/còn trống, báo vàng trước 60 ngày hết hạn, đỏ khi hết hạn hoặc có khế ước quá hạn. Sửa ngân hàng / công ty / số HĐ của hạn mức → khế ước bên dưới mang theo.
- **Khế ước** (`congNo/khoanVay`, `loai:"kheUoc"`): tạo khế ước là tạo luôn lần giải ngân đầu, dòng lãi suất đầu và **một kỳ trả gốc vào ngày đến hạn** (ngày đến hạn bỏ trống → tự tính theo thời hạn). Vượt hạn mức còn trống thì hỏi lại. Bảng con: `giaiNgan`, `laiSuat` (thêm dòng mới; sửa dòng cũ có cảnh báo "chỉ khi nhập nhầm"), `kyTra` (sửa tay → `suaTay`), `traNo`.
- **Trả nợ**: gốc gắn kỳ gốc (`kyTraId`), lãi gắn kỳ lãi (`kyLai` = ngày đến hạn trả lãi). Kỳ gốc tự chuyển `daTra` khi tổng gốc các dòng gắn với kỳ ≥ gốc kỳ; kỳ lãi tự tắt khi có dòng trả gắn. Bảng trả nợ hiện lãi thật / lãi ước / chênh.
- **Lịch trả**: 30 ngày tới + quá hạn, lọc công ty / ngân hàng / gốc-lãi; số đỏ trên tab = số khoản quá hạn.
- **TINH_TOAN** (khối 6): `duNoGoc`, `laiSuatTai`, `laiUocTinh`, `cacKyLai`, `coKyTra`, `lichTra`, `trangThai`, `tinhKhoan`, `hanMucDaDung`, `hanMucConTrong` — đúng mục 1.5.
- **Luật Firebase**: thêm khối `congNo` (nganHang, hanMuc, khoanVay); không sửa khối `hopdong`.

## Đã làm chiều 02/10/2026 (bản v2 — sau khi anh Dũng trả lời 3 câu hỏi; đã ghi vào spec mục 1.5 + 1.6)

- **Bảo lãnh dùng chung hạn mức** (anh Dũng: "bảo lãnh của công ty nào thì tính vào hạn mức của ngân hàng đó"): `TINH_TOAN.baoLanhCuaHanMuc` cộng thư đang hiệu lực **cùng `nganHangId` + cùng `congTyId` = `congTyVay`**. App đã ĐỌC `hopdong/baoLanh` (chưa ghi). Thư nhập từ app Hợp Đồng chỉ có tên ngân hàng gõ tay (`nganHang`), chưa có `nganHangId` → chưa được tính cho tới khi bước 6 cho kế toán gắn ngân hàng. Lưu ý bước 6: một ngân hàng + một công ty có 2 hạn mức (cũ hết hạn + mới) thì thư bị cộng vào cả hai — xử lý khi làm màn Bảo lãnh.
- **File đính kèm = dán link** (anh Dũng: ok): bảng con `fileDinhKem/{id}` `{ten, link, nguon, nguoiTai, luc}` dưới `hanMuc/{id}` và `khoanVay/{id}` (thẻ "File đính kèm" ở chi tiết hạn mức, tab "File" ở khế ước). Chỉ nhận link `http(s)://`. Xoá theo quy tắc chung (giám đốc / yêu cầu xoá).
- **Cách tính lãi ước, `theoDoiLaiTu`** (anh Dũng: không sai) → giữ nguyên.

## Chỗ tôi tự định (spec không nói) — mục 1, 3 anh Dũng đã xác nhận 02/10; còn lại sai thì sửa

1. **Cách đếm ngày tính lãi**: ngày giải ngân có tính lãi, ngày trả gốc thì phần đã trả thôi tính lãi (kỳ 25/01→25/02 = các ngày 25/01 … 24/02). 365 ngày/năm.
2. **Kỳ trả lãi**: ngày N hằng tháng (tháng không có ngày N → ngày cuối tháng), kỳ cuối = ngày đến hạn khế ước.
3. **`theoDoiLaiTu`** (trường thêm): khế ước cũ nhập vào hôm nay thì các kỳ lãi **trước hôm nay** coi như đã trả, không báo quá hạn oan. Kỳ gốc quá hạn thì vẫn báo.
4. **Trả gốc một phần**: kỳ chưa tắt cho tới khi trả đủ gốc của kỳ.
5. **Khế ước quá hạn**: hết kỳ lãi theo lịch (lịch dừng ở ngày đến hạn); muốn nhắc lãi tiếp thì sửa ngày đến hạn (gia hạn / cơ cấu).
6. Lọc theo công ty ở danh sách = khớp công ty đứng tên **hoặc** công ty thực chịu (nút chuyển hai cách xem làm ở Dashboard, bước 9).

## Câu hỏi chờ anh Dũng chốt (gom một lượt)

1. ~~Bảo lãnh dùng chung hạn mức~~ — đã chốt, đã làm (xem trên).
2. ~~File đính kèm~~ — đã chốt dán link, đã làm.
3. **Chỉ mục `app` cho `hopdong/lichSu`, `hopdong/yeuCauXoa`** (luật nhánh dùng chung): hiện app tải cả bảng rồi lọc trên máy; bảng lớn thì nên thêm `.indexOn: ["app"]` — đụng nhánh chung nên hỏi trước.

## Việc tiếp theo (mục 1.2)

3. Vay trung dài hạn theo món: `khoanVay` `loai:"daiHan"`, nhiều lần giải ngân, khối `7. SINH_LICH` (số kỳ + gốc mỗi kỳ + ngày đầu → `kyTra`), trả trước hạn + phí phạt.
4. Thấu chi → 5. Thuê tài chính → 6. Bảo lãnh, phí, ký quỹ → 7. Tài sản bảo đảm → 8. Nhắc hạn + push → 9. Dashboard, biểu đồ, xuất Excel → 10. Nhập Excel.

## Chỗ đang lỗi

- Không có lỗi đã biết. Chưa thử trên iPhone thật (mới mô phỏng 375px). Chưa thử với Firebase thật (cần anh Dũng đăng nhập) — luật `congNo` mới chỉ kiểm tra cú pháp.
