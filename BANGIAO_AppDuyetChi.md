# 📋 BÀN GIAO — App Duyệt Chi PVA 379 (v2 — bản đầy đủ)

> **Dùng file này để Claude ở cửa sổ/Project MỚI hiểu ngay toàn bộ app và làm tiếp không cần hỏi lại.**
> Chỉ cần nói: *"Kế thừa các việc đã làm trong cửa sổ App Duyệt Chi v2 (file BANGIAO_AppDuyetChi.md)"* là bắt tay vào việc luôn.
>
> **Cập nhật lần cuối:** phiên bản app **v53** (`APP_VERSION = '20260702-v53'`, `sw.js VERSION = '20260702-46'`, `version.txt = 20260702-v53`). Ngày 02/07/2026.

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
- **Ảnh:** node `duyetchi/images` đổi `once('value')` → `on('value')` — máy khác thêm/xoá ảnh chứng từ là thấy NGAY (sau lần tải đầu Firebase chỉ gửi phần thay đổi, không tốn thêm băng thông).
- Các biến `_imagesData/_hasImagesSet/_loadingImages/_imgObserver/_metaData/_proposalsData...` đã đưa RA NGOÀI `initFirebaseSync` (top-level) → `_observeImageCards` hết văng lỗi scope (lỗi tiềm ẩn cũ ở mục F).
- `undoApprove`, `confirmTransferAmount`, `undoTransfer` giờ cũng vẽ lại thẻ NGAY (`_cardCache.delete` + `renderProposals()`) như lúc duyệt.

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
