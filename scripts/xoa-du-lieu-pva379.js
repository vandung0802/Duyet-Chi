// XOÁ DỮ LIỆU app PVA-379 (/pva379) → SỔ MỚI — D chốt 25/11/2026: "xóa toàn bộ dữ liệu của app PVA-379 thành sổ mới
// và không link từ duyệt chi sang nữa. để tôi quyết toán sổ cũ và làm sổ mới".
// Chạy trên GitHub Actions (workflow xoa-du-lieu-pva379.yml) bằng FIREBASE_TOKEN hoặc GOOGLE_APPLICATION_CREDENTIALS
// (cùng chìa khoá với tác vụ đưa luật lên; KHÔNG có khoá nào trong repo).
//
//   node scripts/xoa-du-lieu-pva379.js          → CHẠY THỬ: chỉ đếm + in, không xoá gì
//   node scripts/xoa-du-lieu-pva379.js --xoa    → xoá thật
//
// XOÁ (phần giao dịch): proposals, images, khProposals, khImages, khChat*, groupChat, chatPin, chatRead, plans,
//   salaryAdvances, cashflow, bankBalance, advPeople, trash, pendingOtp, online, meta/cashStart, meta/copiedFrom,
//   và số dư đầu kỳ (meta/accounts/<tk>/open) — kế toán nhập lại theo ngày bắt đầu sổ mới.
// GIỮ (phần cấu hình): userRoles (tài khoản đăng nhập + vai do Dũng cấp), employees (danh sách nhân viên),
//   meta/accounts (tên tài khoản, nhóm công ty, thứ tự, ẩn), meta/accountsSeeded, meta/persons, meta/sites,
//   meta/sheetUrl / telegram… (cài đặt kết nối).
// AN TOÀN: CHỈ ghi dưới /pva379/ (hàm kiemDich chặn mọi đường khác). KHÔNG đọc, KHÔNG ghi /duyetchi, Gia Bình,
//   push-subs, push-queue hay bất kỳ nhánh gốc nào khác.
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');

const DU_AN = process.env.FB_PROJECT || 'duyetchi-pva379';   // FB_PROJECT chỉ để thử trên emulator
const DICH = 'pva379';
const XOA = process.argv.includes('--xoa');
const NHANH_XOA = ['proposals', 'images', 'khProposals', 'khImages', 'khChat', 'khChatPin', 'khChatRead',
  'groupChat', 'chatPin', 'chatRead', 'plans', 'salaryAdvances', 'cashflow', 'bankBalance', 'advPeople', 'trash',
  'pendingOtp', 'online'];
const META_XOA = ['cashStart', 'copiedFrom'];
const GIU = ['userRoles', 'employees', 'meta/accounts (tên, nhóm, thứ tự, ẩn)', 'meta/accountsSeeded', 'meta/persons', 'meta/sites', 'meta/sheetUrl, telegram…'];

// Máy chủ thật: qua firebase-tools. Thử trên emulator (FIREBASE_DATABASE_EMULATOR_HOST=127.0.0.1:9000): REST thẳng
// với quyền admin của emulator (firebase-tools đòi đăng nhập kể cả khi trỏ emulator).
const EMU = process.env.FIREBASE_DATABASE_EMULATOR_HOST || '';
function fb(args) {
  const a = args.concat(['--project', DU_AN]);
  if (process.env.FIREBASE_TOKEN) a.push('--token', process.env.FIREBASE_TOKEN);
  return execFileSync('firebase', a, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'inherit'] });
}
async function emuRest(method, duongDan, query) {
  const r = await fetch('http://' + EMU + duongDan + '.json?ns=' + DU_AN + '-default-rtdb' + (query || ''), { method, headers: { Authorization: 'Bearer owner' } });
  if (!r.ok) throw new Error('emulator ' + method + ' ' + duongDan + ' → ' + r.status);
  return r.json();
}
function kiemDich(duongDan) {
  if (!duongDan.startsWith('/' + DICH + '/') || /duyetchi|giabinh|gb-|push-/.test(duongDan)) throw new Error('Chỉ được đụng /' + DICH + '/ — bị chặn: ' + duongDan);
}
function tmp(ten) { return path.join(os.tmpdir(), 'xoa-pva379-' + process.pid + '-' + ten.replace(/[^a-zA-Z0-9]/g, '_') + '.json'); }
// Đọc NÔNG (chỉ tên con, không tải nội dung — kho ảnh hàng chục MB). Đọc qua FILE (-o) vì firebase-tools in cảnh báo ra stdout.
async function docNong(duongDan) {
  kiemDich(duongDan);
  if (EMU) return emuRest('GET', duongDan, '&shallow=true');
  const f = tmp('doc' + duongDan);
  try { fb(['database:get', duongDan, '--shallow', '-o', f]); const s = fs.readFileSync(f, 'utf8').trim(); return s && s !== 'null' ? JSON.parse(s) : null; }
  finally { try { fs.unlinkSync(f); } catch (e) {} }
}
async function docDay(duongDan) {
  kiemDich(duongDan);
  if (EMU) return emuRest('GET', duongDan);
  const f = tmp('doc' + duongDan);
  try { fb(['database:get', duongDan, '-o', f]); const s = fs.readFileSync(f, 'utf8').trim(); return s && s !== 'null' ? JSON.parse(s) : null; }
  finally { try { fs.unlinkSync(f); } catch (e) {} }
}
async function xoa(duongDan) { kiemDich(duongDan); if (!XOA) return; if (EMU) return emuRest('DELETE', duongDan); fb(['database:remove', duongDan, '--force']); }
function dem(v) { return v === null || v === undefined ? 0 : (typeof v === 'object' ? Object.keys(v).length : 1); }

(async function main() {
  console.log((XOA ? '' : '[CHẠY THỬ — chỉ đếm, không xoá] ') + 'Xoá dữ liệu /' + DICH + ' → sổ mới (project ' + DU_AN + ')');
  if (EMU) console.log('  (đang trỏ vào emulator ' + EMU + ')');
  const tomTat = {};
  for (const ten of NHANH_XOA) {
    const n = dem(await docNong('/' + DICH + '/' + ten));
    tomTat[ten] = n;
    if (n) await xoa('/' + DICH + '/' + ten);
    console.log('  ' + ten.padEnd(15) + (n ? n + ' mục' + (XOA ? ' → đã xoá' : '') : 'trống'));
  }
  for (const k of META_XOA) {
    const v = await docDay('/' + DICH + '/meta/' + k);
    tomTat['meta/' + k] = v === null || v === undefined ? 0 : 1;
    if (v !== null && v !== undefined) await xoa('/' + DICH + '/meta/' + k);
    console.log('  ' + ('meta/' + k).padEnd(15) + (v === null || v === undefined ? 'trống' : JSON.stringify(v).slice(0, 80) + (XOA ? ' → đã xoá' : '')));
  }
  // Số dư đầu kỳ từng tài khoản: xoá riêng trường open, GIỮ tên/nhóm/thứ tự/ẩn
  const tk = (await docDay('/' + DICH + '/meta/accounts')) || {};
  let coOpen = 0;
  for (const k of Object.keys(tk)) {
    const t = tk[k];
    if (t && typeof t === 'object' && t.open !== undefined && t.open !== null && t.open !== '') { coOpen++; await xoa('/' + DICH + '/meta/accounts/' + k + '/open'); }
  }
  tomTat['meta/accounts.open'] = coOpen;
  console.log('  ' + 'số dư đầu kỳ'.padEnd(15) + (coOpen ? coOpen + '/' + Object.keys(tk).length + ' tài khoản có số' + (XOA ? ' → đã xoá (giữ tên tài khoản)' : '') : 'chưa nhập') + ' — giữ nguyên ' + Object.keys(tk).length + ' tài khoản');
  console.log('  GIỮ NGUYÊN: ' + GIU.join(', '));
  console.log((XOA ? 'XONG — /' + DICH + ' là sổ mới. ' : 'Chạy thử xong — KHÔNG xoá gì. ') + 'Tóm tắt: ' + JSON.stringify(tomTat));
})().catch(e => { console.error('LỖI: ' + (e && e.message || e)); process.exit(1); });
