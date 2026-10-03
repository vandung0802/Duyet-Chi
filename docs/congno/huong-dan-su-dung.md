# Hướng dẫn dùng app Công nợ ngân hàng PVA-379-279 (cho kế toán)

Địa chỉ app: <https://vandung0802.github.io/Duyet-Chi/congno.html>

App theo dõi **mọi khoản công ty đang nợ ngân hàng** của 3 công ty (PVA, 379, 279): hạn mức vay ngắn hạn và từng khế ước, vay trung dài hạn (mua máy, xe), thuê tài chính thiết bị, thấu chi, thư bảo lãnh, tài sản thế chấp. App tự tính dư nợ, lãi ước, lịch phải trả và nhắc trước ngày đến hạn.

Hướng dẫn này viết theo thứ tự: **mở app → nhập lần đầu → việc hằng ngày → các màn còn lại → câu hỏi hay gặp**. Đọc mục 1, 2, 3 là dùng được; các mục sau tra khi cần.

---

## 1. Mở app, đăng nhập, cài ra màn hình chính

**Đăng nhập**: dùng **đúng email + mật khẩu của app Duyệt Chi**. Chưa có tài khoản thì đăng ký trong app Duyệt Chi trước và chờ được duyệt. Nếu app hiện "⏳ Chờ cấp quyền" nghĩa là tài khoản chưa được duyệt bên Duyệt Chi.

**Cài ra màn hình chính** (để mở nhanh và để nhận thông báo nhắc hạn):

- iPhone: mở app bằng **Safari** → bấm nút **Chia sẻ** (ô vuông có mũi tên đi lên) → **Thêm vào MH chính** → **Thêm**. Từ đó mở app bằng biểu tượng trên màn hình chính, **không mở bằng Safari nữa** (iPhone chỉ cho nhận thông báo khi mở từ biểu tượng này).
- Android: mở bằng **Chrome** → nút ⋮ (góc trên bên phải) → **Thêm vào màn hình chính** (hoặc **Cài đặt ứng dụng**).

**Bản mới**: khi có bản mới, đầu trang hiện dải **"⬆️ Có bản mới — bấm để cập nhật"**. Bấm vào là xong. Số bản đang dùng ghi cạnh tên app ở đầu trang (ví dụ `v15`).

**Đăng xuất**: nút **⚙️ Khác** (góc dưới bên phải) → kéo xuống cuối → **Đăng xuất**.

---

## 2. Bố cục app

Thanh dưới có 5 nút:

| Nút | Để làm gì |
|---|---|
| 📊 **Tổng quan** | Số liệu toàn cục: tổng dư nợ, phải trả 30 ngày, hạn mức còn trống, tiền đang bị giam, biểu đồ. Bấm vào ô số là tới màn liên quan. |
| 💳 **Khoản vay** | Ba nhóm (chọn bằng 3 nút ở đầu màn): **💳 Hạn mức** (vay ngắn hạn, bên trong là khế ước) · **🏗 Trung dài hạn** · **🚜 Thuê tài chính**. |
| 📅 **Lịch trả** | Mọi khoản phải trả trong 30 ngày tới + khoản đã quá hạn (gốc, lãi, nộp thấu chi, phí bảo lãnh). Số đỏ trên nút = số khoản quá hạn. |
| 🛡 **Bảo lãnh** | Thư bảo lãnh tạm ứng, thực hiện hợp đồng, dự thầu, bảo hành; phí bảo lãnh; ký quỹ. |
| ⚙️ **Khác** | Các mục còn lại: **🔔 Nhắc hạn**, **🏦 Ngân hàng**, **🔄 Thấu chi**, **🏠 Tài sản bảo đảm**, **📥 Nhập từ Excel**; bên dưới là Google Sheets, Yêu cầu xoá, Ba công ty, Người dùng, Đăng xuất. Số đỏ trên nút = số việc đang nhắc. |

Quy ước chung trong mọi màn:

- Bấm vào một dòng trong danh sách → mở **chi tiết**. Trong chi tiết, nút **✏️ Sửa** ở góc trên bên phải; nút **‹ Quay lại** ở góc trên bên trái.
- Nút **＋** là thêm mới. Ô có dấu **\*** là bắt buộc. Ô số tháng, số kỳ, ngày trong tháng chỉ nhận **số nguyên** (gõ `6,5` app sẽ báo lỗi).
- Dòng **vàng** = sắp đến hạn. Dòng **đỏ** (có vạch đỏ bên trái) = đã quá hạn hoặc có vấn đề.
- Số tiền có dấu **~** là **số ước tính** (lãi app tự tính). Số thật luôn theo thông báo của ngân hàng và do kế toán nhập.
- Dưới mọi bảng có nút **📤 Xuất Excel** để tải riêng bảng đó.
- Ai đã được duyệt đều **nhập, sửa** được mọi thứ. **Xoá** thì chỉ giám đốc; người khác bấm **"🗑 Yêu cầu xoá"** (xem mục 11).

---

## 3. Nhập lần đầu — làm theo đúng thứ tự này

### Bước 1 — Thêm ngân hàng

Nút **⚙️ Khác** → ô **🏦 Ngân hàng** → **＋ Thêm ngân hàng / công ty cho thuê tài chính**.

- Nhập **Tên ngân hàng**, **Chi nhánh**, **Loại** (Ngân hàng / Công ty cho thuê tài chính), cán bộ tín dụng và số điện thoại (bấm vào số là gọi được).
- Mỗi ngân hàng + chi nhánh là một dòng. Công ty cho thuê tài chính (để nhập hợp đồng thuê máy) cũng thêm ở đây, chọn loại **"Công ty cho thuê tài chính"**.

Bấm vào ngân hàng vừa thêm → thẻ **💳 Số tài khoản tại đây** → **＋ Thêm**: chọn công ty, gõ số tài khoản, ghi chú (ví dụ tài khoản riêng của công trình nào). Một công ty có thể có nhiều tài khoản.

> Chưa có ngân hàng nào thì khi bấm thêm hạn mức / khoản vay / bảo lãnh, app sẽ hiện hộp **"Cần thêm ngân hàng trước"** kèm nút **🏦 Thêm ngân hàng ngay**. Bấm nút đó, lưu ngân hàng, rồi quay lại bấm thêm lần nữa.

### Bước 2 — Thêm hợp đồng hạn mức (vay ngắn hạn)

Nút **💳 Khoản vay** → nút chọn **💳 Hạn mức** (ở đầu màn) → **＋ Thêm hợp đồng hạn mức (vay ngắn hạn)**.

| Ô | Ghi gì |
|---|---|
| Ngân hàng \* | Chọn trong danh sách đã thêm ở bước 1. |
| Công ty đứng tên vay \* | PVA / 379 / 279 — công ty ký hợp đồng với ngân hàng. |
| Công ty thực dùng, thực trả | Chỉ chọn khi **vay chéo** (công ty này đứng tên, công ty kia dùng tiền và trả). Để trống = như công ty đứng tên. |
| Số hợp đồng hạn mức \*, Số tiền hạn mức \* | Theo hợp đồng. |
| Ngày hiệu lực, Ngày hết hạn \* | App báo **vàng trước 60 ngày** hết hạn để chuẩn bị ký lại, **đỏ** khi đã hết hạn. |
| Ngân hàng tách hạn mức bảo lãnh RIÊNG | Tích nếu ngân hàng cấp hạn mức bảo lãnh riêng, rồi nhập số. **Không tích** = thư bảo lãnh đang hiệu lực được **cộng vào phần "đã dùng"** của hạn mức vay (cách thường gặp). |
| Kế toán theo dõi | Người sẽ nhận nhắc hạn của khoản này. |

### Bước 3 — Thêm khế ước nhận nợ (mỗi lần rút vốn)

Bấm vào hợp đồng hạn mức → thẻ **📑 Khế ước nhận nợ** → **＋ Khế ước**.

| Ô | Ghi gì |
|---|---|
| Số khế ước \* | Theo giấy nhận nợ. |
| Ngày giải ngân \*, Số tiền giải ngân \* | Lần giải ngân đầu. (Giải ngân thêm thì vào tab **Giải ngân** của khế ước sau.) |
| Thời hạn (tháng) / Ngày đến hạn | Nhập một trong hai. Bỏ trống ngày đến hạn → app tự tính = ngày giải ngân + thời hạn. |
| Lãi suất (%/năm) \* | Gõ `9,5` (dấu phẩy hoặc chấm đều được). Thả nổi / cố định. |
| Ngày trả lãi hằng tháng (1–31) \* | Ngày ngân hàng thu lãi mỗi tháng. Tháng không có ngày đó thì app lấy ngày cuối tháng. |
| Mục đích rút vốn | Trả cho công trình nào (có gợi ý), khách hàng / nhà cung cấp nhận tiền, nội dung. |
| Nhóm nợ | Theo CIC / ngân hàng, mặc định nhóm 1. Nhóm ≥ 2 app tô đỏ. |
| Được gia hạn / cơ cấu lại nợ | Tích khi ngân hàng cho cơ cấu, ghi ngày và ghi chú. |

Lưu xong, app **tự tạo**: lần giải ngân đầu, dòng lãi suất đầu, và **một kỳ trả gốc vào ngày đến hạn**. Nếu số tiền vượt hạn mức còn trống, app hỏi lại trước khi lưu.

**Khế ước cũ (đã vay trước khi dùng app)**: nhập y như trên với ngày giải ngân thật. App chỉ bắt đầu nhắc trả lãi **từ hôm nay trở đi**, các kỳ lãi trước hôm nay coi như đã trả (không báo quá hạn oan). Riêng kỳ **gốc** đã quá hạn thì vẫn báo đỏ.

### Cách nhanh: nhập cả loạt từ Excel

Nút **⚙️ Khác** → ô **📥 Nhập từ Excel**:

1. Bấm **⬇️ File mẫu** → được file `mau-nhap-cong-no.xlsx` có 6 sheet: `NganHang`, `HanMuc`, `KheUoc`, `VayDaiHan`, `ThueTaiChinh`, `ThauChi` và sheet `HuongDan`. **Không đổi tên sheet, không đổi dòng tiêu đề.**
2. Điền số liệu: mỗi dòng một khoản; ngày ghi `dd/mm/yyyy` (ghi kiểu tháng/ngày/năm hoặc ngày không có thật thì dòng đó bị báo thiếu ngày); tiền ghi số đồng (có dấu chấm cũng được); lãi suất ghi `9,5`. Cột có dấu `*` là bắt buộc. Cột "Ngân hàng" + "Chi nhánh" phải trùng tên đã có trong app hoặc trong sheet `NganHang` của chính file.
3. Bấm **📂 Chọn file** → app hiện bảng **xem trước**: ✅ sẽ thêm · ⏭ bỏ qua (đã có) · ❌ lỗi kèm lý do. **Chưa ghi gì** cho tới khi bấm **"✅ Ghi N dòng hợp lệ"**.
4. Dòng lỗi thì sửa trong Excel rồi nhập lại; dòng đã ghi sẽ tự bỏ qua, không tạo trùng.

Bảo lãnh và tài sản bảo đảm không có trong file mẫu — nhập tay.

---

## 4. Việc hằng ngày / hằng tháng của kế toán

### 4.1 Ngân hàng báo lãi → nhập trả lãi

Cách nhanh nhất: nút **📅 Lịch trả** → bấm vào dòng lãi đến hạn → mở thẳng tab **Lịch trả** của khế ước → bảng **💧 Lãi phải trả** → bấm **Trả** ở dòng đó.

Ô nhập trả nợ:

- **Ngày trả**.
- **Trả lãi (đ) — số THẬT theo ngân hàng**: gõ số trên thông báo của ngân hàng. Ô **"Lãi này trả cho kỳ đến hạn"** app đã chọn sẵn kỳ gần nhất chưa trả.
- **Phí** (nếu có), **Chứng từ / ghi chú** (số UNC…).

Lưu xong: kỳ lãi đó **tự biến mất** khỏi Lịch trả và Nhắc hạn. Trong tab **Trả nợ** của khế ước, cột **Chênh** = lãi thật − lãi ước (dương = ngân hàng thu nhiều hơn app ước) để đối chiếu.

### 4.2 Trả gốc

Vào khế ước (hoặc khoản vay) → tab **Lịch trả** → bảng **📅 Lịch trả gốc** → bấm **Trả** ở kỳ đó. App điền sẵn số gốc còn lại của kỳ; sửa nếu trả một phần. Kỳ **tự chuyển sang ✅ đã trả** khi tổng gốc trả cho kỳ ≥ gốc của kỳ.

Trả gốc + lãi cùng lúc: nhập cả hai ô trong một lần, chọn đúng kỳ gốc và kỳ lãi. Trả **hai kỳ gốc** cùng lúc thì nhập **hai dòng**, mỗi dòng gắn một kỳ (gộp vào một dòng thì kỳ thứ hai vẫn bị báo chưa trả).

### 4.3 Ngân hàng đổi lãi suất

Vào khoản vay → tab **Lãi suất** → **＋ Lãi suất mới** → nhập **Áp dụng từ ngày** và % mới. **Dòng cũ giữ nguyên** để tính lãi các tháng trước. Chỉ bấm vào dòng cũ để sửa khi **nhập nhầm**.

### 4.4 Giải ngân thêm (vay dài hạn giải ngân nhiều lần)

Vào khoản vay → tab **Giải ngân** → **＋ Giải ngân**. Tổng giải ngân không được vượt số tiền vay theo hợp đồng (hợp đồng tăng thì bấm ✏️ Sửa đổi số tiền vay trước).

### 4.5 Trả gốc trước hạn (vay trung dài hạn, thuê tài chính)

Tab **Trả nợ** → **＋ Trả nợ** → tích **"Đây là trả gốc TRƯỚC HẠN"**, nhập số gốc và **Phí phạt trả trước** (nếu có). Gốc này không gắn kỳ nào. Lưu xong, đầu trang khoản vay hiện cảnh báo lịch lệch → bấm **"Khớp lịch với dư nợ"**: app giữ các kỳ gần, **trừ dần từ các kỳ cuối**. Ngân hàng tính cách khác (giảm đều từng kỳ…) thì bấm Huỷ và sửa tay từng kỳ ở tab **Lịch trả** (bấm vào dòng kỳ; kỳ đã sửa tay có dấu ✍️).

### 4.6 Hết khế ước, tất toán

Trả đủ gốc là khế ước tự sang trạng thái **Đã tất toán**, không cần làm gì thêm. Hạn mức còn trống tự tăng lại.

### 4.7 Hạn mức sắp hết hạn, ký lại

App báo vàng trước 60 ngày (ở danh sách hạn mức, Tổng quan và Nhắc hạn). Ký hợp đồng mới → **＋ Thêm hợp đồng hạn mức** mới (giữ hợp đồng cũ để các khế ước cũ còn dư nợ vẫn nằm đúng chỗ). Mốc nhắc "hết hạn hạn mức" bấm **Đã xong** ở màn Nhắc hạn khi đã xử lý.

---

## 5. Vay trung dài hạn theo món (mua máy, xe, đầu tư)

Nút **💳 Khoản vay** → nút chọn **🏗 Trung dài hạn** → **＋ Thêm khoản vay trung dài hạn**.

Khác với khế ước ở phần **lịch trả gốc** — app tự sinh:

| Ô | Ghi gì |
|---|---|
| Số tiền vay theo hợp đồng \* | Tổng hợp đồng tín dụng. |
| Ngày / Số tiền giải ngân lần đầu | Bỏ trống số tiền = giải ngân hết một lần. Các lần sau thêm ở tab Giải ngân. |
| Số kỳ trả gốc \* | Ví dụ 36. |
| Các kỳ cách nhau | Hằng tháng / 3 tháng / 6 tháng / mỗi năm. (Lãi luôn trả hằng tháng.) |
| Ngày trả gốc kỳ đầu \* | Các kỳ sau cùng ngày trong tháng. |
| Gốc mỗi kỳ | Bỏ trống = chia đều, kỳ cuối = phần còn lại. |
| **Số kỳ gốc ĐÃ TRẢ trước khi nhập vào app** | Khoản vay cũ: gõ số kỳ đã trả xong → app ghi sẵn các lần trả đó (chứng từ "Đã trả trước khi nhập vào app") để dư nợ đúng và không báo quá hạn oan. Khoản mới: để trống. |

Lưu xong vào tab **Lịch trả** kiểm tra lại bảng kỳ với lịch của ngân hàng; lệch kỳ nào thì bấm vào kỳ đó sửa tay. Thẻ đầu trang có ô **Kỳ gốc tới** và **còn N kỳ**.

---

## 6. Thuê tài chính thiết bị

Nút **💳 Khoản vay** → nút chọn **🚜 Thuê tài chính** → **＋ Thêm hợp đồng thuê tài chính**. Trước đó phải có **công ty cho thuê tài chính** trong danh sách Ngân hàng (loại "Công ty cho thuê tài chính").

Nhập: số hợp đồng thuê, ngày ký; **thiết bị** (tên, nhãn hiệu, model, số khung, số máy, biển số, giá trị, đang ở công trình nào, công ty nào đang dùng); **tiền** (trả trước, ký quỹ, số tiền tài trợ = gốc thuê, giá mua lại cuối kỳ); lãi suất; **kỳ hạn (số tháng)** và **ngày trả kỳ đầu** (gốc + lãi trả cùng ngày hằng tháng, lãi tính từ ngày ký); **bảo hiểm thiết bị** (hãng, số hợp đồng, ngày hết hạn).

App báo trước **60 ngày** khi hợp đồng thuê sắp kết thúc (chuẩn bị mua lại, sang tên) và khi **bảo hiểm sắp hết hạn**. Tiền ký quỹ thuê được cộng vào ô **"Tiền đang bị giam"** ở Tổng quan cho tới khi tích **"Tiền ký quỹ đã được hoàn lại"**.

---

## 7. Thấu chi

Nút **⚙️ Khác** → ô **🔄 Thấu chi** → **＋ Thêm hạn mức thấu chi**.

- Nhập hạn mức, hiệu lực, lãi suất, **Ngày phải nộp tiền hằng tháng**, và ô **"Hằng tháng phải nộp"**: **Chỉ lãi** hoặc **Cả gốc và lãi** (loại này mỗi kỳ phải nộp toàn bộ số đang dùng về 0).
- **Hạn mức đang dùng dở từ trước**: vào chi tiết → tab **Rút / nộp** → **＋ Rút** nhập **một dòng** bằng số đang dùng hiện tại (nội dung: "số dư khi bắt đầu nhập app").
- Mỗi lần rút: **＋ Rút**. Mỗi lần nộp: **＋ Nộp** — ô **Nộp gốc** làm giảm số đang dùng; ô **Trả lãi** là lãi thật nộp kèm (không làm giảm số đang dùng); chọn **Nộp cho kỳ hằng tháng** để kỳ đó tắt.
- Tab **Nộp hằng tháng** liệt kê các kỳ phải nộp 35 ngày tới + quá hạn với lãi ước; bấm **Nộp** ở dòng đó là ô nhập đã điền sẵn kỳ (và số gốc nếu loại "cả gốc và lãi").
- Số đang dùng = tổng rút − tổng nộp gốc. Cột **Đang dùng** trong bảng giao dịch là số sau từng lần rút / nộp.

---

## 8. Bảo lãnh, phí bảo lãnh, ký quỹ

Nút **🛡 Bảo lãnh** → **＋ Thêm thư bảo lãnh** → chọn loại:

- **Tạm ứng**, **Thực hiện hợp đồng**: **dùng CHUNG với app Hợp Đồng** — nhập ở đây thì bên đó thấy ngay và ngược lại. Có ô **"Hợp đồng (trong app Hợp Đồng)"**: chọn đúng hợp đồng thì thư hiện trong hợp đồng đó bên app Hợp Đồng.
- **Dự thầu**, **Bảo hành**: chỉ theo dõi trong app này.

Các ô chính: ngân hàng phát hành, công ty, số thư, số tiền, ngày phát hành, ngày hết hạn, gói thầu; **Phí bảo lãnh** (thu một lần khi phát hành / thu định kỳ mỗi 1 hoặc 3 tháng, số tiền mỗi kỳ, **"Phí đã nộp đến ngày"** cho thư cũ; thu định kỳ thì phải nhập **số phí mỗi kỳ** app mới nhắc nộp phí); **Ký quỹ** (ban đầu, đã hoàn trả, ngày hoàn trả); kế toán theo dõi.

Trong chi tiết thư:

- **💵 Phí bảo lãnh → ＋ Nộp phí**: app điền sẵn kỳ phí tới. Thư thu phí định kỳ sẽ có mốc nhắc **trước 10 ngày** và hiện trong Lịch trả (loại "Phí bảo lãnh").
- **🔒 Ký quỹ → ＋ Giảm ký quỹ**: bảo lãnh tạm ứng, mỗi lần chủ đầu tư thu hồi tạm ứng thì ngân hàng giảm ký quỹ tương ứng — nhập số thật theo ngân hàng. Thư hết hiệu lực, phần còn lại được hoàn: bấm **✏️ Sửa**, nhập **"Đã được hoàn trả"** và ngày — chỉ nhập **phần còn lại** sau các lần đã giảm (không gõ lại số ký quỹ ban đầu).
- Thư còn hiệu lực sắp hết hạn: báo **trước 15 ngày** (gia hạn hoặc nộp phí gia hạn nếu công trình chưa xong). Thư đã gia hạn thì tích **"Thư đã được gia hạn"** và sửa ngày hết hạn.

Thư còn hiệu lực được **cộng vào phần "đã dùng" của hạn mức vay** cùng ngân hàng, cùng công ty (trừ khi hạn mức tích "tách hạn mức bảo lãnh riêng"). Thư nhập từ app Hợp Đồng chỉ có tên ngân hàng gõ tay nên hiện **"⚠️ chưa gắn ngân hàng"** — bấm **✏️ Sửa** → chọn ngân hàng là xong. Ô tích **"Hiện cả thư đã hết hiệu lực"** để xem lại thư cũ.

Thư do app Hợp Đồng tạo thì app này không xoá được (xoá bên đó).

---

## 9. Tài sản bảo đảm

Nút **⚙️ Khác** → ô **🏠 Tài sản bảo đảm** → **＋ Thêm tài sản bảo đảm**: loại (đất, nhà, xe, máy móc, quyền đòi nợ, sổ tiết kiệm, khác), mô tả, chủ sở hữu (công ty hoặc tên cá nhân), giá trị và ngày định giá, **ngày phải định giá lại** (trống = +12 tháng), ngân hàng nhận thế chấp, số và ngày hợp đồng thế chấp.

Vào chi tiết tài sản → **🔗 Đang bảo đảm cho các khoản → ＋ Gắn khoản**: chọn hạn mức / khoản vay / thấu chi **cùng ngân hàng** mà tài sản này bảo đảm. Một tài sản gắn được nhiều khoản. Ngược lại, trong chi tiết hạn mức / khoản vay có thẻ **"Tài sản bảo đảm cho khoản này"**.

App báo **trước 40 ngày** đến hạn định giá lại; sau khi ngân hàng định giá lại, bấm **✏️ Sửa** nhập giá trị và ngày mới. Sổ tiết kiệm thế chấp được cộng vào **"Tiền đang bị giam"**.

---

## 10. Lịch trả, Nhắc hạn, thông báo 7:00 sáng

**📅 Lịch trả**: mọi khoản phải trả trong 30 ngày tới và khoản quá hạn, lọc theo công ty / ngân hàng / loại (chỉ gốc, chỉ lãi, chỉ nộp thấu chi, chỉ phí bảo lãnh). Bấm vào dòng là mở đúng chỗ để nhập trả. Nhập dòng trả / nộp là khoản đó tự biến mất.

**🔔 Nhắc hạn** (nút **⚙️ Khác** → ô **🔔 Nhắc hạn**): danh sách việc đang nhắc, kể cả việc không phải trả tiền (hạn mức hết hạn, kết thúc thuê, bảo hiểm, định giá lại, bảo lãnh hết hạn). App nhắc trước:

| Việc | Nhắc trước | Tắt bằng cách |
|---|---|---|
| Trả lãi hằng tháng, nộp thấu chi | 5 ngày (nhắc lại hôm trước và đúng ngày) | Nhập dòng trả / nộp cho kỳ đó |
| Trả gốc | 10 ngày (nhắc lại còn 5, 1, 0 ngày) | Nhập dòng trả gốc cho kỳ đó |
| Phí bảo lãnh định kỳ | 10 ngày | Nhập nộp phí |
| Hạn mức / thấu chi hết hạn, kết thúc thuê, bảo hiểm hết hạn | 60 ngày | Bấm **Đã xong** |
| Định giá lại tài sản | 40 ngày | Bấm **Đã xong** |
| Bảo lãnh hết hạn | 15 ngày | Bấm **Đã xong** |

Quá hạn chưa xử lý thì nhắc **mỗi ngày**. Bấm nhầm "Đã xong" thì ở thẻ **✅ Đã xong gần đây** bấm **Mở lại**.

**Bật thông báo trên máy** (để 7:00 sáng điện thoại tự báo): ở màn Nhắc hạn, thẻ **🔔 Thông báo trên máy này** → **Bật thông báo nhắc hạn** → Cho phép. iPhone: **phải cài app ra màn hình chính** (mục 1) và mở từ biểu tượng đó thì nút này mới hiện. Thông báo chỉ gửi khi có việc; mỗi máy cần bật một lần.

**Ai nhận thông báo**: giám đốc; người được giám đốc tích **"nhận mọi nhắc hạn"** (nút **⚙️ Khác** → thẻ **👥 Người dùng**); và **kế toán theo dõi** của chính khoản đó. Vì vậy mỗi hạn mức / khoản vay / thư bảo lãnh nên chọn đúng **Kế toán theo dõi**.

---

## 11. Sửa, xoá, lịch sử

- **Sửa**: mở chi tiết → **✏️ Sửa** (góc trên bên phải). App chỉ ghi những ô mình thật sự đổi, nên hai người sửa hai ô khác nhau của cùng một bản ghi không đè lên nhau. Với dòng con (giải ngân, lãi suất, kỳ trả, trả nợ, giao dịch, phí, số tài khoản…): bấm vào dòng đó trong bảng. Sửa hạn mức (ngân hàng, công ty, số hợp đồng) thì các khế ước bên dưới tự mang theo.
- **Xoá**: cuối ô Sửa có nút đỏ. Giám đốc bấm là xoá luôn (có hỏi lại, **không hoàn tác được**; xoá khoản vay là mất cả giải ngân, lãi suất, lịch trả, trả nợ của nó). Người khác bấm **"🗑 Yêu cầu xoá (giám đốc duyệt)"** → gõ **lý do** → yêu cầu nằm ở nút **⚙️ Khác** → thẻ **🗑 Yêu cầu xoá** để giám đốc **✅ Đồng ý xoá** hoặc **✖ Từ chối**. Đổi ý thì mở lại bản ghi bấm **↩️ Rút lại yêu cầu xoá**.
- **Lịch sử**: cuối mỗi chi tiết (hoặc tab **Lịch sử** của khoản vay / thấu chi) ghi ai, lúc nào, sửa trường gì, giá trị cũ → mới. Không xoá được lịch sử.

---

## 12. File đính kèm (scan hợp đồng, khế ước, chứng từ)

Trong chi tiết hạn mức, khoản vay (tab **File**), thấu chi, thư bảo lãnh, tài sản có thẻ **📁 File đính kèm**:

- **📤 Tải file lên**: chọn file trên máy (≤ 20 MB) → app cất vào Google Drive của công ty (thư mục `Cong No PVA-379-279` / ngân hàng / hợp đồng) và gắn link vào đây. Ai có link đều xem được, nên tài liệu cần kín thì dùng cách dưới.
- **＋ Dán link**: dán link Google Drive / OneDrive của file (đặt quyền xem trước). Link phải bắt đầu bằng `http`.

---

## 13. Tổng quan, Excel, Google Sheets

**📊 Tổng quan**: chọn **Cả 3 công ty** hoặc một công ty; chọn một công ty thì có thêm nút xem **theo công ty ĐỨNG TÊN** hay **theo công ty THỰC CHỊU** (khác nhau khi có vay chéo). Các ô:

- **Tổng dư nợ gốc** (vay + thuê + thấu chi đang dùng) · **Phải trả 30 ngày tới** (gốc + lãi ước + phí, gồm cả phần quá hạn) · **Hạn mức còn trống** (bỏ hạn mức đã hết hạn) · **Lãi ước tính tháng này** · **Tiền đang bị giam** (ký quỹ bảo lãnh + sổ tiết kiệm thế chấp + ký quỹ thuê) · **Bảo lãnh đang hiệu lực** · **Khoản quá hạn** · **Khoản nợ nhóm ≥ 2** · **Việc đang nhắc**.
- Bảng **Theo ngân hàng**, bảng/biểu đồ **Dư nợ 12 tháng qua** và **Gốc + lãi ước 12 tháng tới** (không có mạng vẫn có bảng số).

**Xuất Excel**: nút **📤 Xuất Excel** dưới từng bảng, hoặc nút **📤 Xuất Excel tổng hợp** cuối màn Tổng quan (một file nhiều sheet: TongHop, TheoNganHang, KhoanVay, HanMuc, ThauChi, BaoLanh, TaiSanBaoDam, LichTra90Ngay…).

**Google Sheets**: app tự chép toàn bộ số liệu sang một file Google Sheets khoảng **40 giây sau mỗi lần nhập / sửa**. Link **Mở Google Sheets** và **Mở thư mục Drive** ở nút **⚙️ Khác** → thẻ **🔄 Bản sao Google Sheets**; cần đẩy ngay thì bấm **🔄 Đồng bộ Google Sheets ngay**. **Sheets chỉ để xem** — sửa trong Sheets không vào app.

---

## 14. App tự tính thế nào (để đối chiếu với ngân hàng)

- **Dư nợ gốc** = tổng giải ngân − tổng gốc đã trả.
- **Lãi ước** = dư nợ gốc × lãi suất năm ÷ 365 × số ngày, tính theo từng giai đoạn lãi suất và từng lần giải ngân / trả gốc. Ngày giải ngân có tính lãi; ngày trả gốc thì phần đã trả thôi tính. Kỳ lãi 25/01 → 25/02 gồm các ngày 25/01 … 24/02.
- **Kỳ trả lãi**: ngày N hằng tháng (tháng không có ngày N thì lấy cuối tháng); kỳ cuối = ngày đến hạn khế ước. Khế ước quá hạn thì lịch lãi dừng ở ngày đến hạn — ngân hàng gia hạn / cơ cấu thì sửa ngày đến hạn.
- **Hạn mức đã dùng** = dư nợ các khế ước + thư bảo lãnh đang hiệu lực cùng ngân hàng, cùng công ty (nếu không tách hạn mức bảo lãnh riêng). Một ngân hàng + một công ty có hai hạn mức gối nhau (cũ sắp hết, mới vừa ký) thì thư bảo lãnh chỉ tính vào hạn mức còn hiệu lực hết hạn muộn nhất.
- **Trạng thái** app tự đặt: **Đang vay** · **Sắp đến hạn** (có kỳ gốc trong 7 ngày tới) · **QUÁ HẠN** (có kỳ **gốc** chưa trả đã qua ngày; lãi quá hạn chỉ tô đỏ ở Lịch trả) · **Đã tất toán** (dư nợ 0 và không còn kỳ gốc chưa trả). **Cơ cấu lại** là do kế toán tích tay.
- Lãi thật luôn do kế toán nhập khi trả; app chỉ ước để nhắc và để so **Chênh**.

---

## 15. Câu hỏi hay gặp

**Bấm thêm hạn mức thì hiện "Cần thêm ngân hàng trước"?** — Chưa có ngân hàng nào. Bấm nút **🏦 Thêm ngân hàng ngay** trong hộp đó, lưu, rồi quay lại thêm hạn mức.

**Ô chọn ngân hàng không có ngân hàng tôi cần?** — Đóng ô nhập → nút **⚙️ Khác** → ô **🏦 Ngân hàng** → **＋ Thêm ngân hàng**, rồi quay lại.

**Thư bảo lãnh báo "⚠️ chưa gắn ngân hàng"?** — Thư nhập từ app Hợp Đồng. Bấm vào thư → **✏️ Sửa** → chọn **Ngân hàng phát hành** → Lưu. Từ đó thư mới được cộng vào hạn mức.

**Khoản vay báo "Lịch trả gốc còn X nhưng gốc còn phải trả là Y — lệch"?** — Thường do vừa trả trước hạn hoặc giải ngân thêm. Bấm **Khớp lịch với dư nợ** (trừ dần từ các kỳ cuối) hoặc sửa tay từng kỳ ở tab **Lịch trả** cho đúng bảng của ngân hàng.

**Khế ước cũ vừa nhập mà báo quá hạn lãi?** — Không xảy ra: kỳ lãi trước hôm nay app coi như đã trả. Nếu báo đỏ là do **kỳ gốc** (ngày đến hạn) đã qua — kiểm tra lại ngày đến hạn hoặc nhập trả gốc nếu đã trả.

**Khoản đã tất toán mà Lịch trả vẫn còn dòng lãi đỏ?** — Lãi trả lúc tất toán chưa được gắn kỳ. Vào khoản đó → tab **Trả nợ** → bấm dòng trả lãi → ô **"Lãi này trả cho kỳ đến hạn"** chọn đúng kỳ → Lưu. (Khoản đã tất toán thì app không gửi thông báo nhắc lãi nữa, dòng đỏ chỉ để nhập bù.)

**Lãi app ước khác số ngân hàng thu?** — Bình thường vài nghìn đồng do cách làm tròn / đếm ngày. Lệch lớn thì kiểm tra: lãi suất hiện hành (tab Lãi suất, có đúng dòng từ ngày đổi không), ngày giải ngân, các lần trả gốc. Số thật vẫn nhập theo ngân hàng.

**Không ước được lãi, không nhắc trả lãi?** — Khoản chưa có dòng lãi suất áp dụng cho hôm nay. Vào tab **Lãi suất** thêm dòng.

**Số tiền giải ngân vượt hạn mức còn trống?** — App hỏi "Vẫn lưu?". Thường do thư bảo lãnh đang hiệu lực đã chiếm hạn mức, hoặc hạn mức cũ chưa tất toán hết. Vẫn lưu được nếu đúng thực tế.

**Điện thoại không nhận thông báo 7:00?** — Kiểm tra: (1) iPhone phải cài app ra màn hình chính và mở từ đó; (2) màn Nhắc hạn phải hiện "✅ Đã bật"; (3) mình phải là kế toán theo dõi của khoản đó hoặc được tích "nhận mọi nhắc hạn"; (4) hôm đó phải có việc đến hạn. Thông báo bị chặn trong cài đặt máy thì vào Cài đặt → Thông báo của trình duyệt/app để mở lại.

**App báo "⛔ Không đọc được dữ liệu"?** — Tài khoản chưa được duyệt hoặc mất mạng. Thử lại; vẫn lỗi thì báo giám đốc.

**Lỡ xoá nhầm?** — Chỉ giám đốc xoá được và app đã hỏi lại trước khi xoá; đã xoá thì không hoàn tác, phải nhập lại (lịch sử vẫn còn để tra số cũ).

**Muốn thêm / bớt người dùng?** — Làm trong app Duyệt Chi (duyệt tài khoản). Người đã duyệt mở app này một lần là có tên trong danh sách "Kế toán theo dõi".

---

Gặp lỗi lạ: chụp màn hình (cả thông báo đỏ) gửi giám đốc.
