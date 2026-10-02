#!/usr/bin/env node
// ===== NHẮC HẠN app Hợp đồng PVA-379-279 — chạy trên GitHub Actions 07:00 giờ Việt Nam mỗi ngày =====
// (.github/workflows/nhac-han-hopdong.yml). Quy tắc 18–20 trong docs/hopdong/CLAUDE.md:
//   • nhắc trước 30 ngày, sau đó cứ 5 ngày nhắc lại, tới khi ai đó bấm "Đã xong" trong app
//   • CHỈ gửi khi có việc đến hạn — không có gì thì im lặng (anh Dũng chốt 02/10)
//   • nội dung ngắn: tên gói thầu — loại mốc — còn bao nhiêu ngày
// Làm gì:
//   1. Đọc hopdong/{hopDong, phuLuc, baoLanh, nhacNho, pushSubs} bằng firebase-tools (đăng nhập bằng FIREBASE_TOKEN
//      hoặc GOOGLE_APPLICATION_CREDENTIALS — cùng chìa khoá với tác vụ đưa luật lên, KHÔNG có khoá nào trong repo).
//   2. Đồng bộ bảng nhacNho với dữ liệu (như hàm dongBoNhacNho trong app) — để chạy đúng cả khi không ai mở app.
//   3. Chọn mốc đến hạn, gửi web push tới mọi máy đã đăng ký (hopdong/pushSubs), ghi lại lần nhắc.
// Công thức mốc lấy THẲNG từ khối 6 TINH_TOAN của hopdong.html (một nguồn duy nhất, không chép lại).
// Chạy thử không gửi, không ghi:  node scripts/nhac-han-hopdong.js --thu
// Kiểm tra logic:                 node test-nhac-han-hopdong.js
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const { execFileSync } = require('child_process');

const DU_AN = 'duyetchi-pva379', GOC = 'hopdong';
const CAU_HINH = { NHAC_TRUOC_NGAY: 30, NHAC_LAP_NGAY: 5, TOI_DA_THONG_BAO: 6 }; // tối đa 6 thông báo/lần, còn lại gộp 1 dòng
const LOAI_BAO_LANH = { duThau: 'bảo lãnh dự thầu', thucHienHopDong: 'bảo lãnh thực hiện HĐ', tamUng: 'bảo lãnh tạm ứng', baoHanh: 'bảo lãnh bảo hành' };
const LOAI_MOC = { hetBaoHanh: 'hết bảo hành', hetBaoLanh: 'hết hạn bảo lãnh', hoanThanhHopDong: 'đến hạn hoàn thành hợp đồng', khac: 'mốc tự thêm' };

// ---------- nạp TINH_TOAN từ hopdong.html ----------
function napTinhToan() {
  const L = fs.readFileSync(path.join(__dirname, '..', 'hopdong.html'), 'utf8').split(/\r?\n/);
  const a = L.findIndex(x => x.startsWith('// ===== 6. TINH_TOAN')), b = L.findIndex(x => x.startsWith('// ===== HẾT 6. TINH_TOAN'));
  if (a < 0 || b < 0) throw new Error('Không tìm thấy khối TINH_TOAN trong hopdong.html');
  const ctx = { console }; vm.createContext(ctx);
  vm.runInContext(L.slice(a, b + 1).join('\n') + '\nthis.TINH_TOAN = TINH_TOAN;', ctx);
  return ctx.TINH_TOAN;
}
const T = napTinhToan();

// ---------- tiện ích ngày (giờ Việt Nam) ----------
function homNayVN() { const d = new Date(Date.now() + 7 * 3600 * 1000); return d.toISOString().slice(0, 10); }
function congNgay(ngay, n) { const d = new Date(ngay + 'T00:00:00Z'); d.setUTCDate(d.getUTCDate() + n); return d.toISOString().slice(0, 10); }
function ngayVN(s) { return T.laNgay(s) ? s.slice(8, 10) + '/' + s.slice(5, 7) + '/' + s.slice(0, 4) : ''; }
function khoaNhac(hopDongId, loai, thamChieuId) { return (hopDongId + '__' + loai + '__' + (thamChieuId || 'x')).replace(/[.#$\[\]\/]/g, '_'); }
const cuaAppNay = n => !n.app || n.app === 'hopDong'; // mốc app Công Nợ tạo (app = "congNo") không đụng — quy tắc 17b

// ---------- 2. đồng bộ nhacNho với dữ liệu (bản sao logic dongBoNhacNho trong app) ----------
// dl = {hopDong, phuLuc, baoLanh, nhacNho}; trả về {up, nhacNho} — up là các đường dẫn cần ghi (tương đối gốc hopdong/)
function dongBoNhac(dl, homNay) {
  const hopDong = dl.hopDong || {}, phuLuc = dl.phuLuc || {}, baoLanh = dl.baoLanh || {}, nhacNho = Object.assign({}, dl.nhacNho || {});
  const up = {}, con = new Set();
  Object.keys(hopDong).forEach(id => {
    const h = hopDong[id] || {}; if (h.trangThai === 'biChamDut') return;
    const bl = {}; Object.entries(baoLanh).forEach(([k, b]) => { if (b && typeof b === 'object' && b.hopDongId === id && b.loai !== 'duThau') bl[k] = Object.assign({ id: k }, b); });
    const pl = {}; Object.entries(phuLuc[id] || {}).forEach(([k, p]) => { pl[k] = Object.assign({ id: k }, p); });
    T.cacMoc({ hopDong: Object.assign({ id }, h), phuLuc: pl, baoLanh: bl }).forEach(m => {
      const k = khoaNhac(id, m.loai, m.thamChieuId); con.add(k); const cu = nhacNho[k];
      if (!cu) { nhacNho[k] = up['nhacNho/' + k] = { app: 'hopDong', hopDongId: id, loai: m.loai, thamChieuId: m.thamChieuId || '', loaiBaoLanh: m.loaiBaoLanh || '', ngayMoc: m.ngayMoc, ngayNhacTiep: m.ngayMoc, soLanDaNhac: 0, daXong: false, taoLuc: new Date().toISOString(), taoBoi: 'nhac-han-hopdong' }; }
      else if (cu.ngayMoc !== m.ngayMoc) { up['nhacNho/' + k + '/ngayMoc'] = m.ngayMoc; up['nhacNho/' + k + '/daXong'] = false; up['nhacNho/' + k + '/soLanDaNhac'] = 0; up['nhacNho/' + k + '/lanNhacCuoi'] = null; nhacNho[k] = Object.assign({}, cu, { ngayMoc: m.ngayMoc, daXong: false, soLanDaNhac: 0, lanNhacCuoi: null }); }
    });
  });
  Object.entries(nhacNho).forEach(([k, n]) => { if (n && n.loai !== 'khac' && cuaAppNay(n) && !con.has(k)) { up['nhacNho/' + k] = null; delete nhacNho[k]; } });
  return { up, nhacNho };
}

// ---------- 3. chọn mốc đến hạn hôm nay ----------
// Đến hạn = chưa "Đã xong", còn ≤ 30 ngày (kể cả quá hạn), và chưa nhắc hoặc lần nhắc cuối cách ≥ 5 ngày.
function chonViecNhac(nhacNho, homNay) {
  return Object.entries(nhacNho || {}).map(([id, n]) => Object.assign({ id, conNgay: T.soNgayGiua(homNay, n.ngayMoc) }, n))
    .filter(n => !n.daXong && cuaAppNay(n) && n.conNgay != null && n.conNgay <= CAU_HINH.NHAC_TRUOC_NGAY)
    .filter(n => !T.laNgay(n.lanNhacCuoi) || T.soNgayGiua(n.lanNhacCuoi, homNay) >= CAU_HINH.NHAC_LAP_NGAY)
    .sort((a, b) => a.conNgay - b.conNgay);
}

// Nội dung 1 thông báo (quy tắc 20): "Cầu Trà Ly — hết bảo lãnh thực hiện HĐ sau 12 ngày"
function soanThongBao(n, hopDong) {
  const h = (hopDong || {})[n.hopDongId] || {}; const ten = h.tenGoiThau || h.soHopDong || '(hợp đồng đã xoá)';
  const loai = n.loai === 'hetBaoLanh' ? 'hết ' + (LOAI_BAO_LANH[n.loaiBaoLanh] || 'hạn bảo lãnh') : n.loai === 'khac' ? (n.ghiChu || LOAI_MOC.khac) : (LOAI_MOC[n.loai] || n.loai);
  const khi = n.conNgay < 0 ? 'QUÁ HẠN ' + (-n.conNgay) + ' ngày' : n.conNgay === 0 ? 'HÔM NAY' : 'sau ' + n.conNgay + ' ngày';
  return { title: ten + ' — ' + loai, body: khi + ' (' + ngayVN(n.ngayMoc) + ')' + (n.soLanDaNhac ? ' · đã nhắc ' + n.soLanDaNhac + ' lần' : ''), tag: 'hd-' + n.id };
}
// Gom nếu quá nhiều: tối đa TOI_DA_THONG_BAO − 1 thông báo riêng + 1 dòng gộp
function goiThongBao(ds, hopDong) {
  if (ds.length <= CAU_HINH.TOI_DA_THONG_BAO) return ds.map(n => soanThongBao(n, hopDong));
  const rieng = ds.slice(0, CAU_HINH.TOI_DA_THONG_BAO - 1).map(n => soanThongBao(n, hopDong));
  rieng.push({ title: '📑 Hợp đồng: ' + ds.length + ' việc đến hạn', body: 'và ' + (ds.length - rieng.length) + ' việc khác — mở app, tab Nhắc hạn', tag: 'hd-gop' });
  return rieng;
}
function capNhatSauNhac(ds, homNay) {
  const up = {}; ds.forEach(n => { up['nhacNho/' + n.id + '/soLanDaNhac'] = (Number(n.soLanDaNhac) || 0) + 1; up['nhacNho/' + n.id + '/lanNhacCuoi'] = homNay; up['nhacNho/' + n.id + '/ngayNhacTiep'] = congNgay(homNay, CAU_HINH.NHAC_LAP_NGAY); }); return up;
}

// ---------- vào/ra Firebase qua firebase-tools (không in khoá, không in địa chỉ nhận) ----------
function fb(args) {
  const a = args.concat(['--project', DU_AN]); if (process.env.FIREBASE_TOKEN) a.push('--token', process.env.FIREBASE_TOKEN);
  return execFileSync('firebase', a, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'inherit'] });
}
// Đọc qua FILE tạm (-o): firebase-tools in cảnh báo màu vàng ra stdout trước JSON (vd. cảnh báo --token), đọc stdout sẽ hỏng.
function docNhanh(nhanh) {
  const f = path.join(require('os').tmpdir(), 'nhac-han-' + process.pid + '-' + nhanh.replace(/[^a-zA-Z0-9]/g, '_') + '.json');
  try { fb(['database:get', '/' + nhanh, '-o', f]); const s = fs.readFileSync(f, 'utf8').trim(); return s && s !== 'null' ? JSON.parse(s) : null; }
  finally { try { fs.unlinkSync(f); } catch (e) {} }
}
function ghi(up) { if (!Object.keys(up).length) return; fb(['database:update', '/' + GOC, '--data', JSON.stringify(up), '--force']); }

async function guiPush(dsThongBao, pushSubs, up) {
  const subs = []; Object.entries(pushSubs || {}).forEach(([uid, o]) => Object.entries(o || {}).forEach(([k, s]) => { if (s && typeof s.endpoint === 'string' && s.endpoint.startsWith('https://') && s.keys) subs.push({ uid, k, s }); }));
  if (!subs.length) { console.log('Chưa máy nào đăng ký nhận push (hopdong/pushSubs trống) — không gửi.'); return { sent: 0, failed: 0 }; }
  const webpush = require('web-push');
  const v = docNhanh('fn-secrets/vapid379') || {};
  if (!v.publicKey || !v.privateKey) throw new Error('Thiếu khoá VAPID (fn-secrets/vapid379) — hỏi anh Dũng');
  webpush.setVapidDetails(v.subject || 'mailto:vandung0802@gmail.com', v.publicKey, v.privateKey);
  let sent = 0, failed = 0;
  for (const tb of dsThongBao) {
    const payload = JSON.stringify({ title: tb.title, body: tb.body, tag: tb.tag, url: 'https://vandung0802.github.io/Duyet-Chi/hopdong.html' });
    await Promise.all(subs.map(async x => {
      try { await webpush.sendNotification({ endpoint: x.s.endpoint, keys: x.s.keys }, payload, { timeout: 10000 }); sent++; }
      catch (e) { failed++; console.log('Gửi lỗi (mã ' + (e && e.statusCode) + ') tới máy của uid ' + x.uid.slice(0, 6) + '…'); if (e && (e.statusCode === 404 || e.statusCode === 410)) up['pushSubs/' + x.uid + '/' + x.k] = null; }
    }));
  }
  return { sent, failed, mayNhan: subs.length };
}

async function chay() {
  const thu = process.argv.includes('--thu'); const homNay = homNayVN();
  console.log('Nhắc hạn Hợp đồng — ' + homNay + (thu ? ' (CHẠY THỬ: không ghi, không gửi)' : ''));
  const dl = { hopDong: docNhanh(GOC + '/hopDong') || {}, phuLuc: docNhanh(GOC + '/phuLuc') || {}, baoLanh: docNhanh(GOC + '/baoLanh') || {}, nhacNho: docNhanh(GOC + '/nhacNho') || {} };
  const db = dongBoNhac(dl, homNay);
  console.log('Hợp đồng: ' + Object.keys(dl.hopDong).length + ' · mốc đang theo dõi: ' + Object.keys(db.nhacNho).length + ' · cần đồng bộ: ' + Object.keys(db.up).length + ' thay đổi');
  const ds = chonViecNhac(db.nhacNho, homNay);
  const up = Object.assign({}, db.up);
  if (!ds.length) { console.log('Không có việc nào đến hạn hôm nay → không gửi gì.'); if (!thu) ghi(up); return; }
  const tb = goiThongBao(ds, dl.hopDong);
  console.log('  → ' + tb.length + ' thông báo (không in nội dung: log GitHub Actions của repo công khai ai cũng đọc được)');
  if (thu) return;
  const kq = await guiPush(tb, docNhanh(GOC + '/pushSubs'), up);
  console.log('Đã gửi ' + kq.sent + ' thông báo tới ' + (kq.mayNhan || 0) + ' máy, lỗi ' + kq.failed);
  if (kq.sent > 0) Object.assign(up, capNhatSauNhac(ds, homNay)); // chưa gửi được thì mai nhắc lại, không tính là đã nhắc
  ghi(up);
  console.log('Đã ghi ' + Object.keys(up).length + ' thay đổi vào Firebase.');
}

module.exports = { CAU_HINH, khoaNhac, dongBoNhac, chonViecNhac, soanThongBao, goiThongBao, capNhatSauNhac, congNgay, homNayVN };
if (require.main === module) chay().catch(e => { console.error('LỖI: ' + (e && e.message || e)); process.exit(1); });
