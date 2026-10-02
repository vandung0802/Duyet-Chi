> **⚠️ CHỐT MỚI NHẤT 02/10/2026 (tối) — ĐÈ LÊN mọi chỗ nói "dùng chung" trong file này:** anh Dũng yêu cầu **app Công Nợ và app Hợp Đồng ĐỘC LẬP nhau, chỉ thông nhau MỘT chỗ: nhập bảo lãnh tạm ứng và bảo lãnh thực hiện hợp đồng** (bảng `hopdong/baoLanh`, hai loại `tamUng`, `thucHienHopDong` — nhập một nơi, hai app cùng thấy). Mọi thứ khác của app Công Nợ nằm riêng dưới `congNo/`: `nguoiDung`, `yeuCauXoa`, `lichSu` (và `nhacNho` khi làm bước 8); ba công ty là hằng số trong mã. App Công Nợ **không đọc, không ghi** nhánh nào khác của `hopdong/` (kể cả `thanhToan.thuHoiTamUng` — ký quỹ giảm trừ do kế toán nhập tay). Đăng nhập vẫn bằng tài khoản app Duyệt Chi. Chi tiết: mục 1.6 và `docs/congno/BANGIAO.md`.
>
> **Ghi chú 02/10/2026 (anh Dũng chốt, xem `CLAUDE.md` mục 1.6 của app Hợp đồng) — phần "nhánh dùng chung" dưới đây ĐÃ BỊ THAY bởi chốt mới phía trên:** các nhánh dùng chung `congTy`, `nguoiDung`, `baoLanh`, `nhacNho`, `yeuCauXoa`, `lichSu` nằm tại **`hopdong/...`** trên Firebase (không ở gốc); dữ liệu riêng của app Công Nợ ở `congNo/` (gốc). Đăng nhập bằng **email + mật khẩu Firebase Auth** như app Duyệt Chi, không dùng tên + PIN; `nguoiDung/{uid}` khoá theo uid Firebase. Bản sao file này để trong repo Duyet-Chi chỉ để tham khảo; bản chính ở repo `cong-no-pva-379-279`.

# CLAUDE.md — App "Công Nợ Ngân Hàng PVA-379-279"

> File này là bản hướng dẫn cho AI agent (Claude Code) đóng vai **Chuyên gia phát triển phần mềm kiêm Quản lý công nợ** khi làm việc trong kho mã này. Agent đọc file này đầu tiên ở mỗi phiên. Người trong công ty cũng đọc được: mỗi mục đều có phần giải thích in nghiêng cho người không làm kỹ thuật.
>
> Bản này chốt ngày 02/10/2026 sau buổi phỏng vấn anh Dũng. App này là **app thứ tư** trong bộ công cụ của công ty, sau Duyệt Chi, Tiến độ và Hợp Đồng; nó **dùng chung Firebase và đăng nhập với app Hợp Đồng**, nên ai sửa app này phải đọc cả `CLAUDE.md` của repo `hop-dong-pva-379-279`.

---

## 1. PROJECT CONTEXT — Bối cảnh dự án

*Mục này trả lời câu hỏi: app này làm gì, cho ai, và những quyết định đã chốt mà agent không được tự ý đổi.*

### 1.1. Mục đích

App theo dõi toàn bộ **nợ ngân hàng và thuê tài chính** của ba công ty PVA, 379, 279: hạn mức tín dụng, từng khế ước nhận nợ, vay trung dài hạn, thấu chi, thuê tài chính thiết bị, bảo lãnh ngân hàng, ký quỹ, tài sản thế chấp. Mở app lên là biết ngay: đang nợ bao nhiêu, trong 30 ngày tới phải trả ngày nào, gốc bao nhiêu, lãi khoảng bao nhiêu, ở ngân hàng nào còn trống hạn mức, và tiền đang bị "giam" ở đâu.

App **không** theo dõi công nợ nhà cung cấp, thầu phụ hay vay ngoài ngân hàng. Chỉ ngân hàng và công ty cho thuê tài chính.

### 1.2. Trạng thái hiện tại

**App mới, chưa có mã.** Viết từ đầu theo file này, kế thừa cách tổ chức mã của app Hợp Đồng (một file `index.html`, cùng cách đăng nhập, cùng cách gọi Apps Script, cùng cách gửi thông báo đẩy). Trình tự làm, mỗi bước xong chạy được mới sang bước sau:

1. Khung app: đăng nhập, kết nối Firebase, danh mục ngân hàng và công ty
2. Hạn mức tín dụng → khế ước → lịch sử lãi suất → trả nợ → lịch trả
3. Vay trung dài hạn theo món (sinh lịch tự động)
4. Thấu chi
5. Thuê tài chính thiết bị
6. Bảo lãnh, phí bảo lãnh, ký quỹ (dùng chung với app Hợp Đồng)
7. Tài sản bảo đảm
8. Nhắc hạn và thông báo đẩy
9. Dashboard, biểu đồ, xuất Excel
10. Nhập từ Excel

Dữ liệu ban đầu: quan hệ với khoảng **7–10 ngân hàng và công ty cho thuê tài chính**. Kế toán **có file Excel theo dõi vay riêng** (chưa gửi vào repo). Khi nhận được file, agent đọc cấu trúc cột rồi **thiết kế file mẫu `mau/mau-nhap-cong-no.xlsx` theo đúng cách kế toán đang ghi**, để nhập được với ít chuyển đổi nhất; chưa có file thì làm mẫu theo cấu trúc app ở mục 4.3.

### 1.3. Nền tảng và công nghệ (đã chốt)

| Hạng mục | Quyết định | Lý do |
|---|---|---|
| Kiểu ứng dụng | Web app, cài lên màn hình chính điện thoại (PWA) | Dùng trên máy tính và iPhone, không cài gì thêm |
| Mã nguồn | **Một file `index.html`** | Cùng cách với ba app trước |
| Đưa lên mạng | GitHub Pages, repo `vandung0802/cong-no-pva-379-279` | Miễn phí, đã quen |
| Kho dữ liệu | Cùng Firebase project với Duyệt Chi / Hợp Đồng, nhưng *(chốt 02/10 tối)* **toàn bộ dữ liệu của app nằm riêng dưới `congNo/`** (kể cả `nguoiDung`, `yeuCauXoa`, `lichSu`, `nhacNho`). **Chỉ dùng chung với app Hợp Đồng một bảng: `hopdong/baoLanh`** (bảo lãnh tạm ứng + thực hiện hợp đồng) | Hai app độc lập; bảo lãnh nhập một nơi, cả hai app cùng thấy |
| Đăng nhập | Email + mật khẩu Firebase Auth của app Duyệt Chi (quyền theo `duyetchi/userRoles`); danh sách người dùng của app ghi riêng ở `congNo/nguoiDung` | Một người một mật khẩu cho cả bộ app |
| Bản sao Google Sheets | Đồng bộ một chiều Firebase → Google Sheets qua Apps Script (JSONP) | Kế toán quen xem bảng |
| File đính kèm | Google Drive của vandung0802@gmail.com, link ai cũng tải được; OneDrive chỉ dán link | Như app Hợp Đồng |
| Thông báo đẩy | Web push, hiện trên màn hình khóa điện thoại | Như Duyệt Chi; iPhone phải cài app lên màn hình chính |
| Chạy nhắc định kỳ | GitHub Actions 07:00 giờ Việt Nam mỗi ngày | Đơn giản, không tốn tiền |
| Xuất báo cáo | Nút "Xuất Excel" ở **mọi bảng** | Chỉ cần Excel |

### 1.4. Nghiệp vụ đã chốt

Đây là phần quan trọng nhất. Agent không được tự suy diễn khác đi.

**Ba công ty và vay chéo**

- PVA — Công ty CP Xây lắp công trình Phúc Vinh An; 379 — Công ty CP 379 Việt Nam; 279 — Công ty TNHH Đầu tư và Xây lắp 279. Danh mục `congTy` dùng chung với app Hợp Đồng.
- Có trường hợp **công ty này đứng tên vay nhưng công ty khác dùng tiền hoặc trả nợ**, và tài sản của công ty này thế chấp cho công ty kia vay. Vì vậy mỗi khoản vay có hai trường tách riêng: `congTyVay` (đứng tên trên hợp đồng tín dụng) và `congTyChiu` (thực dùng tiền, thực trả). Dashboard cho chọn xem theo **cả hai cách**.

**Ngân hàng / công ty cho thuê tài chính** — mỗi đơn vị lưu: tên, chi nhánh, loại (ngân hàng / cho thuê tài chính), cán bộ tín dụng phụ trách (tên, số điện thoại), **danh sách nhiều số tài khoản** của từng công ty tại đó (vì mỗi công trình có thể phải mở tài khoản riêng theo yêu cầu thế chấp dòng tiền). Không cần xếp hạng tín nhiệm hay ngày ký hợp đồng khung.

**Hạn mức tín dụng** (vay ngắn hạn xoay vòng)

- Một **hợp đồng hạn mức** (ngân hàng, công ty, số hợp đồng, số tiền hạn mức, ngày hiệu lực, ngày hết hạn, file) → bên dưới nhiều **khế ước nhận nợ**.
- Mỗi khế ước: số khế ước, ngày giải ngân, số tiền, thời hạn (6, 9 tháng… tùy khế ước), ngày đến hạn, **lãi suất riêng**, ngày trả lãi trong tháng, **mục đích rút vốn** (trả cho công trình nào, khách hàng/nhà cung cấp nào), kế toán theo dõi, file.
- Hạn mức cũng có thể cấp cho bảo lãnh. Trường `hanMucBaoLanhRieng`: nếu ngân hàng tách hạn mức bảo lãnh riêng thì nhập số riêng; nếu dùng chung thì bảo lãnh đang hiệu lực được cộng vào "đã dùng" của hạn mức vay.
- Hạn mức hết hạn phải ký lại: **nhắc trước 60 ngày**.

**Vay trung / dài hạn theo món** (mua máy, xe, đầu tư)

- Lưu: ngân hàng, công ty vay, công ty chịu, số hợp đồng, số tiền, ngày giải ngân (có thể nhiều lần), số kỳ, số tiền gốc mỗi kỳ, ngày trả đầu tiên, ngày trả gốc và ngày trả lãi trong tháng, mục đích, kế toán theo dõi, file.
- **App tự sinh lịch trả gốc** từ số kỳ + số tiền mỗi kỳ + ngày trả đầu tiên; kế toán **sửa tay** từng kỳ nếu bảng ngân hàng khác. Lịch sinh ra lưu thật vào Firebase (bảng `kyTra`), không tính lại mỗi lần mở.
- **Trả trước hạn** và **phí phạt trả trước** chỉ theo dõi cho món dài hạn; ngắn hạn không bị phạt nên không có trường này.

**Lãi suất** — áp dụng cho mọi loại (khế ước, dài hạn, thấu chi, thuê tài chính)

- Mỗi khoản có **lịch sử lãi suất**: từ ngày nào, lãi suất bao nhiêu %/năm, ghi chú (cố định / thả nổi = cơ sở + biên độ). Ngân hàng báo đổi thì kế toán **thêm một dòng mới**, không sửa dòng cũ.
- App tính **lãi ước tính theo ngày** từ lịch sử lãi suất để biết "khoảng bao nhiêu"; **lãi thật** do kế toán nhập khi trả theo thông báo của ngân hàng. Dashboard hiện cả hai cột cạnh nhau, và chênh lệch nếu có.
- Trả lãi **hằng tháng** vào ngày cố định của từng khoản. Không có khoản nào trả lãi theo quý.

**Trả nợ thực tế** — mỗi lần trả, kế toán nhập: ngày, khoản vay, gốc, lãi, phí, trả trước hạn (có/không, phí phạt), chứng từ. Dư nợ gốc = tổng giải ngân − tổng gốc đã trả. Nhập dòng trả nợ cho kỳ nào thì nhắc hạn của kỳ đó tự tắt, không phải bấm "Đã xong" riêng.

**Thấu chi**

- Lưu hạn mức thấu chi, ngân hàng, công ty, lãi suất, ngày hết hạn hạn mức, ngày phải nộp tiền hằng tháng.
- **Ghi từng lần rút và nộp** (ngày, số tiền, nội dung). Số đang dùng = Σ rút − Σ nộp.
- Nhắc nộp tiền hằng tháng **trước 5 ngày**.

**Thuê tài chính thiết bị**

- Lưu: công ty cho thuê, số hợp đồng, ngày ký, công ty thuê, công ty chịu, **thiết bị** (tên, nhãn hiệu, model, số khung/số máy, biển số), giá trị thiết bị, tiền trả trước (ký quỹ, thanh toán ban đầu), số tiền tài trợ, kỳ hạn (tháng), ngày trả hằng tháng, giá mua lại cuối kỳ, lãi suất (có lịch sử), **nơi thiết bị đang ở** và **công ty đang dùng**, bảo hiểm thiết bị (hãng, số hợp đồng, ngày hết hạn), kế toán theo dõi, file.
- Tiền thuê mỗi kỳ **tách gốc và lãi** như vay ngân hàng (lãi thả nổi). Lịch trả gốc sinh tự động như vay dài hạn.
- Phí một lần ban đầu (phí quản lý, đăng kiểm…) không theo dõi.
- Nhắc **kết thúc thuê trước 60 ngày** (làm thủ tục mua lại, sang tên, đăng ký); nhắc **hết hạn bảo hiểm trước 60 ngày**.

**Bảo lãnh ngân hàng** — nhánh `baoLanh` **dùng chung với app Hợp Đồng**

- Theo dõi **đủ bốn loại**: dự thầu, thực hiện hợp đồng, tạm ứng, bảo hành. Mỗi thư: ngân hàng, công ty, loại, số thư, gói thầu / hợp đồng (`hopDongId` nếu đã có hợp đồng trong app Hợp Đồng, nếu chưa — bảo lãnh dự thầu — thì ghi tên gói thầu), số tiền, ngày phát hành, ngày hết hạn, đã gia hạn, file.
- **Nhập ở app nào cũng được, app kia thấy ngay** vì cùng một nhánh dữ liệu. Thực tế: kế toán nhập ở app Công Nợ, phòng kế hoạch xem ở app Hợp Đồng.
- **Phí bảo lãnh**: bảo lãnh thực hiện HĐ thu **một lần** khi phát hành, đến hạn thư thì nhắc **phí gia hạn**; bảo lãnh tạm ứng thu định kỳ **1 hoặc 3 tháng tùy ngân hàng** (trường `kyThuPhiThang`). Mỗi lần nộp phí ghi một dòng.
- **Ký quỹ bảo lãnh**: mỗi thư có số tiền ký quỹ ban đầu. Với bảo lãnh tạm ứng, **ký quỹ giảm dần theo từng lần thu hồi tạm ứng** trong hồ sơ thanh toán: khi app Hợp Đồng nhập `thanhToan.thuHoiTamUng`, app Công Nợ đọc và ghi một dòng giảm ký quỹ tương ứng (kế toán xác nhận số tiền giảm thật theo ngân hàng, vì tỷ lệ có thể khác). Ký quỹ đang giữ = ban đầu − Σ giảm trừ − hoàn trả khi thư hết hiệu lực.
- Nhắc **bảo lãnh hết hạn / phí gia hạn trước 15 ngày**; nhắc **phí bảo lãnh tạm ứng kỳ tiếp trước 10 ngày**.

**Tài sản bảo đảm (thế chấp)**

- Mỗi tài sản: loại (đất, nhà, xe, máy móc, quyền đòi nợ, sổ tiết kiệm, khác), mô tả, **chủ sở hữu** (một trong ba công ty, hoặc **tên cá nhân**), giá trị định giá, ngày định giá, ngân hàng đang nhận thế chấp, hợp đồng thế chấp (số, ngày, file).
- Một tài sản bảo đảm cho **nhiều khoản vay** cùng ngân hàng; một khoản vay có thể có nhiều tài sản. Bảng nối `taiSanBaoDam_khoanVay` ghi cặp (tài sản, khoản vay) kèm mục đích vay và khách hàng được giải ngân, để tra ngược "tài sản này đang gánh những khoản nào".
- Thế chấp **quyền đòi nợ** (dòng tiền hợp đồng): chỉ **ghi chú tay** số hợp đồng, **không liên kết** với app Hợp Đồng.
- Sổ tiết kiệm thế chấp tính vào "tiền đang bị giam".
- Nhắc **định giá lại trước 40 ngày** (ngày định giá + 12 tháng, hoặc ngày kế toán nhập).

**Trạng thái khoản vay / khế ước / hợp đồng thuê** — app tự đặt, không nhập tay (trừ `coCauLai` và nhóm nợ):

- `dangVay` — còn dư nợ, chưa có kỳ nào quá hạn
- `sapDenHan` — có kỳ trả trong 7 ngày tới
- `quaHan` — quá ngày trả mà chưa có dòng trả nợ
- `daTatToan` — dư nợ = 0 và không còn kỳ nào
- `coCauLai` — được gia hạn / cơ cấu nợ (kế toán đặt tay, kèm ngày và file)
- Cờ **`nhomNo`** (1–5) do kế toán nhập theo thông báo CIC / ngân hàng. Nhóm ≥ 2 hiện màu cảnh báo trên dashboard.

**Nhắc hạn** — bảng số ngày nhắc trước (hằng số trong `CAU_HINH`):

| Mốc | Nhắc trước | Lặp |
|---|---|---|
| Trả lãi hằng tháng (mọi loại) | 5 ngày | nhắc lại ngày hôm trước và đúng ngày |
| Trả gốc (khế ước đến hạn, kỳ dài hạn, kỳ thuê) | 10 ngày | 5 ngày, hôm trước, đúng ngày |
| Nộp tiền thấu chi hằng tháng | 5 ngày | hôm trước, đúng ngày |
| Hạn mức tín dụng hết hạn | 60 ngày | mỗi 10 ngày |
| Kết thúc thuê tài chính | 60 ngày | mỗi 10 ngày |
| Định giá lại tài sản | 40 ngày | mỗi 10 ngày |
| Hết hạn bảo hiểm thiết bị thuê | 60 ngày | mỗi 10 ngày |
| Bảo lãnh hết hạn / phí gia hạn | 15 ngày | mỗi 5 ngày |
| Phí bảo lãnh tạm ứng kỳ tiếp | 10 ngày | mỗi 5 ngày |

- Nhắc bằng thông báo đẩy lên màn hình điện thoại. Mốc trả tiền **tự tắt khi kế toán nhập dòng trả nợ / nộp phí** cho kỳ đó; mốc còn lại tắt khi ấn "Đã xong" (ghi ai, lúc nào). Quá hạn mà chưa tắt thì **vẫn nhắc mỗi ngày** và đổi sang trạng thái `quaHan`.
- **Người nhận**: anh Dũng, Hiền, Ngọc, và **kế toán theo dõi** của khoản đó (trường `keToanTheoDoi` trên từng khoản vay / thuê / bảo lãnh / tài sản).

**Người dùng và quyền** — như app Hợp Đồng: danh sách và PIN dùng chung; ai có trong app đều tạo/sửa được; **chỉ giám đốc được xóa**, người khác bấm "Yêu cầu xóa"; không có bước duyệt; ai cũng thấy cả ba công ty; mọi thay đổi ghi `lichSu`.

**Dashboard (màn hình đầu tiên)**

- Bộ lọc: công ty PVA / 379 / 279 / Cả 3, và nút chuyển **"theo công ty đứng tên" ↔ "theo công ty thực chịu"**. Khi xem "Cả 3" hai cách cho cùng kết quả.
- **Năm ô số to**: tổng dư nợ gốc; phải trả 30 ngày tới (gốc + lãi ước); hạn mức đã dùng / còn trống (tổng các ngân hàng); lãi ước tính tháng này; **tổng tiền đang bị giam** (ký quỹ + sổ tiết kiệm thế chấp + ký quỹ thuê tài chính).
- Ô đếm: số khoản `quaHan`, số khoản nhóm nợ ≥ 2, số việc đang nhắc.
- **Lịch trả nợ 30 ngày tới** theo ngày: ngày, ngân hàng, khoản, loại (gốc/lãi/phí/thấu chi), số gốc, lãi ước, trạng thái, kế toán theo dõi.
- **Bảng theo ngân hàng**: hạn mức, dư nợ vay, thấu chi đang dùng, bảo lãnh đang hiệu lực, ký quỹ, còn trống.
- **Biểu đồ**: dư nợ gốc theo tháng 12 tháng qua; gốc + lãi ước phải trả 12 tháng tới.
- Nút "Xuất Excel" ở mọi bảng.

### 1.5. Công thức tính (agent phải dùng đúng, không tự chế)

```
duNoGoc(khoan)        = Σ giaiNgan.soTien − Σ traNo.goc
thauChiDangDung       = Σ thauChiGiaoDich.rut − Σ thauChiGiaoDich.nop
hanMucDaDung(hanMuc)  = Σ duNoGoc các khế ước thuộc hạn mức
                        + (bảo lãnh đang hiệu lực CÙNG ngân hàng VÀ CÙNG công ty với hạn mức,
                           nếu hanMucBaoLanhRieng = false)      ← chốt 02/10: bảo lãnh của công ty nào
                                                                   thì tính vào hạn mức của công ty đó
hanMucConTrong        = hanMuc.soTien − hanMucDaDung
kyQuyDangGiu(thu)     = kyQuy.banDau − Σ kyQuyGiamTru.soTien − kyQuy.hoanTra
tienDangBiGiam        = Σ kyQuyDangGiu + Σ taiSanBaoDam(loai = soTietKiem).giaTri
                        + Σ thueTaiChinh.tienKyQuy chưa hoàn

laiUocTinh(khoan, tuNgay, denNgay)
    = Σ qua từng giai đoạn lãi suất chồng lên [tuNgay, denNgay]:
        duNoGoc tại đầu giai đoạn × laiSuatNam / 365 × soNgayTrongGiaiDoan
    (dư nợ thay đổi khi có giải ngân hoặc trả gốc trong kỳ thì tách thêm giai đoạn)
    Dùng 365 ngày/năm. Đây là số ƯỚC TÍNH; số thật lấy từ traNo.lai.
    Đếm ngày (chốt 02/10): ngày giải ngân CÓ tính lãi, ngày trả gốc thì phần đã trả KHÔNG tính lãi nữa.

phaiTra30Ngay         = Σ kyTra.goc (hạn trong 30 ngày, chưa trả)
                        + Σ laiUocTinh đến ngày trả lãi trong 30 ngày
                        + Σ phiBaoLanh kỳ tới trong 30 ngày
                        + Σ thauChi.nopHangThang trong 30 ngày
laiUocThangNay        = Σ laiUocTinh(khoan, đầu tháng, cuối tháng) mọi khoản còn dư nợ

trangThai(khoan)
    = daTatToan  nếu duNoGoc = 0 và không còn kyTra chưa trả
    = coCauLai   nếu kế toán đặt tay
    = quaHan     nếu có kyTra.ngay < hôm nay và chưa có traNo khớp
    = sapDenHan  nếu có kyTra.ngay trong 7 ngày tới
    = dangVay    còn lại

"Cả 3 công ty"        = Σ mọi khoản, không trừ gì (vay chéo không bị tính hai lần
                        vì một khoản chỉ có một congTyVay và một congTyChiu)
```

Tiền: **số nguyên VND**. Lãi suất: số thập phân %/năm (ví dụ `9.5`). Ngày: `YYYY-MM-DD`.

### 1.6. Các điểm đã chốt thêm ngày 02/10/2026

- Quyền đòi nợ: ghi chú tay, không liên kết app Hợp Đồng (app đó chủ yếu phòng kế hoạch dùng).
- Bảo lãnh: nhập ở app Công Nợ, tự hiện bên app Hợp Đồng (và ngược lại) nhờ dùng chung nhánh `baoLanh`.
- Thông tin ngân hàng: mức cơ bản, không xếp hạng tín nhiệm.
- Có file Excel theo dõi vay của kế toán → đưa vào `docs/` khi có, file mẫu nhập liệu thiết kế theo cột của file đó.
- Làm hết trong một lần theo thứ tự mục 1.2.

Chốt thêm chiều 02/10/2026 (sau khi xong bước 1 + 2, anh Dũng trả lời 3 câu hỏi):

- **Bảo lãnh dùng chung hạn mức**: bảo lãnh của công ty nào thì tính vào hạn mức của công ty đó tại ngân hàng đó (khớp `nganHangId` + `congTyId` của thư với `nganHangId` + `congTyVay` của hạn mức). Không cộng một thư vào hạn mức của công ty khác cùng ngân hàng.
- **File đính kèm**: giai đoạn đầu **dán link** Google Drive / OneDrive (như app Hợp Đồng); tải lên tự động làm khi có Apps Script.
- **Lãi ước tính**: ngày giải ngân có tính lãi, ngày trả gốc không; 365 ngày/năm. Khế ước cũ nhập vào app thì các kỳ lãi **trước ngày nhập** coi như đã trả (trường `khoanVay.theoDoiLaiTu`), không báo quá hạn oan.
- **Thực tế triển khai** (theo app Hợp Đồng): mã ở `Duyet-Chi/congno.html`; đăng nhập email + mật khẩu Firebase; bảng dùng chung nằm dưới `hopdong/…`; dữ liệu riêng dưới `congNo/…`. Chi tiết: `docs/congno/BANGIAO.md`.

Chốt tối 02/10/2026 — **hai app độc lập** (anh Dũng: "app công nợ và app hợp đồng là độc lập nhau, chỉ thông nhau mỗi 1 chỗ nhập bảo lãnh tạm ứng và thực hiện hợp đồng"):

- Bảng dùng chung duy nhất: `hopdong/baoLanh`, hai loại `tamUng` và `thucHienHopDong`. Thêm trường được, không đổi tên / xoá trường đang có (app kia đang đọc).
- `nguoiDung`, `yeuCauXoa`, `lichSu`, `nhacNho` của app Công Nợ nằm ở `congNo/…`; không còn trường `app`. Danh mục ba công ty là hằng số trong mã (không đọc `hopdong/congTy`).
- Không đọc `thanhToan.thuHoiTamUng` của app Hợp Đồng: ký quỹ bảo lãnh tạm ứng giảm dần do **kế toán nhập tay** từng lần.
- Bảo lãnh dự thầu, bảo lãnh bảo hành trong app Công Nợ (nếu theo dõi) để riêng ở `congNo/` — chốt chi tiết khi làm bước 6.

Ghi thêm khi làm bước 3 (vay trung dài hạn, bản v5) — Claude tự định, anh Dũng xem sai thì sửa:

- **Kỳ trả gốc không nhất thiết hằng tháng**: thêm trường `kyCachThang` (1 / 3 / 6 / 12 tháng). Lãi vẫn trả hằng tháng.
- **Sinh lịch**: kỳ 1 vào `ngayTraDau`, các kỳ sau cùng ngày đó trong tháng; `gocMoiKy` bỏ trống = chia đều; kỳ cuối = phần còn lại. Lịch sinh trên **số tiền vay theo hợp đồng** (`soTien`), kể cả phần chưa giải ngân.
- **Khoản vay cũ nhập lại**: ô "số kỳ gốc đã trả" → app ghi sẵn mỗi kỳ đã trả một dòng `traNo` gắn đúng kỳ, để dư nợ đúng và không báo quá hạn oan.
- **Trả trước hạn** (`traNo.traTruocHan`, `phiPhat`): gốc trả trước không gắn kỳ; nút **"Khớp lịch với dư nợ"** trừ dần từ các kỳ cuối (kỳ hết gốc thì bỏ), có hỏi lại và ghi lịch sử. Ngân hàng tính khác thì kế toán sửa tay từng kỳ.

Ghi thêm khi làm bước 4 (thấu chi, bản v7) — Claude tự định, anh Dũng xem sai thì sửa:

- **"Nộp tiền hằng tháng" hiểu là nộp LÃI thấu chi**: đến ngày N mỗi tháng phải nộp, số phải nộp = lãi ước tính của kỳ (số đang dùng từng ngày × lãi suất / 365). Tháng nào không dùng thấu chi thì không nhắc.
- **Dòng nộp tách gốc và lãi** (giống trả nợ khoản vay): `soTien` = nộp gốc, làm giảm số đang dùng — công thức `thauChiDangDung = Σ rút − Σ nộp` giữ nguyên; `lai`, `phi` = số thật nộp kèm, không làm giảm số đang dùng. Kỳ nộp tự tắt khi có dòng nộp gắn kỳ (`kyNop`).
- Rút vượt hạn mức: hỏi lại rồi vẫn cho lưu (số liệu thật có thể đã vượt). Nộp gốc nhiều hơn số đang dùng: không cho.
- Hạn mức thấu chi sắp hết hạn: báo trước 60 ngày như hạn mức tín dụng.

Ghi thêm khi làm bước 5 → 10 (bản v8 → v13, anh Dũng dặn "làm hết các bước, không phải hỏi lại") — chi tiết ở `docs/congno/BANGIAO.md`:

- **Thấu chi** (anh Dũng trả lời): nộp hằng tháng là nộp lãi vay; có hạn mức phải nộp cả gốc cả lãi, có hạn mức chỉ nộp lãi → trường `thauChi.nopHangThang` (`lai` | `gocLai`). Thấu chi ít nên để **mục riêng** trong trang Khác.
- **Thuê tài chính** lưu chung bảng `khoanVay` với `loai:"thueTaiChinh"` (không tách nhánh `thueTaiChinh`); công ty thuê = `congTyVay`, số tiền tài trợ = `soTien`, kỳ hạn = `soKy`.
- **Bảo lãnh**: tạm ứng + thực hiện hợp đồng ở bảng chung `hopdong/baoLanh`; dự thầu + bảo hành của app này ở `congNo/baoLanh`; phí ở `congNo/phiBaoLanh/<id thư>`, giảm ký quỹ ở `congNo/kyQuyGiamTru/<id thư>` (nhập tay). App đọc thêm `hopdong/hopDong` (chỉ đọc) để chọn / hiện tên hợp đồng của thư.
- **Tài sản bảo đảm**: bảng nối để lồng trong tài sản (`taiSanBaoDam/{id}/baoDamCho/{id}`), không tách bảng `taiSanBaoDam_khoanVay`.
- **Nhắc hạn**: mốc tính thẳng từ dữ liệu, không lưu; `congNo/nhacNho/<khoá mốc>` chỉ lưu ai bấm "Đã xong". Người nhận mọi nhắc: giám đốc + người được tích `nguoiDung/{uid}/nhanTatCa`.
- **Google Sheets / Drive (Apps Script)**: chưa làm; thay bằng "Xuất Excel tổng hợp" và dán link.

Hiện **không còn việc nào chờ chốt**. Phát sinh mới thì ghi vào đây trước, sửa mã sau.

---

## 2. ABOUT US — Về chúng tôi

*Mục này để agent hiểu mình đang làm việc cho ai, giọng điệu và cách làm việc mong muốn.*

**Người ra quyết định:** anh Võ Văn Dũng, Giám đốc Công ty CP Xây lắp công trình Phúc Vinh An (PVA 379), Vinh, Nghệ An. Kỹ sư cầu đường, làm giám đốc từ 2009, không phải lập trình viên. Anh sửa mã bằng Claude Code với câu lệnh tiếng Việt tự nhiên, nên mã phải dễ đọc, tên biến tiếng Việt không dấu, chú thích tiếng Việt có dấu.

**Ba công ty:** PVA, 379, 279 — cùng một bộ máy điều hành và kế toán, làm cầu đường, hộ lan, cọc khoan nhồi khắp cả nước. Vay vốn ở nhiều ngân hàng, thuê tài chính máy móc, và thường xuyên phải phát hành bảo lãnh để dự thầu và nhận tạm ứng. Tiền vay xoay giữa ba công ty, nên "ai đứng tên" và "ai thực trả" không phải lúc nào cũng là một.

**Người dùng hằng ngày:** kế toán nhập số liệu (mỗi khoản có một kế toán theo dõi); anh Dũng, Hiền và Ngọc nhận mọi thông báo nhắc; xem chủ yếu trên **iPhone**.

**Bộ app đã có, cùng cách làm:**

- **Duyệt Chi** (`github.com/vandung0802/Duyet-Chi`) — gốc của cách đăng nhập tên + PIN, gọi Apps Script, web push.
- **Tiến độ PVA-379** (`github.com/vandung0802/tien-do-pva-379`) — bản điện thoại chữ 16px, nút 48px.
- **Hợp Đồng PVA-379-279** (`github.com/vandung0802/hop-dong-pva-379-279`) — **app anh em trực tiếp**: cùng Firebase, cùng người dùng, chung bảng bảo lãnh. Sửa gì ở nhánh dùng chung phải xem ảnh hưởng cả hai app.

**Điều anh Dũng coi trọng nhất:** nợ ngân hàng sai ngày là bị nhảy nhóm nợ, ảnh hưởng cả ba công ty đi vay sau này. App phải nhắc đúng ngày, tính dư nợ đúng, và ghi lại ai sửa gì. Lãi ước tính là để biết khoảng bao nhiêu mà chuẩn bị tiền; số thật luôn theo ngân hàng.

**Cách anh Dũng muốn được trả lời:** ngắn gọn khi việc gấp, phân tích kỹ khi việc lớn. Tiếng Việt, ít thuật ngữ, có thuật ngữ thì giải thích bằng ví dụ. Đề xuất phải có lý do, không thử sai.

---

## 3. RULES — Quy tắc làm việc

*Những điều agent phải tuân theo. Yêu cầu mới mâu thuẫn với đây thì nói ra và hỏi lại, không làm ngay.*

### 3.1. Trước khi viết mã

1. Đọc `CLAUDE.md` này, `docs/BANGIAO.md`, và **`CLAUDE.md` của repo `hop-dong-pva-379-279`** (mục 4.3 cấu trúc Firebase) ở đầu phiên.
2. Nói rõ định làm gì và tại sao, ngắn, rồi làm. Việc lớn (đổi cấu trúc dữ liệu, thêm màn hình, đụng nhánh dùng chung) thì trình phương án, chờ anh Dũng gật.
3. Không bịa số liệu, tên ngân hàng, số hợp đồng làm dữ liệu mẫu. Cần dữ liệu thử thì ghi "MẪU" trong tên và xóa trước khi bàn giao.
4. Chia việc thành bước nhỏ theo thứ tự mục 1.2, mỗi bước chạy được và kiểm tra được.

### 3.2. Cấu trúc mã

5. **Toàn bộ app trong một file `index.html`.** Ngoại lệ bắt buộc: `manifest.json`, `sw.js`, `icons/`.
6. Apps Script ở `apps-script/Code.gs`; kịch bản nhắc ở `scripts/`. Hai thứ này **tách riêng với repo Hợp Đồng**, không dùng chung file, dù cùng Firebase.
7. Không framework, không công cụ build. Thư viện cho phép qua CDN: Firebase SDK, Chart.js, SheetJS. Thêm gì khác phải hỏi.
8. Tên biến, hàm, khóa dữ liệu: tiếng Việt không dấu kiểu `chuThuongDauChu`. Chú thích: tiếng Việt có dấu, cho người không rành lập trình.
9. Mỗi màn hình một khối, có dòng `// ===== MÀN HÌNH: ... =====` để tìm bằng Ctrl+F.
10. Giao diện theo app Hợp Đồng cho quen tay. Chữ tối thiểu 16px, nút tối thiểu 44px trên điện thoại. Tiền có dấu chấm hàng nghìn, ngày `dd/mm/yyyy`. Khoản `quaHan` và nhóm nợ ≥ 2 hiện màu đỏ, `sapDenHan` màu vàng.

### 3.3. Dữ liệu

11. Firebase là nguồn sự thật. Google Sheets chỉ để xem, không ghi ngược.
12. Tiền: số nguyên VND. Lãi suất: %/năm. Ngày: `YYYY-MM-DD`. Thời điểm lịch sử: ISO 8601 có múi giờ.
13. Mọi thao tác ghi kèm bản ghi `lichSu/` có trường `app = "congNo"`. Không ngoại lệ.
14. Không có nút xóa thật cho người không phải giám đốc. Xóa = `yeuCauXoa/`, giám đốc duyệt.
15. **Nhánh dùng chung** *(chốt 02/10 tối: chỉ còn `hopdong/baoLanh`)*: giữ đúng cấu trúc đã ghi trong CLAUDE.md của app Hợp Đồng. Muốn thêm trường thì thêm, **không đổi tên, không xóa trường** đang có, vì app kia đang đọc. Ngoài bảng này, app Công Nợ **không đọc, không ghi** gì dưới `hopdong/`.
16. Không sửa Firebase Security Rules, cấu hình Firebase, Apps Script đang chạy mà không nói trước và có bản sao lưu.
17. Lịch trả gốc sinh tự động **lưu thật** vào `kyTra`, sửa tay được từng dòng; không tính lại khi mở app.
18. Lịch sử lãi suất: **chỉ thêm dòng**, không sửa dòng cũ (trừ sửa lỗi nhập, và phải ghi lịch sử).
19. Nhập từ Excel theo file mẫu `mau/mau-nhap-cong-no.xlsx` do app xuất; hiện bảng xem trước, báo dòng lỗi, xác nhận mới ghi.
20. Công thức chỉ dùng đúng mục 1.5. Muốn đổi phải hỏi anh Dũng.

### 3.4. Nhắc hạn và thông báo

21. Số ngày nhắc theo bảng mục 1.4, để trong `CAU_HINH` để sửa một chỗ.
22. Kịch bản nhắc chạy trên GitHub Actions 07:00 giờ Việt Nam mỗi ngày, chạy được khi không ai mở app. Mỗi lần chạy: quét `congNo/*` và `baoLanh`, tạo hoặc cập nhật `nhacNho` (với `app = "congNo"`), gửi push cho đúng người nhận.
23. Nội dung thông báo ngắn, có ngân hàng, khoản, loại mốc, số tiền (nếu là trả tiền), số ngày còn lại. Ví dụ: `VietinBank — KƯ 05/2026 trả lãi ~42.300.000đ sau 5 ngày (25/10)`.
24. Mốc trả tiền tự tắt khi có dòng `traNo` / `phiBaoLanh` / `thauChiGiaoDich.nop` khớp kỳ. Không bắt kế toán bấm hai lần.

### 3.5. Kiểm tra và bàn giao

25. Sau mỗi thay đổi, kiểm tra trên trình duyệt máy tính và mô phỏng iPhone. Kiểm tra phép tính bằng một khoản thử có: 2 lần giải ngân, 2 giai đoạn lãi suất, 1 lần trả trước hạn — so lãi ước tính với tính tay.
26. Không đánh dấu "xong" khi còn lỗi hoặc chưa kiểm tra.
27. Cuối mỗi phiên cập nhật `docs/BANGIAO.md`.
28. Commit tiếng Việt, ngắn: `Thêm màn hình khế ước`, `Sửa công thức lãi ước tính`.
29. Không đưa khóa, PIN, mật khẩu vào mã. Cấu hình Firebase công khai để trong khối `CAU_HINH` đầu `index.html` — **giống hệt giá trị trong app Hợp Đồng** vì cùng project.

### 3.6. Khi không chắc

30. Hỏi, gom thành một lượt. Riêng việc đụng nhánh dùng chung với app Hợp Đồng thì **luôn hỏi**, kể cả thấy chắc.

---

## 4. FOLDER STRUCTURE — Cấu trúc thư mục và dữ liệu

*Bản đồ kho mã và bản đồ dữ liệu. Người không kỹ thuật chỉ cần nhớ: app nằm trong `index.html`, dữ liệu nằm trên Firebase chung với app Hợp Đồng, file scan nằm trên Google Drive.*

### 4.1. Thư mục trong repo

```
cong-no-pva-379-279/
│
├── CLAUDE.md                  ← file này
├── README.md                  ← giới thiệu ngắn, cách mở app, cách cài lên iPhone
│
├── index.html                 ← TOÀN BỘ APP
├── manifest.json              ← khai báo PWA
├── sw.js                      ← service worker: cài app, nhận thông báo đẩy
├── icons/
│
├── apps-script/
│   └── Code.gs                ← ghi Google Sheets, tải file lên Drive (riêng app này)
│
├── scripts/
│   └── nhac-han.js            ← GitHub Actions: quét mốc, sinh nhắc, gửi push
├── .github/
│   └── workflows/
│       └── nhac-han.yml       ← 07:00 giờ VN mỗi ngày
│
├── mau/
│   └── mau-nhap-cong-no.xlsx  ← file mẫu nhập liệu ban đầu (app tự xuất được)
│
└── docs/
    ├── BANGIAO.md             ← nhật ký bàn giao giữa các phiên
    ├── huong-dan-su-dung.md   ← cho kế toán (viết sau khi app chạy)
    └── cai-dat.md             ← bước cấu hình Firebase (dùng project có sẵn), Apps Script, Actions
```

### 4.2. Bố cục bên trong `index.html`

```
<head>
  CSS toàn bộ app

<body>
  1.  CAU_HINH            — Firebase (cùng app Hợp Đồng), URL Apps Script, bảng số ngày nhắc
  2.  DU_LIEU_TINH        — loại khoản vay, trạng thái, loại bảo lãnh, loại tài sản
  3.  DANG_NHAP           — đọc nguoiDung/ dùng chung, tên + PIN
  4.  KET_NOI_FIREBASE
  5.  LICH_SU             — ghiLichSu(app = "congNo")
  6.  TINH_TOAN           — toàn bộ công thức mục 1.5, thuần túy, có hàm laiUocTinh()
  7.  SINH_LICH           — sinh kyTra từ số kỳ / số tiền / ngày đầu
  8.  MÀN HÌNH: Dashboard
  9.  MÀN HÌNH: Lịch trả nợ (30 ngày, lọc ngân hàng / công ty / loại)
  10. MÀN HÌNH: Ngân hàng (danh sách, chi tiết: hạn mức, tài khoản, cán bộ, tổng quan nợ)
  11. MÀN HÌNH: Hạn mức & Khế ước (chi tiết khế ước: lãi suất, trả nợ, mục đích)
  12. MÀN HÌNH: Vay dài hạn (chi tiết: giải ngân, lịch trả, lãi suất, trả nợ)
  13. MÀN HÌNH: Thấu chi (giao dịch rút / nộp)
  14. MÀN HÌNH: Thuê tài chính (thiết bị, lịch trả, bảo hiểm, nơi đang ở)
  15. MÀN HÌNH: Bảo lãnh & Ký quỹ (dùng chung dữ liệu với app Hợp Đồng)
  16. MÀN HÌNH: Tài sản bảo đảm (tài sản ↔ khoản vay)
  17. MÀN HÌNH: Nhắc hạn (đang nhắc, Đã xong)
  18. MÀN HÌNH: Nhập từ Excel
  19. MÀN HÌNH: Quản trị (người dùng chung, ngân hàng, yêu cầu xóa — giám đốc)
  20. XUAT_EXCEL          — mọi bảng
  21. THONG_BAO_DAY
  22. DONG_BO_SHEETS
  23. KHOI_DONG
```

### 4.3. Cấu trúc dữ liệu trên Firebase (cùng project với app Hợp Đồng)

Nhánh **dùng chung** (cấu trúc gốc ở CLAUDE.md app Hợp Đồng; dưới đây chỉ ghi phần app này thêm vào):

```
/
├── congTy/{PVA|379|279}                 ← dùng chung, không đổi
├── nguoiDung/{id}                        ← dùng chung; thêm: nhanThongBaoCongNo (bool)
├── baoLanh/{id}                          ← DÙNG CHUNG, dạng phẳng (xem ghi chú dưới)
│     app ("hopDong"|"congNo")            ← app nào tạo
│     loai ("duThau"|"thucHienHopDong"|"tamUng"|"baoHanh")
│     nganHangId, congTyId, soThu, soTien, ngayPhatHanh, ngayHetHan, daGiaHan
│     hopDongId (nếu đã có hợp đồng) | tenGoiThau (nếu chưa)
│     phi: { hinhThuc ("motLan"|"dinhKy"), kyThuPhiThang (1|3), soTienMoiKy }
│     kyQuy: { banDau, hoanTra, ngayHoanTra }
│     keToanTheoDoi, fileDinhKem/{id}
├── nhacNho/{id}                          ← dùng chung; thêm: app, nganHangId, soTien, nguoiNhan[]
├── yeuCauXoa/{id}                        ← dùng chung; thêm: app
├── lichSu/{id}                           ← dùng chung; thêm: app
│
└── congNo/                               ← RIÊNG app này
    ├── nganHang/{id}
    │     ten, chiNhanh, loai ("nganHang"|"choThueTaiChinh")
    │     canBo: { ten, dienThoai }
    │     taiKhoan/{id}: { congTyId, soTaiKhoan, ghiChu }     ← nhiều TK mỗi công ty
    │
    ├── hanMuc/{id}
    │     nganHangId, congTyVay, congTyChiu, soHopDong, soTien
    │     ngayHieuLuc, ngayHetHan, hanMucBaoLanhRieng (bool), soTienHanMucBaoLanh
    │     keToanTheoDoi, fileDinhKem/{id}
    │
    ├── khoanVay/{id}                      ← cả khế ước ngắn hạn lẫn món dài hạn
    │     loai ("kheUoc"|"daiHan"), hanMucId (nếu là khế ước)
    │     nganHangId, congTyVay, congTyChiu, soHopDong, soKheUoc
    │     ngayGiaiNganDau, ngayDenHan, thoiHanThang
    │     ngayTraLaiTrongThang, ngayTraGocTrongThang
    │     mucDich: { congTrinh, khachHang, noiDung }
    │     soTien, soKy, gocMoiKy, ngayTraDau, kyCachThang      ← để sinh lịch (dài hạn); kyCachThang = 1|3|6|12 tháng giữa hai kỳ gốc
    │     theoDoiLaiTu                                         ← ngày bắt đầu theo dõi lãi trong app (khoản cũ nhập lại)
    │     trangThai, coCauLai: { co, ngay, ghiChu }, nhomNo (1-5)
    │     keToanTheoDoi, fileDinhKem/{id}
    │     giaiNgan/{id}: { ngay, soTien, ghiChu }
    │     laiSuat/{id}: { tuNgay, phanTramNam, loai ("coDinh"|"thaNoi"), ghiChu }
    │     kyTra/{id}: { ky, ngay, goc, daTra (bool), traNoId, suaTay (bool) }
    │     traNo/{id}: { ngay, goc, lai, phi, traTruocHan (bool), phiPhat, kyTraId, chungTu }
    │
    ├── thauChi/{id}
    │     nganHangId, congTyVay, congTyChiu, soHopDong, hanMuc, ngayHieuLuc, ngayHetHan, ngayNopHangThang
    │     theoDoiTu                                            ← ngày bắt đầu theo dõi trong app (kỳ nộp trước đó coi như đã nộp)
    │     laiSuat/{id}, keToanTheoDoi, fileDinhKem/{id}
    │     giaoDich/{id}: { ngay, loai ("rut"|"nop"), soTien, lai, phi, kyNop, noiDung }
    │                    ← dòng nộp: soTien = phần nộp GỐC; lai/phi = lãi, phí thật nộp kèm; kyNop = ngày phải nộp hằng tháng mà lần nộp này đáp ứng
    │
    ├── thueTaiChinh/{id}
    │     nganHangId (công ty cho thuê), congTyThue, congTyChiu, soHopDong, ngayKy
    │     thietBi: { ten, nhanHieu, model, soKhung, soMay, bienSo }
    │     giaTriThietBi, tienTraTruoc, tienKyQuy, soTienTaiTro, kyHanThang
    │     ngayTraHangThang, giaMuaLai, ngayKetThuc
    │     noiDangO, congTyDangDung
    │     baoHiem: { hang, soHopDong, ngayHetHan }
    │     trangThai, nhomNo, keToanTheoDoi, fileDinhKem/{id}
    │     laiSuat/{id}, kyTra/{id}, traNo/{id}                ← cùng cấu trúc khoanVay
    │
    ├── phiBaoLanh/{baoLanhId}/{id}        ← mỗi lần nộp phí
    │     ngay, soTien, kyTu, kyDen, loai ("phatHanh"|"giaHan"|"dinhKy"), chungTu
    │
    ├── kyQuyGiamTru/{baoLanhId}/{id}      ← ký quỹ giảm theo từng lần thu hồi tạm ứng
    │     ngay, soTien, thanhToanId (của app Hợp Đồng), daXacNhan (bool), ghiChu
    │
    ├── taiSanBaoDam/{id}
    │     loai, moTa, chuSoHuu: { loai ("congTy"|"caNhan"), congTyId | tenCaNhan }
    │     giaTriDinhGia, ngayDinhGia, ngayDinhGiaLai, nganHangId
    │     hopDongTheChap: { so, ngay }, ghiChu (số HĐ nếu là quyền đòi nợ)
    │     keToanTheoDoi, fileDinhKem/{id}
    │
    └── taiSanBaoDam_khoanVay/{id}         ← bảng nối tài sản ↔ khoản vay
          taiSanId, khoanVayId | thueTaiChinhId | hanMucId
          mucDichVay, khachHangGiaiNgan, ghiChu
```

**Ghi chú về nhánh `baoLanh` dùng chung:** trong CLAUDE.md gốc của app Hợp Đồng, bảo lãnh nằm dưới `baoLanh/{hopDongId}/{id}`. Để bảo lãnh dự thầu (chưa có hợp đồng) và app Công Nợ dùng được, **đổi sang dạng phẳng `baoLanh/{id}` có trường `hopDongId`**. CLAUDE.md của app Hợp Đồng đã được sửa tương ứng cùng ngày 02/10/2026. App Hợp Đồng lọc theo `hopDongId` để hiện đúng hợp đồng; app Công Nợ hiện tất cả.

Ghi chú cho người đọc không kỹ thuật:

- `khoanVay` là bảng chính, dùng cho cả khế ước ngắn hạn lẫn vay dài hạn, phân biệt bằng `loai`. Dưới mỗi khoản có bốn bảng con: giải ngân, lãi suất, lịch trả, trả nợ thực tế.
- `thueTaiChinh` có cấu trúc gần giống `khoanVay`, thêm phần thiết bị và bảo hiểm.
- Dư nợ, hạn mức còn trống, lãi ước tính, trạng thái **không lưu** mà app tự tính mỗi lần hiển thị theo mục 1.5. Riêng **lịch trả gốc** (`kyTra`) thì lưu thật, vì kế toán sửa tay được.
- `lichSu` chung với app Hợp Đồng, phân biệt bằng trường `app`.

### 4.4. Google Sheets (bản sao để xem)

Một file Google Sheets **riêng cho app Công Nợ**, mỗi bảng một sheet: `nganHang`, `hanMuc`, `khoanVay`, `giaiNgan`, `laiSuat`, `kyTra`, `traNo`, `thauChi`, `thueTaiChinh`, `baoLanh`, `phiBaoLanh`, `kyQuyGiamTru`, `taiSanBaoDam`, `nhacNho`, `lichSu`. Thêm sheet `TongHop` (dashboard dạng bảng) và `LichTraNo` (90 ngày tới). Apps Script ghi đè toàn bộ sheet mỗi lần đồng bộ.

### 4.5. Google Drive (file đính kèm)

Thư mục gốc `Cong No PVA-379-279` trong Drive của vandung0802@gmail.com. Bên trong: một thư mục cho mỗi ngân hàng, bên trong nữa một thư mục cho mỗi hợp đồng vay / thuê / thế chấp, đặt tên `[Công ty] Số hợp đồng — Mô tả ngắn`. File thư bảo lãnh để trong thư mục của ngân hàng phát hành. Apps Script tạo thư mục nếu chưa có, đặt quyền "ai có link đều xem", trả link về app.

---

*Hết. Có gì mâu thuẫn giữa file này và mã thì mã sửa theo file, trừ khi anh Dũng nói khác — khi đó sửa file này trước, rồi mới sửa mã. Đụng nhánh dùng chung thì sửa cả CLAUDE.md của app Hợp Đồng.*
