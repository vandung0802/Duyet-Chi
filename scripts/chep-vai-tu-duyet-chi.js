// CHÉP DANH SÁCH NGƯỜI DÙNG (vai) từ app Duyệt Chi sang app PVA-379 — D 27/11/2026: "cho toàn bộ những người đã vào được
// trên sổ Duyệt Chi cũng đăng nhập vào được sổ này". CHỈ chép hồ sơ tài khoản (/duyetchi/userRoles), KHÔNG chép phiếu / sổ quỹ
// (sổ mới, D chốt 25/11). Cùng project Firebase nên uid giống nhau → người ta đăng nhập Google như cũ là vào.
//
//   node scripts/chep-vai-tu-duyet-chi.js          → CHẠY THỬ: chỉ đếm, không ghi
//   node scripts/chep-vai-tu-duyet-chi.js --chep   → ghi vào /pva379/userRoles/<uid> những uid CHƯA có (không đè ai đã có)
//
// Vai: dung→dung, hien→hien, trang→thuquy (thủ quỹ), ketoan→ketoan, còn lại→other; phòng (dept kehoach/both) giữ nguyên.
// Chỉ chép tài khoản đã được duyệt bên Duyệt Chi (approved=true) hoặc 3 vai dung/hien/trang. Nhật ký công khai → KHÔNG in tên / email.
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const DU_AN = process.env.FB_PROJECT || 'duyetchi-pva379';
const CHEP = process.argv.includes('--chep');
const EMU = process.env.FIREBASE_DATABASE_EMULATOR_HOST || '';
const MAP = { dung:'dung', hien:'hien', trang:'thuquy', thuquy:'thuquy', ketoan:'ketoan' };
function fb(args) {
  const a = args.concat(['--project', DU_AN]);
  if (process.env.FIREBASE_TOKEN) a.push('--token', process.env.FIREBASE_TOKEN);
  return execFileSync('firebase', a, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'inherit'] });
}
async function emuRest(method, p, body) {
  const r = await fetch('http://' + EMU + p + '.json?ns=' + DU_AN + '-default-rtdb', { method, headers: { Authorization: 'Bearer owner' }, body: body === undefined ? undefined : JSON.stringify(body) });
  if (!r.ok) throw new Error('emulator ' + method + ' ' + p + ' → ' + r.status);
  return r.json();
}
function kiemDoc(p) { if (p !== '/duyetchi/userRoles' && p !== '/pva379/userRoles') throw new Error('Đường dẫn đọc bị chặn: ' + p); }
function kiemGhi(p) { if (!/^\/pva379\/userRoles\/[A-Za-z0-9_-]{1,128}$/.test(p)) throw new Error('Đường dẫn ghi bị chặn: ' + p); }
function tmp(t) { return path.join(os.tmpdir(), 'chepvai-' + process.pid + '-' + t.replace(/[^a-zA-Z0-9]/g, '_') + '.json'); }
async function doc(p) {
  kiemDoc(p); if (EMU) return emuRest('GET', p);
  const f = tmp('doc' + p);
  try { fb(['database:get', p, '-o', f]); const s = fs.readFileSync(f, 'utf8').trim(); return s && s !== 'null' ? JSON.parse(s) : null; }
  finally { try { fs.unlinkSync(f); } catch (e) {} }
}
async function ghi(p, data) {
  kiemGhi(p); if (!CHEP) return; if (EMU) return emuRest('PUT', p, data);
  const f = tmp('ghi' + p);
  try { fs.writeFileSync(f, JSON.stringify(data)); fb(['database:set', p, f, '--force']); }
  finally { try { fs.unlinkSync(f); } catch (e) {} }
}
(async function main() {
  console.log((CHEP ? '' : '[CHẠY THỬ — chỉ đếm] ') + 'Chép hồ sơ tài khoản Duyệt Chi → PVA-379 (project ' + DU_AN + ')');
  const src = (await doc('/duyetchi/userRoles')) || {}, dst = (await doc('/pva379/userRoles')) || {};
  const ids = Object.keys(src).filter(k => src[k] && typeof src[k] === 'object');
  const dem = { tong: ids.length, daCo: 0, boQua: 0, chep: 0 }, theoVai = {}, daCoVai = {}, daCoChuaDuyet = {};   // đã có bên PVA-379: đếm theo vai + cờ approved (để biết ai còn bị chặn)
  for (const uid of ids) {
    const u = src[uid], role0 = String(u.role || '');
    const duyet = u.approved === true || ['dung', 'hien', 'trang'].indexOf(role0) >= 0;
    if (!duyet) { dem.boQua++; continue; }                 // chưa được duyệt bên Duyệt Chi → không chép
    if (dst[uid] && typeof dst[uid] === 'object' && dst[uid].role) {   // đã có bên PVA-379 → giữ nguyên
      const rv = String(dst[uid].role); daCoVai[rv] = (daCoVai[rv] || 0) + 1; if (dst[uid].approved !== true) daCoChuaDuyet[rv] = (daCoChuaDuyet[rv] || 0) + 1;
      dem.daCo++; continue; }
    const role = MAP[role0] || 'other';
    const rec = { role, approved: true, name: typeof u.name === 'string' ? u.name.slice(0, 200) : '', email: typeof u.email === 'string' ? u.email.slice(0, 320) : '' };
    if (u.dept === 'kehoach' || u.dept === 'both') rec.dept = u.dept;
    theoVai[role] = (theoVai[role] || 0) + 1; dem.chep++;
    await ghi('/pva379/userRoles/' + uid, rec);
  }
  console.log('  Duyệt Chi có ' + dem.tong + ' tài khoản · chưa duyệt (bỏ qua) ' + dem.boQua + ' · đã có bên PVA-379 (giữ nguyên) ' + dem.daCo + ' · ' + (CHEP ? 'ĐÃ CHÉP ' : 'sẽ chép ') + dem.chep);
  console.log('  theo vai: ' + (Object.keys(theoVai).sort().map(k => k + ' ' + theoVai[k]).join(' · ') || '(không có)'));
  console.log('  đã có bên PVA-379 theo vai: ' + (Object.keys(daCoVai).sort().map(k => k + ' ' + daCoVai[k] + (daCoChuaDuyet[k] ? ' (CHƯA duyệt ' + daCoChuaDuyet[k] + ')' : '')).join(' · ') || '(không có)'));
  console.log(CHEP ? 'XONG — người được chép đăng nhập Google như ở Duyệt Chi là vào PVA-379 (nếu còn giai đoạn thử thì vai other vẫn bị chặn tới khi phát hành).' : 'Chạy thử xong — KHÔNG ghi gì.');
})().catch(e => { console.error('LỖI: ' + (e && e.message || e)); process.exit(1); });
