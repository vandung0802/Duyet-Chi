#!/usr/bin/env node
// ===== NHẮC HẠN app Công nợ ngân hàng PVA-379-279 — chạy trên GitHub Actions 07:00 giờ Việt Nam mỗi ngày =====
// (.github/workflows/nhac-han-congno.yml). Quy tắc 21–24 trong docs/hopdong/CLAUDE-cong-no.md:
//   • số ngày nhắc trước theo BẢNG trong khối NHAC_HAN của congno.html (trả lãi 5 ngày, trả gốc 10 ngày, hạn mức 60 ngày…)
//   • mốc trả tiền tự tắt khi kế toán nhập dòng trả / nộp; mốc khác tắt khi có người bấm "Đã xong" trong app; quá hạn thì nhắc mỗi ngày
//   • CHỈ gửi khi có việc đến hạn — không có gì thì im lặng
// Làm gì:
//   1. Đọc congNo/ (toàn bộ) và hopdong/baoLanh (bảng thư bảo lãnh dùng chung) bằng firebase-tools
//      (đăng nhập bằng FIREBASE_TOKEN hoặc GOOGLE_APPLICATION_CREDENTIALS — cùng chìa khoá với tác vụ đưa luật lên; KHÔNG có khoá nào trong repo).
//   2. Tính các mốc bằng ĐÚNG khối TINH_TOAN + NHAC_HAN của congno.html (một nguồn duy nhất, không chép lại công thức).
//   3. Gửi web push: người được tích "nhận mọi nhắc hạn" (congNo/nguoiDung/<uid>/nhanTatCa, giám đốc luôn nhận) + kế toán theo dõi của từng khoản.
// Chạy thử không gửi, không ghi:  node scripts/nhac-han-congno.js --thu
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm');
const { execFileSync } = require('child_process');

const DU_AN = 'duyetchi-pva379', GOC = 'congNo', BAO_LANH_CHUNG = 'hopdong/baoLanh';
const TOI_DA_THONG_BAO = 6;   // mỗi người tối đa 6 thông báo/lần, còn lại gộp 1 dòng
const URL_APP = 'https://vandung0802.github.io/Duyet-Chi/congno.html';

// ---------- nạp TINH_TOAN + SINH_LICH + NHAC_HAN từ congno.html ----------
function napKhoi() {
  const L = fs.readFileSync(path.join(__dirname, '..', 'congno.html'), 'utf8').split(/\r?\n/);
  const a = L.findIndex(x => x.startsWith('// ===== 6. TINH_TOAN')), b = L.findIndex(x => x.startsWith('// ===== HẾT NHAC_HAN'));
  if (a < 0 || b < 0) throw new Error('Không tìm thấy khối TINH_TOAN / NHAC_HAN trong congno.html');
  const ctx = { console }; vm.createContext(ctx);
  vm.runInContext(L.slice(a, b + 1).join('\n') + '\nthis.TINH_TOAN = TINH_TOAN; this.NHAC_HAN = NHAC_HAN;', ctx);
  return ctx;
}
const { NHAC_HAN } = napKhoi();

function homNayVN() { return new Date(Date.now() + 7 * 3600 * 1000).toISOString().slice(0, 10); }

// ---------- chọn việc phải gửi hôm nay, chia theo người nhận ----------
// congNo = toàn bộ nhánh congNo; blChung = hopdong/baoLanh. Trả về { moc: [mốc gửi hôm nay], theoNguoi: {uid: [mốc]} }
function chonViecNhac(congNo, blChung, homNay) {
  const c = congNo || {};
  const du = { nganHang: c.nganHang, hanMuc: c.hanMuc, khoanVay: c.khoanVay, thauChi: c.thauChi, taiSanBaoDam: c.taiSanBaoDam, phiBaoLanh: c.phiBaoLanh, baoLanh: NHAC_HAN.gopBaoLanh(blChung, c.baoLanh) };
  const daXong = c.nhacNho || {};
  const moc = NHAC_HAN.cacMoc(du, homNay).filter(m => !(daXong[m.khoa] && daXong[m.khoa].daXong) && NHAC_HAN.guiHomNay(m));
  const nhanTatCa = Object.entries(c.nguoiDung || {}).filter(([uid, n]) => n && n.dangHoatDong !== false && (n.vaiTro === 'GD' || n.nhanTatCa === true)).map(([uid]) => uid);
  const theoNguoi = {};
  moc.forEach(m => new Set(nhanTatCa.concat(m.nguoi ? [m.nguoi] : [])).forEach(uid => (theoNguoi[uid] = theoNguoi[uid] || []).push(m)));
  return { moc, theoNguoi };
}
// Gom nếu quá nhiều: tối đa TOI_DA_THONG_BAO − 1 thông báo riêng + 1 dòng gộp
function goiThongBao(ds) {
  if (ds.length <= TOI_DA_THONG_BAO) return ds.map(NHAC_HAN.soanThongBao);
  const rieng = ds.slice(0, TOI_DA_THONG_BAO - 1).map(NHAC_HAN.soanThongBao);
  rieng.push({ title: '🏦 Công nợ: ' + ds.length + ' việc đến hạn', body: 'và ' + (ds.length - rieng.length) + ' việc khác — mở app, mục Nhắc hạn', tag: 'cn-gop' });
  return rieng;
}

// ---------- vào/ra Firebase qua firebase-tools (không in khoá, không in địa chỉ nhận) ----------
function fb(args) {
  const a = args.concat(['--project', DU_AN]); if (process.env.FIREBASE_TOKEN) a.push('--token', process.env.FIREBASE_TOKEN);
  return execFileSync('firebase', a, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'inherit'] });
}
// Đọc qua FILE tạm (-o): firebase-tools in cảnh báo ra stdout trước JSON, đọc stdout sẽ hỏng.
function docNhanh(nhanh) {
  const f = path.join(require('os').tmpdir(), 'nhac-cn-' + process.pid + '-' + nhanh.replace(/[^a-zA-Z0-9]/g, '_') + '.json');
  try { fb(['database:get', '/' + nhanh, '-o', f]); const s = fs.readFileSync(f, 'utf8').trim(); return s && s !== 'null' ? JSON.parse(s) : null; }
  finally { try { fs.unlinkSync(f); } catch (e) {} }
}
function ghi(up) { if (!Object.keys(up).length) return; fb(['database:update', '/' + GOC, '--data', JSON.stringify(up), '--force']); }

async function guiPush(theoNguoi, pushSubs) {
  const up = {}; let sent = 0, failed = 0, may = 0;
  const coMay = Object.keys(theoNguoi).filter(uid => pushSubs && pushSubs[uid]);
  if (!coMay.length) { console.log('Chưa máy nào của người nhận đăng ký push (congNo/pushSubs) — không gửi.'); return { sent, failed, may, up }; }
  const webpush = require('web-push');
  const v = docNhanh('fn-secrets/vapid379') || {};
  if (!v.publicKey || !v.privateKey) throw new Error('Thiếu khoá VAPID (fn-secrets/vapid379) — hỏi anh Dũng');
  webpush.setVapidDetails(v.subject || 'mailto:vandung0802@gmail.com', v.publicKey, v.privateKey);
  for (const uid of coMay) {
    const subs = Object.entries(pushSubs[uid] || {}).filter(([k, s]) => s && typeof s.endpoint === 'string' && s.endpoint.startsWith('https://') && s.keys);
    may += subs.length;
    for (const tb of goiThongBao(theoNguoi[uid])) {
      const payload = JSON.stringify({ title: tb.title, body: tb.body, tag: tb.tag, url: URL_APP });
      await Promise.all(subs.map(async ([k, s]) => {
        try { await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, payload, { timeout: 10000 }); sent++; }
        catch (e) { failed++; console.log('Gửi lỗi (mã ' + (e && e.statusCode) + ') tới máy của uid ' + uid.slice(0, 6) + '…'); if (e && (e.statusCode === 404 || e.statusCode === 410)) up['pushSubs/' + uid + '/' + k] = null; }
      }));
    }
  }
  return { sent, failed, may, up };
}

async function chay() {
  const thu = process.argv.includes('--thu'), homNay = homNayVN();
  console.log('Nhắc hạn Công nợ — ' + homNay + (thu ? ' (CHẠY THỬ: không ghi, không gửi)' : ''));
  const congNo = docNhanh(GOC) || {}, blChung = docNhanh(BAO_LANH_CHUNG) || {};
  const kq = chonViecNhac(congNo, blChung, homNay);
  console.log('Khoản vay: ' + Object.keys(congNo.khoanVay || {}).length + ' · việc gửi hôm nay: ' + kq.moc.length + ' · người nhận: ' + Object.keys(kq.theoNguoi).length);
  if (!kq.moc.length) { console.log('Không có việc nào đến hạn hôm nay → không gửi gì.'); return; }
  console.log('  → ' + kq.moc.length + ' mốc đến hạn (không in nội dung: log GitHub Actions của repo công khai ai cũng đọc được)'); // v16
  if (thu) return;
  const g = await guiPush(kq.theoNguoi, congNo.pushSubs);
  console.log('Đã gửi ' + g.sent + ' thông báo tới ' + g.may + ' máy, lỗi ' + g.failed);
  ghi(g.up);   // chỉ dọn các đăng ký push đã chết
}

module.exports = { chonViecNhac, goiThongBao, homNayVN };
if (require.main === module) chay().catch(e => { console.error('LỖI: ' + (e && e.message || e)); process.exit(1); });
