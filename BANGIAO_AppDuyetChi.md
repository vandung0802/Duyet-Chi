# 📋 BÀN GIAO — App Duyệt Chi PVA 379 (v2 — bản đầy đủ)

> **Dùng file này để Claude ở cửa sổ/Project MỚI hiểu ngay toàn bộ app và làm tiếp không cần hỏi lại.**
> Chỉ cần nói: *"Kế thừa các việc đã làm trong cửa sổ App Duyệt Chi v2 (file BANGIAO_AppDuyetChi.md)"* là bắt tay vào việc luôn.
>
> **Cập nhật lần cuối:** phiên bản app **v79** (`APP_VERSION = '20260705-v79'`, `sw.js VERSION = '20260705-72'`, `version.txt = 20260705-v79`). Ngày 05/07/2026 (theo lịch phiên làm việc; commit có thể ghi ngày khác).

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

### U. "Tải lại" lúc vào app ngày càng LÂU khi số phiếu tăng (v68, 05/07/2026 — vá lại mục G/v53)
- **Triệu chứng:** app đang có 123 phiếu, mở/quay lại app thấy kẹt lâu ở badge "☁️ Tải lại" (mất kết nối).
- **Gốc:** cơ chế `forceFirebaseResync()` (mục G, v53) gọi `db.goOffline()+db.goOnline()` **VÔ ĐIỀU KIỆN mỗi lần app chuyển từ ẩn→hiện**, kể cả khi chỉ lướt qua app khác 1-2 giây rồi quay lại ngay (kết nối cũ thực ra vẫn còn sống nguyên). Mỗi lần ép nối lại kiểu này bắt buộc tải lại TOÀN BỘ dữ liệu từ đầu — càng nhiều phiếu (123, sẽ còn tăng) thì càng lâu. Đây là đánh đổi chưa tối ưu của bản vá v53: chữa được "dữ liệu cũ" nhưng lại đẻ ra "chậm dần theo thời gian".
- **Sửa:** thêm biến `_hiddenAt` ghi lại thời điểm app vừa ẩn; khi hiện lại, **CHỈ gọi `forceFirebaseResync()` nếu đã ẩn quá 10 giây** (`hiddenMs > 10000`) — dưới ngưỡng đó hệ điều hành gần như chắc chắn CHƯA cắt kết nối ngầm, giữ nguyên kết nối cũ là đủ, khỏi tải lại vô ích. Trên 10 giây mới có khả năng thật sự bị cắt, lúc đó ép nối lại vẫn đúng như thiết kế gốc.
- **Các trigger resync khác GIỮ NGUYÊN không đổi** (đã đúng từ đầu, không phải nguyên nhân chậm): `online` event (mạng vừa có lại — sự kiện hiếm, không lặp lại liên tục), `pageshow` với `e.persisted` (mở lại từ bfcache — cũng hiếm), watchdog `setInterval` 30s (đã tự gate bằng điều kiện `!fbConnected`, chỉ chạy khi THẬT SỰ mất kết nối).
- Đã kiểm chứng qua preview bằng cách giả lập `document.visibilityState` thật (không chỉ gọi hàm suông): ẩn <10s → `forceFirebaseResync` KHÔNG bị gọi; ẩn >10s (giả lập `_hiddenAt` lùi về quá khứ) → CÓ bị gọi đúng.
- ⚠️ Nếu sau này vẫn còn ai báo "tải lại lâu" dù đã lên v68 — khả năng cao là do **mạng thật sự yếu** (4G/5G chập chờn) chứ không phải lỗi logic này nữa; hỏi rõ họ đang ở tình huống nào (vừa mở app lần đầu? vừa quay lại sau bao lâu? mạng có yếu không?) trước khi sửa tiếp, đừng đoán mò lặp lại.

### Z. Vẫn còn "tải lại lâu" lúc MỞ APP (khác với lúc quay lại app đã sửa ở mục U) — v73, 05/07/2026
- User báo tiếp: mỗi lần **mở app** (không phải quay lại từ nền) vẫn thấy "Tải lại" rất lâu — **"chờ vài giây đến CẢ MỘT PHÚT"** rồi tự hết, dữ liệu đúng, không cần bấm gì (xác nhận đây là vấn đề TỐC ĐỘ/mạng, không phải lỗi logic hiển thị sai dữ liệu).
- **Đã đo thử bằng dữ liệu giả 150 phiếu đủ lịch sử/ý kiến:** vẽ toàn bộ thẻ lên màn hình chỉ mất ~330ms trên máy tính (ước ~0.6-1s điện thoại thật) — **KHÔNG đủ giải thích "cả phút"**. Đã hỏi user xác nhận ảnh chứng từ KHÔNG bị kẹt (đã chuyển hết sang Kho ảnh) — loại trừ luôn nghi ngờ ảnh nặng.
- **Nguyên nhân thật tìm được (đọc kỹ code, không phải đoán):**
  1. **`window.addEventListener('online', forceFirebaseResync)`** (thêm ở mục G/v53) gọi ép `db.goOffline()+goOnline()` **KHÔNG PHÂN BIỆT** đang là lần mở app đầu tiên hay đang dùng dở. Trên iPhone, mở app đúng lúc điện thoại vừa bật sóng lại (từ màn khoá, khỏi vùng mất sóng...) thường bắn sự kiện `online` **NGAY GIỮA LÚC Firebase đang tự kết nối lần đầu** → vô tình "đá ngang" quá trình kết nối tự nhiên, bắt làm lại từ đầu.
  2. **Watchdog tự sửa mất kết nối** (mục G) trước đây chỉ chạy mỗi **30 giây** — nếu lần kết nối đầu bị vướng vì lý do 1 ở trên (hoặc bất kỳ lý do nào), phải chờ đủ 30s mới có đợt tự sửa ĐẦU TIÊN, và nếu đợt đó cũng trục trặc thì thêm 30s nữa → khớp đúng "có khi cả phút" user mô tả (30s + 30s).
- **Đã sửa (2 việc, không đụng gì khác):**
  1. Thêm `const _appLoadedAt = Date.now()` lúc script chạy; listener `online` giờ **bỏ qua nếu chưa quá 8 giây** kể từ lúc mở app (`Date.now()-_appLoadedAt < 8000`) — để Firebase yên tâm tự kết nối lần đầu không bị đá ngang. Sau 8 giây thì `online` vẫn hoạt động bình thường như cũ (ép nối lại khi mạng vừa có lại giữa lúc đang dùng).
  2. Thêm 1 lần kiểm tra SỚM lúc **8 giây** (`setTimeout(...,8000)`) bên cạnh watchdog định kỳ 30 giây cũ (giữ nguyên, không đổi) — nếu 8 giây mà vẫn chưa kết nối được thì thử sửa ngay, thay vì đợi tới mốc 30s mới có đợt đầu tiên.
- Đã kiểm chứng qua preview: biến `_appLoadedAt` tồn tại đúng kiểu số; bắn sự kiện `online` sau khi đã trôi qua >8s (do độ trễ thật giữa các lần gọi công cụ, đo được 9.6s và 35.2s ở 2 lần thử) đều đúng kích hoạt `forceFirebaseResync` — xác nhận nhánh "đã qua 8s thì vẫn hoạt động" đúng; nhánh "chưa qua 8s thì bỏ qua" là phép so sánh đơn giản, đã soát kỹ bằng mắt, không cần thêm test tinh vi hơn. Test lại duyệt D vẫn đúng, không ảnh hưởng.
- ⚠️ Đây là sửa dựa trên phân tích code + suy luận hợp lý (KHÔNG có log thật từ máy user để xác nhận 100% đúng gốc rễ) — nếu vẫn còn báo chậm sau v73, cần hỏi thêm chi tiết cụ thể hơn nữa (loại mạng lúc đó, có Wifi hay 4G, có đúng là LẦN ĐẦU mở hay đang dùng dở) trước khi tiếp tục sửa, đừng lặp lại suy đoán không kiểm chứng được.

### AA. Badge đếm giây để chẩn đoán "tải lại lâu" mà KHÔNG cần mật khẩu (v74, 05/07/2026)
- Sau v73, user chủ động đề nghị đưa mật khẩu đăng nhập để tôi tự vào kiểm tra trực tiếp — **đã từ chối nhận** (nguyên tắc an toàn: không nên cầm thông tin đăng nhập hệ thống tài chính thật của công ty, dù ý tốt). Đề xuất thay thế: cho hiện số giây thật ngay trên badge, để user tự đọc và báo lại chính xác, không cần công cụ/mật khẩu gì.
- **Đã làm:** thêm biến `_fbBadgeIsRed` (đúng bởi `updateFbBadge()`, ~2277) đánh dấu badge đang đỏ hay không; thêm `setInterval` 1 giây — khi đang đỏ, tự cập nhật chữ badge thành `☁️ Tải lại (Ns)` với N = giây tính từ `_appLoadedAt` (biến đã có sẵn từ v73). Khi kết nối lại (`updateFbBadge(true)`), cờ về false, ngừng đếm, badge về "☁️ OK" bình thường.
- Đã kiểm chứng qua preview: gọi `updateFbBadge(false)` → chờ 1 nhịp đếm → chữ đúng dạng "☁️ Tải lại (Ns)"; gọi `updateFbBadge(true)` → chữ về "☁️ OK" và KHÔNG đếm tiếp nữa dù chờ thêm. Test lại duyệt D vẫn đúng, không ảnh hưởng.
- **Cách dùng khi user báo "tải lại lâu" lần sau:** hỏi họ đọc số giây đang hiện trên badge lúc đó (không cần chờ hết mới hỏi — số hiện real-time), để có dữ liệu cụ thể thay vì cảm nhận chủ quan "vài giây đến cả phút".
- **Kết quả đo thật từ user (05/07/2026):** 2 lần đọc badge được **12s và 26s** — dao động lớn giữa các lần → chủ yếu do TÌNH TRẠNG MẠNG thực tế từng lúc, KHÔNG phải hằng số lỗi code có thể "vặn" nhỏ mãi. User cũng xác nhận: **trong lúc badge đếm giây, danh sách phiếu VẪN hiện và dùng được bình thường** (từ cache local) — tức app không hề "đứng", chỉ là dữ liệu mới nhất chưa về. Đề xuất tiếp theo (chưa làm, đang chờ user quyết): đổi badge lúc mới mở app thành màu trung tính "Đang đồng bộ..." trong ~15-20s đầu, chỉ đỏ "Tải lại" thật sự nếu lâu hơn — vì đỏ chói ngay từ đầu trông như LỖI gây hoang mang trong khi là chuyện bình thường.

### AB. Dũng không đăng nhập lại được — nút treo "Đang đăng nhập..." vô hạn (v75, 05/07/2026)
- **Tình huống:** user (Dũng) thoát app rồi không đăng nhập lại được — màn hình kẹt ở nút "⏳ Đang đăng nhập..." không báo lỗi gì. Ảnh chụp cho thấy **điện thoại đang có CUỘC GỌI đang diễn ra** (thanh trạng thái).
- **Chẩn đoán:** test thẳng endpoint đăng nhập Google từ máy tính (`curl POST identitytoolkit.googleapis.com/v1/accounts:signInWithPassword` với key của app + tài khoản giả) → **HTTP 400 trong 1.3s = máy chủ auth hoạt động bình thường**. Vậy lỗi ở MẠNG PHÍA ĐIỆN THOẠI lúc đó. Nghi phạm chính: **cuộc gọi đang diễn ra** — trên iPhone nếu cuộc gọi chạy sóng thường (không VoLTE), dữ liệu di động bị TẠM NGƯNG hoàn toàn trong suốt cuộc gọi; icon WiFi có hiện cũng chưa chắc WiFi có internet thật. Đã hướng dẫn user: cúp máy rồi thử lại / đổi WiFi↔4G / đóng hẳn app mở lại.
- **Lỗ hổng code lộ ra (đã sửa v75):** `doLogin()` (~1462) không có giới hạn chờ — nếu `signInWithEmailAndPassword` không bao giờ phản hồi (mạng tắc), nút treo "Đang đăng nhập..." VĨNH VIỄN, user tưởng app hỏng. Sửa: thêm `timeoutTimer` **20 giây** — quá hạn thì trả lại nút + báo rõ "Không kết nối được máy chủ (quá 20 giây). Kiểm tra mạng: nếu đang gọi điện hãy thử sau khi cúp máy; thử tắt/bật WiFi hoặc 4G rồi đăng nhập lại." (nếu lệnh đăng nhập cũ sau đó vẫn âm thầm thành công thì `onAuthStateChanged` vẫn tự vào app bình thường — không xung đột). Cũng thêm thông báo riêng cho mã lỗi `auth/network-request-failed` (trước rơi vào "Đăng nhập thất bại" chung chung).
- Đã kiểm chứng qua preview: đăng nhập bằng tài khoản giả → báo "Email hoặc mật khẩu không đúng" + nút trả lại ngay (644ms), không treo. Nhánh timeout 20s là setTimeout đơn giản đã soát bằng mắt (không giả lập được mạng tắc từ preview).
- ⚠️ **Ghi chú quy trình:** user 2 lần chủ động đề nghị đưa mật khẩu thật để tôi tự đăng nhập kiểm tra — **đều đã từ chối** (app tài chính công ty; chẩn đoán được bằng cách khác: test endpoint bằng tài khoản giả, badge đếm giây, hỏi hiện tượng cụ thể). Giữ nguyên tắc này.

### AC. Nhắc Trang chuyển tiền khi D,H đã duyệt mà T quên (v76, 05/07/2026)
- **Yêu cầu user + đã bàn phương án trước khi code.** User chốt: làm 1+2+3 (bỏ phương án 4 tự động gửi lại push hằng ngày — để sau); **CHỈ nhắc khi H ĐÃ DUYỆT** (người chốt cuối — phiếu mới có D duyệt thì T được phép chuyển nhưng KHÔNG bị nhắc); badge chờ chuyển **hiện NGAY** không chờ ngưỡng ngày; nút 🔁 khi D,H duyệt xong **vẫn hiện** để bấm đẩy phiếu lên đầu.
- **(1) Nút 🔁 kiêm GIỤC CHUYỂN:** `canRemind(p)` (~2873) giờ chỉ loại `rejected`/`transferred` (trước đây loại luôn phiếu D,H đã duyệt xong → mất nút). Hàm mới `isAwaitingTransferRemind(p)` = D và H đều >0. `remindApprove` phân nhánh: nếu đang chờ chuyển → note tag "Nhắc chuyển lần N" + push `'💸 Nhắc chuyển tiền'` tới `['trang']` + toast riêng; ngược lại giữ nguyên giục duyệt cũ (push dung,hien). Chặn lặp push 600s/phiếu dùng chung key cũ. `remindReportLabel` nhận cả 2 loại tag (regex `(?:Đề xuất lại|Nhắc chuyển)`), nhãn báo cáo "đã nhắc chuyển lần N" khi đang chờ chuyển.
- **(2) Bảng nhắc khi Trang mở app:** modal `#transfer-reminder-modal` (HTML cạnh plan-modal) + `maybeShowTransferReminder()` (cạnh `isAwaitingTransferRemind`) — chỉ role `trang`, chỉ khoản `hAmt>0 && transferred<official`, sắp khoản chờ lâu nhất lên đầu, hiện tổng còn phải chuyển, bấm khoản nào `jumpToProposal` khoản đó. Cờ `_transferReminderShown` chống hiện lặp trong phiên. Gọi từ 2 chỗ (vì thứ tự role/dữ liệu không cố định): cuối `setRole()` (delay 400ms) và trong `_mergeAndRender` khi `wasFirst` — chỗ nào chạy sau khi đủ cả role+data thì thắng, cờ chống trùng.
- **(3) Badge "💸 Chờ chuyển":** trong `_buildCard` khối approved/transferred — khi `!isClosed && hAmt>0 && transferredAmt<approvedAmt` → badge "Chờ chuyển (hôm nay)" / "Chờ chuyển — đã N ngày" (N tính từ `p.approvedH`), cam `#fff7ed/#c2410c`, chuyển `badge-reject` (đỏ) khi ≥3 ngày. Lưu ý `_cardHash` không chứa ngày → số ngày chỉ đổi khi thẻ được vẽ lại (mở app mới là đủ — thẻ rebuild mỗi phiên).
- Đã kiểm chứng qua preview 8 điều kiện badge/nút (đủ duyệt-chưa chuyển: nút+badge+đỏ 4 ngày ✓; chỉ D duyệt: không badge, nút giục duyệt cũ ✓; H duyệt hôm nay: badge cam "hôm nay" ✓; đã chuyển: không gì cả ✓), giục chuyển (note/label/nhảy đầu/badge giục ✓), bảng nhắc (đúng role, đúng danh sách lọc H-đã-duyệt, tổng 18tr đúng, 1 lần/phiên ✓), regression duyệt/chuyển/giục-duyệt-cũ ✓.

### G. Dữ liệu "cập nhật không kịp thời" khi quay lại app (v53 — quan trọng, ĐÃ VÁ LẠI ở v68 xem mục U)
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
- **Đã tái diễn lần 2 ở v66 (05/07/2026)** — xác nhận đây là lỗi hạ tầng GitHub ngẫu nhiên, KHÔNG phải sự cố một lần. Cứ push xong mà `version.txt` không đổi sau ~90s, kiểm tra ngay theo quy trình trên — commit rỗng retry lần nào cũng thành công trong <1 phút. Chú ý: run mới có thể ở trạng thái `"waiting"` một lúc trước khi chuyển `"in_progress"` rồi `"completed"` — đừng vội kết luận fail nếu thấy "waiting", phải đợi tới khi `status` = `"completed"` mới đọc `conclusion`.

### T. 🆕 TÍNH NĂNG MỚI — Kế hoạch vật tư (v67, 05/07/2026)
**Bối cảnh:** user muốn ghi trước nhu cầu vật tư tương lai cho từng công trình (VD "còn 5 ngày cần 50m³ bê tông"), tách biệt hẳn với đề xuất chi tiền. Đã bàn kỹ với user trước khi code — user nhấn mạnh nhiều lần: **tuyệt đối không được ảnh hưởng tính năng cũ đang chạy** (cả công ty phụ thuộc). Cách đảm bảo: mọi thứ dưới đây là **THÊM MỚI HOÀN TOÀN**, không sửa 1 dòng nào của proposals/duyệt/chuyển/báo cáo hiện có.

**Quyết định thiết kế đã chốt cùng user (không tự ý đổi nếu không hỏi lại):**
- Vị trí: nút **"📅 Kế hoạch"** thay chỗ "🚪 Thoát" trên thanh nav dưới; nút Thoát dời vào cuối trang Cài đặt (`logoutRole()` không đổi, chỉ đổi chỗ gọi).
- Quyền: D/H/Trang/Khác đều thêm/sửa được (giống quyền tạo đề xuất).
- **Không cần duyệt để hiện** — ai ghi cũng hiện ngay cho mọi người. D/H có nút **"✅ Xác nhận"** riêng (2 cờ độc lập `confirmedByD`/`confirmedByH`) — CHỈ mang tính tham khảo, KHÔNG ẩn/chặn kế hoạch nếu chưa xác nhận.
- Ngưỡng khẩn cấp: **còn ≤2 ngày** → đỏ; 3-7 ngày → cam; quá hạn mà chưa "Đã hoàn thành" → đỏ đậm "❗ Quá hạn".
- Có nút **"💰 Tạo đề xuất chi"** ngay trên thẻ kế hoạch → điền sẵn công trình + nội dung sang form "Thêm mới" (KHÔNG tự động gửi, vẫn phải tự nhập số tiền + bấm gửi như bình thường).
- ⚠️ **Đã bàn và xác nhận: KHÔNG làm tự động gửi thông báo đẩy lúc nửa đêm dù không ai mở app** (cần Firebase Cloud Functions + Cloud Scheduler — hạ tầng riêng, phức tạp/rủi ro hơn hẳn kiến trúc client-side hiện tại của app3.html, để dành giai đoạn sau nếu thực sự cần). MVP hiện tại: tự tô màu khi mở app + nút **"🔔 Nhắc"** thủ công (tái dùng `sendPushNotif` có sẵn, giống cơ chế "giục duyệt").

**Cấu trúc dữ liệu 1 kế hoạch** (lưu ở `duyetchi/plans/{id}`, **ngăn Firebase RIÊNG HẲN**, không liên quan `duyetchi/proposals`):
```javascript
{
  id, site, material, quantity, neededDate, assignee, note,
  status: "pending"|"ordered"|"done"|"cancelled",
  createdBy, createdAt,
  confirmedByD: ts|null, confirmedByH: ts|null,
  linkedProposalId: id|null,   // gán khi bấm "Tạo đề xuất chi" và GỬI THÀNH CÔNG
}
```

**Vị trí code (app3.html):**
| Hàm/mục | Vai trò |
|---|---|
| `let plans` (~996) | biến toàn cục, load từ `localStorage.dc_plans` |
| Listener `db.ref('duyetchi/plans').on(...)` (trong `initFirebaseSync`, ngay sau listener `proposals`) | đồng bộ — **cố ý KHÔNG gọi `_mergeAndRender()`**, hoàn toàn độc lập |
| `savePlans()` | lưu local + đẩy Firebase (dùng chung cờ `fbInitialLoadDone` để tránh ghi rác lúc mới mở app, giống `pushToFirebase()`) |
| `renderPlans()` / `buildPlanCard()` / `planUrgencyInfo()` / `planConfirmBadge()` | hiển thị danh sách + thẻ + màu khẩn cấp + nút xác nhận |
| `openPlanModal()` / `closePlanModal()` / `savePlanFromModal()` / `deletePlan()` / `setPlanStatus()` / `confirmPlan()` / `remindPlan()` | CRUD + hành động |
| `createProposalFromPlan(id)` + `_pendingPlanLink` (biến toàn cục) | điền sẵn form Thêm mới; **móc nối DUY NHẤT vào code cũ**: trong `submitProposal()`, ngay sau `proposals.unshift(p); save();` có thêm 4 dòng kiểm tra `if(_pendingPlanLink)` để gán `linkedProposalId` — nếu KHÔNG đến từ kế hoạch (`_pendingPlanLink` null, mặc định) thì hành vi `submitProposal()` y hệt như trước, không đổi gì |
| HTML `#page-plan`, `#plan-modal-overlay` | chèn giữa `#page-settings` và `<!-- BOTTOM NAV -->`, dùng lại nguyên các class có sẵn (`.card`, `.proposal`, `.badge*`, `.form-input`, `.btn-full`) — không thêm CSS mới |
| `showPage()` (~2251) | thêm `'plan'` vào mảng trang ẩn/hiện + `if(pg==='plan') renderPlans();` — 2 dòng, không đổi logic cũ |

**Đã kiểm chứng qua preview (không chỉ đọc code):** thêm/sửa/xoá kế hoạch, tô màu đúng theo số ngày còn lại, D xác nhận đúng, đổi trạng thái đúng, bấm "Tạo đề xuất chi" điền đúng công trình+nội dung sang Thêm mới, gửi xong tự nối `linkedProposalId` đúng phiếu, thẻ đổi thành "✅ Đã có đề xuất". Đồng thời **test lại toàn bộ tính năng CŨ sau khi thêm module này**: duyệt D (status→approved đúng), chuyển tiền Trang (status→transferred đúng), báo cáo tóm tắt render bình thường, Cài đặt hiện đúng có nút Đăng xuất mới, thanh nav đúng 5 nút không vỡ layout — **không có gì bị ảnh hưởng**, đúng cam kết với user.

### V. 🔴 Kế hoạch KHÔNG ĐỒNG BỘ được — thiếu luật Firebase (phát hiện + fix HẠ TẦNG, 05/07/2026)
- **Triệu chứng thật tế trên production:** vừa lên v67, user báo banner đỏ "⚠️ Không đồng bộ được kế hoạch — kiểm tra mạng" mỗi lần thêm kế hoạch, dù mạng/kết nối Firebase (proposals) vẫn OK bình thường.
- **Gốc — KHÔNG phải lỗi mạng, KHÔNG phải lỗi app3.html:** Firebase Realtime Database Security Rules của dự án khai báo CHO PHÉP từng đường dẫn con RIÊNG LẺ dưới `duyetchi` (`userRoles`, `meta`, `proposals`, `images`, `pendingOtp`, `online`) — **hoàn toàn CHƯA có luật cho `duyetchi/plans`** (module mới ở v67). Firebase mặc định TỪ CHỐI ghi nếu không có `.write` rule khớp đường dẫn, dù `.read` ở cấp `duyetchi` cha có `auth != null` (read cascade xuống được nhưng **write thì KHÔNG tự cascade** — phải khai rõ ràng ở đúng path).
- **Đây là lỗ hổng quy trình đáng ghi nhớ:** preview luôn báo PERMISSION_DENIED cho MỌI đường dẫn (vì preview không đăng nhập) → không thể phân biệt được "lỗi do preview chưa login" với "lỗi do thiếu luật thật trên production dù đã login" khi test trước khi release. **Bài học: mỗi khi thêm ngăn dữ liệu Firebase MỚI (node mới dưới `duyetchi/`), PHẢI nhớ thêm luật `.read`/`.write` tương ứng trong Security Rules — việc này không thể test được qua preview, chỉ lộ ra khi dùng thật trên production.**
- **Cách chẩn đoán (đã dùng, ghi lại để tái sử dụng):**
  ```bash
  firebase login:list                                          # xác nhận đã đăng nhập đúng tài khoản
  MSYS_NO_PATHCONV=1 firebase database:get "/.settings/rules" --project duyetchi-pva379   # xem luật hiện tại
  ```
  ⚠️ Trên Windows git-bash, path bắt đầu bằng `/` bị MSYS tự động "dịch" sang path Windows → PHẢI có tiền tố `MSYS_NO_PATHCONV=1` mới gọi đúng, nếu không sẽ báo lỗi "Path must begin with /" dù đã gõ đúng.
- **Cách sửa (đã làm, deploy 1 lần, có hiệu lực NGAY LẬP TỨC — không cần bump version/deploy lại app):** tạo file rules mới = y hệt luật cũ + thêm đúng 1 khối cho `plans` (copy pattern của `proposals`, cùng mức quyền — ai đăng nhập cũng đọc/ghi được):
  ```json
  "plans": {
    ".read": "auth != null",
    "$id": { ".write": "auth != null" }
  }
  ```
  Deploy bằng: tạo `firebase.json` (trỏ `database.rules` tới file rules) + `.firebaserc` (project mặc định `duyetchi-pva379`) trong 1 thư mục tạm (KHÔNG phải thư mục app3.html — repo Duyet-Chi không cần chứa file rules này), rồi `firebase deploy --only database --project duyetchi-pva379`. Đã xác nhận deploy "released successfully" và đọc lại rules thấy khối `plans` đã có.
- ⚠️ **Nếu sau này thêm ngăn Firebase mới nào khác** (giống mô hình `duyetchi/plans` độc lập) — **NHỚ LÀM BƯỚC NÀY TRƯỚC KHI báo user tính năng đã xong**, đừng đợi user tự phát hiện lỗi đồng bộ trên production nữa.
- 🔴 **CHƯA HẾT — sau khi thêm luật, user vẫn báo lỗi y hệt ở v69!** Té ra rules chỉ là NỬA vấn đề. Nửa còn lại (thật sự là NGUYÊN NHÂN CHÍNH, xem mục V2 ngay dưới) nằm trong chính code `savePlans()`.

### V2. 🔴 savePlans() ghi SAI KIỂU — `.set()` đè cả ngăn thay vì ghi từng path con (v70, 05/07/2026)
- **Bài học đắt giá:** sau khi thêm luật `.write` ở mục V, user thử lại **VẪN báo y hệt lỗi cũ**. Té ra rules KHÔNG PHẢI toàn bộ vấn đề — code `savePlans()` (viết lúc v67) tự nó có lỗi độc lập, hai lỗi CHỒNG LÊN NHAU khiến chẩn đoán lần 1 tưởng đã xong nhưng thực ra chưa chạm gốc rễ thật.
- **Gốc:** `savePlans()` gọi `db.ref('duyetchi/plans').set(obj)` — ghi đè **NGUYÊN CẢ ngăn `duyetchi/plans`** cùng một lúc (đóng gói mọi kế hoạch vào 1 object rồi set 1 phát). Nhưng luật bảo mật (mục V) chỉ cấp `.write` ở **CẤP CON** `duyetchi/plans/$id`, KHÔNG cấp ở cấp ngăn cha `duyetchi/plans`. Theo đúng cơ chế Firebase RTDB: **`.write` rule ở cấp con KHÔNG cấp quyền ghi cho một lệnh set() ở cấp cha bao trùm nhiều con** — phải ghi rule ở ĐÚNG cấp đang ghi, hoặc ghi bằng multi-path `update()` (mỗi key trong object là 1 path đầy đủ, được xét quyền RIÊNG theo path đó).
- **Đối chiếu:** `proposals` chưa từng gặp lỗi này vì `pushToFirebase()` vốn đã dùng đúng kiểu `db.ref().update({'duyetchi/proposals/{id}': lightFields, ...})` — multi-path update, mỗi phiếu 1 path riêng — khớp đúng luật `duyetchi/proposals/$id`. Khi viết `savePlans()` cho tính năng mới, đã KHÔNG soi theo mẫu này mà tự viết `.set()` đơn giản hơn — đây là chỗ sai.
- **Sửa:** viết lại `savePlans()` giống hệt kiểu proposals — dùng `db.ref().update(updates)` với `updates['duyetchi/plans/'+p.id] = p` cho từng kế hoạch, và `updates['duyetchi/plans/'+id] = null` cho kế hoạch đã bị xoá ở local (theo dõi qua biến `_lastPlanIds`, cập nhật lại mỗi khi listener nhận dữ liệu mới từ server).
- Đã kiểm chứng qua preview bằng cách chặn bắt `db.ref().update()` thật để xem đúng cấu trúc gửi đi: thêm kế hoạch → key đúng là `'duyetchi/plans/{id}'` (không phải `'duyetchi/plans'`); xoá kế hoạch → gửi đúng `null` ở path con tương ứng, các kế hoạch khác không bị đụng.
- **Bài học tổng quát cho lần sau:** khi thêm module Firebase MỚI, đừng chỉ copy "thêm luật cho path mới" — phải **kiểm tra luôn cách CODE ghi dữ liệu có khớp ĐÚNG CẤP mà luật đó cấp quyền hay không** (ghi cả node cha vs ghi từng path con là 2 chuyện khác nhau về mặt luật, dù nhìn code tưởng tương đương). Preview không test được cả hai lỗi này (luôn PERMISSION_DENIED do chưa đăng nhập), nên phải tự soát kỹ bằng mắt + đối chiếu với pattern đã chứng minh đúng (`pushToFirebase()`), không dựa hoàn toàn vào "preview không báo lỗi" làm bằng chứng đủ.

### W. Kế hoạch vật tư — thêm trường tiền + người đề xuất + tab Thống kê (v69, 05/07/2026)
- User phản hồi sau khi dùng thử v67: (1) chưa có ô "số tiền dự kiến", (2) thẻ không hiện tên người đề xuất (dù đã lưu `createdBy`, chỉ quên hiện), (3) cần có tab thống kê tổng hợp trong Kế hoạch.
- **Đã bàn kỹ trước khi code** (đúng yêu cầu user) — chốt: thống kê CÓ chia theo loại vật tư (bê tông/thép/cát...), KHÔNG cần chia theo công trình (đã có bộ lọc CT ở tab Danh sách rồi).
- **Đã làm:**
  - Thêm field `estimatedAmount` vào data model + form (`#plan-inp-amount`, không bắt buộc) + hiện trên thẻ (dùng `fmtVND` — số tiền đầy đủ, giống cách thẻ phiếu đề xuất hiển thị).
  - Thẻ kế hoạch hiện thêm dòng "🙋 Người đề xuất: ${p.createdBy}".
  - Trang Kế hoạch giờ có **2 tab con** (`setPlanTab()`, tái dùng class `.report-subtab`/`.report-subtabs` có sẵn — không thêm CSS mới): **📋 Danh sách** (nội dung cũ) và **📊 Thống kê** (`renderPlanStats()`, mới) — gồm 4 ô tổng theo trạng thái (đếm + tổng tiền dự kiến mỗi nhóm, dùng `fmtTr` rút gọn triệu giống Báo cáo), khối "🔴 SẮP ĐẾN HẠN" (≤2 ngày, tái dùng `planUrgencyInfo`'s ngưỡng ngày), và bảng "Tổng theo loại vật tư" (gộp theo `p.material.trim()`, sắp theo tổng tiền giảm dần).
  - `showPage('plan')` và Firebase listener `duyetchi/plans` giờ render ĐÚNG tab đang active (list hay stats) thay vì luôn mặc định render Danh sách.
- Đã kiểm chứng qua preview với 2 kế hoạch giả (Bê tông 150tr còn 1 ngày, Thép 80tr còn 10 ngày): thẻ hiện đúng tên+tiền; tab Thống kê hiện đúng "ĐANG CHỜ 2 KH 230 tr", khối Sắp đến hạn chỉ có đúng Bê tông (đúng vì Thép còn 10 ngày > ngưỡng 2), bảng vật tư đúng thứ tự Bê tông(150tr) trước Thép(80tr). Test lại duyệt D + báo cáo tóm tắt vẫn đúng, không ảnh hưởng.
- ⚠️ **Đã thay thế ở v71** — xem mục X ngay dưới. Bản tóm tắt số gộp (4 ô trạng thái + bảng theo vật tư) ở mục W KHÔNG CÒN dùng nữa, đừng nhầm với bản hiện tại.

### X. Tab Thống kê đổi thành BẢNG CHI TIẾT đầy đủ (v71, 05/07/2026 — thay thế mục W)
- User phản hồi bản tóm tắt-gộp ở v69 (chỉ có 4 ô trạng thái + bảng gộp theo vật tư) **không đủ để hiểu** — cần xem đủ TỪNG kế hoạch với TẤT CẢ thông tin: vật tư, khối lượng, công trình, người phụ trách, người đề xuất, số tiền, trạng thái, ngày cần.
- **Đã làm đúng quy trình "bàn trước rồi mới code":** dựng bản mẫu (mockup) bằng Artifact với dữ liệu ví dụ, cho user xem trước bố cục bảng — KHÔNG code thẳng vào app. User duyệt bố cục + chốt 2 điểm: (1) đổi tên trạng thái "Đã đặt hàng" → **"Đã đặt cọc"** (khớp thực tế công trường: đặt cọc trước, chưa chắc nhận hàng ngay), (2) bảng chi tiết này **THAY THẾ HẲN** phần số gộp cũ, không giữ song song.
- **Đã làm:** viết lại toàn bộ `renderPlanStats()` (~3991) thành 1 bảng chi tiết — mỗi hàng = 1 kế hoạch, đủ 9 cột (#, Vật tư, Khối lượng, Công trình, Phụ trách, Đề xuất, Dự kiến, Trạng thái, Ngày cần), sắp theo ngày cần gần nhất lên đầu. Viền trái đổi màu theo độ khẩn (đỏ đậm = quá hạn, đỏ = còn ≤2 ngày, trong suốt = bình thường) — tái dùng đúng khuôn `.excel-table-scroll` + `.excel-table-wrap` đã dùng cho bảng "Chưa chuyển" ở Báo cáo (mục N/O), không tạo kiểu bảng mới. Đổi nhãn trạng thái "Đã đặt hàng"→"Đã đặt cọc" ở CẢ 2 chỗ: `<select>` trong `buildPlanCard()` VÀ badge trong bảng Thống kê (biến `PLAN_STATUS_INFO`, key nội bộ vẫn là `'ordered'`, chỉ đổi nhãn hiển thị).
- Đã kiểm chứng qua preview với 4 kế hoạch giả đủ tình huống (quá hạn, còn 1 ngày, chưa có giá, đã hoàn thành): bảng hiện đủ tất cả cột đúng dữ liệu (vật tư/khối lượng/CT/phụ trách/đề xuất/tiền/trạng thái/ngày), nhãn "Đã đặt cọc" đúng ở cả thẻ Danh sách lẫn bảng Thống kê, tổng tiền cuối bảng đúng (141.5tr = 65+58+0+18.5), độ rộng bảng 584px (đúng cuộn ngang trên màn ~355px). Test lại duyệt D vẫn đúng, không ảnh hưởng.

### Y. Bảng Thống kê — thêm bộ lọc công trình + nhấn đúp nhảy sang chi tiết (v72, 05/07/2026)
- User yêu cầu thêm: (1) lọc/tìm theo tên công trình ngay trong tab Thống kê, (2) nhấn đúp 1 hàng trong bảng → nhảy sang đúng thẻ kế hoạch đó ở tab Danh sách (giống hệt cơ chế đã có bên Báo cáo cho đề xuất chi).
- **Bộ lọc:** thêm `<select id="plan-stats-filter-site">` riêng cho tab Thống kê (KHÁC với `#plan-filter-site` của tab Danh sách — 2 bộ lọc độc lập, không dùng chung, tránh đổi 1 bên ảnh hưởng bên kia). `renderPlanStats()` tự đọc giá trị lọc, giữ nguyên lựa chọn khi vẽ lại; nếu lọc ra rỗng thì hiện thông báo riêng "Không có kế hoạch nào khớp công trình đã chọn".
- **Nhảy sang chi tiết:** thêm `id="plancard-${p.id}"` vào thẻ ở `buildPlanCard()` (trước đây CHƯA có id, phải thêm mới nhảy tới được). Viết `jumpToPlanCard(id)` + `attachPlanDoubleTap(container)` — **cố ý viết HÀM RIÊNG**, không tái dùng/sửa `jumpToProposal`/`attachReportDoubleTap` bên Báo cáo (dù logic giống hệt) để không rủi ro đụng vào cơ chế double-tap đề xuất chi đang chạy ổn định. Mỗi hàng bảng Thống kê có `class="plan-row-link" ondblclick="jumpToPlanCard('${p.id}')"`; sau khi render gọi `attachPlanDoubleTap(el)` để mobile double-tap cũng hoạt động (giống hệt kỹ thuật `attachReportDoubleTap` — bắt 2 lần `touchend` cách nhau <350ms trên cùng 1 hàng).
- Đã kiểm chứng qua preview: bộ lọc lọc đúng số dòng (chọn 1 CT → chỉ còn đúng phiếu của CT đó, bỏ lọc → về đủ); double-click desktop (`dispatchEvent(new MouseEvent('dblclick'))`) và double-tap di động (2 lần `TouchEvent('touchend')` cách nhau <350ms, dùng `Touch`/`TouchEvent` giả lập thật) đều nhảy đúng sang tab Danh sách, tìm đúng thẻ theo id, gắn đúng hiệu ứng `.card-highlighted`. Test lại duyệt D + `jumpToProposal` bên Báo cáo vẫn hoạt động bình thường, không bị đụng.

### Q. Thẻ phiếu "Đã chuyển" (duyệt 1 phần) vẫn hiện đỏ/"chờ duyệt" gây hiểu nhầm chưa xong (v62, 04/07/2026)
- **Bối cảnh:** đề xuất 10tr, D duyệt 6tr (H chưa duyệt), Trang chuyển đủ 6tr → app đã tự đúng chuyển `status='transferred'` từ trước (không bắt T chuyển thêm 4tr — đúng quy tắc mục 4). Nhưng **thẻ phiếu vẫn hiện sai**: badge D đỏ "6tr/10tr" (so với tổng đề xuất GỐC) và badge H "⏳ H chờ duyệt" — khiến nhìn vào tưởng vẫn còn dang dở, dù thực ra giao dịch đã ĐÓNG HẲN.
- **Sửa** trong `_buildCard` (~2415, khối `if(p.status==='approved' || p.status==='transferred')`): thêm biến `isClosed = p.status==='transferred'`. Khi `isClosed`, `dFull`/`hFull` chỉ cần `amt>0` (không so với `total` = đề xuất gốc nữa) → hết đỏ; bên nào KHÔNG duyệt gì (amt=0) hiện **"D/H không cần duyệt"** (icon ➖ trung tính) thay vì **"chờ duyệt"** (⏳, ngụ ý còn phải làm gì đó).
- **CHỈ áp dụng khi `status==='transferred'`** (đã đóng hẳn) — phiếu còn `status==='approved'` (D/H duyệt 1 phần nhưng T CHƯA chuyển xong) **giữ nguyên hành vi cũ** (vẫn hiện đỏ + "chờ duyệt"), vì tiền chưa chuyển thì vẫn còn khả năng duyệt thêm/chuyển thêm, không được coi là xong.
- Đã kiểm chứng qua preview 3 kịch bản: (1) chỉ D duyệt 1 phần + đã chuyển → hết đỏ, H hiện "không cần duyệt"; (2) chỉ H duyệt 1 phần + đã chuyển → hết đỏ, D hiện "không cần duyệt"; (3) cả D và H duyệt đủ 100% + đã chuyển → không đổi gì (vẫn đúng như cũ). Phiếu `status==='approved'` (chưa chuyển xong) vẫn hiện đỏ + chờ duyệt như trước — không bị ảnh hưởng.
- ⚠️ **Chưa sửa (phát hiện phụ, ngoài phạm vi user yêu cầu lần này):** nút hành động của `renderBtnD`/`renderBtnH` (~2518/2544) vẫn cho phép bấm "Duyệt" dù phiếu đã `status==='transferred'` đóng hẳn qua 1 mình D hoặc H (canPress không loại trừ status='transferred'). Bấm thêm không phá được số chính thức (do `getOfficialApprovedAmount` ưu tiên H không so độ lớn), nhưng tạo thêm 1 dòng lịch sử duyệt thừa/gây rối. Nếu user muốn khoá hẳn nút này khi đã đóng, cần hỏi rõ trước khi sửa (đây là quyết định nghiệp vụ, không tự ý đổi). — User đã xác nhận (04/07/2026): **để nguyên, không sửa.**
- 🔴 **v66 (05/07/2026) — SỬA LẠI mục Q, v62 đã làm SAI 1 phần, đọc kỹ đừng lặp lại:** user chỉ ra ảnh thực tế (thẻ "Thanh toán tiền 400l dầu") — D **CHƯA duyệt gì cả** (không phải "duyệt 1 phần" như ví dụ ban đầu), chỉ H duyệt + T đã chuyển đủ theo H. v62 lỡ đổi badge thành **"D không cần duyệt"** cho case này — **SAI**: dù tiền đã chuyển dựa trên 1 mình H duyệt, D **VẪN CÒN VIỆC PHẢI XEM/DUYỆT LẠI** cho đúng quy trình (không phải "không cần" vĩnh viễn). Đã sửa lại: khi `amt===0` (chưa duyệt gì) → **LUÔN hiện "chờ duyệt"** như v61, bất kể `isClosed` hay không.
  - **Vẫn giữ đúng phần v62 làm đúng:** khi đã duyệt MỘT PHẦN (amt>0, ví dụ D duyệt 6tr/10tr) VÀ đã đóng (`status==='transferred'`) → hết đỏ so với đề xuất gốc, hiện thẳng số đã duyệt không kèm "/tổng".
  - **Tóm gọn quy tắc đúng (đã chốt):** "chưa duyệt gì" (amt=0) → luôn "chờ duyệt", không phân biệt đóng/chưa đóng. "Đã duyệt một phần" (amt>0) → nếu CHƯA đóng thì vẫn đỏ so với gốc (đúng, tiền chưa chuyển nên còn khả năng duyệt/chuyển thêm); nếu ĐÃ đóng thì hết đỏ (đúng, phần đã duyệt đó coi như xong).

### R. Zoom ảnh trong modal xem to — pinch + double-tap + kéo (v64, 04/07/2026)
- **Lý do:** nhiều ảnh chứng từ chữ nhỏ, xem vừa khung (fit-to-screen) trên điện thoại không đọc được. Toàn app khoá pinch-zoom trang (`<meta viewport ... maximum-scale=1.0>`) nên phải tự làm zoom RIÊNG cho ảnh trong modal bằng CSS `transform` — không gỡ `maximum-scale` (sẽ zoom được cả UI nút bấm/chữ toàn app, phá layout).
- **Vị trí code:** hàm `_initModalZoomGestures()` + `_applyZoomTransform()` + `resetModalZoom()` (~dòng 987, ngay sau `attachLongPress`). Gắn listener touchstart/touchmove/touchend RIÊNG lên `#imgModalSrc`, chạy **song song** với `attachLongPress` đã gắn sẵn (copy/tải/xóa) — không sửa/thay listener cũ, 2 bộ listener không giẫm chân nhau (đã kiểm chứng: long-press vẫn mở menu copy bình thường khi chưa zoom).
- **Cử chỉ hỗ trợ:** pinch 2 ngón (thu/phóng, giới hạn 1×–4×), nhấn đúp (double-tap) bật/tắt nhanh 2.5×, kéo 1 ngón để pan khi đang zoom (>1×). Tự về lại 1× khi: pinch thu về gần 1 (≤1.02), lướt sang ảnh khác (`showModalImg` gọi `resetModalZoom()`), hoặc đóng modal (`closeImgModal` gọi `resetModalZoom()`).
- CSS `#imgModalSrc{touch-action:none}` để trình duyệt không tự cuộn/giật đè lên lúc đang pinch/kéo bằng JS.
- Đã kiểm chứng đầy đủ qua preview bằng `TouchEvent`/`Touch` giả lập thật (không chỉ gọi hàm suông): pinch giãn 2× → scale đúng 2.5; pinch thu lại → tự reset về 1; double-tap → 2.5 rồi double-tap lại → về 1; kéo khi đã zoom → toạ độ dịch chuyển đúng chính xác pixel; lướt ảnh khác / đóng modal → tự reset; long-press-copy vẫn mở menu bình thường khi chưa zoom (không bị phá).

### S. Tăng độ phân giải nén ảnh 600px → 1000px để zoom rõ hơn (v65, 04/07/2026)
- **Lý do:** sau khi có zoom (mục R), ảnh cũ nén 600px khi zoom 4× khá mờ (chỉ tương đương ~150px "thật" ở mức zoom cao nhất). User hỏi tăng lên có ảnh hưởng tốc độ app không — đã **đo thực tế** bằng `compressImage()` thật với ảnh giả lập giống ảnh chứng từ (2000×3000, nhiều dòng chữ nhỏ) trước khi đổi code, không đoán:

  | MAX | Kích thước | Dung lượng | Thời gian nén |
  |---|---|---|---|
  | 600 (cũ) | 400×600 | 34 KB | ~0.3s |
  | 900 | 600×900 | 71 KB | ~0.3s |
  | **1000 (chọn)** | 667×1000 | 80 KB | ~0.3s |
  | 1200 | 800×1200 | 91 KB | ~0.35s |
  | 1600 | 1067×1600 | 151 KB | ~0.6s |

  Kết luận: KHÔNG ảnh hưởng tốc độ chung của app (chỉ tác động lúc nén-upload và tải-xem ảnh, không đụng list/duyệt/chuyển); dung lượng gấp ~2.35 lần nhưng vẫn rất nhỏ so với hạn mức Firebase Storage free tier ngay cả ở quy mô 2000 ảnh/5 tháng. User chọn mức **1000px**.
- **Sửa:** `compressImage()` (~1072) đổi `const MAX = 600` → `const MAX = 1000`. Comment cũ trong code ghi "1200px" là SAI/lỗi thời (thực tế code là 600 trước khi sửa) — đã sửa comment khớp đúng.
- Đã kiểm chứng qua preview: gọi ĐÚNG hàm `compressImage()` thật (không phải bản sao) với ảnh test → ra đúng 667×1000, không lỗi.

### AD. 🔐 BẢO MẬT LỚN v77 — chống sửa số tài khoản/nội dung SAU khi duyệt (05/07/2026, đọc kỹ trước khi đụng vào luật/luồng duyệt)
**Bối cảnh:** user đặt vấn đề: nếu ai đó vào được hệ thống, sửa số tài khoản trong phiếu SAU khi D,H đã duyệt → Trang chuyển nhầm. Đã bàn 3 lớp + user duyệt cả 3, mốc đóng băng = "ngay khi D HOẶC H duyệt".

**Các lỗ hổng THẬT đã phát hiện trong lúc làm (đều đã vá):**
1. Luật cũ: `proposals/$id .write: auth != null` — BẤT KỲ tài khoản nào (kể cả role 'other') sửa được MỌI phiếu MỌI trạng thái, gọi thẳng DB không cần qua UI.
2. **Leo quyền:** `userRoles/$uid` cho TỰ ghi role của mình + `doRegister` ghi role theo TÊN TỰ CHỌN (`nameToRole`) → đăng ký tên "Dũng" là thành role dung, trước cả khi qua OTP (OTP chỉ chặn UI, không chặn DB).
3. **Hồ sơ role của Hiền trên DB là 'other'** (app chạy được nhờ email-fallback client-side ở initAuth) — nếu deploy luật gate-theo-role mà không sửa trước thì CHẶN NHẦM Hiền → tắc tài chính. Đã sửa trực tiếp qua CLI: uid `8Q8g7dm...` (hiensbgt@gmail.com) → `{role:'hien', name:'Hiền'}`. **Bài học: TRƯỚC khi gate theo role DB, PHẢI đọc userRoles thật + auth:export đối chiếu email.**

**Luật Firebase mới (file `database.rules.json` trong repo; bản cũ để hoàn tác: `database.rules.backup-truoc-v77.json`; deploy bằng thư mục tạm + `firebase deploy --only database`):**
- **Đóng băng nội dung:** `desc/note/amount/amountUnit/person/site` chỉ được GIỮ NGUYÊN một khi phiếu có bất kỳ dấu duyệt nào (approvedD/approvedH/2 history tồn tại). Muốn sửa: D/H bỏ duyệt → sửa → duyệt lại.
- **Dấu duyệt:** thêm/đổi `approvedD` chỉ role dung, `approvedH` chỉ hien; GỠ dấu (bỏ duyệt) cũng chỉ đúng người (guard ở `$id .validate` — vì validate con không chạy khi newData con không tồn tại, removal phải guard ở cha).
- **Lịch sử duyệt/chuyển:** từng entry bất biến (so amount+ts); THÊM entry mới chỉ đúng role (D/H/T tương ứng). Gỡ CẢ node transfers chỉ trang.
- **status:** đặt lần đầu ai cũng được (tạo phiếu); ĐỔI chỉ dung/hien/trang (chặn 'other' giả "đã chuyển").
- **contentSnapshot:** từng trường chỉ dung/hien ghi/đổi; gỡ node chỉ dung/hien.
- **Xóa cả phiếu:** đã duyệt → chỉ dung; chưa duyệt → ai cũng được (như cũ).
- **userRoles:** tự ghi role mình CHỈ được 'other' — TRỪ đúng email: dung=vandung0802@gmail.com, hien=hiensbgt@gmail.com, trang=phantrang770@gmail.com (`auth.token.email`, khớp email-fallback trong initAuth); dung ghi được cho mọi người. (Lưu ý: initAuth fallback trang là `includes('trang')` — luật dùng email CHÍNH XÁC của Trang thật, chặt hơn client.)
- **KHÔNG gate** (cố ý, để không vỡ luồng): `approvedDAmount/HAmount` (chỉ là bản lưu phụ, nguồn chuẩn là history đã khóa), `priority/remind*/opinion*/imgStamp/transferredAt/rejected*`.

**Code app v77 đi kèm (BẮT BUỘC khớp luật, không thì thiết bị bị kẹt đồng bộ vì update() multi-path là NGUYÊN KHỐI — 1 validate fail là toàn bộ fail):**
1. `confirmApproveAmount`: chụp `p.contentSnapshot = {desc,note,amount,person,site}` mỗi lần duyệt.
2. `doTransfer`: đối chiếu snapshot vs hiện tại — LỆCH → `alert` cảnh báo bảo mật + CHẶN mở khung chuyển. Phiếu duyệt trước v77 không có snapshot → bỏ qua đối chiếu.
3. `saveEditProposal`: chặn sửa NỘI DUNG phiếu đã duyệt ngay trên UI (vẫn cho sửa ý kiến/ưu tiên/ảnh — các phần không đóng băng, ghi lên với nội dung không đổi thì luật cho qua).
4. `del()`: phiếu đã duyệt chỉ dung xóa.
5. `remindApprove` KHÔNG ghi đuôi giục vào `note` nữa (note đóng băng!) — thông tin giục hiện qua badge + `remindReportLabel` (đọc remindBy/remindCount).
6. Normalize (`_mergeAndRender`): chỉ thiết bị dung push bản sửa lệch; thiết bị khác giữ bản sửa cục bộ + vá `lastPushedSnapshot.proposalsMap` cho các id vừa sửa để push sau này không cố ghi (tránh bị từ chối oan → kẹt).
7. Bỏ duyệt TOÀN BỘ (cả 3 đường: undoApproveFromModal, undoApprove thường + nhánh legacy) → `delete p.contentSnapshot`.
- Thứ tự deploy đã dùng: **app v77 lên Pages TRƯỚC → luật sau** (giảm cửa sổ lệch app cũ/luật mới). App v76 cũ nếu giục-chuyển (ghi note) sẽ bị luật chặn → nhắc mọi người cập nhật v77 ngay.
- Đã test 10 kịch bản qua preview (snapshot đúng, chặn chuyển khi bị sửa, cho chuyển khi khớp/legacy, chặn sửa nội dung đã duyệt, cho sửa ý kiến, chặn xóa non-dung, giục không đụng note, bỏ duyệt xóa snapshot, duyệt→chuyển full flow OK). ⚠️ LUẬT chưa test được bằng user thật từ phía tôi (preview không đăng nhập) — đã yêu cầu D/H/T mỗi người test 1 thao tác ngay sau release.
- **Rủi ro còn lại (chưa xử lý, cân nhắc sau):** xóa BỚT entry lịch sử duyệt/chuyển (removal từng entry không guard được đơn giản trong RTDB rules) → chỉ hạ thấp số/gây nhiễu, không tăng tiền được; role 'trang' vẫn theo email chứa cụm cứng ở client (luật dùng email chính xác — lệch nhau chút, client lỏng hơn); **Storage rules vẫn mở cho ghi không đăng nhập** (việc treo từ v55 — làm cùng đợt migrate ảnh cũ); push-queue ai đăng nhập cũng gửi được (spam risk nhỏ).

### AE. 🔐 BẢO MẬT v78 — vá theo báo cáo kiểm tra của ChatGPT (05/07/2026)
User nhờ ChatGPT phân tích tĩnh app3.html → báo cáo 12 lỗi (APP3-01..12). Báo cáo NGHIÊM TÚC + phần lớn ĐÚNG, nhưng có giới hạn tự nêu: **chỉ đọc app3.html, KHÔNG xem được Firebase Rules** → nhiều lỗi "Critical" của nó (APP3-02 tự gán role, APP3-05 hành động đặc quyền chỉ ở client, phần lớn APP3-06) **thực ra đã vá ở v77** bằng luật máy chủ (mục AD) — báo cáo không biết. Đối chiếu lại từng lỗi với hiện trạng:
- **Đã xử lý ở v77:** APP3-02, APP3-05, phần lớn APP3-06 (khóa ghi theo vai trò ở máy chủ).
- **Còn hở thật → đã vá ở v78 (3 việc):**
  1. **APP3-04 Stored XSS (nghiêm trọng nhất):** đã xác minh CÓ THẬT — `${p.desc}`, `${p.note}`... ghép thẳng vào `innerHTML` KHÔNG lọc, app KHÔNG có hàm escape nào. Kẻ có tài khoản tạo phiếu chứa `<img onerror=...>` → chạy mã trên máy MỌI người xem list. **Vá:** thêm `esc()` (~2347, sau `fmtVND`) lọc `& < > " '`; áp vào TẤT CẢ chỗ nhét dữ liệu người dùng vào HTML: `_buildCard` (desc/note/person/site/opinion/lý do từ chối), notif panel, `opinionReportHtml`, 4 bảng báo cáo (renderReportRejected/renderReportList/renderExcelTable/makeTable + bảng Việc gấp), bảng thống kê kế hoạch, `buildPlanCard`, bảng nhắc chuyển, mọi `<option>` dropdown người/công trường, danh sách người/CT trong Cài đặt. **KHÔNG áp cho `sendPushNotif`** (nội dung thông báo là text thuần, escape sẽ hỏng chữ) và `.value` của input (DOM property, không phải innerHTML — vốn an toàn).
  2. **APP3-01/08 sheetUrl → `<script src>`:** `sanitizeSheetUrl()` (~1062) chỉ chấp nhận `https://` + hostname CHÍNH XÁC `script.google.com` + path `/macros/s/...`; áp tại 3 chỗ gán (khởi tạo từ localStorage, nhận từ Firebase meta trong `_mergeAndRender`, lưu từ ô Cài đặt `saveSheet`). URL lạ → thành `''` → các hàm sync có sẵn `if(!sheetUrl) return` nên không tải script. Không cần sửa 10 hàm sync (chốt tại điểm gán là đủ; DevTools tự đổi biến là máy kẻ tấn công, không tính).
  3. **APP3-10 Formula Injection:** `esc` cục bộ trong `downloadSummaryExcel` (~5031) giờ chèn `'` trước ô bắt đầu bằng `= + - @ \t \r` (giữ CSV quoting cũ).
- **Còn lại / chấp nhận với app nội bộ ~9 người quen:** APP3-03 (OTP — impact giảm mạnh sau v77 vì bypass OTP cũng chỉ ra role 'other'), APP3-07 (localStorage), APP3-09 (push spam), APP3-11 (CSP/SRI), APP3-12. Đáng cải thiện dần, không gấp. **Storage rules vẫn mở** (treo từ v55 — làm cùng migrate ảnh).
- Đã test qua preview: XSS payload `<img onerror>` KHÔNG chạy ở cả thẻ phiếu lẫn 4 bảng báo cáo (window flag vẫn false, HTML thấy `&lt;img`, không có thẻ img thật); `sanitizeSheetUrl` chặn đúng 4 URL độc / giữ URL hợp lệ; CSV chèn `'` trước `=`/`@`/`+`; duyệt + chuyển tiền vẫn OK sau tất cả thay đổi.

### AF. 🔐 BẢO MẬT v79 — vá theo báo cáo TÁI kiểm tra của ChatGPT (05/07/2026)
User gửi lại `app3.html` + `database.rules.json` cho ChatGPT → báo cáo v2. ChatGPT thấy được Rules lần này, đánh giá kỹ hơn. Phần lớn góp ý ĐÚNG; đã vá các lỗ THẬT còn sót, ghi rõ phần còn lại + lý do.
- **Lỗ XSS còn sót (ChatGPT bắt đúng — đã vá v79):**
  - **`src` của ẢNH** (`_buildCard` thumbnail + preview khi Thêm/Sửa): node `duyetchi/images/$id` cho mọi tài khoản ghi → kẻ xấu ghi `src = 'x" onerror="..."'` → thoát khỏi thuộc tính → XSS. Đã bọc `esc(src)` ở 4 chỗ.
  - **Tên NGƯỜI ONLINE** (`online-users-list`, ~1619): mỗi user tự ghi `online/$uid/name` → chèn XSS chạy trên máy người khác khi mở Cài đặt. Đã `esc(nm)`.
  - **Ô chọn tên màn Sửa** (~3493): dùng biến `pp` nên KHÔNG khớp `replace_all` cho `p=>` ở v78 → bỏ sót. Đã `esc`.
  - Rà lại: các `${p.desc}`... còn lại đều ở `sendPushNotif` (text thuần), `.value` (DOM property), hoặc `generateReport` (text copy Zalo) — KHÔNG phải HTML, cố ý không escape.
- **Rules — OTP world-readable (ChatGPT đúng, cơ chế RTDB — đã vá v79):** `.read` ở cấp cha `duyetchi` LAN XUỐNG mọi con và con KHÔNG thu hồi được → `pendingOtp` bị mọi tài khoản đọc dù có luật đọc-hạn-chế riêng. **Đã bỏ `.read` cấp cha**, khai `.read` riêng ở từng nhánh (proposals/images/plans/meta/userRoles/online cho người đăng nhập; pendingOtp chỉ chính chủ/Dũng). Đã kiểm tra app KHÔNG đọc nguyên cả node `duyetchi` (chỉ đọc từng con) → không vỡ.
- **Siết thêm (v79):** `sanitizeSheetUrl` bắt buộc path kết thúc `/exec` hoặc `/dev`; fallback role client đổi `email.includes('trang')` → email CHÍNH XÁC `phantrang770@gmail.com`; `logoutRole` xoá cache `dc_*` khỏi máy (APP3-07); CSV thêm `\n` vào danh sách ký tự mở đầu bị chèn `'`.
- **CHƯA vá — cần backend/hạ tầng, chấp nhận với app nội bộ (đã báo user, chờ quyết định):**
  - **APP3-01/08 full (Sheets JSONP):** vẫn dùng `<script src=sheetUrl>`. ChatGPT đúng rằng hostname-allowlist không loại bỏ hoàn toàn (script.google.com đa tenant). NHƯNG rủi ro thực THẤP vì `meta` (chứa sheetUrl) chỉ role `dung` ghi được (Rules) — kẻ khác không đổi được URL. Fix triệt để = chuyển sang Cloud Function backend (chưa làm).
  - **APP3-02 full:** chưa dùng custom claims/Admin SDK/`email_verified`. Cơ chế email-gate + password hiện tại đủ cho nội bộ. (Rủi ro "email đặc quyền chưa từng đăng ký bị người khác tạo account" — thực tế cả 3 email đã đăng ký rồi.)
  - **APP3-05 (xóa BỚT entry lịch sử):** RTDB `.validate` không chạy khi xóa; xóa entry lịch sử chỉ LÀM GIẢM số đã duyệt/chuyển (không tăng tiền được), nội dung vẫn đóng băng → không trộm được tiền. Khó vá sạch trong RTDB rules.
  - **APP3-09 (push spam), APP3-11 (CSP/SRI), APP3-12 phần Storage:** Storage rules vẫn mở ghi (treo từ v55). Ưu tiên thấp/chờ.
- Đã test v79 qua preview: XSS qua `src` ảnh KHÔNG chạy (src giữ nguyên văn, không sinh onerror), sheetUrl thiếu `/exec` bị chặn, `/exec` + `/dev` OK, URL độc vẫn chặn, logout xoá đúng cache, duyệt+chuyển vẫn OK. Rules deploy thành công.

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
