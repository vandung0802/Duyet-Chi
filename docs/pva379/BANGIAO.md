# App PVA-379 — nhật ký bàn giao

`pva-379.html`: app duyệt chi + sổ quỹ của công ty. Chạy tại https://vandung0802.github.io/Duyet-Chi/pva-379.html

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

## Giai đoạn thử (D chốt 22/11: "1 mình tôi làm app này ngon lành thì mới thông báo cho mọi người")
- `PUSH_TRIAL = true` làm 2 việc: (1) `_trialGate()` — ai không thuộc `TRIAL_ROLES` (D 22/11: `['dung','hien']`, mở thêm cho Hiền) thì thấy màn "PVA-379 đang chạy thử" + nút mở app Duyệt Chi, không đăng ký thông báo; Dũng "xem thử vai" vẫn dùng được; (2) thông báo đẩy chỉ về máy Dũng, tiêu đề "[Thử]".
- **Dữ liệu thử = BẢN CHÉP từ app Duyệt Chi** (`duyetchi/` → `pva379/`), 2 app chạy song song:
  - Kịch bản `scripts/chep-duyetchi-sang-pva379.js`, chạy bằng tác vụ GitHub **"Chep du lieu Duyet Chi sang PVA-379"** (`.github/workflows/chep-du-lieu-pva379.yml`, Run workflow, gõ `CHEP`; để trống = chạy thử chỉ đọc). Dùng cùng chìa khoá FIREBASE_TOKEN với tác vụ đưa luật.
  - Chỉ ĐỌC `duyetchi/`, chỉ GHI `pva379/…` (hàm `kiemDich` chặn). Mỗi nhánh đích XOÁ rồi chép lại = bản chụp lúc chạy; chạy lại bao nhiêu lần cũng được (D muốn số mới thì bảo chép lại; thao tác thử của D trong PVA-379 trên các nhánh đó sẽ mất).
  - Chép: userRoles (role `trang` → `thuquy`), proposals, images, khProposals, khImages, plans, employees, salaryAdvances, groupChat, chatPin, chatRead, khChat, khChatPin, khChatRead, meta/persons, meta/sites. Ghi dấu `meta/copiedFrom {ts, proposals}` (app hiện dòng "bản chép" trong Cài đặt).
  - KHÔNG chép: meta/sheetUrl, sheetViewUrl, telegram* (PVA-379 dùng Sheet riêng), pendingOtp, online. GIỮ NGUYÊN: pva379/meta/accounts, accountsSeeded, cashflow, bankBalance, advPeople, trash.
  - Kho ảnh chia lô ≤12 MB mỗi lệnh ghi. Thử trên emulator (chế độ REST, `FIREBASE_DATABASE_EMULATOR_HOST`): đúng.
- Trong lúc thử, việc thật (duyệt, chuyển) vẫn làm ở app Duyệt Chi. D duyệt trong PVA-379 chỉ là thử, không ai thấy.
- Máy Dũng có 2 service worker (app3 + pva-379) cùng đăng ký kênh `dung` → mỗi thông báo thật hiện 2 lần trên máy D trong giai đoạn thử. Hết khi chuyển hẳn.
- Khi D nói "phát hành": chép lần cuối (`CHEP`), đổi `PUSH_TRIAL=false`, bump version, rồi cho app3 báo chuyển.

## Rà soát toàn app 22/11/2026 (5 lượt đọc độc lập + bấm thử 1.740 phiếu giả giống bản chép)
Đã sửa (v2):
- **Nặng:** app huỷ nhầm đăng ký thông báo của app Duyệt Chi trên cùng máy (khối "tự chữa lành" bê từ Gia Bình — Gia Bình có khoá VAPID riêng, ở đây cùng khoá) → bỏ. Excel tháng rò phiếu người khác → lọc `_canSeeP`.
- **Đầu kỳ sổ quỹ** (`_cashStartYmd`, `meta/cashStart`, `meta/accounts/<mã>/open`): thu/chi/chuyển TRƯỚC mốc không vào sổ (1.740 phiếu cũ không làm quỹ âm); mặc định mốc = ngày chép dữ liệu; Dũng nhập ngày + số dư đầu kỳ từng tài khoản ở Cài đặt → Tài khoản. Chưa khai thì Tổng quan và khung duyệt nhắc "chưa đúng".
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
2. Chuyển dữ liệu (khi D bảo) — **NGUỒN LÀ APP DUYỆT CHI (nhánh `duyetchi/` của project 379). KHÔNG chuyển, KHÔNG đụng dữ liệu Gia Bình** (project `so-quy-gia-binh` chạy riêng mãi, D chốt 19/11):
   - chạy tác vụ "Chep du lieu Duyet Chi sang PVA-379" với `CHEP` (xem mục Giai đoạn thử) — đã có sẵn, chạy lại được;
   - các lần chuyển cũ không có `acct` sẽ tự tính vào tài khoản mặc định (Tiền mặt). Nếu cần đúng từng tài khoản thì thủ quỹ đổi bằng chip tài khoản trên phiếu.
   - Sau đó cho `app3.html` hiện thông báo chuyển sang PVA-379.
3. Kế toán: D cấp vai `ketoan` trong Cài đặt khi có người.

## Thử nghiệm
Bộ thử nằm ngoài repo (scratchpad phiên 19/11): emulator database + auth, Chromium bấm thử 6 tài khoản. Kết quả:
- luồng 1: 22/22 (lập phiếu → D → H → thủ quỹ chuyển từ 379·TP → thu có công trình → Cân đối → quyền xem);
- luồng 2: 10/10 (vay, trả nợ chờ H duyệt, chuyển nội bộ, đối chiếu NH, xoá khoản).
