# App PVA-379 — nhật ký bàn giao

`pva-379.html`: app duyệt chi + sổ quỹ của công ty. Chạy tại https://vandung0802.github.io/Duyet-Chi/pva-379.html

## SỔ MỚI — D chốt 25/11/2026 ("xóa toàn bộ dữ liệu của app PVA-379 thành sổ mới và không link từ duyệt chi sang nữa. để tôi quyết toán sổ cũ và làm sổ mới")
- Lý do: 2 app lệch số vì PVA-379 là bản chép đóng băng lúc 11:23 22/11, Duyệt Chi vẫn chạy thật. D quyết: **Duyệt Chi = sổ cũ, chỉ còn để quyết toán phiếu cũ; PVA-379 = sổ mới, bắt đầu trống.**
- Đã xoá bằng tác vụ GitHub **"Xoa du lieu PVA-379 (so moi)"** (`.github/workflows/xoa-du-lieu-pva379.yml`, gõ `XOA`; để trống = chạy thử chỉ đếm; kịch bản `scripts/xoa-du-lieu-pva379.js`, chỉ đụng `/pva379/`, hàm `kiemDich` chặn mọi đường khác):
  - XOÁ: proposals, images, khProposals, khImages, khChat, khChatPin, khChatRead, groupChat, chatPin, chatRead, plans, salaryAdvances, cashflow, bankBalance, advPeople, trash, pendingOtp, online, meta/cashStart, meta/copiedFrom, và số dư đầu kỳ `meta/accounts/<tk>/open`.
  - GIỮ: userRoles (tài khoản + vai D đã cấp), employees, meta/accounts (tên, nhóm, thứ tự, ẩn), meta/accountsSeeded, meta/persons, meta/sites, meta/sheetUrl, telegram.
  - Ảnh đã tải lên Storage trong lúc thử (`duyetchi/<phiếu>/…`) không xoá (không có khoá Storage trong Actions; chỉ chiếm chỗ, không ai thấy).
- **Đã chạy thật 25/11/2026 16:06 VN** (run 45582216176, success): xoá 1.740 phiếu, 1.615 ảnh, 82 phiếu P.KH, 71 ảnh P.KH, 30 tin chat nhóm, 4 chat P.KH, 1 kế hoạch vật tư, 2 ứng lương, `meta/copiedFrom`; sổ quỹ/đối chiếu/tạm ứng/thùng rác vốn trống; số dư đầu kỳ chưa ai nhập; giữ nguyên 25 tài khoản ngân hàng + userRoles.
- Đã GỠ kịch bản chép `scripts/chep-duyetchi-sang-pva379.js` + workflow `chep-du-lieu-pva379.yml` (còn trong lịch sử git nếu cần). App v9 không còn đọc gì ở `duyetchi/`: bỏ dòng "bản chép" ở Cài đặt, bỏ fallback mốc đầu kỳ theo `meta/copiedFrom`, đăng nhập lần đầu của D không đọc `duyetchi/userRoles` nữa.
- Mốc đầu kỳ: chưa đặt → không có mốc, Cân đối tính mọi khoản. Kế toán / thủ quỹ vào Cài đặt → Tài khoản đặt ngày bắt đầu sổ mới + số dư từng tài khoản + khoản vay còn nợ.
- Còn nguyên: `PUSH_TRIAL=true`, `TRIAL_ROLES=['dung','hien','ketoan']`. Muốn cả công ty lập phiếu mới ở đây thì D nói "phát hành".
- Việc nên làm trước/khi phát hành: hàm `functions/push379.js` kiểm người gửi thông báo bằng `duyetchi/userRoles/<uid>/approved`; người mới chỉ có hồ sơ ở `pva379/userRoles` sẽ bị xếp nhóm "chưa duyệt" (vẫn gửi được nhưng bị giới hạn tần suất). Cần sửa hàm đọc thêm `pva379/userRoles` và D đưa hàm lên (chưa có tác vụ tự động cho functions).

## Gốc và nguyên tắc (D chốt 19/11/2026)
- **Luật sắt (D 22/11): PVA-379 không được ảnh hưởng app Gia Bình** — không đụng file, project, dữ liệu, khoá máy, service worker, đăng ký thông báo của Gia Bình (xem CLAUDE.md). Kiểm tra 22/11: `pva-379.html` không còn chuỗi nào trỏ tới Gia Bình; file Gia Bình chỉ đổi đúng bản vá v121 D duyệt.
- **Gốc là app Sổ Quỹ Gia Bình v121** (`giabinh.html`), thêm vào những phần của app Duyệt Chi v188 (`app3.html`) mà Gia Bình còn thiếu.
- Gia Bình vẫn chạy riêng như cũ. App Duyệt Chi cũ cũng vẫn chạy nguyên, đến khi D nghiệm thu PVA-379 xong và bảo chuyển dữ liệu.
- **Firebase: project 379**, dùng chung tài khoản đăng nhập với app Duyệt Chi, nhưng dữ liệu ở **nhánh riêng `pva379/`**, không đọc/ghi nhánh `duyetchi/`.
- Kèm theo: `sw-pva379.js` (phạm vi `./pva-379.html`), `version-pva379.txt`, `manifest-pva379.json`. Màu chàm `#4338ca`. Khoá trong máy: `pv_*`.

## Vai
| Mã vai | Người | Quyền |
|---|---|---|
| `dung` | Dũng (email cố định) | duyệt D, quản trị, sửa danh sách tài khoản / công trình / người |
| `hien` | Hiền | duyệt H (bước 2) |
| `thuquy` | Thủ quỹ (mặc định Trang, D gán ai cũng được trong Cài đặt) | chuyển tiền, ghi Cân đối |
| `ketoan` | Kế toán (D thêm sau) | rà soát, **thấy hết phiếu**, xem Cân đối |
| `vattu` | Phụ trách vật tư (tuỳ chọn) | như thành viên |
| `other` | Thành viên | lập phiếu, chỉ thấy phiếu của mình |

Gia Bình gọi thủ quỹ là `toan`, vật tư là `trang`. Ở đây đã đổi thành `thuquy` / `vattu`. Các cổng P.KH kế thừa từ app 379 (chỗ `'trang'` nghĩa là thủ quỹ) đã đổi thành `thuquy`.

## Phần lấy từ Duyệt Chi
- `_chuaTaiXong()` (v180): chặn gửi / duyệt / chuyển / từ chối / sửa / xoá khi dữ liệu chưa tải xong.
- Ghi phiếu theo trường (v180). Gia Bình v121 cũng đã có.
- `_canSeeP()` (v187): ai thấy phiếu nào. D, Hiền, kế toán thấy hết. Thủ quỹ thấy phiếu mình + phiếu đã duyệt. Người khác thấy phiếu mình + phiếu bị @nhắc. **Chỉ lọc lúc hiển thị.**
- `_ownerNames()` (v188): báo người lập phiếu. Bỏ kênh phòng ở thông báo phiếu mới / P.KH / ứng lương.
- P.KH bật lại (`_khCanSee`): nút ngay sau Đề xuất. Cài đặt có lại nhãn phòng và nút chuyển phòng.

## Sổ quỹ công ty (khác Gia Bình)
- **Tài khoản tự khai** ở `pva379/meta/accounts/<mã>` = `{name, group, order, off}`. Chỉ Dũng ghi (luật meta).
  - Thẻ "Tài khoản & nguồn tiền" trong Cài đặt có nút nạp sẵn theo sơ đồ D vẽ 19/11: CT 379 (8 TK, BIDV đã gạch), CT PVA (9), CT 279 (4), CT THHD (1), Tiền mặt (TP/Tech/Vietin Trang).
  - Tài khoản đã có giao dịch thì chỉ **ẩn** (`off`), không xoá.
  - **Tự nạp lần đầu** (D chốt 19/11 "chạy tự động"): Dũng mở app mà chưa có danh sách → `_autoSeedAccounts()` tự nạp. Cờ `meta/accountsSeeded` (transaction) chống 2 máy nạp trùng.
- **Hồ sơ Dũng tự tạo** lần đầu đăng nhập (`role:'dung'`, tên lấy từ `duyetchi/userRoles/<uid>/name`). Không có hồ sơ này thì luật máy chủ chặn mọi lệnh ghi của Dũng. Người khác đăng nhập lần đầu → nhập tên → D cấp quyền + vai trong Cài đặt.
- `CASH_ACCT` là object động (`_loadAccounts` chạy mỗi khi meta đổi). `CASH_ACCT._none` (không liệt kê) là chỗ dự phòng khi chưa có tài khoản nào.
- Tổng quan: cột theo **nhóm công ty** (`ACCT_GROUPS`) + bảng **Theo công trình** (`cashBySite`).
- Sổ quỹ: ô từng tài khoản gom theo công ty (`<details>`), lọc `g:<nhóm>` hoặc theo mã TK.
- Khoản thu / ký quỹ có trường `site` (công trình). Nguồn thu: `cdt` / `tc` (thầu chính) / `other`.
- Bỏ: Trả lại vốn góp (`ret`), sổ Hợp đồng, Luân chuyển. Menu Khác có nút mở app Hợp đồng / Công nợ / Thiết bị.
- Giữ tab **Vay** cho vay ngoài (Vay A, Vay B…), theo D chốt 19/11. Vay ngân hàng do app Công nợ theo dõi; trả nợ ngân hàng ghi phiếu chi loại `tranovay`.
- Xoá khoản Cân đối: Dũng xoá thẳng; hoặc Hiền đồng ý một đề nghị của **người khác** (`deleteReq/ok/hien1`). Hiền tự đề nghị thì phải chờ Dũng.
- Cân đối chỉ D / Hiền / thủ quỹ / kế toán xem (`_cashCanSee`), luật máy chủ cũng chặn đọc `cashflow` và `bankBalance`. Nhân viên chỉ vào tab Tạm ứng (sổ của mình).

## v21 (D 26/11/2026): Trả gốc / trả phí + lãi vay ngân hàng cho khoản vay cũ KHÔNG nhập sổ
Nguyên văn D: "thêm 1 mục trả phí và lãi vay ngân hàng, 1 mục trả gốc vay ngân hàng. Cái này dùng cho những khoản cũ không nhập lại trên sổ".
- `cashflow` type **`bankpay`** `{kind:'goc'|'laiphi', bank, amount, acct, date, desc}`. Thủ quỹ / Hiền ghi (tab Vay: 2 nút 🏦), trừ tài khoản ngay, **không qua duyệt**, **không đụng "Còn nợ vay"** (vì khoản vay không có trong sổ). Sửa sai → đề nghị sửa (v19; trường `bank` thêm vào `changes`).
- `cashTotals`: `bankGoc`, `bankLaiPhi`, `byRow.gocNH` / `laiPhiNH`; `tienTrongTk` trừ cả hai. Tổng quan: 2 hàng trong Tiền ra. Tab Vay: mục "TRẢ NGÂN HÀNG — KHOẢN VAY CŨ KHÔNG NHẬP SỔ" (`renderBankPays`): tổng gốc / phí+lãi, tổng theo từng ngân hàng, danh sách thẻ (đổi TK, sửa, xoá). Sổ quỹ / biểu đồ / Excel tháng / Sheet (`loai`, `src` = ngân hàng) tính là tiền ra.
- Luật: `type` thêm `bankpay`; `kind` ∈ {goc, laiphi} đóng băng; `bank` ≤200 đóng băng (mở qua editReq).
- Thử: luật 92/92 (+6), Chromium `smoke12` 7/7.
- **v22 (D 26/11 "phải chọn đúng ngân hàng công ty thì mới trừ đúng TK")**: lỗi v21 — ô "Trả từ tài khoản" của form trả NH không nằm trong `_refreshAcctSelects` nên TRỐNG, mọi khoản bị trừ vào TK mặc định. Đã thêm `bankpay-inp-acct` vào danh sách; nhãn đổi "Trả từ tài khoản (công ty · ngân hàng)". smoke12 9/9 (chọn TK CT PVA · MSB → trừ đúng TK đó).
- **v23 (D 26/11 "bấm mũi tên ở mục ngân hàng không thấy tài khoản công ty")**: form trả NH đưa ô **Trả từ tài khoản công ty** lên đầu (kèm chú thích), ô "Trả cho ngân hàng nào" xuống dưới và gợi ý sẵn tên các ngân hàng công ty đang có tài khoản (`_bankNames` lấy từ `CASH_ACCT`, bỏ nhóm Tiền mặt) cộng tên đã gõ. smoke12 10/10.

## v20 (D 26/11/2026): trả nợ "mồ côi" + chặn ghi trùng
Sự cố: D ghi khoản vay nhập sai, Trang ghi trả nợ 696,9tr cho nó, D xoá khoản vay → lần trả nợ còn lại (không có khoản vay) vẫn nằm trong Sổ quỹ và trừ tiền; thẻ nợ cũ (khoản vay ghi lại) chỉ có 1 lần trả → "sổ Trang 2 món, nợ cũ 1 món".
- App: `_orphanRepays()` = repay có `loanId` không còn khoản vay. Tab Vay hiện khung đỏ **"N lần trả nợ KHÔNG gắn với khoản vay nào"** (`#cash-orphan-wrap`, `_orphanRepayHtml`) với nút 🔗 Gắn vào khoản vay… (chỉ Dũng — `relinkRepay`, luật `loanId` chỉ Dũng đổi) và 🗑 Xoá / Đề nghị xoá. Tổng quan có dòng cảnh báo đỏ (`_orphanWarnHtml`). Sổ quỹ: dòng trả nợ ghi rõ "vay: …" hoặc "⚠️ KHÔNG gắn khoản vay nào".
- Xoá khoản vay (`deleteCashRec`, Dũng) có lần trả nợ → hỏi: OK = xoá luôn các lần trả nợ (vào thùng rác), Huỷ = giữ (hiện ở khung mồ côi).
- **Chặn bấm đúp**: `_cashBusy()` / `_cashBusySet()` — 5 hàm lưu khoản (thu/ký quỹ, vay, trả nợ, chuyển nội bộ, chi riêng) bỏ qua lần bấm thứ hai trong lúc đang ghi / 2 giây.
- Kịch bản máy chủ `scripts/xoa-tra-no-mo-coi.js` + tác vụ **"Xoa tra no mo coi PVA-379"** (`xoa-tra-no-mo-coi.yml`, gõ `XOA`; trống = đếm): bỏ các repay mồ côi vào `pva379/trash/cashflow/<id>` rồi xoá. Nhật ký chỉ in mã bản ghi + ngày (repo công khai, không in số tiền / nội dung). Đã chạy 26/11 theo yêu cầu D.
- Thử: emulator `mocoi-test` 14/14 (bảng đỏ, kịch bản đếm/xoá, thùng rác, chặn bấm đúp, xoá vay kèm trả nợ). Luật không đổi.

## v19 (D 26/11/2026): Sửa khoản sổ quỹ nhập sai — Trang bấm sửa, Hiền duyệt
Nguyên văn D: "Các khoản nhập sai phải cho sửa, ví dụ Trang đang nhập sai số tiền cần sửa, Trang bấm sửa Hiền duyệt là được".
- Nút **✏️ Sửa** trên mọi thẻ khoản sổ quỹ (thu, ký quỹ, vay / nợ cũ, từng lần trả nợ, chi riêng) và dòng chuyển nội bộ trong Sổ quỹ. Modal `#cash-edit-modal-overlay` (`openCashEdit`) hiện đúng các trường theo loại khoản (`_ceFields`): số tiền (gốc / lãi với trả nợ), nội dung, ngày, nguồn, nơi giữ, người cho vay, lãi suất, hạn trả, của ai, đơn vị nhận. Tài khoản / công trình vẫn đổi thẳng bằng nút trên thẻ như cũ.
- Thủ quỹ / Hiền gửi **`editReq {by, byName, ts, note, changes}`** (chỉ các trường có đổi). Hộp "✏️ Đề nghị sửa" trên thẻ (`cashEditReqBox`) hiện cũ → mới; **Hiền (không phải người đề nghị) hoặc Dũng** bấm Duyệt sửa (`approveCashEdit`: ghi đè đúng các trường + gỡ `editReq` + ghi `edited {by, byName, ts, okBy, okName, fields}` trong một lần `update`) hoặc Từ chối; người đề nghị tự hủy được. Hiền tự đề nghị → chờ Dũng. Dũng mở modal thì sửa thẳng.
- Tổng quan có hộp gom "N đề nghị sửa khoản đang chờ duyệt" (`_pendingEditsHtml`) để Hiền thấy một chỗ. Sau duyệt gọi `syncCashToSheet` với bản mới.
- Luật: từng trường (amount, desc, date, principal, interest, lenderName, rate, due, holder, src, who, payee, lender) chỉ đổi được khi (a) Dũng, hoặc (b) Hiền/Dũng không phải người đề nghị, giá trị mới **bằng đúng** `editReq/changes/<trường>` và `editReq` bị gỡ trong cùng lần ghi; `editReq` chỉ thủ quỹ / Hiền / Dũng tạo, `changes` chỉ nhận đúng các trường trên; gỡ `editReq` chỉ người đề nghị / Hiền / Dũng. Khoản gắn phiếu chi (`fromProposal`) không sửa ở đây (sửa ở phiếu).
- Thử: luật 86/86 (+13), Chromium `smoke10` (Trang đề nghị 5tr→6tr, Hiền duyệt, Cân đối đổi theo; Hiền tự đề nghị không tự duyệt).

## v18 (D 26/11/2026): Đơn vị / người nhận tiền trên mọi mục chi
Nguyên văn D: "ở tất cả các mục chi có thêm tên đơn vị nhận tiền — mục đích là để lọc, ví dụ lọc được trả cho công ty thép bao nhiêu tiền, trả cho cá nhân ai bao nhiêu tiền, người đề xuất sẽ ghi".
- Trường **`payee`** (chuỗi ≤200, không bắt buộc) trên: phiếu chi (form lập `#inp-payee`, modal sửa `#edit-payee`, đóng băng sau duyệt như `site`), phiếu P.KH (`#kh-inp-payee`), chi riêng (`#rieng-inp-payee`, cashflow). Gợi ý tự động từ các tên đã dùng (`<datalist id="payee-list">`, `_fillPayeeList`). `contentSnapshot` có payee.
- Hiển thị: chip 🏢 trên thẻ phiếu + thẻ P.KH + thẻ chi riêng; tìm kiếm trang Đề xuất bắt cả payee.
- Báo cáo: ô lọc **🏢 Tất cả đơn vị nhận** (`#filter-payee`, `getFilteredProposals`) áp cho Tóm tắt / Danh sách / Đã chuyển / Chưa chuyển / Từ chối / Excel; tab con mới **🏢 Người nhận** (`renderReportPayee`): gộp theo đơn vị — số phiếu, đề xuất, đã duyệt, đã chuyển, dòng TỔNG, chạm dòng → lọc danh sách (`_payeeJump`). Chỉ phiếu chi; ứng lương / P.KH / chi riêng không gộp vào.
- Excel: Excel tháng thêm cột cuối "Đơn vị nhận" (không đụng cột I công thức); CSV tổng hợp thêm cột sau Công trình.
- Luật: `payee` ở `proposals/$id`, `khProposals/$id` (cùng điều kiện `site`), `cashflow/$id` (đóng băng như `desc`).
- Chưa làm: Google Sheet chưa có cột đơn vị nhận (mẫu Apps Script cố định cột) — làm khi D nối Sheet.
- Thử: luật 73/73 (+5), Chromium `smoke9` (form lưu payee, chip, tìm kiếm, bảng Người nhận, lọc, modal sửa).

## v17 (D 26/11/2026 "Cho H đủ các quyền như thủ quỹ")
- Phần còn lại: **chuyển tiền theo phiếu**. `_isTreasurer()` = thuquy | hien: nút 💸 chuyển / hoàn tác / đính ảnh chuyển khoản trên thẻ phiếu (Hiền thấy nút chuyển sau khi chính mình đã duyệt H), mục "Chờ chuyển tiền" trong nhắc việc + chuông, nhắc thiếu ảnh Zalo. Luật: `transfers` tạo / đổi tài khoản cho hien (proposals, khProposals, salary), `transferred`.
- Vẫn giữ: Hiền chỉ chuyển được khi phiếu đã có duyệt H (như thủ quỹ); kênh thông báo của Hiền vẫn là `hien`.
- Thử: luật 68/68 (+1).

## v16 (D 26/11/2026 "Bạn mở hết các Quyền cho H đi")
- Trong **sổ quỹ (Cân đối)**, Hiền = thủ quỹ: `_cashWriter()` = thuquy | hien | dung dùng cho ghi thu / ký quỹ / vay / nợ cũ / trả nợ / chuyển nội bộ / chi riêng, lấy ký quỹ về, đổi tài khoản khoản đã ghi, nhập số dư ngân hàng thật, đặt ngày + số dư đầu kỳ, xác nhận "nộp lại" trong sổ tạm ứng. Luật mở tương ứng (`type`, `returned`, `acct/from/to/site`, `bankBalance` ghi, `meta/cashStart`, `accounts/$k/open`, `settlement ok/rej` kind ret).
- Hiền ghi trả nợ thì tự duyệt được (D chọn cách 1, chấp nhận không kiểm chéo).
- **Không mở**: chuyển tiền theo PHIẾU (nút T trên phiếu) vẫn chỉ thủ quỹ; xoá khoản vẫn theo luồng đề nghị xoá.
- Thử: luật 67/67 (+7 mục v16).

## v15 (D 26/11/2026 "bật đi và mở")
- **Hiền ghi được khoản THU và KÝ QUỸ** (`cashCanWriteIn` + luật `type` cho hien tạo `in`, `dep`; vẫn không tạo vay / chuyển nội bộ / lấy ký quỹ về / đổi tài khoản khoản đã ghi).
- **Bật tự cập nhật cho nhóm thử**: `version-pva379.txt` = `20261126-v15`, `sw-pva379.js` VERSION `20261126-pv15`. Từ nay mỗi bản mới nếu D muốn nhóm thử tự lên thì bump cả 3 chỗ; người ngoài nhóm thử vẫn bị màn chặn nên không ảnh hưởng. "Phát hành" thật = đổi `PUSH_TRIAL=false`.

## Kế toán chưa được xem toàn bộ — v14 (D 26/11/2026: "kế toán chưa cho xem")
- Kế toán (vai `ketoan`) hạ xuống mức mọi người: `_canSeeP` chỉ phiếu của mình; `_cashCanSee` / `_oneAcct` / `_fullView` = dung, hien, thuquy; `_canSetOpening` = dung, thuquy (thẻ Tài khoản ở Cài đặt ẩn với kế toán). Luật: gỡ `ketoan` khỏi `bankBalance` đọc, `meta/cashStart` + `meta/accounts/$k/open` ghi. `cashflow` đọc vẫn mở chung (v10).
- Giữ nguyên việc của kế toán: nút rà soát thuế / hoá đơn / hợp đồng trên phiếu mà kế toán thấy, duyệt kê tạm ứng (`_settleCan`), kênh thông báo `kt`, vẫn trong `TRIAL_ROLES`.
- Hệ quả: số dư đầu kỳ + khoản vay cũ do **Trang (thủ quỹ) hoặc Dũng** nhập. Muốn mở lại cho kế toán: thêm `'ketoan'` vào 4 hàm trên + 3 dòng luật.
- Thử: luật 59/59 (sửa 3 mục), smoke6 (kế toán không thấy thẻ tài khoản / Cân đối / phiếu người khác), smoke7 hồi quy.

## Nợ tồn đọng cũ + Chi riêng — v11 (D chốt 25/11/2026)
Nguyên văn D: "thêm 1 mục nợ tồn đọng cũ, tức là các khoản đang nợ cũ từ trước chưa vào sổ (vay ngoài - vay cá nhân) và mục này cũng có trả nợ nhưng sẽ đi ra 1 nhánh riêng có tổng hợp riêng để dễ thấy và cuối cùng ở cân đối công ty vẫn có tổng hợp khoản này vào. D và Hiền có các khoản chi riêng - khoản này thì khi Trang chi không cần D và H duyệt, Trang thống kê lại để tổng hợp, gọi là chi riêng; Trang phải kê để cân quỹ."
- **Nợ tồn đọng cũ** = khoản `cashflow` type `loan` có cờ **`old: true`**, KHÔNG có `acct` (tiền đã nhận trước sổ mới, đã nằm trong số dư đầu kỳ). Thủ quỹ / Dũng ghi: tab Vay → nút **📜 Ghi NỢ TỒN ĐỌNG CŨ** (= modal vay với ô tick "Nợ tồn đọng cũ", ẩn chọn tài khoản, nhãn "Số CÒN NỢ hiện tại"). Trả nợ dùng đúng luồng `repay` (trừ tài khoản, Hiền duyệt).
  - `cashTotals`: `vay` (tiền vào) và `byAcct` bỏ qua `old`; `noVay` vẫn gồm tất cả; thêm **`noVayCu`** (nợ cũ còn lại). Sổ quỹ / biểu đồ / Excel tháng không ghi nợ cũ là tiền vào. Tổng quan: dòng "Trong đó nợ tồn đọng cũ" dưới bảng công trình.
  - Tab Vay: danh sách vay mới + tổng như cũ; bên dưới là mục riêng **📜 NỢ TỒN ĐỌNG CŨ** (`renderOldLoans`, `#cash-oldloan-wrap`) với tổng riêng (nợ cũ ghi nhận · đã trả gốc · còn nợ cũ · đang chờ H). Thẻ dùng chung `_loanCardHtml` (nhãn NỢ CŨ, không chip tài khoản, không nút đổi tài khoản).
- **Chi riêng** = `cashflow` type **`rieng`** `{who:'dung'|'hien', amount, acct, date, desc, by, byName, ts}`. Thủ quỹ **hoặc Hiền** (D 26/11: "Hiền vẫn có quyền nhưng Quỹ (Trang)"; Dũng quản trị) ghi, **không có pending / không ai duyệt**, trừ thẳng tài khoản (`tienTrongTk -= chiRieng`, `byRow.chiRieng`). Tab con **👤 Chi riêng** (`renderRiengList`, modal `#rieng-modal-overlay`): tổng · Dũng · Hiền + danh sách (đổi tài khoản, đề nghị xoá như khoản khác). Tổng quan: hàng "Chi riêng D / Hiền" trong Tiền ra + dòng tổng hợp theo người. Sổ quỹ / biểu đồ / Excel tháng / Sheet (`loai` = "Chi riêng", `src` = tên người) đều tính là tiền ra. KHÔNG tính vào `daChi` (chi theo phiếu) và không vào bảng công trình.
- Luật: `type` cho thủ quỹ tạo thêm `'rieng'`, Hiền chỉ tạo được `'rieng'` (không tạo thu/vay/ký quỹ); trường `who` ∈ {dung, hien}, `old` === true; cả hai đóng băng sau khi ghi (trừ Dũng). Thử 56/56 (+8 mục v11); Chromium `smoke8` 17/17 (Trang ghi nợ cũ 200 + vay 100 + chi riêng 5/3 → tiền TK 1.092, nợ 300 trong đó cũ 200; Hiền duyệt trả 50 nợ cũ → cũ 150, TK 1.042).
- 26/11 D "mở cho Trang": `TRIAL_ROLES` thêm `thuquy` (v13) — Trang vào được app, ghi thu / vay / nợ cũ / chi riêng / chuyển tiền phiếu; thông báo thử tới cả kênh thủ quỹ.

## Quyền xem — v10 (D chốt 25/11/2026)
Nguyên văn D: "Tất cả mọi người nhìn được: đề xuất của chính mình, tổng thu chi của từng công trình, nhìn thấy vật tư, thiết bị luân chuyển, xuất ra từng công trình không xuất tổng của công ty. Không nhìn thấy cân đối, không xuất ra cả công ty, không nhìn thấy tổng thu. Chỉ Dũng Hiền Trang thấy được toàn bộ."
- **Người xem toàn bộ** `_fullView()` = `_cashCanSee()` = dung, hien, thuquy (~~ketoan~~ — bỏ ở v14, D 26/11 "kế toán chưa cho xem").
- **Mọi người** (vai other/vattu, không phải P.KH thuần): phiếu của mình (`_canSeeP`, như cũ); tab **Báo cáo → 🏗 Công trình** (`renderReportSite`): bảng thu về / đã chi / thu − chi / ký quỹ treo của TỪNG công trình (`_siteTableHtml({total:false})` — KHÔNG dòng TỔNG), chọn 1 công trình → **⬇️ Excel công trình** (`exportSiteExcel` / `_siteRows`: THU, CHI, ký quỹ; sheet có TỔNG THU / TỔNG CHI / THU − CHI của riêng công trình đó). Vật tư + Ứng lương + app Thiết bị/Hợp đồng/Công nợ trong menu Khác như cũ.
- **Ẩn với mọi người**: nút Cân đối (như cũ), nút 📤 Gửi Telegram (`#btn-tg-report`, `#tile-tg`), 📊 Bảng tính Google (`#btn-sheet-view`, `#tile-sheet-view`), lựa chọn "Tất cả công trình" khi xuất, dòng TỔNG. Nút ⬇️ Tải Excel ở Tóm tắt vẫn còn nhưng chỉ ra phiếu của chính họ (`getFilteredProposals` lọc `_canSeeP`), không phải số công ty.
- **Luật máy chủ**: `pva379/cashflow` `.read` mở cho tài khoản đã duyệt (trừ P.KH thuần) + email D — để máy nhân viên tính được "thu về" theo công trình. `bankBalance` vẫn chỉ 4 vai. **Giới hạn thật thà**: người biết kỹ thuật mở DevTools vẫn đọc được cả `cashflow` (cũng như `proposals` từ trước tới nay) — quyền "chỉ từng công trình" là ở giao diện. Muốn chặn cứng thì phải thêm nhánh tổng hợp theo công trình do máy người xem toàn bộ ghi; chưa làm.
- Thử: luật 48/48 (thêm 3 mục v10); Chromium `smoke7` 18/18 (nhân viên: đọc cashflow, 1/2 phiếu, không TỔNG, không "Tất cả", Excel CT X đúng 2 dòng; D: đủ TỔNG + Tất cả + Cân đối).

## Giai đoạn thử (D chốt 22/11: "1 mình tôi làm app này ngon lành thì mới thông báo cho mọi người")
- `PUSH_TRIAL = true` làm 2 việc: (1) `_trialGate()` — ai không thuộc `TRIAL_ROLES` (D 22/11: `['dung','hien']`, mở thêm cho Hiền; 24/11 thêm `'ketoan'` để nhập đầu kỳ) thì thấy màn "PVA-379 đang chạy thử" + nút mở app Duyệt Chi, không đăng ký thông báo; Dũng "xem thử vai" vẫn dùng được; (2) thông báo đẩy chỉ về máy Dũng, tiêu đề "[Thử]".
- ~~Dữ liệu thử = BẢN CHÉP từ app Duyệt Chi~~ **(hết hiệu lực 25/11 — xem mục SỔ MỚI ở đầu; kịch bản chép đã gỡ)**. Ghi lại để hiểu lịch sử:
  - Kịch bản `scripts/chep-duyetchi-sang-pva379.js`, chạy bằng tác vụ GitHub **"Chep du lieu Duyet Chi sang PVA-379"** (`.github/workflows/chep-du-lieu-pva379.yml`, Run workflow, gõ `CHEP`; để trống = chạy thử chỉ đọc). Dùng cùng chìa khoá FIREBASE_TOKEN với tác vụ đưa luật.
  - Chỉ ĐỌC `duyetchi/`, chỉ GHI `pva379/…` (hàm `kiemDich` chặn). Mỗi nhánh đích XOÁ rồi chép lại = bản chụp lúc chạy; chạy lại bao nhiêu lần cũng được (D muốn số mới thì bảo chép lại; thao tác thử của D trong PVA-379 trên các nhánh đó sẽ mất).
  - Chép: userRoles (role `trang` → `thuquy`), proposals, images, khProposals, khImages, plans, employees, salaryAdvances, groupChat, chatPin, chatRead, khChat, khChatPin, khChatRead, meta/persons, meta/sites. Ghi dấu `meta/copiedFrom {ts, proposals}` (app hiện dòng "bản chép" trong Cài đặt).
  - KHÔNG chép: meta/sheetUrl, sheetViewUrl, telegram* (PVA-379 dùng Sheet riêng), pendingOtp, online. GIỮ NGUYÊN: pva379/meta/accounts, accountsSeeded, cashflow, bankBalance, advPeople, trash.
  - Kho ảnh chia lô ≤12 MB mỗi lệnh ghi. Thử trên emulator (chế độ REST, `FIREBASE_DATABASE_EMULATOR_HOST`): đúng.
- Trong lúc thử, việc thật (duyệt, chuyển) vẫn làm ở app Duyệt Chi. D duyệt trong PVA-379 chỉ là thử, không ai thấy.
- Máy Dũng có 2 service worker (app3 + pva-379) cùng đăng ký kênh `dung` → mỗi thông báo thật hiện 2 lần trên máy D trong giai đoạn thử. Hết khi chuyển hẳn.
- Khi D nói "phát hành": đổi `PUSH_TRIAL=false`, bump version, rồi cho app3 báo người lập phiếu mới sang PVA-379 (25/11: KHÔNG chép dữ liệu nữa).

## Rà soát toàn app 22/11/2026 (5 lượt đọc độc lập + bấm thử 1.740 phiếu giả giống bản chép)
Đã sửa (v2):
- **Nặng:** app huỷ nhầm đăng ký thông báo của app Duyệt Chi trên cùng máy (khối "tự chữa lành" bê từ Gia Bình — Gia Bình có khoá VAPID riêng, ở đây cùng khoá) → bỏ. Excel tháng rò phiếu người khác → lọc `_canSeeP`.
- **Đầu kỳ sổ quỹ** (`_cashStartYmd`, `meta/cashStart`, `meta/accounts/<mã>/open`): thu/chi/chuyển TRƯỚC mốc không vào sổ (1.740 phiếu cũ không làm quỹ âm); mặc định mốc = ngày chép dữ liệu; Dũng / thủ quỹ / kế toán nhập ngày + số dư đầu kỳ từng tài khoản ở Cài đặt → Tài khoản (luật: `meta/cashStart`, `meta/accounts/$k/open` mở cho 3 vai; danh sách tài khoản vẫn chỉ Dũng — 24/11). Chưa khai thì Tổng quan và khung duyệt nhắc "chưa đúng". Cam kết chi ("đã duyệt chưa chuyển") chỉ tính phiếu duyệt từ đầu kỳ; nợ vay tính mọi khoản vay kể cả trước đầu kỳ (kế toán 24/11).
- **Phiếu P.KH đã chuyển tiền TÍNH vào sổ quỹ** (trước Gia Bình loại ra) — kế toán không đọc được P.KH nên sổ trên máy kế toán thiếu phần này; muốn đủ thì D cho kế toán phòng "Cả 2 phòng". (Điểm D cần biết.)
- Phiếu cũ không `createdByUid`: chỉ Dũng sửa/xoá (luật đòi uid; trước app cho người lập bấm rồi máy chủ từ chối → kẹt đồng bộ). Phiếu cũ không có ô thuế: không đòi hóa đơn, không vào "chưa rà soát".
- Chuông thủ quỹ chỉ đếm phiếu đã có Hiền duyệt; vai vật tư/kế toán có mục "đã chuyển xong"; bảng nhắc nhảy đúng phiếu P.KH; 3 chỗ `_zaloJump/chatRemindGo/chatOpenRef` thiếu `else` (phiếu P.KH bị đá về trang chủ).
- Khung sửa giữ công trình cũ không còn trong danh sách; bắt chọn công trường. Chọn phòng 3 giá trị (Kế toán / P.KH / Cả 2). Kế hoạch vật tư chặn khi chưa tải xong. Bỏ nút "Ghi vào Luân chuyển".
- Đối chiếu Sheet hằng ngày chỉ phiếu 60 ngày; "Đồng bộ lại" giãn 1,2 s; hộp chờ gửi lại ≤ 6 mục/lượt. Excel tháng: lần chuyển cũ không ghi tài khoản → để trống (không gán Tiền mặt); sắp xếp sổ quỹ tháng (lệnh `.sort` bị nuốt trong chú thích).
- Thông báo: vai vật tư không đẩy sang cả phòng; chat nhóm so theo kênh máy chủ; Telegram không cho vai vật tư gửi, chỉ phiếu mình thấy.
- Lặt vặt: toast "còn X tr" sai đơn vị; chạm tên trên tiêu đề mở nhầm màn đăng nhập; bộ đếm online dọn khi đăng xuất; chip "chưa rõ nguồn" cho lần chuyển cũ; tài khoản mặc định đang gánh lần chuyển không ghi TK thì không xoá được; TK đã ẩn vẫn chọn được khi trả nợ; hộp đề nghị xoá suy vai từ tên.
- Luật: `bankBalance` thêm vế email Dũng; `lenderName/rate/due/ts` khoản Cân đối đóng băng sau khi ghi (trừ Dũng); `deleteReq/ok/hien1` ≠ người đề nghị.
- Script chép: userRoles đã có bên PVA-379 giữ nguyên (vai/phòng/quyền D cấp riêng), chỉ thêm uid mới; in số phiếu tạo trong PVA-379 sẽ bị thay. Workflow ghim `firebase-tools@13`.
Chưa sửa / để D quyết: token Telegram ở `meta` mọi tài khoản đã duyệt đọc được (kế thừa Duyệt Chi); icon PWA 2 app giống nhau; `syncReconcileToSheet` gửi 1.740 id trong 1 URL (~25 KB, app Duyệt Chi vẫn làm vậy); 2 service worker cùng kênh `dung` → máy D nhận 2 lần.

## Thông báo đẩy
- Đi qua `push-queue` / `push-subs` của 379 (Cloud Function `processPushQueue`). Không dùng trạm `gbRelay`.
- Kênh: `dung`, `hien`, `thuquy`→`trang`, còn lại → `kt` / `kh` theo phòng (`_pushChanOfRole`, `_pushMapTargets`).
- **Người bấm không tự nhận thông báo** (D 22/11): `sendPushNotif` bỏ kênh của chính người bấm khỏi danh sách nhận.
- **`PUSH_TRIAL = true`**: giai đoạn dùng thử, chỉ gửi về máy Dũng NHỮNG GÌ VỐN PHẢI BÁO CHO DŨNG (người khác lập phiếu, nhắc tên…), tiêu đề có "[Thử]"; thao tác của chính Dũng không sinh thông báo nào. **Khi D nói "phát hành" → đổi thành `false`.**
- Hạn chế còn lại: Cloud Function chỉ coi người gửi là "đã duyệt" nếu `duyetchi/userRoles/<uid>/approved` = true. Người chỉ được duyệt ở `pva379` gửi được vào hàng đợi (luật đã mở), nhưng hàm xử lý theo hạng "chưa duyệt". Sau khi chuyển dữ liệu thì hết vướng, vì người dùng có ở cả 2 nhánh. Nếu muốn sửa tận gốc: sửa `functions/push379.js` rồi D deploy functions.

## Luật Firebase
- Nhánh `pva379` trong `database.rules.json`, gốc là nhánh `duyetchi` của `database-giabinh.rules.json`, đã đổi theo các mục ở trên. `push-subs` và `push-queue` chỉ **thêm** điều kiện cho người có vai ở `pva379`. Nhánh `duyetchi` không đổi.
- Đã thử trên emulator: 36/36 mục (gồm 9 mục hồi quy app Duyệt Chi).

## Kho ảnh / PDF
- Ghi thẳng Storage 379 như app Duyệt Chi, đường dẫn `duyetchi/<phiếu>/…`, PDF ở `duyetchi/pdf/…`.
- **Chưa kiểm được luật Storage** (không có trong repo). Nếu đính PDF báo lỗi thì do luật Storage chỉ cho ảnh, cần mở thêm `application/pdf`.

## Google Sheet
- Dùng Sheet **mới, riêng** cho PVA-379. D vào Cài đặt → Kết nối Google Sheets → sao chép mã Apps Script trong app → dán → triển khai → dán link vào app.
- Sheet "Cân đối" có thêm 2 cột Tài khoản, Công trình. Không dùng chung Sheet của app Duyệt Chi.

## Việc còn lại / khi chuyển hẳn
1. D dùng thử, rồi nói "phát hành": đổi `PUSH_TRIAL=false`, bump `APP_VERSION` + `version-pva379.txt` + `VERSION` trong `sw-pva379.js`.
2. ~~Chuyển dữ liệu từ app Duyệt Chi~~ — **BỎ (D chốt 25/11: sổ mới, không chép)**. Dữ liệu Gia Bình càng không đụng (project `so-quy-gia-binh` chạy riêng mãi, D chốt 19/11). Khi phát hành chỉ cần cho `app3.html` báo: phiếu mới lập ở PVA-379, phiếu cũ quyết toán nốt ở Duyệt Chi.
3. Kế toán: D cấp vai `ketoan` trong Cài đặt khi có người.

## Thử nghiệm
Bộ thử nằm ngoài repo (scratchpad phiên 19/11): emulator database + auth, Chromium bấm thử 6 tài khoản. Kết quả:
- luồng 1: 22/22 (lập phiếu → D → H → thủ quỹ chuyển từ 379·TP → thu có công trình → Cân đối → quyền xem);
- luồng 2: 10/10 (vay, trả nợ chờ H duyệt, chuyển nội bộ, đối chiếu NH, xoá khoản).
