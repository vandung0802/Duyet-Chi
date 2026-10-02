# BANGIAO — nhật ký bàn giao app Công Nợ Ngân Hàng PVA-379-279

> Phiên sau đọc file này + spec `docs/hopdong/CLAUDE-cong-no.md` (bản chốt 02/10/2026) + `docs/hopdong/CLAUDE.md` mục 4.3 trước khi sửa `congno.html`. Ghi ngắn: đã làm gì, còn gì, chỗ nào khác spec, câu nào chờ anh Dũng chốt.

## Tình trạng chung (02/10/2026)

- App ở `congno.html` trong repo `Duyet-Chi` (cùng chỗ với `hopdong.html`, `thietbi.html`), chạy tại `https://vandung0802.github.io/Duyet-Chi/congno.html`. **Bản v15**. Kèm `manifest-congno.json`, `version-congno.txt`.
- **ĐỘC LẬP với app Hợp Đồng (anh Dũng chốt tối 02/10)**: mọi dữ liệu ở `congNo/…`; chỗ thông nhau DUY NHẤT là bảng thư bảo lãnh `hopdong/baoLanh` (`CAU_HINH.BAO_LANH`). Đừng thêm bất kỳ lần đọc/ghi nào khác vào `hopdong/…`.
- **ĐÃ XONG CẢ 10 BƯỚC** của mục 1.2 (khung app + danh mục ngân hàng/công ty; hạn mức → khế ước → lãi suất → trả nợ → lịch trả; vay trung dài hạn theo món; thấu chi).
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
## Đã làm 02/10/2026 (bản v11 — bước 8: nhắc hạn + thông báo đẩy)

- **Khối `NHAC_HAN`** (thuần, nằm ngay sau `7. SINH_LICH`, có test): `BANG_NHAC` = bảng số ngày nhắc mục 1.4 (sửa một chỗ ở đây), `cacMoc(du, homNay)` tính mọi mốc đang trong thời gian nhắc THẲNG từ dữ liệu, `guiHomNay`, `soanThongBao`, `gopBaoLanh`. Mốc KHÔNG lưu vào Firebase.
- **Tự tắt**: mốc trả tiền (gốc, lãi, nộp thấu chi, phí bảo lãnh) lấy từ lịch "chưa trả" nên nhập dòng trả / nộp là hết. Mốc khác (hạn mức / thấu chi hết hạn, kết thúc thuê, bảo hiểm, định giá lại, bảo lãnh hết hạn): bấm **"Đã xong"** → `congNo/nhacNho/<khoá mốc>` `{daXong, nguoiXong, lucXong, tieuDe, loai, ngay}`; "Mở lại" = xoá dòng đó. Khoá mốc có ngày nên gia hạn (đổi ngày) là thành mốc mới.
- Quá hạn chưa xử lý: nhắc mỗi ngày. Mốc không phải trả tiền quá hạn > 30 ngày mà không ai bấm thì thôi nhắc (tránh thư bảo lãnh cũ nhắc mãi).
- **Màn "🔔 Nhắc hạn"** (mục trong trang Khác; số đỏ trên nút Khác = số việc đang nhắc + yêu cầu xoá với giám đốc).
- **Thông báo đẩy** y nguyên cách app Hợp Đồng: `sw-congno.js` (phạm vi `congno`), đăng ký lưu `congNo/pushSubs/{uid}/{khoá}`, khoá VAPID chung Duyệt Chi; `scripts/nhac-han-congno.js` + `.github/workflows/nhac-han-congno.yml` chạy 07:00 giờ VN (dùng lại `FIREBASE_TOKEN`), nạp công thức từ chính `congno.html`. Chạy thử: `node scripts/nhac-han-congno.js --thu` hoặc Actions → "Nhac han Cong no" → tích "chạy thử".
- **Người nhận**: giám đốc (vaiTro GD) + người được tích **"nhận mọi nhắc hạn"** ở trang Khác → Người dùng (`congNo/nguoiDung/{uid}/nhanTatCa` — anh Dũng tích cho Hiền, Ngọc) + kế toán theo dõi của khoản đó. Mỗi người tối đa 6 thông báo/lần, còn lại gộp.
- Luật: thêm `congNo/nhacNho`, `congNo/pushSubs` (chỉ ghi dưới uid của mình).
- **Chưa thử được**: bật thông báo thật trên điện thoại và lần chạy 07:00 đầu tiên (cần máy thật + dữ liệu thật).
## Đã làm 02/10/2026 (bản v12 — bước 9: Tổng quan, biểu đồ, xuất Excel)

- **Khối `TONG_HOP`** (thuần, có test, nằm giữa `7. SINH_LICH` và `NHAC_HAN`): `tinh(du, homNay, cty, theoChiu)` → tổng dư nợ gốc (vay + thuê + thấu chi đang dùng), phải trả 30 ngày (gốc + lãi ước + phí bảo lãnh, gồm cả phần quá hạn), hạn mức / đã dùng / còn trống (bỏ hạn mức đã hết hạn), lãi ước tháng này, tiền đang bị giam, đếm quá hạn / nhóm nợ ≥ 2, bảng theo ngân hàng; `duNoTheoThang`, `phaiTraTheoThang` cho 2 biểu đồ.
- **Tab "📊 Tổng quan"** là màn đầu: nút chọn Cả 3 / PVA / 379 / 279; chọn một công ty thì hiện thêm nút "theo công ty ĐỨNG TÊN ↔ THỰC CHỊU". 9 ô số (bấm vào ô để tới màn liên quan), lịch 30 ngày (12 dòng gần nhất), bảng theo ngân hàng, 2 biểu đồ Chart.js kèm bảng số (không có mạng thì vẫn có bảng số).
- **Xuất Excel ở mọi bảng**: `ganNutXuat()` tự gắn nút "📤 Xuất Excel" dưới mọi bảng (`.tw` có `<table>`) sau mỗi lần vẽ; `xuatBang` đổi ô số kiểu `1.200.000` thành số. Nút **"Xuất Excel tổng hợp"** ở cuối Tổng quan: 8 sheet (TongHop, TheoNganHang, KhoanVay, HanMuc, ThauChi, BaoLanh, TaiSanBaoDam, LichTra90Ngay) — dùng thay bản sao Google Sheets khi chưa có Apps Script.
- Thanh dưới giờ có 5 nút: Tổng quan · Khoản vay · Lịch trả · Bảo lãnh · Khác.
## Đã làm 02/10/2026 (bản v13 — bước 10: nhập từ Excel) — HẾT 10 BƯỚC

- Mục "📥 Nhập từ Excel" trong trang Khác. **File mẫu do app xuất** (`taiFileMau`, tên `mau-nhap-cong-no.xlsx`, không để file .xlsx trong repo vì `.gitignore` chặn): 6 sheet `NganHang, HanMuc, KheUoc, VayDaiHan, ThueTaiChinh, ThauChi` + `HuongDan`; cột khai trong `MAU_NHAP` (sửa một chỗ).
- `xuLyNhap` dựng gói ghi trong **bản nháp** của `DL` (dòng sau thấy dòng trước: ngân hàng → hạn mức → khế ước) và gọi ĐÚNG các hàm `KIEM_TRA` của form nhập tay → cùng luật, cùng cách sinh lịch. Hiện bảng xem trước từng sheet: ✅ sẽ thêm / ⏭ bỏ qua (đã có) / ❌ lỗi kèm lý do; bấm xác nhận mới ghi (một lần `update`, có lịch sử "nhập từ Excel"). Nhập lại cùng file không tạo đôi.
- Đọc được: ngày kiểu Excel hoặc chữ `dd/mm/yyyy`; tiền có dấu chấm; lãi suất `9,5` hoặc ô định dạng phần trăm.
- **Chưa có file theo dõi vay thật của kế toán** → mẫu theo cấu trúc app. Khi anh Dũng gửi file: chỉnh `MAU_NHAP` (tên cột, thứ tự) cho giống cách kế toán ghi. Bảo lãnh, tài sản bảo đảm: nhập tay.
## Đã làm 02/10/2026 (bản v14–v15 — lời nhắc rõ hơn; Google Sheets + Drive qua Apps Script)

- **Lời nhắc phải rõ** (anh Dũng gửi ảnh câu "Thêm ngân hàng ở mục Ngân hàng (trang Khác) trước": không biết thêm ở trang nào): thay bằng `thieuNganHang()` — hộp hướng dẫn 3 bước có nút **"🏦 Thêm ngân hàng ngay"** đưa thẳng tới form; dưới mọi ô chọn ngân hàng có dòng chỉ đường (`HUONG_DAN_NH`); màn Tổng quan lúc chưa có số liệu hiện 3 bước có link bấm được. **Quy ước từ nay: lời nhắc nào bảo người dùng sang chỗ khác thì phải ghi đủ đường đi (nút nào ở thanh dưới → ô nào) hoặc có nút bấm tới thẳng.**
- **`AppsScript_CongNo.gs`** (ở gốc repo): `khoiTao` (tạo file Sheets + thư mục Drive, lưu ID vào Script Properties), `doPost` với `dongBo` (ghi đè từng sheet), `taiFile` (cất vào Drive `Cong No PVA-379-279/<ngân hàng>/<hợp đồng>`, quyền ai có link đều xem, trả link), `thongTin`. **Kiểm tra người gọi bằng mã đăng nhập Firebase** (`accounts:lookup` + đọc `duyetchi/userRoles/<uid>` bằng chính mã đó) — không có khoá bí mật trong mã.
- **App (khối 22)**: `cacBangTongHop()` trả 18 bảng dùng chung cho Excel tổng hợp và Sheets (TongHop, TheoNganHang, KhoanVay, HanMuc, ThauChi, BaoLanh, TaiSanBaoDam, LichTra90Ngay, NganHang, GiaiNgan, LaiSuat, KyTra, TraNo, ThauChiGiaoDich, PhiBaoLanh, KyQuyGiamTru, NhacNho, LichSu). `goiAppsScript` = `fetch` POST `text/plain` (không dùng JSONP vì dữ liệu lớn). Tự đồng bộ 40 giây sau mỗi lần ghi (`henDongBo` trong `ghiNhieu`) + nút "Đồng bộ ngay" ở trang Khác. Nút "📤 Tải file lên" ở thẻ File đính kèm (≤ 20 MB) → ghi `fileDinhKem` `{ten, link, nguon:'drive', driveId}`.
- **Địa chỉ Apps Script**: `CAU_HINH.URL_APPS_SCRIPT` (để trống) hoặc giám đốc dán ở trang Khác → `congNo/meta/urlAppsScript` (luật: chỉ giám đốc ghi, phải bắt đầu `https://script.google.com/macros/s/`). App chỉ nhận đúng dạng `…/exec`.
- **CHƯA TRIỂN KHAI THẬT**: tiện ích Claude trong Chrome không kết nối nên Claude không tự đưa script lên được; anh Dũng làm theo `docs/congno/cai-dat-apps-script.md` (5 bước). Chưa thử được với Apps Script thật (mới thử bằng máy chủ giả) — đặc biệt là việc trình duyệt đọc được câu trả lời của Apps Script (CORS); nếu thẻ ở trang Khác báo lỗi sau khi dán địa chỉ thì xử lý ở đây.
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

## Việc tiếp theo

Cả 10 bước mục 1.2 đã xong (v13). Còn lại, theo thứ tự nên làm:

1. **Anh Dũng dùng thử với dữ liệu thật** (đăng nhập, nhập vài khoản, bật thông báo trên iPhone đã cài app ra màn hình chính) — mọi thứ mới chỉ được thử bằng Firebase giả trên máy. Xem tab Actions trên GitHub: "Dua luat Firebase len may chu" phải xanh; "Nhac han Cong no" chạy 07:00 mỗi sáng.
2. Trong trang Khác → Người dùng: tích "nhận mọi nhắc hạn" cho Hiền, Ngọc.
3. Nhận file Excel theo dõi vay của kế toán → chỉnh `MAU_NHAP` theo cột của file đó.
4. **Google Sheets + Drive**: mã đã xong (v15); chờ anh Dũng cài Apps Script theo `docs/congno/cai-dat-apps-script.md` rồi dán địa chỉ vào trang Khác.
5. `docs/congno/huong-dan-su-dung.md` cho kế toán (viết sau khi anh Dũng duyệt giao diện).
6. Các câu tự định ở trên (thấu chi, khớp lịch, kỳ trả gốc theo quý, bảo hành / dự thầu để riêng…) — anh Dũng thấy sai chỗ nào thì sửa chỗ đó.

## Chỗ đang lỗi

- Không có lỗi đã biết. Chưa thử trên iPhone thật (mới mô phỏng 375px). Chưa thử với Firebase thật — luật `congNo` mới kiểm tra cú pháp + mô phỏng; thông báo đẩy chưa thử trên máy thật.