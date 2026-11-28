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

## v64 (D 28/11/2026) — Bảo lãnh để lẫn cũ / mới; nhắc ảnh chuyển tiền chỉ từ 29/11
- D: "chọn vào bảo lãnh thì hiện ra tất cả các bảo lãnh đang có, không cần phân biệt cũ mới. Cũ mới chỉ khác lúc nhập để có trừ ký quỹ hay không, phần theo dõi như nhau nên thống kê cứ để lẫn và sắp xếp theo thời gian với từng loại".
- Bỏ 2 tab "Bảo lãnh / Bảo lãnh cũ". Danh sách chung: gom theo loại (`BL_KIND_ORDER`), trong loại xếp ngày phát hành cũ → mới, cũ mới lẫn nhau (thẻ BL cũ vẫn có nhãn "📜 cũ"). Thêm nút **📜 Thêm BL cũ** cạnh "➕ Thêm bảo lãnh" (mở `openBlModal(null,false,true)`). `setBlTab` còn giữ nhưng không lọc nữa.
- D: "có 67 món chưa up ảnh vì đang lẫn cũ mới … chỉ nhắc các món từ ngày 29/11 trở đi". `ZALO_REMIND_SINCE` = 29/11/2026 00:00 (+07) — áp cho cả nhắc thủ quỹ "chưa upload ảnh chuyển tiền" và nhắc người đề xuất "chưa gửi ảnh lên Zalo". Món chuyển trước mốc không nhắc (vẫn up ảnh được bình thường).
- Thử: `smoke38.js` (không còn tab, có nút Thêm BL cũ, 4 BL lẫn cũ mới xếp đúng ngày, nhắc ảnh chỉ món từ 29/11); hồi quy smoke35 (sửa theo nút mới), 36, 37.

## v63 (D 28/11/2026) — Bảo lãnh tạm ứng giảm trừ; ký quỹ nhập số hoặc %; tiền bung về TK ngân hàng phát hành
- D: "bảo lãnh tạm ứng có giảm trừ giá trị từng phần, giảm bằng nào thì ký quỹ bung tương ứng bằng đó"; làm rõ: "nút giảm bảo lãnh có thể giảm cả hoặc giảm 1 phần, mục ký quỹ có thể nhập số hoặc nhập phần trăm, nếu nhập % thì khi giảm sẽ tự giảm theo %, nhập số thì giảm số, tiền bung sẽ cộng vào tk ngân hàng phát hành"; "giải toả về TK TM Trang là sai, giải toả về tk ngân hàng phát hành" + "cũ hay mới đều về đúng tk phát hành".
- Form: ô Ký quỹ có chọn **Số tiền / Phần trăm** (`#bl-dep-mode`). Phần trăm → lưu `depPct` (0–100) và `depAmount = round(amount × depPct / 100)` (bắt buộc có số tiền bảo lãnh). Số tiền → không có `depPct`.
- BL loại `tamung` đang hiệu lực có nút **➖ Giảm trừ** (`reduceBl` / `saveReduceBl`, người ghi sổ): ngày, giá trị giảm (không vượt giá trị còn lại; nút **Giảm toàn bộ** điền hết phần còn lại), ký quỹ bung TỰ TÍNH: có `depPct` → giảm × %; nhập số → bằng đúng phần giảm; luôn không quá phần ký quỹ còn treo; sửa tay được.
- Ký quỹ bung = 1 lần "lấy về" trên khoản `dep` (transaction) có `acct` = TK về. Ghi `reds[]` {ts, date, amount, rel, byName}; giá trị còn lại `_blValLeft` = amount − Σ giảm trừ. Giảm về 0 → hỏi chấm dứt (`_blRelease`, trả nốt ký quỹ).
- **TK về (cũ lẫn mới)** = `_blBankAcct(b)`: TK công ty có tên khớp ngân hàng phát hành (`_blBankKey`, dạng "<công ty> · <tên TK>" như ô chọn ngân hàng); ngân hàng khác không có TK công ty → TK của khoản ký quỹ. Áp cho Giảm trừ, ↩ Giải toả ký quỹ (`returnDeposit(id, toAcct)`), Chấm dứt BL, tự đóng khi hết hạn. `cashTotals` / sổ quỹ / Excel cộng lần lấy về vào `x.acct || r.acct`.
- Thẻ hiện "· giải toả về <TK ngân hàng phát hành>" (trước đây BL cũ hiện TK chọn lúc nhập, VD TM Trang — sai). Form BL cũ: chọn ngân hàng công ty thì ẩn ô TK, lưu `depAcct` = TK ngân hàng phát hành; chỉ hỏi TK khi "ngân hàng khác". Dữ liệu BL cũ đã nhập (depAcct = TM Trang) KHÔNG cần sửa: lúc giải toả tự tra theo tên ngân hàng.
- Luật: `baoLanh/$id/reds/$i` (kiểm dạng), `depPct` (số 0..100).
- Thử: `smoke37.js` 15/15 (số: giảm 200tr bung 200tr; %: bung 60tr; Giảm toàn bộ; về 0 → chấm dứt; tiền về BIDV = NH phát hành; BL cũ nhập TM Trang → thẻ + chấm dứt về NH phát hành, TM Trang không đổi; form BL cũ ẩn ô TK); luật 219/219; hồi quy smoke12, 23, 30, 31, 33, 35, 36.

## v62 (D 28/11/2026) — Bảo lãnh: chấm dứt / hết hạn tự trả ký quỹ, vô thời hạn, nhóm theo loại
- D: "khi bảo lãnh hết hạn hoặc có nút chấm dứt bảo lãnh (có thể đóng trước hạn) thì tiền ký quỹ tự động bung vào tài khoản; có bảo lãnh vô thời hạn, khi đạt yêu cầu kỹ thuật sẽ bấm nút đóng"; "sắp xếp theo ngày cũ nhất đến mới, theo từng loại BL THHĐ, BLTƯ, BLTT…, bấm vào đâu sẽ xổ ra loại bảo lãnh đó".
- `_blRelease(id, reason)`: `transaction` trên khoản `dep` — thêm 1 lần "lấy về" bằng TOÀN BỘ phần còn treo (không còn treo thì bỏ qua), rồi đặt bảo lãnh `status:'closed'`, `closedAt`, `closedBy`, `closeReason` ('manual' | 'expired'). Giao dịch nguyên tử → 2 máy / bấm 2 lần không trả 2 lần. Tiền về đúng TK của khoản ký quỹ (TK đã trích; bảo lãnh cũ = TK chọn lúc nhập).
- Nút thẻ "⚫ Đóng" đổi thành **⛔ Chấm dứt BL** (`closeBl`), hộp xác nhận ghi số ký quỹ sẽ về TK nào.
- Tự đóng khi hết hạn: `_blAutoExpire()` (gọi trong `renderBlAlert`) — chỉ chạy trên máy NGƯỜI GHI SỔ (thủ quỹ / Hiền / Dũng), với bảo lãnh đang hiệu lực, có hạn, đã QUA ngày hết hạn (ngày hết hạn < hôm nay) và sổ quỹ đã tải xong khoản ký quỹ; mỗi phiên thử 1 lần / bảo lãnh. Nhân viên mở app thì chỉ thấy khung đỏ "quá n ngày" — không tự ghi.
- **Vô thời hạn**: ô đánh dấu trong form (`noExp:true`, không có `expDate`), ẩn ô ngày hết hạn + khu gia hạn; không vào khung nhắc, không tự đóng, không có nút Gia hạn; đóng bằng Chấm dứt BL khi đạt yêu cầu kỹ thuật. Luật: bắt buộc có `expDate` HOẶC `noExp === true`; thêm `noExp`, `closedBy`, `closeReason`.
- Danh sách: gom theo loại theo thứ tự BL THHĐ → BL TƯ → BL TT → BL DT → BL BH → BL khác (`BL_KIND_ORDER`, `BL_KIND_SHORT`), mỗi nhóm 1 dòng tiêu đề (số bảo lãnh, tổng số tiền, ký quỹ còn treo, số chờ duyệt, cảnh báo sắp hết hạn), mặc định thu gọn, bấm để xổ (`toggleBlKind`, nhớ trong phiên). Trong nhóm xếp ngày phát hành cũ → mới.
- Thử: luật 219/219; `smoke36.js` (tự đóng khi hết hạn chỉ trên máy thủ quỹ, chấm dứt trả ký quỹ — bấm 2 lần cùng lúc vẫn 1 lần, vô thời hạn, nhóm theo loại + thứ tự ngày); hồi quy smoke12, 23, 29, 30, 33–35.

## v61 (D 28/11/2026) — Bảo lãnh: phí theo kỳ + tab Bảo lãnh cũ
- D: "phần phí cũng cần có dấu cộng để các loại bảo lãnh đóng phí theo kỳ, kế toán vào nhập thêm phí theo định kỳ thu của ngân hàng; thêm tab bảo lãnh cũ để nhập những bảo lãnh có trước sổ — ký quỹ vẫn vào tiền ký quỹ nhưng không trừ từ nguồn nào, phí cũ không nhập, phí mới kế toán cộng thêm; gia hạn có thể nhiều hơn 2 lần".
- **Phí theo kỳ** `fees[]` {ts, date, amount, acct, feeId, by, byName}: trong form có "➕ Thêm phí" (ngày thu, số tiền, TK — TK chỉ người ghi sổ thấy); trên thẻ có nút **➕ Phí** (`addBlFee` / `saveBlFee`). Thủ quỹ / Hiền / Dũng thêm → ghi ngay 1 khoản `bankpay laiphi` (feeId). Người khác (kế toán…) thêm → kỳ phí "⏳ chờ ghi sổ"; người ghi sổ bấm **✅ Ghi sổ n phí** (`confirmBlFees`, chọn 1 TK cho cả lượt). Thẻ hiện tổng phí (ban đầu + các kỳ + phí gia hạn), số kỳ, danh sách kỳ.
- Luật `baoLanh/$id/fees/$i`: `.write` riêng cho mọi người đã duyệt — chỉ TẠO kỳ mới, `by` = chính mình, KHÔNG có `feeId`; gắn feeId / sửa / xoá kỳ phí do quyền cha (người ghi sổ). Người khác vẫn không sửa được thông tin bảo lãnh.
- **Bảo lãnh cũ**: tab con 🛡 Bảo lãnh | 📜 Bảo lãnh cũ (`_blTab`, `setBlTab`), cờ `old:true` trên bảo lãnh. Form cũ: ẩn ô phí ban đầu (phí cũ không nhập, chỉ thêm kỳ phí mới), ô TK ký quỹ đổi thành "Khi giải toả, tiền về tài khoản". Lúc có hiệu lực ghi khoản `dep` có `old:true`, `date` = NGÀY NHẬP SỔ (nếu để ngày phát hành có trước mốc đầu kỳ thì sổ bỏ qua cả khoản ký quỹ lẫn lần lấy về).
- Ký quỹ `old` trong sổ quỹ: `cashTotals` — vẫn tính vào "đang gửi ngoài" (`dangGuiNgoai`), KHÔNG trừ tài khoản lúc ghi (`kqTruTk`: cũ = −đã lấy về, mới = còn treo), lấy về vẫn cộng vào tài khoản; `kyQuyDaChi` bỏ khoản cũ; sổ quỹ chi tiết không có dòng "Ký quỹ" ra cho khoản cũ (chỉ dòng "Lấy về"); Excel tháng / Excel công trình không tính tiền ra cho khoản cũ.
- Gia hạn: không giới hạn số lần (đã thử 4 lần trong một form).
- Thử: luật 215/215 (8 ca "BL v61"); `smoke35.js` (bảo lãnh cũ, ký quỹ không trừ TK rồi giải toả cộng TK, 2 kỳ phí trong form, kế toán thêm phí chờ → thủ quỹ ghi sổ, ➕ Phí trên thẻ, gia hạn 4 lần); hồi quy smoke12, 23, 29–31, 33, 34.

## v60 (D 28/11/2026) — sửa form Bảo lãnh
- D: "loại bảo lãnh thêm bảo lãnh thanh toán; ngân hàng phát hành chọn trong ngân hàng của công ty, có thể đánh thêm ngân hàng khác; thêm 1 dòng số tiền bảo lãnh; thêm dấu cộng gia hạn, khi gia hạn sẽ có phí và hiệu lực".
- `BL_KIND` thêm `thanhtoan` (Thanh toán). Ô ngân hàng = `<select id="bl-bank-sel">` lấy `_loanBankOpts()` (tài khoản ngân hàng của từng công ty) + "Ngân hàng khác (gõ tên)…" → hiện ô gõ `#bl-bank` (`_blBankUi`, `_blBankVal`). Sửa bảo lãnh cũ: tên ngân hàng không có trong danh sách thì tự chọn "khác" và điền sẵn.
- Trường mới `amount` (số tiền bảo lãnh; luật: số 0..10^12), hiện trên thẻ.
- Khu "Gia hạn" trong form: liệt kê các lần đã gia hạn + nút **➕ Gia hạn** thêm dòng (hiệu lực đến, phí gia hạn, TK trích — TK chỉ người ghi sổ thấy). Lưu: xếp theo ngày, mỗi lần phải sau lần trước, `expDate` = lần cuối; bảo lãnh đang / vừa có hiệu lực thì mỗi lần có phí → 1 khoản `bankpay laiphi` (feeId, `acct`). Người khác thêm gia hạn khi bảo lãnh còn chờ → lúc Hiền duyệt mới ghi phí (TK = TK phí của bảo lãnh nếu dòng chưa có). Luật `ext/$i` thêm `acct`. Nút "📅 Gia hạn" trên thẻ vẫn giữ.
- Thử: `smoke33.js` thêm ca (loại Thanh toán, ngân hàng công ty / khác, số tiền, 2 lần gia hạn trong form → đúng ngày hết hạn + đúng khoản phí); luật 207/207; hồi quy smoke12, 23, 27, 29–32, 34.

## v59 (D 28/11/2026 "giao diện rối quá: nút 1 H đã duyệt, nút 2 từ chối, nút 3 bấm vào thì hiện ra mấy cái đó, nhìn cho gọn; Hiền đã duyệt thì nút đổi sang màu khác màu nút bấm duyệt")
- Hàng nút trên thẻ phiếu (`renderApproveRow`): Hiền chỉ còn **H · Từ chối · ⋯**. Chuyển tiền / chuyển tiếp, hoàn tác lần chuyển gần nhất, xem / thêm / dán ảnh chuyển khoản, Giục → nằm trong menu ⋯ (`openCardMenu`, nhánh `currentRole==='hien'`). Ô "—" khi không còn quyền từ chối không vẽ nữa (`renderBtnReject` trả '').
- Thủ quỹ: **T · ảnh CK · ⋯** — ô ảnh chuyển khoản gọn 1 nút (`renderBtnShareCompact` "📤 n ảnh CK ▾"), bấm mở `openProofMenu` (Xem / chia sẻ · Thêm ảnh · Dán ảnh). `renderBtnShare` cũ giữ cho nhân viên (chỉ xem ảnh).
- Màu: nút **bấm duyệt** (D / H) = cam đặc chữ trắng; **duyệt thêm** (đã duyệt một phần) = vàng; **đã duyệt** = xanh dương (`#dbeafe` / `#1e40af`) cho cả nút và ô trạng thái `.badge-approved`; đã chuyển giữ xanh lá.
- Thử: `smoke34.js`; hồi quy smoke12, 14, 23, 24, 26, 27, 29, 31–33.

## v58 (D 28/11/2026) — mục BẢO LÃNH (menu Khác → 🛡 Bảo lãnh, trang `#page-baolanh`)
- D yêu cầu: tên bảo lãnh, ngân hàng, ký quỹ bao nhiêu lấy từ nguồn nào nằm lại ngân hàng nào (trừ ở nguồn nộp, sang phần ký quỹ), phí bảo lãnh trích từ TK nào hạch toán vào phí và lãi ngân hàng, thời hạn hết (nhắc trước 5 ngày).
- D chốt: (1) chỉ quản ở PVA-379, KHÔNG nối bảng bảo lãnh của app Hợp đồng / Công nợ NH; (2) thủ quỹ / Hiền / Dũng thêm, sửa — có hiệu lực ngay; người khác thêm → "chờ Hiền duyệt"; (3) mọi người xem + thấy nhắc; (4) có bảo lãnh tín chấp (ký quỹ 0 / trống); (5) chỉ nhắc bằng khung đỏ trong app (không thông báo đẩy 7h).
- Dữ liệu `pva379/baoLanh/<id>`: name, kind (duthau | thuchien | tamung | baohanh | khac), site, bank, issueDate, expDate, depAmount, depAcct, depId, fee, feeAcct, feeId, status (pending | active | rejected | closed), by, byName, ts, note, okH {by,name,ts}, rej {by,name,ts,reason}, ext[] {ts,from,to,fee,feeId,byName}, closedAt.
- Tiền KHÔNG ghi riêng: lúc có hiệu lực (người ghi sổ lưu, hoặc Hiền / Dũng bấm "Duyệt & ghi sổ") app ghi một lần (`db.ref().update`) 1 khoản `cashflow` type `dep` (ký quỹ, `holder` = ngân hàng phát hành, `acct` = TK nộp) + 1 khoản `bankpay` kind `laiphi` (phí, `acct` = TK trích), lưu mã ở depId / feeId. Ký quỹ 0 → không có khoản `dep`. Bảo lãnh đã có hiệu lực: form chỉ sửa thông tin, tiền sửa ở Cân đối.
- Nút: Gia hạn (ngày mới phải sau ngày cũ; phí gia hạn → khoản `bankpay laiphi` mới, ghi vào `ext`), Giải toả ký quỹ (= `returnDeposit(depId)` sẵn có), Đóng, Từ chối (Hiền / Dũng), Xoá (Hiền / Dũng; người lập xoá được bảo lãnh chưa có hiệu lực — xoá bảo lãnh KHÔNG xoá khoản ký quỹ / phí trong sổ quỹ).
- Nhắc: `#bl-alert` trên danh sách phiếu (tab Đề xuất) — bảo lãnh đang hiệu lực còn ≤ 5 ngày hoặc quá hạn; Hiền / Dũng thấy thêm số bảo lãnh chờ duyệt. Chấm số trên ô Bảo lãnh trong menu Khác.
- Luật `pva379/baoLanh`: đọc = mọi người đã duyệt; tạo = người ghi sổ (mọi trạng thái) hoặc người khác (chỉ `pending`, `by` = chính mình); sửa = người ghi sổ, hoặc người lập khi bảo lãnh đang `pending` / `rejected` và giữ `pending`; rời `pending` chỉ Hiền / Dũng; xoá = Hiền / Dũng, hoặc người lập khi chưa có hiệu lực; kiểm dạng ngày, số tiền, `$other` cấm.
- Thử: bộ thử luật 207/207 (18 ca "BL"); `smoke33.js` (thủ quỹ thêm ghi sổ ngay + trừ TK + khung nhắc; nhân viên thêm chờ duyệt; tín chấp; Hiền duyệt; gia hạn; giải toả + đóng); hồi quy smoke12, 14, 23, 24, 26–32.

## v57 (D 28/11/2026 "sửa chữ ứng lương thành Lương và NC rồi cho ra ngoài, vì cái này hay dùng")
- Nút `#nav-luong` ra THANH DƯỚI (bỏ khỏi CSS ẩn), nhãn "💵 Lương và NC"; bỏ ô Lương khỏi menu Khác; chấm báo Lương không còn cộng vào chấm của nút Khác; mở trang Lương thì sáng nút Lương (không sáng nút Khác). Người chỉ thuộc phòng Kế hoạch vẫn ẩn như cũ.
- Mọi chữ hiện cho người dùng "Ứng lương / ứng lương" → "Lương và NC" (tiêu đề trang, tab con, nút đề xuất, hộp nhập Excel, thông báo, Excel tháng / công trình, giải ngân thẳng). Diễn giải phiếu MỚI tạo là "Lương và NC tháng …"; phiếu cũ giữ chữ cũ. Không đổi `kind:'salary'`, tên hàm, tên sheet Google.
- Thử: `smoke32.js` (Hiền + nhân viên); hồi quy smoke14, 23, 24, 26–31.

## v56 (D 28/11/2026 "nhập các số nhỏ xong app cộng cho được không" → "cách 1, làm cả cho các mục")
- MỌI ô số tiền (ô có `oninput="fmtAmountInput(this)"`, 23 ô: phiếu chi, P.KH, ứng lương, duyệt số, chuyển tiền, thu, ký quỹ, vay, trả nợ, phí + lãi NH, chi riêng, chuyển giữa TK, đầu kỳ, quyết toán tạm ứng, hợp đồng…) nhận phép CỘNG: gõ `120.000+35.000+8.500`.
- Đang gõ: nổi nút **+** ở mép phải ô (bàn phím số iPhone không có dấu +) và nhãn "= 163.500 đ" ngay dưới ô (`#amt-help`, `_amtHelpShow`). Rời ô / Enter → `_amtSettle` thay phép cộng bằng tổng và bắn `input` (các ô xem trước như mã QR tự tính lại); `title` của ô giữ phép cộng vừa gõ.
- Mọi chỗ đọc số tiền đi qua `amtVal()` (cộng các số): `parseAmountInput` + 14 chỗ trước đây bỏ ký tự không phải số (nếu không, "10.000+2.000" sẽ bị ghép thành 100.002.000). `saveAcctOpen` (đầu kỳ, có thể âm) cũng dùng `amtVal`. Chỉ CỘNG, không trừ / nhân.
- Thử: `smoke31.js` (điện thoại giả lập: nút +, tổng nổi, rời ô ra tổng, lưu đúng; lưu khi ô còn phép cộng vẫn đúng; phiếu chi); hồi quy smoke12–14, 23–27, 29, 30.

## v55 (D 28/11/2026 "sắp xếp những tài khoản đang có tiền lên trên, xong đến TK MSB, TP rồi đến các TK đang 0 đồng khác")
- Sổ quỹ, khung số dư: trong từng công ty `_bookAcctSort()` xếp TK có số dư khác 0 (nhiều tiền trước) → MSB → TP (TP / TPBank / Tiên Phong, so tên không dấu) → các TK 0 đồng còn lại theo thứ tự cài đặt. TK MSB / TP đang có tiền thì nằm ở nhóm đầu theo số tiền. Chỉ đổi thứ tự hiển thị, không đổi `order` trong `meta/accounts`.
- Thử: `smoke30.js` thêm ca thứ tự.

## v54 (D 28/11/2026 "sổ quỹ: bỏ phần nhập số thực, hiện tài khoản và số dư, bấm vào tài khoản sổ ra chi tiết phía dưới" + "mục ghi chuyển tiền giữa các tài khoản đổi lên trên cùng")
- Cân đối → Sổ quỹ, khung số dư (`renderCashBook` → `acctBox`): mỗi tài khoản 1 dòng (tên + số dư sổ tính ra), BỎ ô "Số dư ngân hàng thật" + nút Lưu + dòng khớp / lệch. Bấm dòng → `toggleBookAcct(a)` xổ `_bookAcctDetail(a)` ngay bên dưới (giao dịch của riêng tài khoản, mới nhất trước, có số dư chạy, 40 dòng + "Xem thêm"); bấm lại thu gọn; mở tài khoản khác thì tài khoản cũ thu lại.
- Nút "🔁 Ghi chuyển tiền giữa các tài khoản" chuyển lên TRÊN CÙNG khung số dư.
- Dữ liệu `pva379/bankBalance` + hàm `saveBankBalance` để nguyên (không còn nút gọi), không xoá gì. Danh sách sổ quỹ chung (có ô lọc) bên dưới giữ nguyên.
- Thử: `smoke30.js`; hồi quy smoke12, 24, 26, 28, 29.

## v53 (D 28/11/2026 "cho tất cả mọi người đều nhìn thấy các phiếu đề xuất của cả công ty, không có quyền sửa chữa can thiệp gì vào phiếu của người khác, xem được toàn bộ báo cáo") — THAY quy tắc xem v10 / v14
- `_canSeeP()` luôn đúng: ai đã được duyệt cũng thấy mọi phiếu chi, ứng lương, P.KH, sổ tạm ứng của cả công ty. Sửa / xoá / duyệt / chuyển KHÔNG đổi: vẫn theo `_canEditDelete`, `_canOpenEdit`, nút D / H / T (nhân viên mở phiếu người khác không có nút Sửa / Xoá).
- Báo cáo: tab Công trình có dòng TỔNG và xuất Excel "Tất cả công trình" cho mọi người. Các tab Danh sách / Đã chuyển / Chưa chuyển / Từ chối / Người nhận / Tóm tắt đọc qua `_canSeeP` nên tự đủ.
- Trang P.KH: mọi người thấy nút trang (chỉ xem); nút "Đề xuất chi phí Kế hoạch" (`#kh-new-btn`) và `openKhModal()` vẫn chỉ `_khCanSee()`. Luật: `pva379/khProposals` + `khImages` `.read` mở cho mọi người đã duyệt (ghi giữ nguyên).
- GIỮ hạn chế (D chưa yêu cầu): tab Cân đối (số dư tài khoản, thu, ký quỹ, vay, chi riêng), Thùng rác, nút gửi báo cáo Telegram, ô bảng tính Google, phần sổ quỹ trong Excel tháng — chỉ Dũng / Hiền / thủ quỹ (`_fullView()`).
- Người CHỈ thuộc phòng Kế hoạch: thấy hết phiếu P.KH; phiếu bên kế toán CHƯA mở (luật `proposals` chặn đọc phòng KH, app rút gọn của họ ghi chung một gói nên mở thêm cần sửa riêng).
- Sót ở v51 đã sửa: xoá dòng sổ tạm ứng đã duyệt (`advDeleteItem`) cho Hiền như Dũng.
- Thử: `smoke29.js`; hồi quy smoke14, 23, 25–28. `smoke7` / `smoke15` / `smoke22` còn kiểm quy tắc cũ (nhân viên chỉ thấy phiếu mình, không TỔNG, chờ Dũng duyệt xoá) — đã được thay, không phải lỗi.

## v52 (D 28/11/2026 "ô chọn tên nhân viên, ngân hàng để chế độ gợi ý — gõ vài ký tự là nhảy đến tên cần tìm")
- Mọi `<select>` có từ 8 dòng trở lên (`_CBX_MIN`): bấm / chạm vào → hộp `#cbx-ov` có ô gõ tìm (không dấu, khớp mọi từ, khớp cả từ khoá ngân hàng qua `data-kw`, ví dụ "vcb", "ky thuong"), Enter chọn dòng đầu. Chọn xong ghi `selectedIndex` vào ô gốc + bắn `input` / `change` → mã cũ (onchange, `.value`) chạy y nguyên.
- Bắt sự kiện ở cấp `document` (mousedown / touchend / phím cách, Enter, Alt+↓), nên ô dựng sau (danh sách động) tự có. Vuốt cuộn qua ô không mở. Ô ngắn, ô bị khoá, ô chọn nhiều giữ kiểu cũ; muốn bỏ một ô thì thêm `data-nocbx="1"`.
- Áp dụng thực tế: ngân hàng nhận (lập / sửa phiếu, P.KH), nhân viên ứng lương, người đề xuất (Dũng), các ô lọc theo người / công trình khi danh sách dài.
- Thử: `smoke28.js` (điện thoại chạm + máy tính chuột); hồi quy smoke7, 12, 14, 21, 23–27.

## v51 (D 28/11/2026 "tất cả các lệnh sửa, xoá bỏ yêu cầu Dũng duyệt đi, chỉ cần Hiền duyệt là được") — THAY quyết định v43
- Hiền như Dũng (`_isApprover()`): xoá THẲNG phiếu / P.KH / ứng lương / công trình / đề xuất vật tư / nhân viên / khoản sổ quỹ / ảnh / dòng sổ tạm ứng đã xác nhận; DUYỆT hoặc TỪ CHỐI đề nghị xoá của người khác (`delReqs`, `deleteReq` sổ quỹ). Đề nghị mới báo cả `dung` + `hien`.
- Người khác (thủ quỹ, kế toán, nhân viên, chủ phiếu) vẫn chỉ GỬI đề nghị xoá. Đề nghị SỬA khoản sổ quỹ (`editReq`) đã do Hiền / Dũng duyệt từ v19/v27, không đổi.
- GIỮ chỉ Dũng (lớp đỡ cuối, D chưa yêu cầu đổi): khôi phục / xoá hẳn khỏi thùng rác; cấp vai, sửa danh sách tài khoản ngân hàng, danh sách người đề xuất; xoá sạch nhóm chat.
- Luật: xoá `proposals`, `khProposals`, `plans`, `employees`, `cashflow` thêm `hien`; `delReqs` Hiền gỡ được; `trash` Hiền bỏ vào được (lấy ra vẫn chỉ Dũng).
- Vật tư luân chuyển (`pva379/assets`, v69) vẫn ghi "Dũng duyệt" nhưng nhánh này KHÔNG có luật → mọi ghi đều bị máy chủ chặn từ trước (lỗi có sẵn, chưa sửa).
- Thử: bộ thử luật 189/189; `smoke27.js` (Hiền duyệt / từ chối đề nghị, xoá thẳng, không khôi phục được, Dũng khôi phục được); hồi quy smoke7, 12, 14, 20–26.

## v50 (D 28/11/2026 "làm sao cho an toàn nhất") — gia cố bảo mật đợt 1
- **Mã**: hàm `ejs()` (đặt cạnh `sid()`) dùng cho MỌI dữ liệu ghép vào chuỗi JS trong `onclick="…('…')"` — `esc()` không đủ ở ngữ cảnh đó. Quy ước từ nay: trong thuộc tính `on*` chỉ dùng `ejs()` (chuỗi bất kỳ) hoặc `sid()` (mã phiếu); `esc()` chỉ cho phần chữ hiện ra. `monthLabel()` và các ô chọn tháng đã lọc. Tin chat: khoá thật luôn thắng ô `_k` trong dữ liệu.
- **Luật** (`database.rules.json`): `pva379/cashflow/$id` chỉ thủ quỹ / Hiền / Dũng ghi (nhân viên vẫn đọc cho Báo cáo → Công trình); `transfers/$i/loanId|src` của lần chuyển đã có chỉ 3 vai đó đổi (cả `khProposals`); `trash` chỉ Dũng bỏ vào (từ v43 chỉ Dũng xoá); `proposals/$id/month` phải dạng `2026-11` (cả `duyetchi`); `pva379/online/$uid` chỉ người đã duyệt ghi.
- **Thùng rác**: khôi phục mục không do chính tài khoản Dũng bỏ vào → hỏi lại kèm cảnh báo.
- **Sao lưu**: `scripts/backup-db.ps1` thêm nhánh `/pva379` (file `backup-pva379-<ngày>.json`). Máy đang chạy tác vụ `PVA-Backup` cần lấy bản mới (bấm lại `CAI-BACKUP.bat` nếu tác vụ gọi bản chép ngoài repo).
- Kèm: app Duyệt Chi v189, Hợp đồng v37, Thiết bị v12 sửa cùng kiểu (`ejs()`); luật `thietbi/*/status` chỉ nhận chữ thường ngắn, `hopdong/nhacNho/$id/soLanDaNhac` phải là số.
- Thử: bộ thử luật 179/179 (26 ca mới "BM"); `smoke26.js` nạp sẵn dữ liệu xấu rồi mở app — bản cũ mã chạy, bản mới không; hồi quy smoke7, 12–25.
- Chưa làm trong đợt này (cần D quyết vì đổi cách dùng): quyền ghi ảnh chứng từ, danh sách người dùng riêng cho 3 app phụ, đọc sổ theo từng người. App Gia Bình chưa sửa (chờ D yêu cầu đích danh).

## v49 (D 27/11/2026 "cho mã QR hiện luôn ở form lập phiếu khi nhập tk")
- Ba form có ô Tài khoản nhận (lập phiếu `inp`, P.KH `kh-inp`, sửa phiếu `edit`) có thêm khung `#<prefix>-payqr` ngay dưới ô gợi ý. Chọn ngân hàng + gõ số tài khoản hợp lệ (theo `_payRead`) → `_formQrDraw(prefix)` vẽ mã sau 350 ms kể từ lần gõ cuối; thiếu ngân hàng / số quá ngắn → mã biến mất.
- Gọi từ `_payHint` (gõ, chọn ngân hàng) và `_paySet` (tự điền theo lần chi trước, đọc ảnh, mở form sửa, xoá form) nên mọi đường điền tài khoản đều ra mã.
- Mã ở form **KHÔNG kèm số tiền và nội dung** (thẻ 01 = 11): chỉ để người lập phiếu quét kiểm TÊN chủ tài khoản. Mã kèm số tiền vẫn chỉ ở hộp chuyển tiền / `openPayQr` của thủ quỹ sau khi duyệt — đừng gộp hai chỗ này.
- `_formQrZoom(prefix)` phóng to (kèm tên trên phiếu), `_formQrSave(prefix)` lưu / chia sẻ ảnh (dùng lại `_qrSave`).
- Không đổi luật, không đổi dữ liệu. Thử: `smoke25.js` 15/15 (giải mã mã bằng bộ đọc độc lập), hồi quy smoke7, 14, 23, 24.

## v48 (D 27/11/2026 "nhập tài khoản vào thì tự hiện ra QR chưa")
- Trước: mã QR chỉ hiện khi bấm nút 📲. Nay hộp **Xác nhận chuyển tiền** của phiếu có tài khoản nhận **hiện sẵn mã QR** (`_taQrDraw`), kèm ngân hàng · số TK (nút chép), tên trên phiếu, cảnh báo nếu TK khác lần chi trước; mã tự vẽ lại theo số tiền đang gõ (kể cả nút "Chuyển toàn bộ"); bấm vào mã → hộp phóng to (`openPayQr`); nút "Lưu ảnh QR" (`_qrSave` dùng chung cho cả hai hộp). Nút 📲 QR trên thẻ phiếu giữ nguyên.
- Thử: `smoke23` thêm 2 ca (mã tự hiện, giải mã ra đúng TK + số tiền; đổi số tiền → mã đổi); hồi quy smoke7, 14, 17, 24.

## v47 (D 27/11/2026, ảnh chụp màn hình: QR Techcombank ra tên "TCB" thay vì "NGUYEN THI BAI")
- Nguyên nhân: mã QR Techcombank có thẻ 59 (tên đơn vị) = "TCB"; v46 tin thẻ đó làm tên nên không đọc chữ nữa. Nay thẻ 59 chỉ nhận khi ≥ 2 từ, ≥ 5 ký tự, không phải tên / từ khoá ngân hàng.
- Có mã QR mà chưa có tên (và tài khoản chưa từng chi) → **cắt vùng quanh mã** (2 mức nới: gần rồi rộng), phóng to tới 1800 điểm ảnh (tối đa ×4), che mã, đọc riêng vùng đó (`_scanCropCanvas`; `_scanOcr` nhận thẳng canvas). Ảnh chụp màn hình có thẻ QR nhỏ, chữ tên rất nhỏ vẫn đọc được. Không ra thì mới đọc cả ảnh như cũ.
- `_scanFixUpperName`: tên IN HOA lẫn từ có dấu với không dấu ("NGUYEN THỊ BAI" — bộ chữ tiếng Việt tự thêm dấu) → bỏ dấu về dạng ngân hàng in; tên in hoa có dấu ở đa số từ thì giữ.
- Thử: `unit-scan.js` 18/18; `smoke24` 29/29 (thêm ảnh tái hiện của D ở 3 độ phân giải: ra đúng tài khoản + "NGUYEN THI BAI"); hồi quy smoke7, 22, 23.

## v46 (D 27/11/2026 "đưa QR lên mà không thấy hiện tên người thụ hưởng"; "viết bằng chữ viết tay là không đọc được")
- Mã VietQR KHÔNG chứa tên người thụ hưởng (chỉ BIN + số TK, tuỳ chọn số tiền / nội dung) → tên phải đọc từ chữ in cạnh mã. v45 chỉ nhận tên sau nhãn "chủ tài khoản…" hoặc dòng "Công ty…", còn thẻ QR của app ngân hàng in tên TRƠN.
- `_scanParseText(text, {acct, okLine})`: thêm bước tìm **tên không nhãn** = dòng CHỮ IN HOA 2–7 từ, không số, không phải tên ngân hàng / khẩu hiệu (VietQR, napas, quét mã…), gần dòng số tài khoản nhất (≤ 4 dòng), chỉ lấy từ dòng bộ đọc tin ≥ 60%. Không có thì KHÔNG bịa tên.
- Che vùng mã QR (theo toạ độ jsQR) trước khi đọc chữ — đọc chữ trên hình mã chỉ ra rác. `_scanQrIn` trả `{data, box}`.
- Ảnh chỉ có mã, không in tên → ô tên để trống, giải thích "mã QR không chứa tên… app ngân hàng sẽ hiện tên khi thủ quỹ quét".
- **Chữ viết tay**: bộ đọc trên máy (tesseract) không đọc được — giới hạn của công nghệ, không sửa được bằng mã. Lựa chọn đã nêu với D: gõ tay lần đầu (lần sau app tự điền theo đơn vị), xin mã QR / tin nhắn chữ, hoặc dịch vụ đọc chữ của Google (ảnh gửi sang dịch vụ Google — cần D đồng ý vì trái yêu cầu "ảnh không ra ngoài"). CHƯA làm gì thêm.
- Thử: `unit-scan.js` 17/17 (thêm 4 mẫu tên trơn / rác / không bịa); `smoke24` 23/23 (thêm thẻ QR ngân hàng có tên trơn, ảnh chỉ có mã); hồi quy smoke7, 22, 23; `robust24` không đổi kết luận.

## v45 (D 27/11/2026 "làm tiếp đọc ảnh tự điền") — BƯỚC 2: đọc ảnh NGAY TRÊN MÁY
- Khung "🔎 Đọc ảnh điền giúp" + "📋 Dán chữ có số TK" dưới phần ảnh của form phiếu chi và form P.KH (`scanFill`, `scanPasteText`). Chỉ điền ô đang TRỐNG; kết quả ghi rõ nguồn và mức tin từng ô.
- **Ảnh không rời máy**: thư mục `ocr/` trong repo (jsQR 1.4.0, tesseract.js 5.1.1 + core LSTM, bộ chữ tiếng Việt `vie` best_int — xem `ocr/README.md`), tải về trình duyệt khi bấm nút lần đầu (khoảng 5 MB), chạy tại chỗ; `workerPath` / `corePath` / `langPath` trỏ về `ocr/` nên không gọi CDN (bài thử kiểm không có request ra jsdelivr / unpkg / tessdata).
- **Dùng ẢNH GỐC**: `compressImage` nén ảnh lưu còn 1000 điểm ảnh (quá mờ để đọc chữ) → `_scanKeep(file)` giữ File gốc trong bộ nhớ (`_scanFiles`, tối đa 6, xoá khi bỏ ảnh / gửi phiếu), không lưu đi đâu. Không có ảnh gốc thì đọc ảnh đã nén. File PDF chưa đọc.
- Thứ tự: (1) mã QR chuyển khoản trong ảnh (`_scanQrIn` thử 3 cỡ → `_vietQrParse`) → ngân hàng + số TK + số tiền, chính xác; (2) không có thì đọc chữ (`_scanOcr`, `rotateAuto` tự xoay thẳng) → `_scanParseText`: số TK sau nhãn (STK / số tài khoản / TK…), bỏ MST / điện thoại / hotline; ngân hàng theo `SCAN_BANK_KW` (cụm dài thắng); số tiền CHỈ lấy sau nhãn (tổng thanh toán / tổng cộng / số tiền…); tên sau nhãn chủ TK / thụ hưởng / người nhận, không có thì dòng "Công ty…"; uỷ nhiệm chi chỉ lấy phần từ dòng thụ hưởng trở đi; (3) tên khớp lại đơn vị đã có (theo số TK đã chi, hoặc so tên không dấu); công trình: tên công trình có trong chữ, không thì theo lần chi trước của đơn vị.
- **Chặn đọc sai số tài khoản** (phép thử ảnh xấu dần cho thấy ảnh nghiêng 6° rụng 1 chữ số mà bộ đọc vẫn "chắc"): tự xoay thẳng; ĐỌC 2 LẦN ở 2 cỡ ảnh — khác nhau thì KHÔNG điền vào ô; độ tin của bộ đọc < 80% thì cảnh báo đỏ; số điền từ chữ (ảnh / dán) → lúc bấm Gửi app hỏi "đã so lại từng số chưa", hiện số theo nhóm 4 (`_scanConfirmAcct`). Số từ mã QR không hỏi.
- **Giới hạn đã đo** (ảnh mẫu dựng bằng trình duyệt, CHƯA thử ảnh chụp thật của công ty): chữ in rõ, nghiêng tới ~6°, mờ nhẹ / vừa, chữ nhỏ → số TK, ngân hàng, số tiền đúng; tên hay sai dấu ("CỐ PHẦN", "MIỄN") nên chỉ là gợi ý; mờ nặng / nghiêng 12° → không đọc được, app báo và không điền. Chữ viết tay: không đọc.
- Thử: `unit-scan.js` 13/13 (10 mẫu chữ: Zalo, UNC hai bên, hoá đơn có MST, SHB ≠ SCB, không nhãn…); `smoke24` 20/20 (3 ảnh mẫu + QR + mờ nặng + không đè ô có sẵn + xác nhận lúc gửi + không gọi máy chủ ngoài); `robust24` (8 mức xấu dần); hồi quy smoke7, 17, 21, 22, 23. Luật không đổi.

## v44 (D 27/11/2026 "kế toán gõ lại số tài khoản hay sai… khi có tài khoản thì tự tạo 1 mã QR trên app để thủ quỹ chuyển cho nhanh") — BƯỚC 1
D chốt qua trao đổi: ảnh KHÔNG gửi ra ngoài (không dùng AI bên thứ ba); Trang chuyển bằng app ngân hàng trên điện thoại. Bước 2 (đọc mã QR + chữ trong ảnh tải lên, ngay trên máy) CHƯA làm.
- Phiếu chi / P.KH thêm ô **Tài khoản nhận** (không bắt buộc): `payBank` = mã BIN 6 số (bảng `PAY_BANKS`, 57 ngân hàng, lấy từ gói công khai vietnam-qr-pay 1.5.1 — đọc file như văn bản, bỏ tên cũ trùng BIN và ví MoMo), `payAcctNo` = số tài khoản (chữ số / chữ hoa, 4–30). Tên chủ TK = ô payee sẵn có. Có ở form lập, form P.KH, khung Sửa (chỉ người lập sửa).
- **Tự điền theo lần chi trước**: gõ / chọn đơn vị nhận (so tên không dấu, `_payLast`) mà ô TK trống → điền TK phiếu gần nhất của đơn vị đó, nhắc "kiểm lại". Gõ TK khác lần trước → nhắc ngay tại ô. Không có nhánh dữ liệu mới — suy từ các phiếu.
- **An toàn**: luật khoá `payBank` / `payAcctNo` sau khi có duyệt (như payee; trước duyệt chỉ người lập / Dũng); `contentSnapshot` chụp thêm 2 trường lúc duyệt → `doTransfer` và `openPayQr` chặn + cảnh báo nếu khác lúc duyệt. Thẻ phiếu (người duyệt / thủ quỹ) và hộp QR cảnh báo khi TK khác lần chi trước cho cùng đơn vị (`_payWarn`).
- **Mã QR**: `vietQrPayload(bin, acct, amount, memo)` theo VietQR / EMVCo (00=01 · 01=12 có tiền / 11 không · 38{00 A000000727 · 01{00 BIN · 01 TK} · 02 QRIBFTTA} · 53=704 · 54 · 58=VN · 62{08 nội dung không dấu ≤ 50} · 63 CRC16-CCITT). Vẽ bằng `qrcode-gen.js` (qrcode-generator 2.0.4, MIT, để trong repo, tải khi cần) → PNG viền trắng. Hộp `openPayQr`: số tiền mặc định = còn phải chuyển (sửa được), nhắc đối chiếu TÊN chủ tài khoản app ngân hàng hiện ra, nút Lưu ảnh (chia sẻ / tải) + Chép số TK. Nút 📲 QR trên thẻ phiếu (thủ quỹ, Hiền, Dũng) và trong hộp chuyển tiền.
- Excel tháng thêm cột cuối "Tài khoản nhận".
- **Chưa kiểm được ở đây**: quét bằng app ngân hàng thật. Đã kiểm: CRC theo véc-tơ chuẩn, bố cục thẻ đối chiếu mã nguồn gói công khai, vẽ rồi giải mã lại bằng jsQR. Cần D / Trang quét thử 1 mã thật (xem tên chủ TK hiện ra, không cần chuyển).
- Thử: `unit-qr.js` 11/11; luật 153/153 (thêm 12 ca); `smoke23` (lập phiếu có TK, tự điền, nhắc khác TK, duyệt chụp snapshot, sửa sau duyệt bị chặn, QR giải mã đúng BIN / TK / số tiền / nội dung, đổi số tiền QR đổi theo, sửa TK sau duyệt → chặn chuyển + chặn QR); hồi quy smoke7, 14, 17, 21, 22.

## v43 (D 27/11/2026 "nút sửa bố trí xấu; tất cả nút xoá khi 1 ai đó xoá phải được sự đồng ý của tôi")
- **Thay quyết định v27** (Hiền xoá thẳng): nay MỌI người không phải Dũng, kể cả Hiền, bấm xoá → thành ĐỀ NGHỊ XOÁ, Dũng đồng ý mới xoá thật.
  - Phiếu chi / P.KH / ứng lương (`del`), công trình (`delSite`), đề xuất vật tư (`deletePlan`), nhân viên (`deleteEmp`): đề nghị ghi ở `pva379/delReqs/<loại>_<mã>` {kind p|s|k|n, id, label, amount, by, byName, ts}; `requestDelete` / `approveDelReq` (Dũng, gọi lại hàm xoá với `{force:true}` → không hỏi lại) / `rejectDelReq` (Dũng từ chối hoặc người gửi huỷ). Báo đẩy tới Dũng khi có đề nghị, báo người gửi khi Dũng đồng ý / từ chối.
  - Khoản sổ quỹ: giữ cơ chế `deleteReq` trên khoản, nay chỉ Dũng đồng ý / không đồng ý (bỏ đường "Hiền đồng ý là xoá").
  - Khung "🗑 N đề nghị xoá chờ Dũng duyệt" (`#delreq-panel`) đầu trang Đề xuất: Dũng thấy tất cả (kèm số khoản sổ quỹ chờ xoá, bấm sang Cân đối), người gửi thấy đề nghị của mình + nút huỷ. Công trình đang chờ xoá hiện "⏳ chờ xoá" thay cho nút ×.
  - Không áp: thu hồi tin nhắn của chính mình, bỏ ảnh / dòng kê tạm ứng khi đang soạn, vật tư luân chuyển (đã Dũng duyệt từ v69), các mục vốn chỉ Dũng xoá (tài khoản, người dùng, người đề xuất, thùng rác).
- Luật: xoá `proposals/$id`, `khProposals/$id`, `cashflow/$id` chỉ Dũng (giữ đường thủ quỹ — nay cả Hiền — gỡ khoản ký quỹ tự sinh `p_*` khi hoàn tác chuyển tiền); `plans/$id`, `employees/$id` xoá chỉ Dũng (vẫn sửa được như cũ); xoá node không tồn tại không bị chặn (để lần ghi gộp không vỡ); thêm `delReqs`. Dũng được gỡ lần chuyển trên phiếu (cần khi xoá khoản vay giải ngân thẳng). Danh sách công trình (`meta/sites`) Hiền vẫn ghi được (thêm / sửa tên) — việc chặn Hiền xoá công trình nằm ở app.
- Nút ✏️ và × trong Danh sách công trình gom thành cụm bên phải, cùng cỡ 34px, tên công trình chiếm phần còn lại.
- Thử: luật 141/141 (đổi 3 ca cũ "Hiền xoá thẳng" thành bị chặn, thêm 19 ca); `smoke22` (NV / Hiền đề nghị, Dũng đồng ý / từ chối, thùng rác, khung đề nghị); `smoke17` sửa phần xoá khoản vay sang Dũng; hồi quy smoke7, 8, 14, 20, 21.

## v42 (D 27/11/2026 "mục công trình phải sửa tên được")
- Nút ✏️ cạnh mỗi công trình (Dũng, Hiền) → `renameSite(i)`: hỏi tên mới, chặn trống / trùng (không phân biệt hoa thường), đếm và hỏi xác nhận số phiếu / khoản sổ quỹ / kế hoạch vật tư đang ghi tên cũ, rồi ghi MỘT lần (`db.ref().update`, cả hoặc không): `meta/sites`, `site` của mọi phiếu (`proposals` + `khProposals`, kể cả ứng lương), `contentSnapshot/site` cùng giá trị cho phiếu đã duyệt, `cashflow/*/site`, `plans/*/site`. Báo cáo theo công trình không bị tách hai tên; phiếu đã duyệt vẫn chuyển tiền được (không vấp cảnh báo sửa sau duyệt).
- Luật: `proposals/$id/site` và `khProposals/$id/site` thêm vế Dũng / Hiền đổi được kể cả phiếu đã duyệt, CHỈ khi `contentSnapshot/site` mới = giá trị mới (hoặc phiếu chưa có snapshot) — giữ lớp chống sửa sau duyệt. Hàng Google Sheet đã đồng bộ trước đó vẫn ghi tên cũ (không sửa ngược).
- Gia cố: gợi ý tài khoản khi chuyển tiền không lỗi khi phiếu có loại thuế lạ.
- Thử: luật 123/123 (thêm 5 ca); `smoke21` (đổi "Thép Thương mại Hà Nội" → tên mới: 3 phiếu + 1 khoản đổi, phiếu đã duyệt đổi kèm snapshot, báo cáo gộp, vẫn mở được chuyển tiền, chặn trùng tên); hồi quy smoke7, smoke20.

## v41 (D 27/11/2026 "thêm CT Cầu xã ĐA vẫn chưa được")
- Chưa rõ nguyên nhân trên máy D (v40 đã đúng trên giả lập cho cả Dũng và Hiền) → làm cho chắc và cho biết lỗi: `_saveSites()` ghi THẲNG `pva379/meta/sites` bằng `set()` và chờ máy chủ trả lời; báo "✅ đã lưu lên máy chủ (N công trình)" hoặc "❌ Không lưu được: <mã lỗi>"; đang "xem thử vai" (`_viewAs`) thì báo thoát ra (trước đây `save()` chỉ nhả toast "Đang xem thử" dễ bỏ qua). Thêm trùng tên bị chặn. Thẻ Danh sách công trình ghi "Máy chủ đang có N công trình", lệch với máy thì cảnh báo đỏ.
- Thử: `smoke20` mở rộng (trùng tên, toast đã lưu, dòng số máy chủ).

## v40 (D 27/11/2026 "thêm công trình thấy rồi, quay ra lại mất")
- Lỗi do v39: `pushToFirebase` chỉ ghi gói meta (persons + sites + sheetUrl) khi `currentRole==='dung'` → Hiền thêm công trình chỉ nằm trên máy, tải lại là mất. Nay Hiền ghi RIÊNG `pva379/meta/sites` khi danh sách đổi (luật v39 cho), không kèm persons / sheetUrl.
- `addSite` / `delSite` chặn khi dữ liệu chưa tải xong (`_chuaTaiXong`) — trước đó thêm sớm quá cũng chỉ nằm trên máy.
- Thử: `smoke20` (Hiền thêm → máy chủ có, tải lại còn; Dũng thêm đủ gói; hai bên không ghi đè nhau). Thử luật trực tiếp: Dũng ghi cả gói OK, Hiền cả gói bị chặn, Hiền chỉ sites OK.

## v39 (D 27/11/2026 "cho Hiền quyền giống Dũng để thêm công trình")
- `addSite` / `delSite`: `_isApprover()` (Dũng, Hiền); xoá công trình hỏi trước (phiếu đã ghi công trình đó giữ nguyên). Luật: `pva379/meta/sites` `.write` dung | hien (+ validate tên ≤ 200 ký tự); danh sách người đề xuất (`meta/persons`) vẫn chỉ Dũng. Luật 118/118.

## v38 (D 27/11/2026 "cho cả cái màu bên ngoài thành màu đó luôn")
- Biểu tượng app (ngoài màn hình chính / thông báo / tab): trước manifest trỏ `icon-192.png` / `icon-512.png` dùng chung với Duyệt Chi mà **file không có trong repo** (404 → điện thoại tự sinh chữ cái). Nay có bộ riêng `icon-pva379-512.png` / `-192.png` / `-180.png` (nền cam đỏ, chữ PVA 379; tạo bằng PIL, vùng an toàn maskable). `manifest-pva379.json` icons (any + maskable), `<link rel="apple-touch-icon">` → 180, `<link rel="icon">` → 192, `sw-pva379.js` icon/badge thông báo → 192. Không đụng manifest / icon của Duyệt Chi, Gia Bình.
- Lưu ý: điện thoại đã cài sẵn app phải **gỡ rồi cài lại** (Thêm vào màn hình chính) mới đổi biểu tượng; bản cài mới thấy ngay.

## v37 (D 27/11/2026 "đổi màu thành cam đỏ")
- Màu chủ đạo chàm → CAM ĐỎ: `--blue:#c2410c`, `--blue-light:#ffedd5`, `--blue-dark:#9a3412` (mọi chỗ dùng biến tự đổi); `theme-color` + `manifest-pva379.json` = `#c2410c`; màn vai / màn chặn, ô "Còn được tiêu" (gradient #9a3412→#ea580c), ô "= Trong TK" / "= Tiền trong tài khoản" nền cam nhạt, tiêu đề Sheet Apps Script. Giữ nguyên: ô Tiền mặt (xanh lá), nhãn "NH giải ngân thẳng" (chàm, để phân biệt), nút Sửa (xanh dương), màu trạng thái. Biểu tượng PWA (file ảnh) chưa đổi.

## v36 (27/11/2026) — PHÁT HÀNH (D: "giữ nguyên không thay đổi gì nhé. phát hành")
- `PUSH_TRIAL = false`: bỏ màn chặn thử → 12 nhân viên (vai other, đã có hồ sơ + đã duyệt sẵn bên `pva379/userRoles`) vào được; thông báo đẩy gửi đúng vai, không còn "[Thử]". Không đổi gì khác (D dặn giữ nguyên; lô 40 phiếu ứng lương giữ). `version-pva379.txt` + `sw-pva379.js` = v36.
- Người mới (D nêu 1 nhân viên 27/11): tự Đăng ký trong app → D đọc mã 6 số → D bấm "Cho xem dữ liệu" ở Cài đặt → Duyệt tài khoản.
- Còn việc của D: `firebase deploy --only functions` trên máy D (push379 kiểm thêm `pva379/userRoles`).
- Thử: `smoke19` (nhân viên vào không bị chặn; thấy Đề xuất + Báo cáo, không Cân đối / Thùng rác; thông báo không gắn [Thử]).

## 27/11/2026 — chuẩn bị cho mọi người Duyệt Chi vào PVA-379 (D hỏi "cho toàn bộ những người đã vào được sổ DC cũng đăng nhập vào sổ này")
- `scripts/chep-vai-tu-duyet-chi.js` + tác vụ `chep-vai-tu-duyet-chi.yml` (gõ `CHEP`; trống = chạy thử đếm): chép HỒ SƠ TÀI KHOẢN `duyetchi/userRoles` → `pva379/userRoles` cho uid chưa có (không đè ai đã có), chỉ tài khoản đã duyệt bên DC; vai trang→thuquy, dung/hien/ketoan giữ, còn lại other; dept kehoach/both giữ. KHÔNG chép phiếu / sổ quỹ (sổ mới). Nhật ký chỉ đếm theo vai, không in tên / email. Cùng project nên uid trùng → đăng nhập Google như cũ là vào.
- `functions/push379.js`: người nhận / tên người nhận được kiểm thêm ở `pva379/userRoles` (trước chỉ `duyetchi/userRoles` → người chỉ có hồ sơ PVA-379 không nhận thông báo). **Cần D deploy functions** (`firebase deploy --only functions` trên máy D) — repo không có tác vụ tự deploy functions.
- Chưa đổi `PUSH_TRIAL` — vai `other` vẫn bị chặn tới khi D nói "phát hành" (= `PUSH_TRIAL=false`).

## v35 (D 27/11/2026 "phần vay xếp khoản chưa trả xong trước, khoản đã trả sau")
- `renderLoanList`: khoản còn nợ gốc lên trước (mới → cũ theo ngày), khoản đã trả hết gốc xuống dưới; áp dụng cả mục Nợ tồn đọng cũ (dùng chung danh sách đã xếp). Thử: `smoke18`.

## v34 (D 27/11/2026 "thêm cả ứng lương đã duyệt — giải ngân cũng có thể dùng để trả lương")
- `_allocProps` gồm cả phiếu ỨNG LƯƠNG (kind salary, nằm trong `pva379/proposals`, cùng luồng duyệt / chuyển) đã duyệt còn phải chuyển; nhãn "Lương · tên NV · nhóm · Ứng lương tháng …"; xếp sau phiếu chi. Vẫn bỏ ký quỹ, tạm ứng.
- Nút **➕ Ứng lương cả đợt** (`loanAllocAddSalary`): kê một lúc mọi phiếu ứng lương đã duyệt còn phải chuyển (bỏ phiếu đã có dòng), số tiền = phần còn lại — giải ngân trả lương cả đợt không phải chọn từng người.
- Luật không đổi. Thử: `smoke17` thêm 2 phiếu lương (1 đã duyệt có trong danh sách, 1 chưa duyệt không có; nút cả đợt kê đúng 1 dòng 8tr).

## v33 (D 27/11/2026 "bấm Trả phiếu không hiện phiếu nào")
- Danh sách phiếu cho giải ngân thẳng (`_allocProps`) nay gồm cả **phiếu P.KH** đã duyệt (trả nhà cung cấp phần lớn là phiếu P.KH; v32 lọc nhầm). Vẫn bỏ ứng lương, ký quỹ, tạm ứng. Nhãn có tiền tố "P.KH ·".
- Danh sách trống → ghi rõ "Chưa có phiếu nào ĐÃ DUYỆT còn phải chuyển (N phiếu đang chờ duyệt — duyệt xong mới chọn được)"; có phiếu thì ghi số lượng.
- Thử: luật 114/114 (thêm 2 ca lần chuyển nguồn vay trên khProposals); `smoke17` thêm phiếu P.KH đã duyệt có trong danh sách + câu báo trống.

## v32 (D 27/11/2026 "vay: chọn ngân hàng có sẵn của công ty; giải ngân thẳng cho đơn vị nhận theo phiếu đã duyệt")
D chốt: (1) giải ngân thẳng BẮT BUỘC có phiếu và phiếu đã duyệt; (2) mỗi lần NH giải ngân = 1 khoản vay riêng, hạch toán / trả gốc lãi / lãi suất riêng; (3) thủ quỹ hoặc Hiền ghi; (4) một lần giải ngân chia nhiều dòng (phiếu A, phiếu B, phần còn lại về TK); (5) phí giải ngân NH thu RIÊNG ngoài khoản vay, là chi phí → mục "Trả phí + lãi vay NH".
- Form Vay: "Vay của = Ngân hàng" → ô **Ngân hàng cho vay (theo từng công ty)** chọn từ tài khoản đã khai (`_loanBankOpts`: `379 · TP`, `PVA · Vietin`…, bỏ nhóm Tiền mặt, có "Ngân hàng khác (gõ tên)"); `lenderName` = tên đó → tab Vay gộp nợ đúng theo công ty vay.
- Ô **Giải ngân thẳng** (chỉ thủ quỹ / Hiền thấy — Dũng không ghi được lần chuyển vào phiếu theo luật): ẩn "Tiền về tài khoản", hiện **bảng phân bổ** (`loanAllocAdd`): dòng *Trả phiếu* (chọn trong phiếu đã duyệt còn phải chuyển, không ký quỹ / tạm ứng / lương / P.KH — `_allocProps`; chọn xong tự điền số còn lại) hoặc *Về tài khoản*; tổng phải bằng đúng số vay (`_loanAllocSum`, chặn lưu nếu lệch). Ô **Phí giải ngân** + tài khoản bị trừ.
- Dữ liệu: khoản vay `{direct:true, alloc:[{kind:'acct',acct,amount}|{kind:'prop',pid,amount}]}`, KHÔNG có `acct`. Mỗi dòng prop ghi vào phiếu một lần chuyển `{amount, ts, loanId, src:'loan'}` (không `acct`) qua `_loanApplyDirect` → phiếu "đã chuyển", báo cáo công trình / người nhận / Excel tính đủ. Phí → `bankpay` kind `laiphi`, `bank`=tên NH, `loanId`, trừ TK ngay (chi phí), không duyệt.
- `cashTotals`: `vay` (tiền vào TK) chỉ cộng dòng về TK; lần chuyển có `loanId` không trừ TK, không vào `daChi`, cộng vào `chiTuVay` (dòng riêng ở Tổng quan "NH giải ngân thẳng theo phiếu"); `noVay` đủ cả khoản. Sổ quỹ: khoản vay direct ra từng dòng "phần về TK"; lần chuyển nguồn vay không vào Sổ quỹ. Thẻ phiếu / Excel ghi "NH giải ngân thẳng"; không đổi nguồn, không hoàn tác ở phiếu (`undoTransfer` chặn).
- Thẻ khoản vay: nhãn GIẢI NGÂN THẲNG, liệt kê từng dòng (bấm mở phiếu), phí GN đã ghi, cảnh báo "chưa ghi vào phiếu" + nút 🔁 Ghi lại nếu lần ghi vào phiếu bị rớt. Không có nút Sửa / đổi nguồn (sai thì xoá ghi lại). Tổng tab Vay thêm "NH trả thẳng theo phiếu X".
- Xoá khoản vay direct (Dũng / Hiền): gỡ các lần chuyển `loanId` trên phiếu (chỉ khi là các lần cuối của phiếu — luật không cho dời chỗ lần chuyển cũ; có lần chuyển sau → báo hoàn tác trước), phiếu quay về đã duyệt; phí giải ngân (chi phí thật) giữ nguyên.
- Luật: `cashflow/$id` thêm `direct` (true, không kèm `old`/`acct`), `alloc` (đóng băng với thủ quỹ; từng dòng kind acct phải có TK tồn tại / kind prop phải có pid); `proposals/$id/transfers/$i` thêm `loanId`, `src='loan'`. **Sửa lỗi cũ**: vế "từng chỉ số transfers phải còn" chỉ cho thủ quỹ → thêm Hiền (v17 cho Hiền hoàn tác nhưng phiếu có 2+ lần chuyển Hiền gỡ không được; xoá vay direct cũng cần).
- Sửa kèm: `_cashBusy()` không còn tự khoá 2 giây khi form báo lỗi nhập liệu (trước: sửa lỗi xong bấm Lưu ngay bị "Đang lưu…").
- Thử: luật 112/112 (thêm 19 ca v32); Chromium `smoke17` (Trang: danh sách NH theo công ty; kê 1 tỷ = phiếu A 200 + phiếu B 100 + về TM 700, phí 2tr trừ 379·TP → TM 750, 379·TP 998, tiền TK 1.748, nợ vay 1 tỷ, chi thẳng 300, CT X 200 / CT Y 100, thẻ vay, Tổng quan, Sổ quỹ, chặn hoàn tác; Hiền xoá vay → phiếu về đã duyệt, phí giữ); hồi quy smoke7/8/14 đúng.

## v31 (D 26/11/2026 "Cân đối: tiền mặt đang còn nhìn thấy ngay trên Còn được tiêu; form chuyển tiền hiện số dư TK đi / đến")
- Tổng quan Cân đối: ô xanh lá **💵 TIỀN MẶT ĐANG CÒN** đặt trên ô Còn được tiêu = tổng `byAcct` các tài khoản nhóm Tiền mặt (`icon==='💵'`, bỏ TK đã tắt số dư 0), kèm từng tài khoản (bấm → Sổ quỹ TK đó). Người `_oneAcct()` không thấy.
- Form 🔁 Chuyển tiền: dưới ô Từ / Sang có dòng `Đang có: X` của tài khoản vừa chọn (`_xferBal()` gọi khi mở form, đổi TK, gõ số tiền); đã gõ số tiền thì thêm `Sau khi chuyển: Y` (đỏ + ⚠️ âm nếu < 0); chọn cùng TK → báo đỏ. Chỉ hiển thị, không chặn lưu (giữ kiểm tra cũ trong `submitXfer`).
- Thử: Chromium `smoke16` (Trang: hero 70tr = 50 + 20, thứ tự trước Còn được tiêu; form: Đang có / Sau khi chuyển đúng, báo âm, cùng TK; lưu 30tr rồi mở lại số dư đổi; NV không thấy ô tiền mặt). Luật không đổi.

## v30 (D 26/11/2026 "3 người Trang, Hiền, Dũng thấy toàn bộ sổ; người khác chỉ phiếu mình + từng công trình, không thấy mục khác")
- Rà lại quyền xem: nhân viên vẫn thấy phiếu của mình, Báo cáo → Công trình (thu/chi từng CT, Excel từng CT, không dòng TỔNG — D xác nhận lại 26/11 "từng công trình được, tổng quan toàn bộ không"), Vật tư (D: "vật tư nhìn thấy được"). Các tab Tóm tắt / Danh sách / Đã chuyển / Chưa chuyển / Từ chối / Người nhận và Excel đều đi qua `getFilteredProposals()` → chỉ phiếu `_canSeeP`.
- Lỗ hổng vá: **Thùng rác** (thẻ `#trash-card` ở Cài đặt + ô `#tile-trash` trong menu Thêm) trước đây ai đã duyệt cũng xem, liệt kê phiếu / khoản đã xoá của cả công ty → nay chỉ `_fullView()` (Dũng, Hiền, thủ quỹ); `moreGo('trash')` chặn có báo; `renderTrash()` ngoài nhóm chỉ ra mục chính mình đã xoá (phòng gọi thẳng hàm). Luật `pva379/trash` không đổi (đọc vẫn mở cho người đã duyệt — chỉ là ẩn giao diện, như `cashflow`).
- Thử: Chromium `smoke15` (NV vai other: thẻ + ô Thùng rác ẩn, bấm bị chặn, Cân đối / Telegram / Bảng tính ẩn, Báo cáo → Công trình hiện không TỔNG, Vật tư + Cài đặt vẫn trong menu Thêm; D thấy đủ 2 mục rác). Luật 93/93.

## v29 (D 26/11/2026 "duyệt 1 phần thì số còn lại vẫn ở Chờ duyệt để duyệt tiếp hoặc từ chối")
- `_remainOpen(p)` = còn phần đề xuất chưa duyệt (`remainUnapproved`) và chưa bị đóng. Ô **Chờ duyệt** (`_expenseMatch pending`) gồm cả phiếu duyệt 1 phần (dù đã chuyển phần duyệt); số tiền ô này cộng **phần còn lại** với phiếu đã có duyệt. Ô "Chờ duyệt thêm" (v111) bỏ.
- Người duyệt đã duyệt 1 phần thấy nút **✕ Không duyệt X còn lại** (`rejectRemain` → `p.remainRej {ts, amount, reason, by, name, role}`, bắt buộc lý do, báo người đề xuất). Đóng rồi thì phiếu rời Chờ duyệt / chuông / nhắc việc; thẻ hiện badge đỏ. Người đề xuất "xin duyệt thêm" (askMore mới hơn) hoặc người duyệt duyệt thêm → mở lại (`remainClosed` so ts).
- Nút từ chối lời xin thêm hiện ở mọi trạng thái (trước chỉ khi đã chuyển đủ). Nhắc việc ghi "Duyệt tiếp X còn lại". Luật không đổi (`remainRej` là trường tự do trong proposals pva379).
- Thử: Chromium `smoke14` (H duyệt 6/10tr → ô Chờ duyệt vẫn có, số 4tr; H đóng → rời; NV xin thêm → quay lại).

## v28 (D 26/11/2026 "Tổng quan, Sổ quỹ ghi đúng số tiền, cùng một đơn vị, không làm tròn tr / tỷ")
- Toàn bộ trang Cân đối (Tổng quan: ô lớn, bảng theo công ty, bảng theo công trình, dòng tổng; biểu đồ tháng; Thu / Ký quỹ / Vay / Nợ cũ / Trả NH / Chi riêng / Sổ quỹ) đổi `fmtShortMoney` → `fmtVND` (đủ đơn vị đồng). Bảng công ty hạ cỡ chữ 10.5px, ô lớn 24px, cuộn ngang. Giữ số rút gọn ở trang Đề xuất (ô thống kê) và Báo cáo → Người nhận.

## v27 (D 26/11/2026 "Bỏ các yêu cầu phải Dũng duyệt khi thay đổi, sửa, xoá — mình Hiền duyệt là được")
- `_isApprover()` = dung | hien. Hiền: **xoá thẳng** khoản sổ quỹ (kể cả chuyển nội bộ, khoản vay kèm trả nợ), **sửa thẳng** mọi trường (modal Sửa khoản lưu ngay, không editReq), duyệt đề nghị sửa / xoá của thủ quỹ (đồng ý xoá = xoá ngay), gắn lại trả nợ mồ côi, xoá phiếu chi / P.KH / ứng lương đã duyệt. Không còn trạng thái "chờ Dũng" ở đâu trong sổ quỹ.
- Thủ quỹ vẫn đi đường đề nghị → Hiền duyệt. Luật: cashflow `.write` xoá cho hien; 16 trường (amount, desc, date, principal, interest, lenderName, rate, due, holder, src, who, payee, lender, bank, kind, loanId) cho hien đổi thẳng; `.write` xoá phiếu đã duyệt ở proposals / khProposals / salaryAdvances cho hien.
- Giữ cho Dũng: khôi phục Thùng rác, danh sách tài khoản / người / công trình, cấp vai, hoàn tác lượt duyệt của chính Dũng.
- Thử: luật 93/93 (bỏ 2 mục lỗi thời), smoke10 + smoke8 hồi quy.

## v26 (D 26/11/2026 "khi ấn đổi nên hiện cả nguồn đi và nguồn đến")
- Chuyển nội bộ: nút ✎ đổi (thẻ `cashAcctBtn` và dòng Sổ quỹ) mở `fixXferAccts(id, focus)` — một hộp hiện **cả tài khoản đi và tài khoản đến** (select theo công ty · ngân hàng), dòng tóm tắt A → B, chặn trùng nhau, nút Lưu chỉ sáng khi có đổi; ghi `update({from,to})` một lần. Khoản khác vẫn dùng `pickAcct` một đầu.

## v25 (D 26/11/2026)
- Hộp đề nghị xoá khoản sổ quỹ: Hiền (không phải người đề nghị) / Dũng có thêm nút **✖ Không đồng ý** (`rejectCashDelete`: gỡ deleteReq, báo thủ quỹ). Trước chỉ có "Tôi đồng ý xóa".
- Chi riêng thêm **Trang** (`RIENG_WHO.trang`, luật `who` nhận 'trang'); tổng theo người ở Tổng quan / tab Chi riêng có dòng Trang; nhãn `who` dùng `RIENG_WHO` ở mọi chỗ (sổ quỹ, Sheet, nhãn khoản, form sửa).

## v24 (D 26/11/2026): rà khoản ghi trùng + xoá chuyển nội bộ trong Sổ quỹ
- Sự cố: Trang ghi trùng cặp "TM nộp Vietin 379 40tr (chuyển nội bộ) → Vietin 379 chuyển cào bóc (lần chuyển trên phiếu)".
- Kịch bản `scripts/ra-trung-so-quy.js` + tác vụ **"Ra trung so quy PVA-379"** (`ra-trung-so-quy.yml`, `lenh` = ra | xoa-khoan | bo-lan-chuyen, `ids`): rà nhóm khoản sổ quỹ giống hệt (loại, số tiền, TK, ngày) và phiếu có ≥2 lần chuyển cùng số cùng ngày; xoá khoản theo mã (vào thùng rác); bỏ lần chuyển trên phiếu (bản sao vào `trash/transfer`, tính lại `status` như nút Hoàn tác; từ chối phiếu ký quỹ). Nhật ký in mã + ngày + loại + tên TK + số tiền làm tròn triệu, không in nội dung / người.
- App: dòng chuyển nội bộ trong Sổ quỹ có nút 🗑 (Dũng xoá thẳng / người khác đề nghị xoá) — trước v24 không có chỗ nào xoá được xfer. Tổng quan gom thêm "N đề nghị xoá khoản đang chờ" (`_pendingDelsHtml`) để Hiền duyệt xoá cả xfer.
- Thử: emulator `ratrung-test` 7/7.

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
