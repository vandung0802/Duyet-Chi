# 📋 BÀN GIAO — App Duyệt Chi PVA 379 (v2 — bản đầy đủ)

> **Dùng file này để Claude ở cửa sổ/Project MỚI hiểu ngay toàn bộ app và làm tiếp không cần hỏi lại.**
> Chỉ cần nói: *"Kế thừa các việc đã làm trong cửa sổ App Duyệt Chi v2 (file BANGIAO_AppDuyetChi.md)"* là bắt tay vào việc luôn.
>
> **Cập nhật lần cuối:** phiên bản app **v64** (`APP_VERSION = '20260704-v64'`, `sw.js VERSION = '20260704-57'`, `version.txt = 20260704-v64`). Ngày 04/07/2026.

---

## 0. QUY TẮC LÀM VIỆC BẮT BUỘC (đọc trước tiên)

1. **File chính của app là `app3.html`** (KHÔNG phải `index.html`). Repo `Duyet-Chi` hiện chỉ track `app3.html` + `sw.js` + `version.txt` + `manifest*.json`.
2. **Tự đẩy lên sau mỗi thay đổi + tự kiểm thử, KHÔNG hỏi user.** User ở iPhone, không thao tác máy tính được. Xong việc là `git add ... && git commit && git push origin main`.
3. **MỖI LẦN ra bản mới PHẢI bump ĐỒNG THỜI 3 chỗ về CÙNG một chuỗi phiên bản** (nếu không, cơ chế "Cập nhật phần mềm mới" sẽ sai — xem mục 9):
   - `APP_VERSION` trong `app3.html` (VD `'20260630-v53'`)
   - Nội dung file `version.txt` (đúng y chuỗi đó, VD `20260630-v53`)
   - `VERSION` trong `sw.js` (đánh số riêng tăng dần, VD `'20260630-46'` — chỉ cần khác lần trước)
4. **Kiểm thử bằng preview** (server đã chạy sẵn). Vào app3 cần `location.replace('/app3.html?fresh='+Date.now())`. Lỗi Firebase `PERMISSION_DENIED` trong preview là BÌNH THƯỜNG (do preview không đăng nhập) — bỏ qua.
5. **Nguyên tắc dữ liệu cốt lõi:** đừng lưu dữ liệu suy ra được (derived) song song với nguồn gốc — chỉ giữ 1 nguồn, tính lại khi cần (xem mục 5).
6. **Tiếng Việt** khi giao tiếp với user. Giải thích ngắn gọn, thực tế, trấn an khi user lo (đây là app điều hành tiền của cả công ty — lỗi làm tắc việc cả công ty).

---

## 1. THÔNG TIN CƠ BẢN

- **Tên:** App Duyệt Chi — Phúc Vinh An (PVA 379)
- **URL người dùng mở (điện thoại):** https://vandung0802.github.io/Duyet-Chi/app3.html
- **Dạng:** PWA một file `app3.html` (~4000 dòng, HTML+CSS+JS inline), host GitHub Pages.
- **Backend:** Firebase Realtime Database (đồng bộ đa máy, realtime) + Google Sheets (ghi log qua Apps Script, kỹ thuật JSONP).
- **Firebase project:** `duyetchi-pva379` (asia-southeast1). Có **Firebase Auth** (email + mật khẩu) để đăng nhập.

### Hai repo GitHub (mục 8 nói kỹ)
- **`vandung0802/Duyet-Chi`** ← **thư mục làm việc chính** `F:\nháp\379 duyệt chi\tóm tắt chuyển pro` là clone của repo này. Push ở đây là cập nhật production `/Duyet-Chi/app3.html`. **Bản điện thoại chạy ở đây → chỉ cần push repo này là đủ.**
- **`vandung0802/vandung0802.github.io`** (clone riêng ở `C:\Users\Vo Van Dung\vandung0802.github.io\`) — repo cũ, `index.html` là bản sao rất cũ (v16). Vai trò không còn chắc; **hỏi user trước khi đụng**. Thường KHÔNG cần.

---

## 2. VAI TRÒ (ROLE) & ĐĂNG NHẬP

Đăng nhập bằng **Firebase Auth (email + mật khẩu)**, có tab Đăng nhập / Đăng ký. Sau khi đăng nhập, `currentRole` được xác định (dung/hien/trang/other).

| Role (mã) | Người | Ký hiệu | Màu | Quyền |
|-----------|-------|---------|-----|-------|
| `dung` | Dũng (GĐ) | D | Xanh dương | Tạo phiếu, **Duyệt D**, Từ chối, Sửa, Xóa phiếu |
| `hien` | Hiền (Phó GĐ) | H | Tím `#7c3aed` | **Duyệt H**, Từ chối |
| `trang` | Trang (Thủ quỹ) | T | Vàng | **Chuyển tiền**, Upload ảnh chứng từ |
| `other` | Khác | 👤 | Xám | Xem + Thêm phiếu |

`ROLES` định nghĩa ở ~dòng 1125. `getCurrentUserName()` ~1132.

---

## 3. VÒNG ĐỜI MỘT PHIẾU

```
Tạo phiếu → Chờ duyệt (pending)
   ↓ D duyệt (một phần hoặc toàn bộ, nhiều lần cộng dồn)
   ↓ H duyệt (một phần hoặc toàn bộ, nhiều lần cộng dồn)
   → Đã duyệt (approved)
   ↓ Trang chuyển tiền (nhiều lần, ghi vào transfers[])
   → Đã chuyển xong khi chuyển ĐỦ SỐ DUYỆT CHÍNH THỨC (không phải số đề xuất gốc)
   ↓ Trang upload ảnh chứng từ
D hoặc H có thể → Từ chối (rejected) — undo được.
```

**Quy trình duyệt:** Công trường đề xuất → **D (Dũng) duyệt** → **H (Hiền) duyệt** → **T (Trắng/Trang) chuyển tiền**.

---

## 4. QUY TẮC NGHIỆP VỤ QUAN TRỌNG (dễ làm sai — đọc kỹ)

### Số duyệt CHÍNH THỨC — `getOfficialApprovedAmount(p)` = `h>0 ? h : d`
- **H đã duyệt → lấy số H** (H là người chốt cuối, ưu tiên hơn D dù D duyệt số khác).
- **H chưa duyệt, D đã duyệt → lấy số D** — vì **T ĐƯỢC PHÉP chuyển chỉ cần D duyệt** (phiếu D-duyệt-một-mình nằm ở "Đã duyệt · chờ chuyển", T chuyển được).
- Chưa ai duyệt (official = 0) → "Chờ duyệt".
- ⚠️ **ĐỪNG đổi thành "chỉ tính H"** — đã thử và SAI. Cả 2 yêu cầu ("đo theo H khi có H" + "T chuyển được với D") đều thỏa bằng `h>0?h:d`.

### "Đã chuyển xong" = T chuyển ĐỦ số DUYỆT chính thức (KHÔNG phải số đề xuất gốc `p.amount`)
- D/H có thể duyệt ít hơn đề xuất; phần chưa duyệt coi như không chi.
- Bug cũ: đo "xong" theo `p.amount` → phiếu chuyển đủ số duyệt vẫn kẹt ở "Việc gấp".

### 🔴 NGUỒN CHUẨN DUY NHẤT (single source of truth) — cực kỳ quan trọng
- **Số 1 người (D/H) đã duyệt = TỔNG `approvedDHistory` / `approvedHHistory`** (mảng lịch sử từng lần). Helper: **`approvedAmtOf(p, who)`** (~dòng 2449).
- Field `approvedDAmount` / `approvedHAmount` **CHỈ là bản lưu phụ** (để tương thích + ghi Sheet). **TUYỆT ĐỐI không đọc field làm căn cứ.**
- Số đã chuyển = TỔNG `p.transfers` (`getTotalTransferred`, ~2460). Cũng chỉ 1 nguồn.
- **Vì sao:** trước đây đọc trực tiếp field → field lệch với lịch sử khi đồng bộ nhiều máy → nút bấm vs khung duyệt mâu thuẫn → kẹt "lúc duyệt được lúc không". Dùng lịch sử thì không bao giờ lệch.
- **`normalizeApprovedAmounts(list)`** (~2424): khi tải, tự chữa lệch (field = tổng lịch sử) và **backfill lịch sử từ field** cho dữ liệu cũ chỉ có field; các phiếu sửa được đẩy lên Firebase (gọi trong `_mergeAndRender`).

### Báo cáo Tóm tắt / Excel
- Lọc theo số official (KHÔNG dựa field `status` đã lưu, để bền với dữ liệu cũ).
- Ô "Việc gấp CHƯA XONG" = **số CÒN PHẢI CHUYỂN** = official − đã chuyển (chưa duyệt thì = số đề xuất); ẩn phiếu đã chuyển đủ.

---

## 5. CẤU TRÚC DỮ LIỆU MỖI PHIẾU

```javascript
{
  id: "timestamp string",        // duy nhất, dùng làm key Firebase + id card DOM
  desc, person, site, note,
  amount: 65000000,              // ⚠️ ĐƠN VỊ = ĐỒNG (VND), KHÔNG phải triệu. migrateAmountsToVND() tự nâng cấp phiếu cũ lưu bằng triệu.
  status: "pending|approved|transferred|rejected",
  ts: timestamp,
  priority, remindCount, lastRemindAt,   // giục duyệt
  opinionD, opinionH,            // ý kiến

  // Duyệt — NGUỒN CHUẨN là *History; field *Amount chỉ phụ
  approvedD:  timestamp|null,    approvedDAmount: number, approvedDHistory: [{amount, ts}],
  approvedH:  timestamp|null,    approvedHAmount: number, approvedHHistory: [{amount, ts}],

  // Từ chối
  rejectedBy: "D"|"H"|null, rejectedAt, rejectedByD:{reason,ts}, rejectedByH:{reason,ts},

  // Chuyển tiền (Trang) — NGUỒN CHUẨN là transfers[]
  transfers: [{amount, ts}], transferredAt,

  // Ảnh (lưu ở node riêng duyetchi/images, KHÔNG kèm trong proposals)
  imgImages: [base64...], imgB64,      // ảnh Zalo (imgB64 giữ tương thích cũ)
  proofImages: [base64...], proofB64,  // ảnh chứng từ chuyển tiền
}
```

---

## 6. LƯU TRỮ

### Firebase Realtime DB (đồng bộ chính)
- `duyetchi/meta` → {persons, sites, sheetUrl, updatedAt}
- `duyetchi/proposals/{id}` → phiếu (KHÔNG kèm ảnh)
- `duyetchi/images/{id}` → {imgImages, proofImages}  (tải TRỄ sau khi hiện phiếu, cho app mở nhanh)
- **Smart push:** chỉ ghi node thay đổi (so với `lastPushedSnapshot`) → tránh quota. `pushToFirebase()`.
- 3 listener tách riêng (meta / proposals / images) → duyệt phiếu chỉ đụng proposals, không tải lại ảnh. `_mergeAndRender()` (~1666) gộp & render.

### localStorage (cache dự phòng offline)
`dc_proposals`, `dc_persons`, `dc_sites`, `dc_sheetUrl`, `dc_role`, `app_version`, `dc_notif_seen`.

---

## 7. GOOGLE SHEETS + APPS SCRIPT

- Ghi log qua **JSONP** (tạo `<script src=sheetUrl?...>` rồi xoá) để tránh CORS. Các hàm: `syncToSheet(add)`, `syncStatusToSheet(updateStatus)`, `syncApprovalToSheet(updateApproval)`, `syncApprovalAmountToSheet(updateApprovalAmount)`, `syncTransferToSheet(updateTransfer)`, `syncRejectedByToSheet(updateRejectedBy)`, `syncEditToSheet(edit)`, `syncDeleteToSheet(delete)`, `syncReconcileToSheet(reconcile)`.
- **Code Apps Script nằm trong `copyScript()`** (~dòng 4073, template string `const code=\`...\``). User COPY → dán vào Google Apps Script → deploy Web App **BẰNG MÁY TÍNH** (điện thoại không làm được). Khi sửa logic Sheet phải sửa trong template này.
- **Sheet chính "Tổng hợp đề xuất"** — 18 cột: `STT, ID, Thời gian tạo, Nội dung, Người đề xuất, Công trường, Số tiền ĐX, Ghi chú, D duyệt - lịch sử, H duyệt - lịch sử, Trạng thái, Lý do từ chối, Ngày cập nhật, D tổng duyệt, H tổng duyệt, Tổng đã chuyển, T chuyển - lịch sử, Số tiền duyệt chính thức`. STT + mới nhất lên đầu.
- **Định dạng tiền** `#,##0" đ"` (phân cách nghìn + " đ") ở các cột tiền (7,14,15,16,18).
- **4 sheet báo cáo tự dựng:** `Đã chuyển`, `Chưa chuyển`, `Từ chối`, `Chờ duyệt` (`buildReports`, `writeReport_`).
- **Tự đối chiếu:** app gửi danh sách id còn tồn tại (`reconcile`) → Sheet tự xoá dòng của phiếu đã bị xoá bên app (dọn rác). Chạy 6s sau lần tải đầu.

---

## 8. DEPLOY & HAI REPO (chi tiết)

```bash
cd "F:/nháp/379 duyệt chi/tóm tắt chuyển pro"
# (đã sửa APP_VERSION + version.txt + sw.js VERSION cùng chuỗi)
git add app3.html sw.js version.txt && git commit -m "..." && git push origin main
# GitHub Pages build ~30-90s. Kiểm tra:
#   curl https://vandung0802.github.io/Duyet-Chi/version.txt
#   curl .../app3.html | grep APP_VERSION
```
- Đôi khi remote có commit từ máy khác của user → `git pull --rebase origin main` trước khi push (xung đột hay ở `_cardHash` → giữ bản superset).
- `index.html` và `app.html` đã bị xoá khỏi repo Duyet-Chi (chỉ giữ app3.html) — đừng tạo lại trừ khi user yêu cầu.

---

## 9. CƠ CHẾ "CẬP NHẬT PHẦN MỀM MỚI" (mục user rất quan tâm)

**Yêu cầu user:** đừng bắt người dùng tự đóng/mở app (họ thấy phức tạp). Cứ có bản mới thì hiện **1 thanh xanh "🔄 Có phần mềm mới — NHẤN VÀO ĐÂY để cập nhật"** (div `#update-banner` ngay sau `<body>`, ẩn sẵn). Bấm 1 lần là cập nhật.

- `checkForUpdate()`: fetch `version.txt` (no-store); nếu `text.trim() !== APP_VERSION` → hiện banner. Trigger: 4s sau khi mở, mỗi 3 phút, và `visibilitychange` khi quay lại app.
- `doUpdateNow()` (onclick banner): xoá Cache Storage + unregister service worker, rồi **`location.replace(pathname + '?u=' + Date.now())`** — **phải phá cache bằng query param** (vì `location.reload(true)` KHÔNG vượt được `Cache-Control: max-age=600` của GitHub Pages + cache app iPhone).
- 🔴 **ĐỪNG bật banner theo sự kiện `controllerchange`** — nó kích hoạt mỗi lần SW mới claim trang (kể cả bản đã khớp) → banner giả → bấm → reload → SW claim lại → **lặp vô tận**. Banner CHỈ do `checkForUpdate()` điều khiển. (Đã bỏ tự-reload-15-phút và ETag silent-reload cũ.)
- **Nhãn phiên bản trên tiêu đề:** `#ver-label` trong `<h1>` + `document.title` hiện phần "vNN" của APP_VERSION (set lúc load qua biến `VER_LABEL`). Trước đây viết cứng "v14" → user tưởng chưa cập nhật. **Nhìn số "vNN" là biết máy đang chạy bản nào** (dùng chẩn đoán "đã cập nhật chưa").
- **Máy iPhone kẹt bản cũ (trước v48):** phải chờ ~10 phút cho HTTP cache hết hạn rồi đóng hẳn + mở lại; hoặc xoá icon PWA rồi thêm lại từ Safari (chắc nhất). Từ v48 trở đi nút cập nhật tự phá cache nên không còn cảnh này.

---

## 10. TÍNH NĂNG NỔI BẬT

- Duyệt/chuyển **từng phần nhiều lần** (cộng dồn). Undo bỏ duyệt / bỏ từ chối / hoàn tác lần chuyển.
- Nhiều ảnh Zalo + nhiều ảnh chứng từ. Long-press ảnh (Sao chép/Tải/Xóa). Paste ảnh (Ctrl+V) ở Thêm mới / Sửa / khu chứng từ.
- PWA (sw.js), badge số thông báo, push notification (Web Push qua sw.js).
- Giục duyệt (phiếu nhảy lên đầu). Ý kiến D/H. Khóa (lock) phiếu.
- Hiển thị tiền: dùng `fmtVND(n)` với **nbsp (U+00A0)** giữa số và "đ" để **"đ" không rớt dòng riêng**. Vùng badge phải `word-break:normal` (KHÔNG `break-word`).

---

## 11. 🐞 TOÀN BỘ VẤN ĐỀ ĐÃ SỬA (không sót)

### A. Lỗi duyệt D/H "lúc được lúc không" (nghiêm trọng nhất — đã sửa triệt để)
- **Gốc:** lưu song song field `approvedXAmount` và mảng `approvedXHistory` → lệch nhau khi đồng bộ nhiều máy → thẻ/nút/khung mâu thuẫn → kẹt duyệt, báo "vượt quá đề xuất" sai.
- **Sửa:** helper `approvedAmtOf` đọc DUY NHẤT từ lịch sử; thay TẤT CẢ chỗ đọc field bằng helper (renderBtnD/H, badge, canRemind, getMyPendingItems, 3 hàm báo cáo, `_cardHash`, syncApprovalAmountToSheet...). `normalizeApprovedAmounts` tự chữa lệch + backfill. (`getOfficialApprovedAmount` = h>0?h:d.)
- Nút **"Bỏ toàn bộ phần đã duyệt"** trước chỉ xoá lần cuối → sửa reset TRIỆT ĐỂ (xoá cả field lẫn lịch sử, về pending).

### B. Thẻ hiển thị chậm / mâu thuẫn với modal
- Duyệt xong thẻ vẫn hiện "Chờ duyệt" một nhịp → user tưởng chưa duyệt, bấm lại → modal báo "đã duyệt đủ" → hoang mang. **Sửa:** sau duyệt/bỏ duyệt **vẽ lại thẻ NGAY** (`renderProposals()` + `_cardCache.delete(id)` sau `save()`, không chờ debounce `renderAll` 80ms).
- Mở khung duyệt mà người đó **đã duyệt đủ** → hiện rõ **"✅ … đã duyệt đủ … rồi"**, ẩn ô nhập (`#aa-input-group`), chỉ để nút bỏ duyệt + Hủy. (`approveBy` cũng gọi `renderProposals()` để thẻ hết cũ khi mở.)
- Khung duyệt / khung chuyển tiền **tự làm mới** khi dữ liệu đổi (đồng bộ từ máy khác) lúc đang mở, thay vì báo lỗi rồi đứng im với số cũ.

### C. Dữ liệu cũ chỉ có field, chưa có lịch sử (v52)
- Thẻ hiện "đã duyệt" (đọc field qua fallback) nhưng bấm "Bỏ duyệt" báo **"Không có lần duyệt nào để bỏ"** (undo đọc lịch sử rỗng). **Sửa:** `normalizeApprovedAmounts` **backfill** 1 lần duyệt từ field; `undoApprove` cũng cho bỏ khi chỉ có field.

### D. Cơ chế cập nhật (v46→v51)
- Thêm banner "Cập nhật phần mềm mới" (v47). Sửa **vòng lặp bấm hoài không tắt** do `controllerchange` (v48). Nút cập nhật **phá cache** bằng `?u=timestamp` (v48). Tiêu đề hiện **đúng phiên bản** thay nhãn cứng "v14" (v49).

### E. Google Sheets (đã làm)
- Apps Script mới: STT + mới nhất lên đầu, đổi tên sheet "Tổng hợp đề xuất", thêm 4 sheet báo cáo tự dựng.
- Tự đối chiếu, xoá dòng phiếu đã bị xoá bên app (dọn rác).
- Định dạng tiền phân cách nghìn + " đ" cho sheet chính + 4 sheet báo cáo.

### G. Dữ liệu "cập nhật không kịp thời" khi quay lại app (v53 — quan trọng)
- **Gốc:** iPhone cắt NGẦM kết nối realtime khi app chạy nền/khóa màn hình; Firebase mất 30–60s+ mới tự nhận ra → mở app thấy số CŨ rất lâu, duyệt máy này máy kia không thấy.
- **Sửa:** thêm `forceFirebaseResync()` (goOffline→goOnline, throttle 5s) gọi khi: `visibilitychange`→visible, `online`, `pageshow` (bfcache), và watchdog 30s khi mất kết nối. Badge đỏ "Tải lại" chỉ hiện nếu mất kết nối >3s (tránh nhấp nháy lúc bắt tay lại).
- ~~**Ảnh:** node `duyetchi/images` đổi `once('value')` → `on('value')`~~ ⚠️ **ĐÃ GỠ ở v54 — đừng làm lại:** `on()` cả node ảnh khiến MỖI LẦN nối lại mạng (4G/app nền) kéo lại cả kho ảnh hàng chục MB → nghẽn mạng, mọi cập nhật chậm theo (chính là lỗi "hôm nay chậm" user báo ngay sau v53). v54 quay về `once` + cơ chế **imgStamp** (xem H).
- Các biến `_imagesData/_hasImagesSet/_loadingImages/_imgObserver/_metaData/_proposalsData...` đã đưa RA NGOÀI `initFirebaseSync` (top-level) → `_observeImageCards` hết văng lỗi scope (lỗi tiềm ẩn cũ ở mục F).
- `undoApprove`, `confirmTransferAmount`, `undoTransfer` giờ cũng vẽ lại thẻ NGAY (`_cardCache.delete` + `renderProposals()`) như lúc duyệt.

### H. Cache local vượt hạn mức làm CHẾT NGẦM đồng bộ + render (v54 — gốc rễ "hôm qua ổn, hôm nay lỗi")
- **Gốc:** `save()` và `_mergeAndRender` lưu `dc_proposals` KÈM TOÀN BỘ ảnh base64 vào localStorage (hạn mức ~5MB). Khi ảnh chứng từ tích đủ nhiều (52 phiếu đã chuyển), `setItem` văng `QuotaExceededError` **không được bọc try/catch** → chết luôn `pushToFirebase()` phía sau (duyệt xong máy kia không thấy) và chết luôn phần render phía dưới trong merge (nhận dữ liệu mới mà màn hình không đổi). Lỗi phụ thuộc LƯỢNG DỮ LIỆU nên "hôm qua ổn, hôm nay lỗi".
- **Sửa:** cache local chỉ lưu **phần nhẹ không ảnh** (`_lightProposalsJson()`), bọc try/catch, `pushToFirebase()` luôn chạy kể cả cache lỗi. Ảnh luôn tải từ Firebase khi mở app. Duyệt cũng nhanh hơn (hết stringify hàng chục MB mỗi lần bấm).
- **Đồng bộ ảnh kiểu nhẹ (imgStamp):** khi 1 máy đổi ảnh của phiếu nào, `pushToFirebase` đóng dấu `p.imgStamp = Date.now()` NGAY TRONG PHIẾU (node phiếu nhẹ, realtime sẵn) — trong pushToFirebase phần soát ảnh chạy TRƯỚC phần soát phiếu để dấu kịp vào `lightFields`. Máy khác thấy `imgStamp` mới hơn `_imagesStamps[id]` → `_refetchImagesFor(id)` tải lại ảnh ĐÚNG phiếu đó qua `.get()`, vá `lastPushedSnapshot.imagesMap` (`_syncSnapshotImages`) để không ghi ngược ảnh lên lại (chống ping-pong).

### I. Chống quá tải dài hạn (v55 — user hỏi "2000 ảnh, 4000 phiếu thì sao?")
- **Đã làm (bước 1):** ảnh MỚI sau khi lưu được NGẦM đưa lên **Firebase Storage** (`_offloadQueue` + `_offloadImagesToStorage`, kích hoạt từ pushToFirebase chỗ soát ảnh), database chỉ giữ **URL**. Upload lỗi → giữ base64 như cũ, không bao giờ chặn nghiệp vụ. Storage rules hiện **cho ghi không cần đăng nhập** (preview upload được) — cân nhắc siết lại sau.
- **Đã làm (bước 3):** danh sách chỉ vẽ `_renderLimit = 150` phiếu mới nhất + nút "Xem thêm"; `setFilter` reset về 150. Tìm kiếm/thống kê/báo cáo vẫn tính trên TOÀN BỘ.
- **Đã làm (bước 2 — v56):** nút **"Chuyển ảnh cũ lên Kho ảnh"** trong tab Cài đặt (`admin-migrate-section`, chỉ role dung thấy; `toggleMigrateOldImages`). Chạy tuần tự từng phiếu: `.get()` bản ảnh mới nhất từ server → dùng lại bộ máy `_offloadQueue` để upload + thay URL → save; Dừng/chạy tiếp được, phiếu lỗi giữ nguyên base64. **User phải TỰ BẤM nút mới chạy** — code lên rồi nhưng migrate thật là do user quyết. (Code gốc do phiên nền viết, phiên đó bị kẹt chờ permission → đã kế thừa, rà soát, kiểm thử, deploy từ phiên chính. Nhánh `claude/practical-curie-50999f` không cần dùng nữa.)
- **CHƯA làm (bước 4):** khi phiếu > ~1500 → node `duyetchi/archive` cho phiếu đã chuyển xong >3 tháng, app không lắng nghe mặc định; Báo cáo có nút tải dữ liệu cũ. Google Sheets vẫn giữ 100% lịch sử.

### J. 🔴 CORS trên Firebase Storage bucket — BẮT BUỘC phải có, không phải lỗi code (phát hiện 04/07/2026)
- **Triệu chứng:** sau khi ảnh chuyển sang lưu ở Kho ảnh (Storage) — cả ảnh mới tự động (v55) lẫn ảnh cũ migrate (v56) — nút **"Sao chép ảnh"** (nhấn giữ ảnh) không hoạt động. Ảnh vẫn HIỆN bình thường (vì `<img src>` không cần CORS), nhưng COPY/tải-bằng-canvas cần đọc byte ảnh qua JS (`fetch`/canvas) — việc này bị trình duyệt CHẶN nếu bucket chưa khai báo CORS cho phép domain app đọc.
- **Đây KHÔNG phải lỗi trong `app3.html`** — code `dataUrlToBlob`/`imgActionCopy` (~dòng 1013-1092) vốn đã đúng, đủ fallback. Gốc là **cấu hình bucket GCS thiếu CORS**, nằm NGOÀI code, không thấy được khi đọc app3.html.
- **Đã sửa (không cần đổi code/version):** chạy `gsutil cors set` cho bucket `gs://duyetchi-pva379.firebasestorage.app`, cho phép GET từ origin `https://vandung0802.github.io`. Máy tính này đã có sẵn Google Cloud SDK đăng nhập đúng tài khoản `vandung0802@gmail.com` — nhưng gọi `gcloud`/`gsutil` trực tiếp bị lỗi "Python not found" (do Windows App Execution Alias chặn `python`), **phải set biến môi trường trước**:
  ```bash
  export CLOUDSDK_PYTHON="/c/Users/Vo Van Dung/AppData/Local/Google/Cloud SDK/google-cloud-sdk/platform/bundledpython/python.exe"
  gsutil cors get gs://duyetchi-pva379.firebasestorage.app   # xem cấu hình hiện tại
  gsutil cors set cors.json gs://duyetchi-pva379.firebasestorage.app   # áp dụng
  ```
  Nội dung `cors.json` đang áp dụng:
  ```json
  [{"origin": ["https://vandung0802.github.io"], "method": ["GET"], "responseHeader": ["Content-Type"], "maxAgeSeconds": 3600}]
  ```
- **Nếu sau này đổi domain** (ví dụ chuyển sang domain riêng, hoặc dùng thêm `vandung0802.github.io` repo kia cho app3) → phải thêm origin đó vào `cors.json` rồi `gsutil cors set` lại, nếu không COPY ẢNH sẽ lại hỏng dù code không đổi gì.
- Đã kiểm chứng bằng preview: trước khi set CORS, `fetch(url,{mode:'cors'})` báo "Failed to fetch" nhưng `fetch(url,{mode:'no-cors'})` trả `type:'opaque'` (chứng minh mạng thông, chỉ là CORS chặn đọc) — sau khi set CORS thì `dataUrlToBlob` (hàm copy dùng) đọc được blob bình thường.

### K. Copy ảnh vẫn không được sau khi sửa CORS — lỗi thứ 2 chồng lên (v57, 04/07/2026)
- **Sau khi sửa CORS (mục J), user báo copy VẪN không được** trên iPhone. Tìm tiếp ra lỗi thứ 2, đặc thù Safari: `imgActionCopy()` (~1046) cũ gọi `await dataUrlToBlob(src)` (tải ảnh qua mạng — CHẬM, có độ trễ) RỒI MỚI gọi `navigator.clipboard.write()`. **Safari (WebKit) coi lệnh ghi clipboard là "không còn nằm trong lúc người dùng vừa bấm" nếu có một `await` mạng thật (macrotask) xen giữa** → từ chối ghi (`NotAllowedError`), dù ảnh tải về hoàn toàn thành công. Đây là lý do ảnh Zalo cũ (base64, xử lý tức thì không qua mạng) copy được, còn ảnh mới ở Kho ảnh (phải tải qua mạng) thì không — dù CORS đã đúng.
- **Sửa (v57):** gọi `navigator.clipboard.write()` NGAY LẬP TỨC với một `ClipboardItem` chứa **Promise CHƯA xong** thay vì đợi Blob thật xong mới gọi — đây là cách chuẩn WebKit khuyến nghị để giữ "tính hợp lệ trong lúc bấm" trong khi việc tải ảnh vẫn chạy ngầm bên trong Promise đó.
- **Giới hạn khi kiểm thử:** preview chạy Chromium (không phải WebKit/Safari), và trình duyệt tự động hoá luôn từ chối quyền clipboard-write (`Write permission denied`) bất kể code đúng hay sai — đây là giới hạn của môi trường test, không phải lỗi thật. Đã kiểm chứng tách bạch được: **phần tải ảnh + chuyển PNG chạy đúng** (dùng ảnh PNG 1×1 thật để test, không phải chuỗi giả) khi CORS được cấp — chỉ riêng bước gọi `clipboard.write()` không xác minh được 100% qua preview, cần user tự test trên iPhone thật.
- ⚠️ Nếu user báo còn lỗi copy nữa: hỏi rõ **hiện tượng cụ thể** (không có gì xảy ra? có xin quyền rồi từ chối? tự động tải ảnh về? hiện popup "chuột phải để copy"?) — mỗi hiện tượng chỉ ra nguyên nhân khác nhau, đừng đoán mò lặp lại.

### L. Nút "Chia sẻ ảnh" chia sẻ NHẦM đường link thay vì file ảnh (v58, 04/07/2026)
- **Triệu chứng:** `imgActionShare()` (~1126) cũ CHỈ đóng gói thành File để chia sẻ khi ảnh là base64 (`src.startsWith('data:')`); ảnh ở Kho ảnh (`https://…`, tức MỌI ảnh từ v55 trở đi) rơi thẳng xuống nhánh `navigator.share({url: src})` — chia sẻ đường link, Zalo/Messenger nhận link không hiện ảnh trực tiếp.
- **Sửa:** dùng chung `dataUrlToBlob(src)` (đã kiểm chứng đọc đúng cả base64 lẫn URL Kho ảnh — xem mục J/K) để LUÔN lấy ảnh thật rồi đóng gói File, chỉ rơi về chia sẻ link nếu máy thật sự không hỗ trợ `canShare({files})`. Thêm fallback: chia sẻ file thất bại (không phải do user tự hủy) → tự tải ảnh về máy thay vì báo lỗi suông.
- **Giới hạn khi test:** `navigator.share`/`navigator.canShare` không tồn tại trong Chromium headless dùng để preview (Web Share API cần trình duyệt mobile/PWA thật) → chỉ kiểm chứng được phần lấy blob + đóng gói File đúng (ảnh PNG thật, đúng size/type), KHÔNG kiểm chứng được bảng chia sẻ thật của iOS. Cần user tự test trên iPhone.

### M. Bảng Báo cáo đổi đơn vị tiền sang TRIỆU cho kế toán dễ đọc (v59, 04/07/2026)
- **Yêu cầu user:** các bảng trong tab Báo cáo hiện đồng đầy đủ ("5.500.000 đ") khó đọc cho kế toán → đổi sang "5.5 tr". **CHỈ đổi trong bảng tổng hợp**, các chỗ khác (thẻ phiếu, khung duyệt/chuyển, toast, push notif, xuất CSV/text, đồng bộ Google Sheet) **giữ nguyên** `fmtVND` (đồng đầy đủ) — không được ảnh hưởng chức năng khác.
- **Đã làm:** thêm hàm dùng chung `fmtTr(n)` (~3865, ngay trước `_renderReportTab`) — dưới 1 triệu vẫn hiện nguyên `fmtVND` (tránh "0.5 tr" khó đọc), từ 1 triệu trở lên hiện `"X.XX tr"` (tối đa 2 chữ số thập phân), dùng nbsp giữa số và "tr" để không rớt dòng riêng (giống nguyên tắc `fmtVND`). Áp dụng thay `fmtVND` → `fmtTr` trong ĐÚNG 4 hàm dựng bảng ở tab Báo cáo: `renderReportSummary` (~4123, thẻ thống kê + bảng Việc gấp + `makeTable` cho Chờ duyệt/Đã duyệt·chờ chuyển/Đã chuyển/Từ chối), `renderExcelTable` (~4052, tab Đã chuyển/Chưa chuyển — xóa hàm `fmtShort` cục bộ trùng lặp, dùng `fmtTr` thống nhất), `renderReportRejected` (~3943, tab Từ chối), `renderReportList` (~3983, tab Danh sách).
- **KHÔNG đổi** (cố ý, đúng yêu cầu "giữ nguyên chỗ khác"): `generateReport`/`copyReport` (văn bản copy dán Zalo, ~4225-4260), phần xuất CSV/Excel (`addSection` ~4340), đồng bộ Google Sheet (`syncApprovalToSheet` và các hàm sync khác) — Sheet có định dạng tiền riêng (`#,##0" đ"`) trong `copyScript()`, không liên quan tới thay đổi này.
- Đã kiểm chứng qua preview: `fmtTr(5500000)`→"5.5 tr", `fmtTr(65000000)`→"65 tr", `fmtTr(500000)`→"500.000 đ" (dưới 1tr), `fmtTr(0)`→"—"; `fmtVND` không đổi; cả 4 tab báo cáo render đúng với dữ liệu giả, không còn số đồng đầy đủ lọt vào bảng tổng hợp.

### N. Bảng "Chưa chuyển" — thu nhỏ cột Còn chuyển/D duyệt/H duyệt (v60, 04/07/2026)
- Sau khi tiền đã rút gọn dạng "X tr" (mục M), user muốn 3 cột này hẹp lại để nhường chỗ cho cột "Tên đề xuất" (đang `width:auto`) rộng ra, dễ đọc nội dung.
- Sửa `colsPending` trong `renderExcelTable` (~4098): "Còn chuyển" 76px→52px, "D duyệt"/"H duyệt" 68px→46px mỗi cột (giảm tổng 66px, dồn hết cho cột Tên đề xuất vì đó là cột duy nhất `width:auto`). Chỉ áp dụng cho bảng tab **Chưa chuyển** (`kind==='pending'`) — bảng tab Đã chuyển (`colsDone`) không có 2 cột D/H duyệt nên không đụng tới.

### O. Bố cục 3 bảng Báo cáo — thu nhỏ cột tiền, tăng cột nội dung, căn giữa, cuộn ngang (v61, 04/07/2026)
- **Tab Tóm tắt** (`makeTable` trong `renderReportSummary`): thêm class CSS riêng **`report-table-summary`** (đi kèm `report-table`) để override width/align CHỈ cho 4 bảng nhóm ở tab này (Chờ duyệt/Đã duyệt·chờ chuyển/Đã chuyển/Từ chối-trong-Tóm-tắt) — `.col-desc` 80px→130px, `.col-amt` 84px→56px. **CSS đặt SAU rule gốc `.report-table .col-amt` trong `<style>` (cùng 2-class specificity, ai đứng sau thắng)** — nếu sau này sửa lại nhớ giữ đúng thứ tự, không thì mất tác dụng.
- ⚠️ **v63 sửa lại (đọc kỹ, đừng làm lại như v61):** cột **Nội dung** (`.col-desc`) KHÔNG được `text-align:center` — user chỉ muốn căn giữa THEO CHIỀU DỌC trong hàng (`vertical-align:middle`), chữ vẫn đọc căn trái tự nhiên. v61 tôi hiểu nhầm "căn giữa hàng" = căn giữa chữ theo chiều ngang, áp `text-align:center` cho cả `.col-desc` → SAI, đã bị user chỉnh lại. Các cột còn lại (Người/Công trình/Số tiền/Lý do) mới đúng là căn giữa chữ ngang như y/c ban đầu — GIỮ NGUYÊN, không đụng.
- ⚠️ **Tab "Từ chối" ĐỘC LẬP** (`renderReportRejected`, khác với bảng Từ chối con trong Tóm tắt) dùng chung `<table class="report-table">` gốc, KHÔNG có class `report-table-summary` → không bị ảnh hưởng bởi mục này (đã kiểm chứng qua preview: width/align giữ nguyên 84px/phải).
- **Tab Đã chuyển** (`colsDone` trong `renderExcelTable`): cột "Đã chuyển" 82px→56px, nhường cho Tên đề xuất (`width:auto`).
- **Tab Chưa chuyển**: bỏ hậu tố " ✓" sau tiền D/H duyệt; cột D duyệt/H duyệt 46px→38px; cột Mức 36px→24px; đổi từ `excel-table-fixed` (ép vừa 100% khung, không bao giờ cuộn) sang **`excel-table-scroll`** (bảng CUỘN NGANG) — cột Tên đề xuất giờ **160px cố định** (không phải `auto`).
  - 🔴 **Bẫy đã gặp khi làm:** `table-layout:fixed` + `width:auto` bị Chromium co bảng về đúng bằng khung chứa (bỏ qua tổng độ rộng cột khai báo trong colgroup) — PHẢI tính tổng các cột bằng JS (`pendingTotalWidth`) rồi gán thẳng `style="width:${pendingTotalWidth}px"` vào thẻ `<table>` mới ép đúng ý. Chỉ khai báo `width:auto` trong CSS class KHÔNG đủ.
  - Cũng phải thêm `min-width:unset` cho `.excel-table-scroll` vì class gốc `.excel-table` có sẵn `min-width:560px` — nếu không, bảng luôn rộng tối thiểu 560px (nhiều hơn cần) khiến bị cuộn/che nhiều hơn dự tính (lố qua cả cột H duyệt).
  - Kết quả đã đo trong preview (mobile 375px): cột #→H duyệt hiện đủ không cuộn (H duyệt bị che ~16px cuối, chấp nhận được), Mức+Ngày hoàn toàn khuất phải cuộn phải mới thấy — đúng ý muốn.

### P. GitHub Pages đôi khi deploy THẤT BẠI ở bước "deploy" (không phải CDN cache chậm) — cách chẩn đoán
- Sau khi push v61, `version.txt` không đổi trên production dù **>20 phút** (bình thường 30-90s). Ban đầu tưởng CDN Fastly cache lâu — SAI. Kiểm tra qua API công khai mới ra đúng nguyên nhân:
  ```bash
  curl -s "https://api.github.com/repos/vandung0802/Duyet-Chi/actions/runs?per_page=5"
  ```
  → tìm run có `head_sha` khớp commit vừa push, thấy `"conclusion": "failure"`. Xem chi tiết job:
  ```bash
  curl -s "https://api.github.com/repos/vandung0802/Duyet-Chi/actions/runs/<run_id>/jobs"
  ```
  → job **"deploy"** (không phải "build") có bước "Deploy to GitHub Pages" `conclusion: "failure"` — build tĩnh vẫn ra đúng, nhưng bước đẩy lên hosting bị lỗi (hạ tầng GitHub, không phải lỗi code của mình).
- **Cách sửa: push một commit mới bất kỳ để GitHub tự tạo lượt deploy mới** (deploy cũ KHÔNG tự retry). Nhanh nhất, không đụng nội dung:
  ```bash
  git commit --allow-empty -m "chore: kich hoat lai GitHub Pages deploy" && git push origin main
  ```
  Theo dõi run mới bằng API ở trên đến khi `"conclusion": "success"`, rồi mới `curl version.txt` xác nhận.
- Máy tính này KHÔNG có `gh` CLI cài đặt — dùng `curl` gọi thẳng REST API công khai (không cần token cho repo public) là đủ để chẩn đoán.

### Q. Thẻ phiếu "Đã chuyển" (duyệt 1 phần) vẫn hiện đỏ/"chờ duyệt" gây hiểu nhầm chưa xong (v62, 04/07/2026)
- **Bối cảnh:** đề xuất 10tr, D duyệt 6tr (H chưa duyệt), Trang chuyển đủ 6tr → app đã tự đúng chuyển `status='transferred'` từ trước (không bắt T chuyển thêm 4tr — đúng quy tắc mục 4). Nhưng **thẻ phiếu vẫn hiện sai**: badge D đỏ "6tr/10tr" (so với tổng đề xuất GỐC) và badge H "⏳ H chờ duyệt" — khiến nhìn vào tưởng vẫn còn dang dở, dù thực ra giao dịch đã ĐÓNG HẲN.
- **Sửa** trong `_buildCard` (~2415, khối `if(p.status==='approved' || p.status==='transferred')`): thêm biến `isClosed = p.status==='transferred'`. Khi `isClosed`, `dFull`/`hFull` chỉ cần `amt>0` (không so với `total` = đề xuất gốc nữa) → hết đỏ; bên nào KHÔNG duyệt gì (amt=0) hiện **"D/H không cần duyệt"** (icon ➖ trung tính) thay vì **"chờ duyệt"** (⏳, ngụ ý còn phải làm gì đó).
- **CHỈ áp dụng khi `status==='transferred'`** (đã đóng hẳn) — phiếu còn `status==='approved'` (D/H duyệt 1 phần nhưng T CHƯA chuyển xong) **giữ nguyên hành vi cũ** (vẫn hiện đỏ + "chờ duyệt"), vì tiền chưa chuyển thì vẫn còn khả năng duyệt thêm/chuyển thêm, không được coi là xong.
- Đã kiểm chứng qua preview 3 kịch bản: (1) chỉ D duyệt 1 phần + đã chuyển → hết đỏ, H hiện "không cần duyệt"; (2) chỉ H duyệt 1 phần + đã chuyển → hết đỏ, D hiện "không cần duyệt"; (3) cả D và H duyệt đủ 100% + đã chuyển → không đổi gì (vẫn đúng như cũ). Phiếu `status==='approved'` (chưa chuyển xong) vẫn hiện đỏ + chờ duyệt như trước — không bị ảnh hưởng.
- ⚠️ **Chưa sửa (phát hiện phụ, ngoài phạm vi user yêu cầu lần này):** nút hành động của `renderBtnD`/`renderBtnH` (~2518/2544) vẫn cho phép bấm "Duyệt" dù phiếu đã `status==='transferred'` đóng hẳn qua 1 mình D hoặc H (canPress không loại trừ status='transferred'). Bấm thêm không phá được số chính thức (do `getOfficialApprovedAmount` ưu tiên H không so độ lớn), nhưng tạo thêm 1 dòng lịch sử duyệt thừa/gây rối. Nếu user muốn khoá hẳn nút này khi đã đóng, cần hỏi rõ trước khi sửa (đây là quyết định nghiệp vụ, không tự ý đổi). — User đã xác nhận (04/07/2026): **để nguyên, không sửa.**

### R. Zoom ảnh trong modal xem to — pinch + double-tap + kéo (v64, 04/07/2026)
- **Lý do:** nhiều ảnh chứng từ chữ nhỏ, xem vừa khung (fit-to-screen) trên điện thoại không đọc được. Toàn app khoá pinch-zoom trang (`<meta viewport ... maximum-scale=1.0>`) nên phải tự làm zoom RIÊNG cho ảnh trong modal bằng CSS `transform` — không gỡ `maximum-scale` (sẽ zoom được cả UI nút bấm/chữ toàn app, phá layout).
- **Vị trí code:** hàm `_initModalZoomGestures()` + `_applyZoomTransform()` + `resetModalZoom()` (~dòng 987, ngay sau `attachLongPress`). Gắn listener touchstart/touchmove/touchend RIÊNG lên `#imgModalSrc`, chạy **song song** với `attachLongPress` đã gắn sẵn (copy/tải/xóa) — không sửa/thay listener cũ, 2 bộ listener không giẫm chân nhau (đã kiểm chứng: long-press vẫn mở menu copy bình thường khi chưa zoom).
- **Cử chỉ hỗ trợ:** pinch 2 ngón (thu/phóng, giới hạn 1×–4×), nhấn đúp (double-tap) bật/tắt nhanh 2.5×, kéo 1 ngón để pan khi đang zoom (>1×). Tự về lại 1× khi: pinch thu về gần 1 (≤1.02), lướt sang ảnh khác (`showModalImg` gọi `resetModalZoom()`), hoặc đóng modal (`closeImgModal` gọi `resetModalZoom()`).
- CSS `#imgModalSrc{touch-action:none}` để trình duyệt không tự cuộn/giật đè lên lúc đang pinch/kéo bằng JS.
- Đã kiểm chứng đầy đủ qua preview bằng `TouchEvent`/`Touch` giả lập thật (không chỉ gọi hàm suông): pinch giãn 2× → scale đúng 2.5; pinch thu lại → tự reset về 1; double-tap → 2.5 rồi double-tap lại → về 1; kéo khi đã zoom → toạ độ dịch chuyển đúng chính xác pixel; lướt ảnh khác / đóng modal → tự reset; long-press-copy vẫn mở menu bình thường khi chưa zoom (không bị phá).

### F. Khác
- Badge "D/H đã duyệt" không bị tách chữ khi duyệt một phần.
- Hiển thị tiền: "đ" không rớt dòng riêng (nbsp + word-break:normal).
- Số duyệt chính thức = H nếu có, không thì D (đã thử "chỉ H" → SAI → trả lại).
- **Lỗi tiềm ẩn `_observeImageCards`**: tham chiếu `_imgObserver` (khai báo trong scope listener Firebase ~1664) NGOÀI tầm của nó → luôn throw (observer lazy-load ảnh chưa từng chạy). Đã **bọc `try/catch`** ở chỗ gọi trong `renderProposals` để không làm hỏng render. *(Nếu rảnh có thể sửa gốc: đưa observer vào đúng scope.)*

---

## 12. HÀM / VỊ TRÍ QUAN TRỌNG (app3.html, số dòng ~gần đúng)

| Hàm / mục | Dòng ~ | Ghi chú |
|-----------|--------|---------|
| `#update-banner` (HTML) | 278 | thanh cập nhật |
| `APP_VERSION`, `VER_LABEL`, `checkForUpdate`, `doUpdateNow` | 823–856 | cơ chế cập nhật |
| đăng ký Service Worker | ~1841 | KHÔNG bật banner theo controllerchange |
| `migrateAmountsToVND` | 1828 | nâng cấp tiền triệu→đồng |
| `_mergeAndRender` | 1666 | gộp dữ liệu + render; gọi normalize |
| `renderAll` / `renderProposals` / `renderCard` / `_buildCard` / `_cardHash` | 1923 / 2064 / 2111 / 2119 / 2108 | render danh sách (renderCard có cache theo hash) |
| `renderBtnD` / `renderBtnH` | 2237 / 2263 | nút duyệt |
| `normalizeApprovedAmounts` | 2424 | chữa lệch + backfill |
| `approvedAmtOf` / `getOfficialApprovedAmount` / `getTotalTransferred` | 2449 / 2454 / 2460 | NGUỒN CHUẨN |
| `approveBy` / `confirmApproveAmount` / `undoApproveFromModal` / `undoApprove` | 2483 / 2531 / 2518 / 2610 | duyệt & bỏ duyệt |
| khung chuyển tiền (`confirmTransferAmount`...) | ~2620 | tự làm mới khi dữ liệu đổi |
| báo cáo (Tóm tắt/Excel) | ~3600–4010 | lọc theo official |
| `copyScript()` (Apps Script template) | ~4073 | code Sheet |

---

## 13. FIREBASE CONFIG

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyBUy3IMuyXZYN9dkyhrariRD-aPbC0HmT8",
  authDomain: "duyetchi-pva379.firebaseapp.com",
  databaseURL: "https://duyetchi-pva379-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "duyetchi-pva379",
  storageBucket: "duyetchi-pva379.firebasestorage.app",
  messagingSenderId: "366275914302",
  appId: "1:366275914302:web:c9d7aefd880fa0985c7f6f"
};
```

---

## 14. BẪY / LƯU Ý KHI SỬA (đừng vấp lại)

- **Preview:** vào app3 cần `location.replace('/app3.html?fresh='+Date.now())`; `PERMISSION_DENIED` Firebase là bình thường; test logic bằng cách bơm `proposals=[...]` rồi gọi hàm trực tiếp qua `preview_eval`.
- **`window.APP_VERSION` = undefined** khi test (const không gắn vào window) — dùng `eval('APP_VERSION')` trong preview.
- **Ký tự "đ":** `fmtVND` đã dùng nbsp; đừng đổi về space thường; đừng đặt `word-break:break-word` ở cha của vùng badge tiền.
- **Đừng đọc field `approvedXAmount` làm căn cứ** — luôn dùng `approvedAmtOf`.
- **Bump 3 chỗ version** mỗi lần deploy, nếu không banner cập nhật sẽ sai.
- **Apps Script sửa trong `copyScript()`** rồi báo user copy dán deploy lại bằng máy tính.

---

## 15. MEMORY (ghi nhớ giữa các phiên — nếu môi trường có)

Có hệ thống memory ở `…/memory/` (file `MEMORY.md` là index). Các memory hiện có: auto-push 2 repo + tự test; hai repo GitHub; hiển thị "đ"; quy tắc duyệt/chuyển (nguồn chuẩn, official, backfill, vẽ lại ngay); nút cập nhật phần mềm. Nếu có memory, đọc để nắm bối cảnh; nếu không, file BÀN GIAO này là đủ.

---

## 16. CÂU MỞ ĐẦU GỢI Ý CHO CỬA SỔ MỚI

> "Tôi tiếp tục phát triển **App Duyệt Chi PVA 379**. File chính là **app3.html** (PWA một file, Firebase Realtime DB + Google Sheets qua JSONP), đã có file **BANGIAO_AppDuyetChi.md** mô tả toàn bộ. Hãy **kế thừa** mọi thứ trong đó (nguyên tắc: nguồn chuẩn = lịch sử, tự push repo Duyet-Chi + bump 3 chỗ version, tự test bằng preview, không hỏi lại). Việc cần làm tiếp: **[mô tả]**."
