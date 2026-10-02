# CLAUDE.md — App "Hợp Đồng PVA-379-279"

> File này là bản hướng dẫn cho AI agent (Claude Code) đóng vai **Chuyên gia phát triển phần mềm kiêm Quản lý dự án xây dựng** khi làm việc trong kho mã này. Agent đọc file này đầu tiên ở mỗi phiên. Người trong công ty cũng đọc được: mỗi mục đều có phần giải thích in nghiêng cho người không làm kỹ thuật.
>
> Bản này chốt ngày 30/09/2026 sau buổi phỏng vấn anh Dũng; **cập nhật 02/10/2026** khi có thêm app Công Nợ (repo `cong-no-pva-379-279`) dùng chung Firebase và đăng nhập với app này — các chỗ đổi được đánh dấu *(02/10)*.

---

## 1. PROJECT CONTEXT — Bối cảnh dự án

*Mục này trả lời câu hỏi: app này làm gì, cho ai, đang ở đâu, và những quyết định đã chốt mà agent không được tự ý đổi.*

### 1.1. Mục đích

App quản lý toàn bộ vòng đời **hợp đồng với chủ đầu tư** (tiền vào) của ba công ty PVA, 379, 279: từ lúc ký, qua các phụ lục, tạm ứng, thanh toán từng đợt, giữ lại bảo hành, quyết toán, cho tới lúc hết bảo hành và nhận lại tiền. Nhìn vào màn hình đầu tiên là biết ngay doanh thu đến thời điểm hiện tại của từng công ty hoặc cả ba, tiền còn phải thu, tiền đang bị giữ, và những hợp đồng đang chờ quyết toán.

App **không** quản lý hợp đồng thầu phụ, nhà cung cấp (tiền ra). Dashboard dòng tiền vì thế chỉ có phía thu. Nếu sau này cần tiền ra sẽ mở dự án khác, không nhồi vào đây.

### 1.2. Trạng thái hiện tại

**Anh Dũng đã viết dở app này.** Cách làm đã chốt: **mã hiện có phải sửa theo đúng file này** — thiếu thì tự bổ sung, thừa thì bỏ đi, không cần hỏi lại từng chỗ. Trình tự ở phiên đầu tiên:

1. Đọc `index.html` và `docs/BANGIAO.md` (nếu có) để biết đã làm được đến đâu.
2. Đối chiếu với yêu cầu trong file này, viết ra một bảng ngắn: đã có / thiếu / thừa / làm khác. Báo bảng đó cho anh Dũng **một lần** rồi bắt tay làm luôn, không chờ.
3. Sửa và bổ sung theo bảng, mỗi bước một việc, giữ nguyên cách tổ chức một file `index.html`. Phần đã có mà đúng thì giữ, không viết lại cho "đẹp".

Dữ liệu ban đầu: khoảng **20 hợp đồng đang dở dang** trên cả ba công ty, hiện theo dõi bằng Excel và nhắc nhở thủ công. File Excel có nhưng chưa đầy đủ, nên app phải cho nhập cả từ Excel lẫn nhập tay.

*(02/10)* Đã có file Excel mẫu thật của kế toán: `docs/Theo-doi-cong-trinh-Dai-Thanh.xls` (3 sheet theo năm). Cách kế toán đang ghi: **mỗi hợp đồng một khối nhiều dòng** — dòng đầu có TT, tên công trình, chủ đầu tư, số HĐ, ngày ký, giá trị; các dòng dưới mỗi dòng một đợt (Đợt 1, Đợt 2, Quyết toán, Quyết toán BS, "ĐC giảm của Đ3"…) với ngày nghiệm thu, giá trị, lũy kế, ngày/số hóa đơn, doanh thu, thuế; cột "Nhận tiền" (ngày, số tiền) chạy song song nhưng **không khớp dòng với đợt**; sheet 2024 có thêm cột tạm ứng / thu hồi / còn lại và cột chênh lệch tiền về. **File mẫu nhập liệu `mau/mau-nhap-hop-dong.xlsx` phải theo bố cục này** (một sheet hợp đồng, một sheet đợt nghiệm thu, một sheet tiền về — mỗi dòng có số HĐ để nối), và bộ nhập Excel phải đọc được cả file gốc kiểu khối nhiều dòng nói trên, hiện xem trước để kế toán ghép tiền về vào đúng đợt trước khi ghi.

### 1.3. Nền tảng và công nghệ (đã chốt)

| Hạng mục | Quyết định | Lý do |
|---|---|---|
| Kiểu ứng dụng | Web app, cài được lên màn hình chính điện thoại (PWA) | Dùng được trên máy tính và iPhone, không phải cài gì |
| Mã nguồn | **Một file `index.html`** chứa toàn bộ giao diện và logic | Cùng cách với app Duyệt Chi và app Tiến độ, anh Dũng đã quen sửa |
| Đưa lên mạng | GitHub Pages, repo `vandung0802/hop-dong-pva-379-279` | Miễn phí, đã dùng cho hai app trước |
| Kho dữ liệu chính | Firebase Realtime Database. *(02/10)* **Dùng chung project với app Công Nợ**: các nhánh `congTy`, `nguoiDung`, `baoLanh`, `nhacNho`, `yeuCauXoa`, `lichSu` là chung; app Công Nợ để dữ liệu riêng dưới `congNo/` | Nhiều người nhập cùng lúc; bảo lãnh nhập một nơi cả hai app cùng thấy |
| Bản sao Google Sheets | Đồng bộ một chiều Firebase → Google Sheets qua Google Apps Script (gọi kiểu JSONP như Duyệt Chi) | Kế toán quen xem bảng; tránh lỗi CORS của GitHub Pages |
| File đính kèm (scan hợp đồng, phụ lục, bảo lãnh) | Tải lên **Google Drive** của tài khoản vandung0802@gmail.com qua Apps Script; lưu link công khai "ai có link đều tải được" vào Firebase | Ai cũng tải xuống được, không hạn chế |
| OneDrive | Giai đoạn đầu chỉ cho **dán link** OneDrive vào ô đính kèm; chưa làm tải lên tự động | Kết nối OneDrive phức tạp hơn nhiều, để giai đoạn sau |
| Thông báo đẩy | Web push (Firebase Cloud Messaging), hiện trên màn hình khóa điện thoại | Như app Duyệt Chi; iPhone cần cài app lên màn hình chính, iOS 16.4 trở lên |
| Chạy nhắc định kỳ | GitHub Actions chạy mỗi sáng 7:00 giờ Việt Nam, đọc Firebase, gửi push cho mốc đến hạn | Cách đơn giản nhất, không tốn tiền |
| Đăng nhập | Chọn tên + mã PIN (như Duyệt Chi). *(02/10)* Danh sách người dùng và PIN **dùng chung với app Công Nợ** (nhánh `nguoiDung`) | Một người một mật khẩu cho cả bộ app |
| Xuất báo cáo | Nút "Xuất Excel" trên dashboard và bảng hợp đồng | Chỉ cần Excel, không cần gửi Zalo/Telegram |

### 1.4. Nghiệp vụ đã chốt

Đây là phần quan trọng nhất. Agent không được tự suy diễn khác đi.

**Ba công ty**

- PVA — Công ty CP Xây lắp công trình Phúc Vinh An (tên cũ: Công ty CP Xây dựng 439, cùng một pháp nhân)
- 379 — Công ty CP 379 Việt Nam
- 279 — Công ty TNHH Đầu tư và Xây lắp 279
- Lưu mã số thuế và người đại diện của từng công ty.
- Ba công ty thỉnh thoảng giao khoán nội bộ cho nhau (không nhiều). Hợp đồng nội bộ có cờ `noiBo = true` và trỏ về hợp đồng gốc. Khi cộng "Cả 3 công ty" phải **loại hợp đồng nội bộ** ra, nếu không doanh thu bị tính hai lần.

**Doanh thu**

- Dashboard hiện **hai cột cạnh nhau**: (a) giá trị đã nghiệm thu lũy kế và (b) tiền đã thực về tài khoản lũy kế.
- Hợp đồng liên danh: chỉ theo dõi **phần của công ty mình**. Trường `giaTriGoc` lưu phần của mình; `tyLeLienDanh` và `tongGiaTriLienDanh` chỉ để tham khảo. Không theo dõi phần của thành viên ngoài.
- Khi quyết toán được duyệt, **doanh thu cuối cùng lấy theo giá trị quyết toán**, không lấy giá trị hợp đồng.

**Hợp đồng**

- Trường bắt buộc: công ty ký, số hợp đồng, ngày ký, chủ đầu tư / ban QLDA, tên gói thầu, tên dự án, **loại hợp đồng** (trọn gói / đơn giá cố định / đơn giá điều chỉnh), giá trị trước thuế, thuế, giá trị sau thuế, thời gian thực hiện, ngày khởi công, ngày hoàn thành theo hợp đồng, file scan.
- Không cần số quyết định phê duyệt kết quả lựa chọn nhà thầu.
- Trạng thái: `dangThiCong` / `choNghiemThuHoanThanh` / `dangBaoHanh` / `choQuyetToan` / `daXong` / `tamDung` / `biChamDut`.

**Phụ lục**

- Có thể **cộng hoặc trừ** giá trị, có thể gia hạn thời gian, hoặc cả hai.
- Giá trị hợp đồng hiện hành = giá gốc + tổng điều chỉnh của các phụ lục. Ngày hoàn thành hiện hành = ngày trong phụ lục sau cùng có gia hạn.
- Phụ lục sau cùng có sửa đổi là bản đang có hiệu lực.

**Tạm ứng**

- Một hợp đồng có **nhiều đợt** tạm ứng.
- Mỗi đợt có bảo lãnh tạm ứng: ngân hàng, số tiền, ngày hết hạn, file.
- Số tiền thu hồi tạm ứng mỗi đợt thanh toán do **kế toán nhập tay**, app không tự tính theo tỷ lệ.

**Thanh toán từng đợt** — mỗi đợt lưu:

- Ngày nghiệm thu khối lượng, giá trị nghiệm thu đợt này
- Số tiền đề nghị thanh toán
- Thu hồi tạm ứng đợt này
- Giữ lại bảo hành đợt này
- Giữ lại chờ quyết toán đợt này
- Số tiền thực nhận, ngày tiền về
- File đính kèm
- Không tách cột thuế GTGT từng đợt (đã hỏi, không cần).

**Bảo lãnh** — theo dõi cả ba loại, mỗi loại có ngân hàng, số tiền, ngày phát hành, ngày hết hạn, file, và **nhắc gia hạn**:

- Bảo lãnh thực hiện hợp đồng
- Bảo lãnh tạm ứng
- Bảo lãnh bảo hành

*(02/10)* Nhánh `baoLanh` **dùng chung với app Công Nợ**. Thực tế kế toán nhập bảo lãnh ở app Công Nợ (kèm phí và ký quỹ), phòng kế hoạch xem ở app này; nhập ở app này cũng được, bên kia thấy ngay. App này chỉ hiện các thư có `hopDongId` trùng hợp đồng đang mở; bảo lãnh dự thầu (chưa có hợp đồng) chỉ hiện bên app Công Nợ. Phí bảo lãnh và ký quỹ do app Công Nợ quản, app này không hiện. Khi nhập `thanhToan.thuHoiTamUng`, app Công Nợ sẽ đọc để giảm ký quỹ bảo lãnh tạm ứng — vì vậy **không được đổi tên trường `thuHoiTamUng`**.

**Bảo hành**

- Theo dõi **cả hai hình thức**: chủ đầu tư giữ tiền, hoặc mình nộp bảo lãnh bảo hành để nhận đủ tiền. Một hợp đồng có thể dùng một hoặc cả hai.
- **Khi phát hành thư bảo lãnh bảo hành thì tiền giữ bảo hành được trả về.** Trong app, lúc nhập bảo lãnh loại `baoHanh`, hỏi luôn "Đã nhận lại tiền giữ bảo hành chưa?" — nếu có thì tự tạo một bản ghi `hoanTra` loại `baoHanh` với số tiền và ngày tiền về. Từ đó ô "đang bị giữ bảo hành" giảm về 0 và mốc nhắc chuyển sang ngày hết hạn của thư bảo lãnh.
- Tiền giữ bảo hành cũng được trả về khi hết thời gian bảo hành (trường hợp chủ đầu tư giữ tiền tới cùng). Cả hai trường hợp đều ghi vào `hoanTra`.
- Thời gian bảo hành tính từ **ngày nghiệm thu hoàn thành bàn giao đưa vào sử dụng**. Thường 12 hoặc 24 tháng. Không có hợp đồng bảo hành nhiều giai đoạn.

**Nhắc hạn** — bốn loại mốc:

1. Hết hạn bảo hành (để làm hồ sơ xin hoàn trả tiền bảo hành)
2. Hết hạn bảo lãnh (cả ba loại)
3. Ngày hoàn thành theo hợp đồng sắp đến (tránh bị phạt tiến độ)
4. (dự phòng) mốc do người dùng tự thêm

Cách nhắc: **nhắc trước 1 tháng, sau đó cứ 5 ngày nhắc một lần, nhắc cho đến khi có người ấn "Đã xong"**. Nhắc bằng thông báo đẩy lên màn hình điện thoại, không cần mở app. Không cần trang "Việc cần làm" riêng, nhưng trên dashboard có ô đếm số việc đang nhắc.

**Quyết toán**

- Theo dõi: ngày nộp hồ sơ, ngày được duyệt, giá trị được duyệt, đã nhận đủ tiền hay chưa, còn nợ bao nhiêu.
- "Chờ quyết toán" trên dashboard = danh sách hợp đồng đã xong việc nhưng chưa được duyệt quyết toán, kèm số tiền còn đọng.

**Người dùng và quyền**

- Người dùng: **lấy đúng danh sách người dùng của app Duyệt Chi** (anh Dũng - giám đốc, Hiền - phó giám đốc, Trang - thủ quỹ, kế toán Hằng, Ngọc, Kim Anh, Bảo, và những người phòng kế hoạch đã có trong Duyệt Chi). Người phòng kế hoạch nhập số liệu như kế toán, không khác gì. Danh sách quản lý trong app, thêm bớt được.
- **Ai có trong app đều được tạo và sửa** mọi thứ. Không có bước duyệt: nhập xong là có hiệu lực ngay.
- **Chỉ giám đốc được xóa.** Người khác muốn xóa thì bấm "Yêu cầu xóa", giám đốc đồng ý mới xóa.
- Ai cũng thấy cả ba công ty.
- **Mọi thay đổi số liệu đều ghi lịch sử**: ai sửa, lúc nào, trường nào, giá trị cũ, giá trị mới.

**Dashboard (màn hình đầu tiên)**

- Bộ lọc công ty: PVA / 379 / 279 / Cả 3 (đã trừ nội bộ).
- Sáu ô số to: tổng giá trị hợp đồng đang thực hiện; đã nghiệm thu lũy kế; tiền đã về lũy kế; còn phải thu; đang bị giữ bảo hành; đang bị giữ chờ quyết toán.
- Dòng tiền: chọn xem **theo tháng hoặc theo quý**, có **bảng số** và **biểu đồ**, hai cột **kế hoạch tiền về** và **thực tế về** để so sánh. Kế hoạch tiền về **nhập trong từng hợp đồng, theo từng tháng** (tab "Kế hoạch tiền về" trong chi tiết hợp đồng: một bảng tháng — số tiền dự kiến). Dashboard tự cộng các hợp đồng lại theo tháng, gộp thành quý khi chọn xem quý.
- Danh sách "Chờ quyết toán" kèm tiền còn đọng.
- Ô đếm việc đang nhắc.

**Bảng danh sách hợp đồng** — cột: công ty, số hợp đồng, tên gói thầu, chủ đầu tư, giá trị hiện hành, đã nghiệm thu, đã về tiền, còn phải thu, trạng thái, ngày hết bảo hành. Lọc và sắp xếp theo từng cột.

### 1.5. Công thức tính (agent phải dùng đúng, không tự chế)

```
giaTriHienHanh      = giaTriGoc + Σ phuLuc.giaTriDieuChinh          (phụ lục có thể âm)
nghiemThuLuyKe      = Σ thanhToan.giaTriNghiemThu
tamUngLuyKe         = Σ tamUng.soTien
thuHoiTamUngLuyKe   = Σ thanhToan.thuHoiTamUng
tamUngChuaThuHoi    = tamUngLuyKe − thuHoiTamUngLuyKe
thucNhanLuyKe       = Σ thanhToan.soTienThucNhan
tienDaVe            = tamUngLuyKe + thucNhanLuyKe
giuBaoHanhDangGiu   = Σ thanhToan.giuBaoHanh − Σ hoanTra.baoHanh
giuQuyetToanDangGiu = Σ thanhToan.giuQuyetToan − Σ hoanTra.quyetToan
conPhaiThu          = nghiemThuLuyKe − thuHoiTamUngLuyKe − thucNhanLuyKe
                      (trong đó tách riêng phần đang bị giữ bảo hành và giữ quyết toán)
doanhThuCuoiCung    = quyetToan.giaTriDuyet nếu đã duyệt, ngược lại = giaTriHienHanh
ngayHetBaoHanh      = ngayNghiemThuBanGiao + thoiGianBaoHanhThang
Cả 3 công ty        = Σ các hợp đồng có noiBo = false
```

Tiền lưu bằng **số nguyên VND**, không dùng số thập phân. Ngày lưu dạng `YYYY-MM-DD`.

### 1.6. Các điểm đã chốt thêm ngày 30/09/2026

- Kế hoạch tiền về: nhập trong từng hợp đồng theo từng tháng; dashboard tự cộng.
- Không tách thuế GTGT trong từng đợt thanh toán.
- OneDrive: giai đoạn đầu chỉ dán link. Tải lên tự động để sau khi app chạy ổn vài tháng, hoặc bỏ nếu Google Drive đủ dùng.
- Mã đang viết dở: sửa theo file này, thiếu tự bổ sung, thừa tự bỏ (xem mục 1.2).

Chốt thêm ngày 02/10/2026 (khi lập app Công Nợ):

- Dùng chung Firebase project và danh sách người dùng + PIN với app Công Nợ.
- Bảng `baoLanh` đổi sang dạng phẳng, dùng chung; thêm loại dự thầu; phí và ký quỹ do app Công Nợ quản.
- File Excel thật của kế toán (Đại Thành) là chuẩn để thiết kế mẫu nhập liệu.

Hiện **không còn việc nào chờ chốt**. Phát sinh mới thì ghi vào đây trước, sửa mã sau.

---

## 2. ABOUT US — Về chúng tôi

*Mục này để agent hiểu mình đang làm việc cho ai, giọng điệu và cách làm việc mong muốn. Người mới tham gia dự án đọc để biết bối cảnh.*

**Người ra quyết định:** anh Võ Văn Dũng, Giám đốc Công ty CP Xây lắp công trình Phúc Vinh An (PVA 379), Vinh, Nghệ An. Kỹ sư cầu đường, làm giám đốc từ 2009. Anh Dũng không phải lập trình viên. Anh sửa mã bằng Claude Code với câu lệnh tiếng Việt tự nhiên, nên mã phải dễ đọc, đặt tên biến tiếng Việt không dấu, chú thích tiếng Việt có dấu.

**Ba công ty:** PVA, 379, 279 — cùng một bộ máy điều hành và kế toán, làm cầu đường, hộ lan, cọc khoan nhồi trên khắp cả nước (Nghệ An, Huế, Đà Nẵng, Hà Nội, Phú Thọ...). Thường xuyên dự thầu liên danh với đơn vị khác.

**Người dùng hằng ngày:** kế toán và thủ quỹ nhập số liệu; giám đốc và phó giám đốc xem dashboard, chủ yếu trên **iPhone**. Sóng ở công trường chập chờn; văn phòng thì ổn.

**Hai app đã có, cùng cách làm:**

- **Duyệt Chi** (`github.com/vandung0802/Duyet-Chi`): duyệt chi phí, một file `index.html`, Firebase, đồng bộ Google Sheets bằng JSONP, đăng nhập tên + PIN, web push. **App Hợp Đồng kế thừa cách đăng nhập, cách gọi Apps Script và cách gửi push từ app này.**
- **Tiến độ PVA-379** (`github.com/vandung0802/tien-do-pva-379`): theo dõi tiến độ, có bản điện thoại `/m/` chữ 16px, nút cao 48px.

**Điều anh Dũng coi trọng nhất:** số liệu hợp đồng là uy tín nhà thầu. Sai một con số là có thể mất tiền hoặc bị phạt. App phải tính đúng, ghi lại ai sửa gì, và không bao giờ tự đoán số.

**Cách anh Dũng muốn được trả lời:** ngắn gọn khi việc gấp, phân tích kỹ khi việc lớn. Nói tiếng Việt, không dùng thuật ngữ nếu không cần, nếu cần thì giải thích bằng ví dụ đời thường. Đề xuất phải có lý do, không thử sai.

---

## 3. RULES — Quy tắc làm việc

*Mục này là những điều agent phải tuân theo. Nếu một yêu cầu mới mâu thuẫn với quy tắc ở đây, agent phải nói ra và hỏi lại chứ không làm theo yêu cầu mới ngay.*

### 3.1. Trước khi viết mã

1. Đọc `CLAUDE.md` và `docs/BANGIAO.md` đầu phiên. Đọc `index.html` phần liên quan trước khi sửa.
2. Nói rõ **định làm gì và tại sao** bằng tiếng Việt, ngắn thôi, rồi mới làm. Việc lớn (đổi cấu trúc dữ liệu, thêm màn hình) thì trình phương án rồi chờ anh Dũng gật.
3. Không tự bịa số liệu, tên chủ đầu tư, số hợp đồng để làm dữ liệu mẫu. Cần dữ liệu thử thì ghi rõ là "MẪU" trong tên và xóa trước khi bàn giao.
4. Chia việc thành bước nhỏ, mỗi bước chạy được và kiểm tra được. Claude Code hay mất kết nối, bước nhỏ thì làm lại dễ.

### 3.2. Cấu trúc mã

5. **Toàn bộ app trong một file `index.html`.** Không tách thành nhiều file JS/CSS. Ngoại lệ bắt buộc của trình duyệt: `manifest.json`, `sw.js` (service worker cho PWA và push), thư mục `icons/`.
6. Mã Apps Script để ở `apps-script/Code.gs`, mã chạy nhắc hạn ở `scripts/`. Đây là mã chạy nơi khác, không phải một phần của app nên được tách.
7. Không dùng framework (React, Vue...) hay công cụ build (npm, webpack). HTML + CSS + JavaScript thuần. Thư viện ngoài chỉ nạp qua thẻ `<script src>` từ CDN, hiện cho phép: Firebase SDK, Chart.js (biểu đồ), SheetJS (đọc/xuất Excel). Muốn thêm thư viện khác phải hỏi.
8. Tên biến, hàm, khóa dữ liệu: tiếng Việt không dấu, viết kiểu `chuThuongDauChu` (ví dụ `giaTriHienHanh`, `ngayHetBaoHanh`). Chú thích trong mã: tiếng Việt có dấu, viết cho người không rành lập trình đọc được.
9. Mỗi màn hình là một khối rõ ràng trong file, có dòng chú thích đầu khối kiểu `// ===== MÀN HÌNH: Danh sách hợp đồng =====` để tìm bằng Ctrl+F.
10. Giao diện: theo cái anh Dũng đang viết dở. Chữ tối thiểu 16px, nút bấm cao tối thiểu 44px trên điện thoại. Số tiền hiện có dấu chấm ngăn hàng nghìn (`15.900.000.000`), ngày hiện `dd/mm/yyyy`.

### 3.3. Dữ liệu

11. Firebase là nguồn sự thật duy nhất. Google Sheets chỉ là bản sao để xem, **không ghi ngược từ Sheets về Firebase**.
12. Tiền: số nguyên VND. Ngày: chuỗi `YYYY-MM-DD`. Thời điểm ghi lịch sử: ISO 8601 có múi giờ.
13. Mọi thao tác ghi (tạo, sửa) phải kèm một bản ghi vào `lichSu/`: ai, lúc nào, bảng nào, bản ghi nào, trường nào, cũ, mới. Không có ngoại lệ.
14. **Không có nút xóa thật cho người không phải giám đốc.** Xóa = chuyển sang `yeuCauXoa/`, giám đốc duyệt mới xóa, và bản ghi xóa cũng ghi vào `lichSu/`.
15. Không sửa Firebase Security Rules, không đổi cấu hình Firebase, không đổi Apps Script đang chạy mà không nói trước và có bản sao lưu.
16. Nhập từ Excel phải theo file mẫu do app xuất ra (`mau/mau-nhap-hop-dong.xlsx`). Trước khi ghi vào Firebase phải hiện bảng xem trước, báo dòng lỗi, người dùng bấm xác nhận mới ghi.
17. Công thức tính chỉ dùng đúng mục 1.5. Muốn đổi công thức phải hỏi anh Dũng, vì công thức là nghiệp vụ, không phải kỹ thuật.
17b. *(02/10)* Nhánh dùng chung với app Công Nợ (`congTy`, `nguoiDung`, `baoLanh`, `nhacNho`, `yeuCauXoa`, `lichSu`): được **thêm** trường, **không đổi tên, không xóa** trường đang có, không đổi cấu trúc — app kia đang đọc. Mọi ghi vào `lichSu`, `nhacNho`, `yeuCauXoa` phải có `app = "hopDong"`. Không đọc, không ghi vào `congNo/`.

### 3.4. Nhắc hạn và thông báo

18. Nhắc trước 30 ngày, lặp mỗi 5 ngày, dừng khi ấn "Đã xong". Ai ấn "Đã xong" thì ghi tên và giờ.
19. Kịch bản nhắc chạy trên GitHub Actions lúc 07:00 giờ Việt Nam mỗi ngày. Phải chạy được cả khi không có ai mở app.
20. Nội dung thông báo ngắn, có tên gói thầu, loại mốc, số ngày còn lại. Ví dụ: `Cầu Trà Ly — hết bảo lãnh thực hiện HĐ sau 12 ngày`.

### 3.5. Kiểm tra và bàn giao

21. Sau mỗi thay đổi, tự kiểm tra trên trình duyệt máy tính và mô phỏng màn hình iPhone. Kiểm tra phép tính bằng một hợp đồng thử có đủ tạm ứng, thanh toán, phụ lục âm dương.
22. Không đánh dấu việc "xong" khi còn lỗi hoặc chưa kiểm tra.
23. Cuối mỗi phiên làm việc, cập nhật `docs/BANGIAO.md`: đã làm gì, còn gì, chỗ nào đang lỗi. Phiên sau đọc file này để nối tiếp.
24. Commit bằng tiếng Việt, ngắn, nói rõ làm gì: `Thêm màn hình nhập đợt thanh toán`, `Sửa công thức còn phải thu`.
25. Không bao giờ đưa khóa API, PIN, hay mật khẩu vào mã. Cấu hình Firebase công khai (apiKey, databaseURL) để ở đầu `index.html` trong một khối `CAU_HINH` để dễ tìm.

### 3.6. Khi không chắc

26. Hỏi. Một câu hỏi tốn 1 phút; sửa lại việc làm sai tốn 1 buổi. Nhưng gom câu hỏi lại, hỏi một lượt, đừng hỏi từng câu lắt nhắt.

---

## 4. FOLDER STRUCTURE — Cấu trúc thư mục và dữ liệu

*Mục này vẽ bản đồ kho mã và bản đồ dữ liệu trong Firebase. Người không kỹ thuật chỉ cần nhớ: app nằm trong `index.html`, dữ liệu nằm trên Firebase, file scan nằm trên Google Drive.*

### 4.1. Thư mục trong repo

```
hop-dong-pva-379-279/
│
├── CLAUDE.md                  ← file này
├── README.md                  ← giới thiệu ngắn, cách mở app, cách cài lên iPhone
│
├── index.html                 ← TOÀN BỘ APP: giao diện + logic + gọi Firebase
├── manifest.json              ← khai báo PWA (tên app, icon, màu)
├── sw.js                      ← service worker: cài app, nhận thông báo đẩy
├── icons/                     ← icon app các cỡ (192, 512)
│
├── apps-script/
│   └── Code.gs                ← Google Apps Script: nhận dữ liệu từ app,
│                                 ghi vào Google Sheets, tải file lên Drive
│
├── scripts/
│   └── nhac-han.js            ← kịch bản Node chạy bởi GitHub Actions:
│                                 đọc Firebase, tìm mốc đến hạn, gửi push
├── .github/
│   └── workflows/
│       └── nhac-han.yml       ← lịch chạy 07:00 giờ VN mỗi ngày
│
├── mau/
│   └── mau-nhap-hop-dong.xlsx ← file Excel mẫu để nhập dữ liệu ban đầu
│
└── docs/
    ├── BANGIAO.md             ← nhật ký bàn giao giữa các phiên làm việc
    ├── huong-dan-su-dung.md   ← hướng dẫn cho kế toán (viết sau khi app chạy)
    └── cai-dat-firebase.md    ← các bước tạo Firebase, Apps Script, GitHub Actions
```

### 4.2. Bố cục bên trong `index.html`

Vì cả app nằm trong một file, file phải chia khối rõ, theo đúng thứ tự này:

```
<head>
  CSS toàn bộ app

<body>
  1.  CAU_HINH            — cấu hình Firebase, URL Apps Script, hằng số (30 ngày, 5 ngày)
  2.  DU_LIEU_TINH        — danh sách công ty, trạng thái, loại hợp đồng, loại bảo lãnh
  3.  DANG_NHAP           — chọn tên + PIN, lưu phiên vào localStorage
  4.  KET_NOI_FIREBASE    — đọc/ghi, lắng nghe thay đổi
  5.  LICH_SU             — hàm ghiLichSu() dùng chung cho mọi thao tác ghi
  6.  TINH_TOAN           — toàn bộ công thức mục 1.5, thuần túy, không đụng giao diện
  7.  MÀN HÌNH: Dashboard
  8.  MÀN HÌNH: Danh sách hợp đồng
  9.  MÀN HÌNH: Chi tiết hợp đồng (tab: Thông tin / Phụ lục / Tạm ứng /
                Thanh toán / Bảo lãnh / Bảo hành & Quyết toán /
                Kế hoạch tiền về / File / Lịch sử)
  10. MÀN HÌNH: Nhắc hạn (danh sách đang nhắc, nút Đã xong)
  11. MÀN HÌNH: Nhập từ Excel (xem trước → xác nhận)
  12. MÀN HÌNH: Quản trị (người dùng, công ty, yêu cầu xóa — giám đốc)
  13. XUAT_EXCEL          — xuất dashboard, danh sách hợp đồng
  14. THONG_BAO_DAY       — đăng ký push, lưu token vào Firebase
  15. DONG_BO_SHEETS      — gọi Apps Script kiểu JSONP
  16. KHOI_DONG           — chạy khi mở trang
```

### 4.3. Cấu trúc dữ liệu trên Firebase Realtime Database

Mỗi nhánh dưới đây là một "bảng". Khóa `{id}` do Firebase sinh (`push()`), trừ `congTy` dùng khóa cố định `PVA`, `379`, `279`.

```
/
├── congTy/{PVA|379|279}
│     ten, tenVietTat, maSoThue, nguoiDaiDien, diaChi
│
├── nguoiDung/{id}
│     ten, vaiTro ("GD" | "NV"), pinHash, boPhan, dangHoatDong
│     pushTokens/{token}: true
│
├── hopDong/{id}
│     congTyId, soHopDong, ngayKy, chuDauTu, tenGoiThau, tenDuAn
│     loaiHopDong ("tronGoi" | "donGiaCoDinh" | "donGiaDieuChinh")
│     giaTriTruocThue, thue, giaTriGoc          ← giaTriGoc = sau thuế, phần của mình
│     lienDanh: { co (bool), tyLe, tongGiaTriLienDanh, thanhVienKhac }
│     noiBo: { co (bool), hopDongGocId }        ← giao khoán nội bộ
│     thoiGianThucHien, ngayKhoiCong, ngayHoanThanhHopDong
│     trangThai
│     baoHanh: { hinhThuc ("giuTien"|"baoLanh"|"caHai"),
│                ngayNghiemThuBanGiao, soThang (12|24), ngayHetBaoHanh }
│     quyetToan: { ngayNop, ngayDuyet, giaTriDuyet, daNhanDu (bool), conNo }
│     keHoachTienVe/{YYYY-MM}: soTien           ← kế hoạch theo tháng, dashboard cộng thành quý
│     fileDinhKem/{id}: { ten, link, nguon ("drive"|"onedrive"), nguoiTai, luc }
│     taoBoi, taoLuc, suaBoi, suaLuc
│
├── phuLuc/{hopDongId}/{id}
│     soPhuLuc, ngayKy, loai ("giaHan"|"dieuChinhGia"|"caHai")
│     giaTriDieuChinh (số nguyên, có thể âm), ngayHoanThanhMoi, noiDung
│     fileDinhKem/{id}
│
├── tamUng/{hopDongId}/{id}
│     dot, ngay, soTien
│     baoLanh: { nganHang, soTien, ngayPhatHanh, ngayHetHan, fileId }
│
├── thanhToan/{hopDongId}/{id}
│     dot, ngayNghiemThu, giaTriNghiemThu, soTienDeNghi
│     thuHoiTamUng, giuBaoHanh, giuQuyetToan
│     soTienThucNhan, ngayTienVe, ghiChu
│     fileDinhKem/{id}
│
├── hoanTra/{hopDongId}/{id}                    ← nhận lại tiền giữ bảo hành / quyết toán
│     loai ("baoHanh"|"quyetToan"), ngay, soTien, ghiChu
│     lyDo ("phatHanhBaoLanh"|"hetBaoHanh"|"duyetQuyetToan"|"khac")
│     baoLanhId                                  ← nếu trả tiền do phát hành thư bảo lãnh
│
├── baoLanh/{id}                                ← (02/10) DÙNG CHUNG với app Công Nợ, dạng phẳng
│     app ("hopDong"|"congNo")                  ← app nào tạo
│     loai ("duThau"|"thucHienHopDong"|"tamUng"|"baoHanh")
│     hopDongId (bắt buộc với 3 loại sau; dự thầu thì để trống, ghi tenGoiThau)
│     nganHangId (trỏ congNo/nganHang) hoặc nganHang (tên, nếu nhập từ app này)
│     congTyId, soThu, soTien, ngayPhatHanh, ngayHetHan, daGiaHan
│     phi, kyQuy, keToanTheoDoi                 ← app Công Nợ ghi; app này không đụng
│     fileDinhKem/{id}
│
├── nhacNho/{id}                                ← (02/10) dùng chung, có trường app
│     app ("hopDong"|"congNo")
│     hopDongId, loai ("hetBaoHanh"|"hetBaoLanh"|"hoanThanhHopDong"|"khac")
│     thamChieuId, ngayMoc, ngayNhacTiep, soLanDaNhac
│     daXong (bool), nguoiXong, lucXong
│
├── yeuCauXoa/{id}                              ← (02/10) dùng chung, có trường app
│     app, bang, banGhiId, nguoiYeuCau, luc, lyDo
│     trangThai ("cho"|"dongY"|"tuChoi"), nguoiDuyet, lucDuyet
│
├── lichSu/{id}                                 ← (02/10) dùng chung, có trường app
│     app, nguoi, luc, bang, banGhiId, hopDongId
      hanhDong ("tao"|"sua"|"xoa")
      truong, giaTriCu, giaTriMoi
│
└── congNo/                                     ← (02/10) dữ liệu riêng của app Công Nợ,
                                                   app này KHÔNG đọc, KHÔNG ghi
```

Ghi chú cho người đọc không kỹ thuật:

- `hopDong` là bảng chính. Mỗi hợp đồng có các bảng con `phuLuc`, `tamUng`, `thanhToan`, `hoanTra` treo bên dưới theo `hopDongId`. Riêng `baoLanh` nằm phẳng ở gốc và nối với hợp đồng bằng trường `hopDongId`, vì app Công Nợ cũng dùng.
- Các con số tổng (giá trị hiện hành, đã nghiệm thu, tiền về, còn phải thu) **không lưu** trong Firebase mà app **tự tính** mỗi lần hiển thị từ các bảng con, theo công thức mục 1.5. Làm vậy để không bao giờ lệch giữa số tổng và số chi tiết.
- `lichSu` là sổ ghi ai làm gì. Chỉ thêm, không sửa, không xóa.

### 4.4. Google Sheets (bản sao để xem)

Một file Google Sheets, mỗi bảng Firebase là một sheet cùng tên: `hopDong`, `phuLuc`, `tamUng`, `thanhToan`, `baoLanh`, `hoanTra`, `nhacNho`, `lichSu`. Thêm sheet `TongHop` do Apps Script tính sẵn để kế toán mở ra là thấy dashboard dạng bảng. Apps Script ghi đè toàn bộ sheet mỗi lần đồng bộ, không ghi từng dòng.

### 4.5. Google Drive (file đính kèm)

Thư mục gốc `Hop Dong PVA-379-279` trong Drive của vandung0802@gmail.com. Bên trong mỗi hợp đồng một thư mục con đặt tên `[Công ty] Số hợp đồng — Tên gói thầu`. Apps Script tạo thư mục nếu chưa có, tải file lên, đặt quyền "Bất kỳ ai có link đều xem được", trả link về cho app ghi vào Firebase.

---

*Hết. Có gì mâu thuẫn giữa file này và mã đang có thì mã phải sửa theo file, trừ khi anh Dũng nói khác — khi đó sửa file này trước, rồi mới sửa mã.*
