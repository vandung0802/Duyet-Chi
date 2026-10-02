# BANGIAO — nhật ký bàn giao app Công Nợ Ngân Hàng PVA-379-279

> Phiên sau đọc file này + spec `docs/hopdong/CLAUDE-cong-no.md` (bản chốt 02/10/2026) + `docs/hopdong/CLAUDE.md` mục 4.3 trước khi sửa `congno.html`. Ghi ngắn: đã làm gì, còn gì, chỗ nào khác spec, câu nào chờ anh Dũng chốt.

## Tình trạng chung (02/10/2026)

- App ở `congno.html` trong repo `Duyet-Chi` (cùng chỗ với `hopdong.html`, `thietbi.html`), chạy tại `https://vandung0802.github.io/Duyet-Chi/congno.html`. **Bản v10**. Kèm `manifest-congno.json`, `version-congno.txt`.
- **ĐỘC LẬP với app Hợp Đồng (anh Dũng chốt tối 02/10)**: mọi dữ liệu ở `congNo/…`; chỗ thông nhau DUY NHẤT là bảng thư bảo lãnh `hopdong/baoLanh` (`CAU_HINH.BAO_LANH`). Đừng thêm bất kỳ lần đọc/ghi nào khác vào `hopdong/…`.
- **Đã xong bước 1 → 7** của mục 1.2 (khung app + danh mục ngân hàng/công ty; hạn mức → khế ước → lãi suất → trả nợ → lịch trả; vay trung dài hạn theo món; thấu chi).
- Kiểm tra công thức: `node test-congno-tinhtoan.js` (68 phép tính, gồm cả khối 7 SINH_LICH và thấu chi; có khoản thử 2 lần giải ngân, 2 giai đoạn lãi suất, 1 lần trả trước hạn — khớp số tính tay).
- Chạy thử giao diện không cần đăng nhập thật: máy chủ thử + Firebase giả (`serve-congno.js`, `fb-stub.js`) nằm ngoài repo, trong thư mục làm việc của Claude; mất thì viết lại theo nhật ký phiên (stub mô phỏng `ref().on/get/update/push`, `orderByChild().equalTo()`, auth, luật "xoá chỉ giám đốc").

## Khác spec — làm theo thực tế app Hợp Đồng (anh Dũng dặn "dùng lại y nguyên, không viết cách mới")

| Spec ghi | Thực tế đã làm | Lý do |
|---|---|---|
| Repo riêng `cong-no-pva-379-279`, file `index.html` | `Duyet-Chi/congno.html` | App Hợp Đồng cũng nằm trong repo này; cùng tên miền nên đăng nhập một lần dùng cho cả bộ; luật Firebase tự deploy sẵn. Muốn tách repo sau thì chuyển 1 file. |
| Đăng nhập tên + PIN | Email + mật khẩu Firebase (chung tài khoản Duyệt Chi), quyền theo `duyetchi/userRoles` (`approved`, role `dung` = giám đốc) | Y nguyên `hopdong.html` (chốt 30/09). |
| Bảng dùng chung (`congTy`, `nguoiDung`, `yeuCauXoa`, `lichSu`, `nhacNho`, `baoLanh`) | Từ v4 **chỉ còn `hopdong/baoLanh`** dùng chung; `nguoiDung`, `yeuCauXoa`, `lichSu` ở `congNo/…`; ba công ty là hằng số `CONG_TY` | Anh Dũng chốt tối 02/10: hai app độc lập. |
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
- **v3 (02/10)**: bị thoát từ tab khác (Duyệt Chi / Hợp Đồng cùng origin, không qua `dangXuat()`) thì `onAuthStateChanged` tự tải lại trang khi `!user && _daKetNoi` — trước đó `_daKetNoi` còn `true` nên đăng nhập lại không nối lại dữ liệu (giống Hợp Đồng v14).

## Đã làm tối 02/10/2026 (bản v4 — tách độc lập khỏi app Hợp Đồng)

- Anh Dũng: "app công nợ và app hợp đồng là độc lập nhau, chỉ thông nhau mỗi 1 chỗ nhập bảo lãnh tạm ứng và thực hiện hợp đồng". Đã ghi vào đầu spec + mục 1.3, 1.6, quy tắc 15, và `docs/hopdong/CLAUDE.md` mục 1.6.
- `DL` thêm `nguoiDung`, `yeuCauXoa`, `lichSu` (đọc/ghi ở `congNo/…`); bỏ `DLC`, `dChung`, `GOC_CHUNG`, `CAU_HINH.APP`, trường `app` trong dòng lịch sử / yêu cầu xoá; bỏ đọc `hopdong/congTy` (thẻ "Ba công ty" hiện tên từ hằng số + số tài khoản, số hạn mức). Biến `baoLanhChung` ← `hopdong/baoLanh` (chỉ đọc, để tính hạn mức đã dùng).
- Luật: thêm `congNo/nguoiDung|yeuCauXoa|lichSu` (chép biểu thức của khối `hopdong`). Không sửa khối `hopdong`.
- Kiểm tra bằng Firebase giả: stub báo lỗi nếu app ghi bất kỳ gì vào `hopdong/`, và ghi lại mọi đường dẫn đã đọc → chỉ còn `congNo/*`, `duyetchi/userRoles/{uid}`, `duyetchi/meta/sites` (gợi ý tên công trình), `hopdong/baoLanh`.
- **Rác còn lại từ v1–v3** (nếu anh Dũng đã thử trên mạng thật trước v4): vài dòng trong `hopdong/lichSu`, `hopdong/yeuCauXoa` có `app:"congNo"` và trường `hopdong/nguoiDung/{uid}/app/congNo`. App Hợp Đồng lọc theo `app` nên không hiện; `lichSu` luật không cho xoá. Không chuyển sang `congNo/lichSu` (dữ liệu thử). Muốn dọn thì giám đốc xoá bằng Firebase Console.
- **Khi làm bước 6 (bảo lãnh)**: chỉ `tamUng` + `thucHienHopDong` ghi vào `hopdong/baoLanh` (giữ nguyên trường app Hợp Đồng đang đọc, thêm `nganHangId`, `phi`, `kyQuy`, `keToanTheoDoi`); dự thầu / bảo hành của app Công Nợ để ở `congNo/baoLanh` (hỏi anh Dũng có theo dõi bảo hành ở đây không); ký quỹ giảm trừ nhập tay, KHÔNG đọc `hopdong/thanhToan`; hạn mức đã dùng cộng cả hai bảng.

## Đã làm 02/10/2026 (bản v5 — đổi màu + bước 3: vay trung dài hạn)

- **Màu (v6, anh Dũng tự chọn bằng ảnh)**: **hồng đất `#E6B8B7`** cho đầu trang + nút (`--blue`); vì màu nhạt nên chữ trên nó dùng `--on-blue:#5a2322`, chữ nhấn / viền / thanh tiến độ dùng `--blue-dark:#8a3a38`; nền `#fbf6f6`. Dòng QUÁ HẠN thêm vạch đỏ bên trái cho khỏi lẫn với nền hồng. Tên biến CSS vẫn là `--blue*` như app Hợp Đồng. (v5 từng là xanh ngọc — anh Dũng đổi.)
- **Tab "Khoản vay"** (trước là "Hạn mức"): 2 nút chọn — 💳 Hạn mức ngắn hạn / 🏗 Vay trung dài hạn; chung ô tìm + lọc (`veVay` → `veHanMuc`, `veDaiHan`). Sau này Thấu chi, Thuê tài chính thêm nút chọn vào đây.
- **Vay trung dài hạn** = `congNo/khoanVay` với `loai:"daiHan"` (không có `hanMucId`, không lưu `ngayDenHan` — ngày kết thúc = kỳ gốc cuối). Trường thêm: `soTien`, `soKy`, `gocMoiKy`, `ngayTraDau`, `kyCachThang`, `ngayTraGocTrongThang` (tự lấy từ ngày kỳ đầu). Form `oDaiHan`, kiểm tra `kiemTraDaiHan`; chi tiết dùng chung `veCtKhoanVay` (biến `dh`).
- **Khối 7 `SINH_LICH`** (thuần, có test): `sinhLich` (tạo khoản là sinh đủ `kyTra`, lưu thật), `khopLich` (trừ dần từ kỳ cuối). Nút "Khớp lịch với dư nợ" (`khopLichKhoan`) hiện trong ô cảnh báo khi lịch lệch `dư nợ + chưa giải ngân` — dùng được cho cả khế ước.
- **Khoản cũ**: ô "số kỳ gốc đã trả" → ghi sẵn N dòng `traNo` (chứng từ "Đã trả trước khi nhập vào app") gắn N kỳ đầu, `daTra:true`.
- **Trả trước hạn + phí phạt**: ô tích + ô phí phạt chỉ hiện ở form trả nợ của vay dài hạn; cột Phí của bảng trả nợ = phí + phí phạt, dấu ⏩ = trước hạn.
- Giải ngân nhiều lần: tổng không vượt `soTien`; `tinhKhoan` có thêm `chuaGiaiNgan`, `phiPhatDaTra`, `soKyConLai`.
- Chi tiết ngân hàng có thêm bảng "Vay trung dài hạn tại đây". Lịch trả ghi `Vay DH <số HĐ>` / `KƯ <số>` (`tenKhoan`).
- Luật Firebase không đổi (vẫn nhánh `congNo/khoanVay`).

## Đã làm 02/10/2026 (bản v7 — bước 4: thấu chi)

- **Dữ liệu** `congNo/thauChi/{id}` (luật Firebase đã thêm nhánh `thauChi`): `nganHangId, congTyVay, congTyChiu, soHopDong, hanMuc, ngayHieuLuc, ngayHetHan, ngayNopHangThang, theoDoiTu, keToanTheoDoi, ghiChu` + bảng con `giaoDich`, `laiSuat`, `fileDinhKem`.
- **Giao dịch**: `loai: rut|nop`. Dòng nộp tách `soTien` (nộp GỐC — giảm số đang dùng), `lai`, `phi` (số thật nộp kèm), `kyNop` (gắn kỳ nộp hằng tháng → kỳ tự tắt). Bảng giao dịch có cột "Đang dùng" sau từng giao dịch, lãi thật cạnh lãi ước.
- **TINH_TOAN**: `thauChiNhuKhoan` (rút = giải ngân, nộp gốc = trả gốc → dùng lại `duNoGoc`, `laiUocTinh`, `cacKyLai`), `thauChiDangDung`, `lichNopThauChi`, `tinhThauChi`.
- **Giao diện**: nút chọn thứ ba "🔄 Thấu chi" trong tab Khoản vay (`veThauChi`); chi tiết `veCtThauChi` có tab Rút / nộp · Nộp hằng tháng · Lãi suất · File · Lịch sử. Lịch trả 30 ngày có thêm loại "Nộp thấu chi" (lọc được). Chi tiết ngân hàng có bảng "Thấu chi tại đây".
- Dọn chung: `veBangLaiSuat(duongCha, bảng)` + `formLaiSuat(duongCha, id)` dùng cho cả khoản vay lẫn thấu chi (bước 5 thuê tài chính dùng lại); `tatCaLichTra` mỗi dòng có `ten`, `mo`.
- **Chờ anh Dũng xác nhận**: "nộp tiền hằng tháng" tôi hiểu là nộp LÃI thấu chi (số phải nộp = lãi ước của kỳ). Nếu thực tế là phải nộp cả gốc về 0 mỗi tháng thì đổi `lichNopThauChi`.
- **Nhắc trước 5 ngày** (push) làm ở bước 8 — hiện mới hiện trên Lịch trả và tô vàng/đỏ.

## Đã làm 02/10/2026 (bản v8 — bước 5: thuê tài chính + sửa thấu chi theo anh Dũng)

- Anh Dũng dặn "làm hết các bước đi, không phải hỏi lại" → các bước 5–10 làm liền, chỗ chưa rõ tự quyết và ghi ở đây.
- **Thuê tài chính lưu CHUNG bảng `congNo/khoanVay` với `loai:"thueTaiChinh"`** (spec vẽ nhánh `thueTaiChinh` riêng nhưng "cùng cấu trúc khoanVay" → dùng chung để lịch trả, lãi suất, trả nợ, khớp lịch, trạng thái chạy y như vay dài hạn). Khác tên trường so với spec: công ty thuê = `congTyVay`, số tiền tài trợ = `soTien`, kỳ hạn = `soKy`. Thêm: `ngayKy, thietBi{ten,nhanHieu,model,soKhung,soMay,bienSo}, giaTriThietBi, tienTraTruoc, tienKyQuy, kyQuyDaHoan, giaMuaLai, noiDangO, congTyDangDung, baoHiem{hang,soHopDong,ngayHetHan}`. Lãi tính từ ngày ký; gốc + lãi trả cùng ngày hằng tháng (ngày của kỳ đầu). Form `oThueTC`, cảnh báo `canhBaoThueTC` (kết thúc thuê / hết hạn bảo hiểm ≤ 60 ngày). Nút chọn "🚜 Thuê tài chính" trong tab Khoản vay.
- **Thấu chi (anh Dũng trả lời 02/10)**: nộp hằng tháng là nộp lãi vay; "có khoản phải nộp cả gốc cả lãi, có khoản thì nộp mỗi lãi" → mỗi hạn mức có ô **"Hằng tháng phải nộp: Chỉ lãi / Cả gốc và lãi"** (`nopHangThang: lai|gocLai`). Loại `gocLai`: gốc phải nộp mỗi kỳ = toàn bộ số đang dùng cuối ngày đó. Kỳ không có gì phải nộp (không dùng, không lãi) thì không hiện.

## Đã làm 02/10/2026 (bản v9 — bước 6: bảo lãnh, phí, ký quỹ; thấu chi thành mục riêng)

- **Thanh dưới**: Khoản vay · Lịch trả · **Bảo lãnh** · Khác. Trang **Khác** có ô bấm mở các mục con: Ngân hàng, **Thấu chi** (anh Dũng: "hạn mức thấu chi có rất ít nên có thể để mục riêng" → bỏ khỏi hàng nút chọn của tab Khoản vay). `chuyenTab` sáng nút "Khác" khi đang ở mục con.
- **Thư bảo lãnh**: loại `tamUng`, `thucHienHopDong` ghi vào bảng CHUNG `hopdong/baoLanh` (trong mã là bảng `blChung`; `dRieng('blChung/…')` trả về đường dẫn thật) với `app:"congNo"`; loại `duThau`, `baoHanh` ghi vào `congNo/baoLanh`. `dsBaoLanh()` gộp hai nguồn (chỉ lấy 2 loại chung từ bảng chung — thư bảo hành của app Hợp Đồng KHÔNG hiện ở đây). Sửa thư chỉ ghi trường thay đổi → không mất trường app Hợp Đồng ghi (`hopDongId`, `tamUngId`…); ghi thêm `nganHangId`, `nganHang` (tên, để app Hợp Đồng hiện), `phi{hinhThuc,kyThuPhiThang,soTienMoiKy,daNopDen}`, `kyQuy{banDau,hoanTra,ngayHoanTra}`, `keToanTheoDoi`, `fileDinhKem`. Thư do app Hợp Đồng tạo: app này không xoá được.
- **Đọc thêm `hopdong/hopDong` (chỉ đọc, một lần, bằng `get`)** để hiện tên hợp đồng của thư và cho chọn hợp đồng khi nhập thư chung (có `hopDongId` thì thư mới hiện trong hợp đồng bên app Hợp Đồng). Đây là phần của chỗ thông nhau về bảo lãnh; ngoài `hopdong/baoLanh` + lần đọc này, app không đụng gì khác của `hopdong/`.
- **Phí** `congNo/phiBaoLanh/<id thư>/<id>` `{ngay,soTien,loai,kyTu,kyDen,chungTu}`; **giảm ký quỹ** `congNo/kyQuyGiamTru/<id thư>/<id>` `{ngay,soTien,ghiChu}` — nhập tay (không đọc `thanhToan.thuHoiTamUng`). `TINH_TOAN.kyQuyDangGiu`, `kyPhiToi` (thư thu phí định kỳ: kỳ tới = hết kỳ đã nộp gần nhất), `baoLanhHieuLuc`. Lịch trả có loại "Phí bảo lãnh".
- **Hạn mức đã dùng** cộng thư đang hiệu lực từ `dsBaoLanh()` (cùng ngân hàng + cùng công ty). Thư của app Hợp Đồng chưa gắn ngân hàng hiện "⚠️ chưa gắn ngân hàng" — bấm Sửa để chọn.
- Luật: thêm `congNo/baoLanh`, `phiBaoLanh/$baoLanhId/$id`, `kyQuyGiamTru/$baoLanhId/$id` (xoá cả nhóm khi xoá thư: chỉ giám đốc).

## Đã làm 02/10/2026 (bản v10 — bước 7: tài sản bảo đảm)

- Mục "🏠 Tài sản bảo đảm" trong trang Khác. `congNo/taiSanBaoDam/{id}`: `loai, moTa, chuSoHuu{loai,congTyId|tenCaNhan}, giaTriDinhGia, ngayDinhGia, ngayDinhGiaLai (trống = +12 tháng), nganHangId, hopDongTheChap{so,ngay}, ghiChu, keToanTheoDoi, fileDinhKem`.
- **Bảng nối để NGAY TRONG tài sản**: `taiSanBaoDam/{id}/baoDamCho/{id}` `{khoan:'hanMuc/<id>'|'khoanVay/<id>'|'thauChi/<id>', mucDichVay, khachHangGiaiNgan, ghiChu}` (spec vẽ bảng riêng `taiSanBaoDam_khoanVay`; để lồng cho gọn, tra ngược bằng `taiSanCua(khoa)`). Chi tiết hạn mức / khoản vay / thấu chi hiện thẻ "Tài sản bảo đảm cho khoản này".
- Định giá lại: tô vàng trước 40 ngày, đỏ khi quá hạn. Sổ tiết kiệm thế chấp cộng vào "tiền đang bị giam". Quyền đòi nợ: chỉ ghi chú tay.
- Luật: thêm `congNo/taiSanBaoDam`.
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
3. ~~Chỉ mục `app` cho `hopdong/lichSu`~~ — hết cần: từ v4 lịch sử nằm riêng ở `congNo/lichSu`.

## Việc tiếp theo (mục 1.2)

3. ~~Vay trung dài hạn theo món~~ — xong v5.
4. ~~Thấu chi~~ — xong v7.
5. ~~Thuê tài chính~~ — xong v8.
6. Bảo lãnh, phí, ký quỹ → 7. Tài sản bảo đảm → 8. Nhắc hạn + push → 9. Dashboard, biểu đồ, xuất Excel → 10. Nhập Excel.

## Chỗ đang lỗi

- Không có lỗi đã biết. Chưa thử trên iPhone thật (mới mô phỏng 375px). Chưa thử với Firebase thật (cần anh Dũng đăng nhập) — luật `congNo` mới chỉ kiểm tra cú pháp.
