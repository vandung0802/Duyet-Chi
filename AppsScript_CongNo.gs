// ===== Apps Script của app "Công nợ ngân hàng PVA-379-279" (congno.html) =====
// Làm 2 việc (mục 1.3, 4.4, 4.5 của docs/hopdong/CLAUDE-cong-no.md):
//   1. dongBo  — nhận các bảng số liệu app gửi lên, GHI ĐÈ toàn bộ từng sheet của file Google Sheets (bản sao MỘT CHIỀU để kế toán xem; không ghi ngược về app).
//   2. taiFile — nhận file scan (hợp đồng, khế ước, thư bảo lãnh…), cất vào Google Drive: "Cong No PVA-379-279" / <ngân hàng> / <hợp đồng>, đặt quyền "ai có link đều xem", trả link về app.
// Ai được gọi: người ĐANG ĐĂNG NHẬP app (gửi kèm mã đăng nhập Firebase) VÀ đã được duyệt trong app Duyệt Chi. Không có mật khẩu nào nằm trong file này.
//
// CÀI ĐẶT (làm 1 lần, bằng tài khoản vandung0802@gmail.com):
//   1. script.google.com → Dự án mới → dán toàn bộ file này vào Mã.gs → Lưu.
//   2. Chọn hàm khoiTao → Chạy → Cho phép (tạo file Sheets + thư mục Drive, xem link ở Nhật ký thực thi).
//   3. Triển khai → Tùy chọn triển khai mới → Ứng dụng web → Thực thi dưới tên: Tôi; Ai có quyền truy cập: Bất kỳ ai → Triển khai.
//   4. Chép URL .../exec vào CAU_HINH.URL_APPS_SCRIPT trong congno.html.
// Sửa mã về sau: Triển khai → Quản lý các tùy chọn triển khai → Sửa → Phiên bản mới (GIỮ NGUYÊN URL).

const API_KEY = 'AIzaSyBUy3IMuyXZYN9dkyhrariRD-aPbC0HmT8';   // khoá CÔNG KHAI của Firebase web (giống trong congno.html) — chỉ dùng để hỏi Firebase "mã đăng nhập này của ai"
const DB_URL = 'https://duyetchi-pva379-default-rtdb.asia-southeast1.firebasedatabase.app';
const TEN_SHEET = 'Công nợ ngân hàng PVA-379-279 (bản sao từ app)';
const TEN_THU_MUC = 'Cong No PVA-379-279';
const FILE_TOI_DA_MB = 20;

// ---------- 1 lần: tạo file Sheets + thư mục Drive, nhớ ID ----------
function khoiTao() {
  const p = PropertiesService.getScriptProperties();
  if (!p.getProperty('SHEET_ID')) p.setProperty('SHEET_ID', SpreadsheetApp.create(TEN_SHEET).getId());
  if (!p.getProperty('FOLDER_ID')) p.setProperty('FOLDER_ID', DriveApp.createFolder(TEN_THU_MUC).getId());
  // gọi thử ra ngoài một lần để Google hỏi luôn quyền "kết nối dịch vụ bên ngoài" (cần khi kiểm tra mã đăng nhập)
  UrlFetchApp.fetch(DB_URL + '/.json?shallow=true', { muteHttpExceptions: true });
  Logger.log('Google Sheets: https://docs.google.com/spreadsheets/d/' + p.getProperty('SHEET_ID'));
  Logger.log('Thư mục Drive: https://drive.google.com/drive/folders/' + p.getProperty('FOLDER_ID'));
}

// ---------- kiểm tra người gọi ----------
// Hỏi Firebase mã đăng nhập (idToken) này của ai, rồi đọc hồ sơ của chính người đó trong app Duyệt Chi xem đã được duyệt chưa.
function xacThuc_(idToken) {
  if (!idToken || !/^[\w-]{10,}\.[\w-]{10,}\.[\w-]{10,}$/.test(String(idToken))) return null;   // phải có dạng JWT — kẻ gọi bừa không làm tốn lượt UrlFetch
  const r = UrlFetchApp.fetch('https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=' + API_KEY,
    { method: 'post', contentType: 'application/json', payload: JSON.stringify({ idToken: idToken }), muteHttpExceptions: true });
  if (r.getResponseCode() !== 200) return null;
  const u = (JSON.parse(r.getContentText()).users || [])[0]; if (!u || !u.localId) return null;
  const h = UrlFetchApp.fetch(DB_URL + '/duyetchi/userRoles/' + u.localId + '.json?auth=' + encodeURIComponent(idToken), { muteHttpExceptions: true });
  const ho = h.getResponseCode() === 200 ? (JSON.parse(h.getContentText()) || {}) : {};
  if (ho.approved !== true && ho.role !== 'dung') return null;
  return { uid: u.localId, email: u.email || '', ten: ho.name || u.email || '' };
}
function traLoi_(o, callback) {
  const s = JSON.stringify(o);
  return callback ? ContentService.createTextOutput(callback + '(' + s + ')').setMimeType(ContentService.MimeType.JAVASCRIPT)
                  : ContentService.createTextOutput(s).setMimeType(ContentService.MimeType.JSON);
}
const gioVN_ = () => Utilities.formatDate(new Date(), 'Asia/Ho_Chi_Minh', 'HH:mm dd/MM/yyyy');

// ---------- GET: chỉ để thử xem script còn sống (gọi kiểu JSONP được: ?callback=tenHam) ----------
function doGet(e) {
  const cb = e && e.parameter && /^[A-Za-z_$][\w$]{0,40}$/.test(e.parameter.callback || '') ? e.parameter.callback : '';
  return traLoi_({ ok: true, app: 'congNo', lucDongBo: PropertiesService.getScriptProperties().getProperty('LUC_DONG_BO') || '' }, cb);
}

// ---------- POST: mọi việc thật ----------
function doPost(e) {
  try {
    const d = JSON.parse(e.postData.contents), nguoi = xacThuc_(d.idToken);
    if (!nguoi) return traLoi_({ ok: false, loi: 'Chưa đăng nhập hoặc tài khoản chưa được duyệt' });
    if (d.action === 'dongBo') return traLoi_(dongBo_(d, nguoi));
    if (d.action === 'taiFile') return traLoi_(taiFile_(d, nguoi));
    if (d.action === 'thongTin') return traLoi_(thongTin_());
    return traLoi_({ ok: false, loi: 'Không hiểu yêu cầu: ' + d.action });
  } catch (err) { return traLoi_({ ok: false, loi: String(err && err.message || err) }); }
}
function thongTin_() {
  const p = PropertiesService.getScriptProperties();
  if (!p.getProperty('SHEET_ID') || !p.getProperty('FOLDER_ID')) return { ok: false, loi: 'Chưa chạy khoiTao trong Apps Script (chưa có file Sheets / thư mục Drive)' };
  return { ok: true, sheetUrl: 'https://docs.google.com/spreadsheets/d/' + p.getProperty('SHEET_ID'), thuMucUrl: 'https://drive.google.com/drive/folders/' + p.getProperty('FOLDER_ID'),
    lucDongBo: p.getProperty('LUC_DONG_BO') || '', nguoiDongBo: p.getProperty('NGUOI_DONG_BO') || '' };
}

// ---------- 1. ghi đè Google Sheets ----------
// d.bang = [{ten:'TongHop', mang:[[tiêu đề…],[dòng…]…]}, …] — mỗi phần tử một sheet, ghi đè toàn bộ.
function dongBo_(d, nguoi) {
  const p = PropertiesService.getScriptProperties(), id = p.getProperty('SHEET_ID');
  if (!id) return { ok: false, loi: 'Chưa chạy khoiTao (chưa có file Sheets)' };
  const khoa = LockService.getScriptLock(); if (!khoa.tryLock(20000)) return { ok: false, loi: 'Đang có người khác đồng bộ, thử lại sau ít phút' };
  try {
    const ss = SpreadsheetApp.openById(id), luc = gioVN_(); let soDong = 0;
    (d.bang || []).forEach(b => {
      const ten = String(b.ten || '').slice(0, 90); if (!ten) return;
      const mang = (b.mang || []).filter(r => Array.isArray(r)); if (!mang.length) mang.push(['(chưa có dữ liệu)']);
      const soCot = Math.max.apply(null, mang.map(r => r.length).concat([1]));
      const o = mang.map(r => { const x = r.map(v => v == null ? '' : (typeof v === 'string' && /^[=+\-@]/.test(v) ? "'" + v : v)); while (x.length < soCot) x.push(''); return x; });   // chuỗi bắt đầu = + - @ → thêm dấu ' để Sheets không coi là công thức
      const sh = ss.getSheetByName(ten) || ss.insertSheet(ten);
      sh.clearContents();
      sh.getRange(1, 1, o.length, soCot).setValues(o);
      sh.getRange(1, 1, 1, soCot).setFontWeight('bold').setBackground('#E6B8B7');
      sh.setFrozenRows(1);
      soDong += o.length - 1;
    });
    const dau = ss.getSheetByName('Trang tính1') || ss.getSheetByName('Sheet1');   // sheet trống mặc định lúc mới tạo file
    if (dau && ss.getSheets().length > 1 && dau.getLastRow() === 0) ss.deleteSheet(dau);
    p.setProperty('LUC_DONG_BO', luc); p.setProperty('NGUOI_DONG_BO', nguoi.ten);
    return { ok: true, luc: luc, soSheet: (d.bang || []).length, soDong: soDong, sheetUrl: ss.getUrl() };
  } finally { khoa.releaseLock(); }
}

// ---------- 2. cất file vào Google Drive ----------
// d = {ten, mime, duLieu (base64), thuMuc: ['tên ngân hàng', '[PVA] số hợp đồng — mô tả']} → {ok, link, id}
function thuMucCon_(cha, ten) {
  ten = String(ten || '').replace(/[\\/:*?"<>|]/g, '-').trim().slice(0, 120); if (!ten) return cha;
  const it = cha.getFoldersByName(ten); return it.hasNext() ? it.next() : cha.createFolder(ten);
}
function taiFile_(d, nguoi) {
  const id = PropertiesService.getScriptProperties().getProperty('FOLDER_ID');
  if (!id) return { ok: false, loi: 'Chưa chạy khoiTao (chưa có thư mục Drive)' };
  if (!d.duLieu || !d.ten) return { ok: false, loi: 'Thiếu file' };
  const bytes = Utilities.base64Decode(d.duLieu);
  if (bytes.length > FILE_TOI_DA_MB * 1024 * 1024) return { ok: false, loi: 'File lớn hơn ' + FILE_TOI_DA_MB + ' MB' };
  let tm = DriveApp.getFolderById(id); (d.thuMuc || []).slice(0, 3).forEach(t => { tm = thuMucCon_(tm, t); });
  const ten = String(d.ten).replace(/[\\/:*?"<>|]/g, '-').slice(0, 150);
  const f = tm.createFile(Utilities.newBlob(bytes, d.mime || 'application/octet-stream', ten));
  f.setDescription('Tải lên từ app Công nợ bởi ' + nguoi.ten + ' lúc ' + gioVN_());
  f.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);   // ai có link đều xem / tải được (mục 1.3)
  return { ok: true, link: f.getUrl(), id: f.getId(), ten: ten };
}
