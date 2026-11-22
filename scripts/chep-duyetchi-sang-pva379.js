// CHÉP DỮ LIỆU app Duyệt Chi (/duyetchi) sang app PVA-379 (/pva379) — cùng project duyetchi-pva379.
// Chạy trên GitHub Actions (workflow chep-du-lieu-pva379.yml) bằng FIREBASE_TOKEN hoặc GOOGLE_APPLICATION_CREDENTIALS
// (cùng chìa khoá với tác vụ đưa luật lên; KHÔNG có khoá nào trong repo). Chạy lại bao nhiêu lần cũng được:
// mỗi nhánh đích bị XOÁ rồi chép lại y nguồn (bản chụp tại thời điểm chạy).
//
//   node scripts/chep-duyetchi-sang-pva379.js --thu   → CHỈ ĐỌC + in số lượng, không ghi gì
//   node scripts/chep-duyetchi-sang-pva379.js         → chép thật (ghi đè các nhánh dưới của /pva379)
//
// AN TOÀN: CHỈ ĐỌC /duyetchi, CHỈ GHI /pva379/... (hàm kiemDich chặn mọi đường ghi khác). KHÔNG chép:
//   - meta/sheetUrl, sheetViewUrl, telegram* (PVA-379 dùng Google Sheet RIÊNG; không bắn Telegram nhóm công ty khi thử)
//   - pendingOtp (mã đăng ký), online (ai đang mở app)
//   - pva379/meta/accounts, accountsSeeded (danh sách tài khoản của PVA-379) và pva379/cashflow, bankBalance, advPeople, trash
//     (sổ quỹ — app Duyệt Chi không có) → GIỮ NGUYÊN.
// Đổi vai: userRoles role 'trang' → 'thuquy' (PVA-379 gọi thủ quỹ là 'thuquy').
// userRoles: tài khoản ĐÃ CÓ bên PVA-379 thì GIỮ NGUYÊN (vai kế toán, phòng, quyền do Dũng cấp riêng trong PVA-379
// không bị chép đè khi chạy lại); chỉ THÊM tài khoản chưa có. Phiếu tạo trong PVA-379 sau lần chép trước thì bị thay
// bằng bản Duyệt Chi (giai đoạn thử chủ ý như vậy) — script in ra số lượng để biết.
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');

const DU_AN = 'duyetchi-pva379';
const NGUON = 'duyetchi', DICH = 'pva379';
const THU = process.argv.includes('--thu');
// Nhánh chép nguyên (cùng tên 2 bên). Thứ tự: nhẹ trước, kho ảnh sau cùng.
const NHANH = ['userRoles', 'proposals', 'khProposals', 'plans', 'employees', 'salaryAdvances',
  'groupChat', 'chatPin', 'chatRead', 'khChat', 'khChatPin', 'khChatRead', 'images', 'khImages'];
const META_CHEP = ['persons', 'sites'];
const CO_BATCH = 12 * 1024 * 1024;   // mỗi lệnh ghi tối đa ~12 MB JSON (kho ảnh chia nhiều lần)

// Máy chủ thật: qua firebase-tools (cần FIREBASE_TOKEN / GOOGLE_APPLICATION_CREDENTIALS).
// Thử trên emulator (FIREBASE_DATABASE_EMULATOR_HOST=127.0.0.1:9000): gọi REST thẳng với quyền admin của emulator
// (firebase-tools đòi đăng nhập kể cả khi trỏ emulator nên không thử được bằng CLI).
const EMU = process.env.FIREBASE_DATABASE_EMULATOR_HOST || '';
function fb(args) {
  const a = args.concat(['--project', DU_AN]);
  if (process.env.FIREBASE_TOKEN) a.push('--token', process.env.FIREBASE_TOKEN);
  return execFileSync('firebase', a, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'inherit'] });
}
async function emuRest(method, duongDan, body) {
  const r = await fetch('http://' + EMU + duongDan + '.json?ns=' + DU_AN + '-default-rtdb', { method, headers: { Authorization: 'Bearer owner' }, body: body === undefined ? undefined : JSON.stringify(body) });
  if (!r.ok) throw new Error('emulator ' + method + ' ' + duongDan + ' → ' + r.status);
  return r.json();
}
function tmp(ten) { return path.join(os.tmpdir(), 'chep-pva379-' + process.pid + '-' + ten.replace(/[^a-zA-Z0-9]/g, '_') + '.json'); }
// Đọc qua FILE (-o): firebase-tools in cảnh báo ra stdout trước JSON, đọc stdout sẽ hỏng.
async function doc(duongDan) {
  if (!duongDan.startsWith('/' + NGUON + '/') && !duongDan.startsWith('/' + DICH + '/')) throw new Error('Chỉ đọc /' + NGUON + '/ hoặc /' + DICH + '/ — bị chặn: ' + duongDan);
  if (EMU) return emuRest('GET', duongDan);
  const f = tmp('doc' + duongDan);
  try { fb(['database:get', duongDan, '-o', f]); const s = fs.readFileSync(f, 'utf8').trim(); return s && s !== 'null' ? JSON.parse(s) : null; }
  finally { try { fs.unlinkSync(f); } catch (e) {} }
}
function kiemDich(duongDan) {
  if (!duongDan.startsWith('/' + DICH + '/') || duongDan.includes(NGUON)) throw new Error('Chỉ ghi /' + DICH + '/ — bị chặn: ' + duongDan);
}
async function xoa(duongDan) { kiemDich(duongDan); if (THU) return; if (EMU) return emuRest('DELETE', duongDan); fb(['database:remove', duongDan, '--force']); }
async function ghiFile(lenh, duongDan, data) {
  kiemDich(duongDan); if (THU) return;
  if (EMU) return emuRest(lenh === 'database:update' ? 'PATCH' : 'PUT', duongDan, data);
  const f = tmp('ghi' + duongDan + Math.random().toString(36).slice(2, 7));
  try { fs.writeFileSync(f, JSON.stringify(data)); fb([lenh, duongDan, f, '--force']); }
  finally { try { fs.unlinkSync(f); } catch (e) {} }
}
// Xoá nhánh đích rồi chép lại; object nhiều con thì chia lô theo cỡ (kho ảnh hàng chục MB)
async function chepNhanh(ten, data) {
  const dich = '/' + DICH + '/' + ten;
  await xoa(dich);
  if (data === null || data === undefined) return { so: 0, lo: 0 };
  if (typeof data !== 'object' || Array.isArray(data)) { await ghiFile('database:set', dich, data); return { so: Array.isArray(data) ? data.length : 1, lo: 1 }; }
  const khoa = Object.keys(data); let lo = {}, co = 2, soLo = 0;
  const day = async () => { if (Object.keys(lo).length) { await ghiFile('database:update', dich, lo); soLo++; lo = {}; co = 2; } };
  for (const k of khoa) {
    const s = JSON.stringify(data[k]).length + k.length + 4;
    if (co + s > CO_BATCH) await day();
    lo[k] = data[k]; co += s;
  }
  await day();
  return { so: khoa.length, lo: soLo };
}
function doiVai(userRoles) {
  let n = 0;
  Object.keys(userRoles || {}).forEach(uid => {
    const u = userRoles[uid];
    if (u && typeof u === 'object' && u.role === 'trang') { u.role = 'thuquy'; n++; }
  });
  return n;
}

(async function main() {
  console.log((THU ? '[CHẠY THỬ — chỉ đọc] ' : '') + 'Chép /' + NGUON + ' → /' + DICH + ' (project ' + DU_AN + ')');
  if (EMU) console.log('  (đang trỏ vào emulator ' + EMU + ')');
  const tomTat = {}; let tongPhieu = 0;
  for (const ten of NHANH) {
    let data = await doc('/' + NGUON + '/' + ten);
    if (ten === 'userRoles') {
      const n = doiVai(data); if (n) console.log('  userRoles: đổi vai trang → thuquy cho ' + n + ' tài khoản');
      const cu = (await doc('/' + DICH + '/userRoles')) || {}; let giu = 0;
      Object.keys(cu).forEach(uid => { if (cu[uid] && typeof cu[uid] === 'object' && cu[uid].role) { data = data || {}; data[uid] = Object.assign({}, data[uid] || {}, cu[uid]); giu++; } });
      if (giu) console.log('  userRoles: giữ nguyên ' + giu + ' tài khoản đã có bên PVA-379 (vai / phòng / quyền do Dũng cấp)');
    }
    if (ten === 'proposals' || ten === 'khProposals') {
      const cu = (await doc('/' + DICH + '/' + ten)) || {}, mocCu = ((await doc('/' + DICH + '/meta/copiedFrom')) || {}).ts || 0;
      const moi = Object.keys(cu).filter(k => cu[k] && (cu[k].ts || 0) > mocCu && !(data && data[k]));
      if (moi.length) console.log('  ' + ten + ': ' + moi.length + ' phiếu tạo trong PVA-379 sau lần chép trước sẽ bị thay bằng bản Duyệt Chi (giai đoạn thử)');
    }
    const r = await chepNhanh(ten, data);
    if (ten === 'proposals') tongPhieu = r.so;
    tomTat[ten] = r.so;
    console.log('  ' + ten.padEnd(15) + (data === null ? 'trống → xoá bên đích' : r.so + ' mục' + (r.lo > 1 ? ' (' + r.lo + ' lô)' : '')));
  }
  for (const k of META_CHEP) {
    const data = await doc('/' + NGUON + '/meta/' + k);
    const r = await chepNhanh('meta/' + k, data);
    tomTat['meta/' + k] = r.so;
    console.log('  ' + ('meta/' + k).padEnd(15) + (data === null ? 'trống' : r.so + ' mục'));
  }
  // Dấu "đã chép lúc nào" để app hiện cho Dũng biết dữ liệu mới tới đâu
  if (!THU) await ghiFile('database:set', '/' + DICH + '/meta/copiedFrom', { ts: Date.now(), nguon: NGUON, proposals: tongPhieu });
  console.log((THU ? 'Chạy thử xong — KHÔNG ghi gì.' : 'XONG. ') + 'Tóm tắt: ' + JSON.stringify(tomTat));
})().catch(e => { console.error('LỖI: ' + (e && e.message || e)); process.exit(1); });
