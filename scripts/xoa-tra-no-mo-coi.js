// XOÁ LẦN TRẢ NỢ "MỒ CÔI" trong sổ quỹ PVA-379 (/pva379/cashflow): bản ghi type 'repay' mà khoản vay (loanId) không còn
// (khoản vay đã bị xoá / ghi lại). D 26/11/2026: "món 696,9 triệu trả nợ bị trùng — tôi đã xoá khoản vay nhập sai, xoá nốt phần trả".
// Chạy trên GitHub Actions (workflow xoa-tra-no-mo-coi.yml) bằng FIREBASE_TOKEN / GOOGLE_APPLICATION_CREDENTIALS. Không có khoá trong repo.
//
//   node scripts/xoa-tra-no-mo-coi.js         → CHẠY THỬ: chỉ đếm + in, không xoá
//   node scripts/xoa-tra-no-mo-coi.js --xoa   → bỏ vào thùng rác (pva379/trash/cashflow/<id>) rồi xoá khỏi sổ
//
// AN TOÀN: chỉ đọc /pva379/cashflow, chỉ ghi /pva379/trash/cashflow/<id> và xoá /pva379/cashflow/<id> của đúng các bản mồ côi.
// Nhật ký Actions của repo công khai → KHÔNG in nội dung / số tiền, chỉ in mã bản ghi + ngày.
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');

const DU_AN = process.env.FB_PROJECT || 'duyetchi-pva379';
const XOA = process.argv.includes('--xoa');
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
function kiem(duongDan) { if (!/^\/pva379\/(cashflow|trash\/cashflow)(\/|$)/.test(duongDan) || /duyetchi|giabinh|gb-|push-/.test(duongDan)) throw new Error('Đường dẫn bị chặn: ' + duongDan); }
function tmp(t) { return path.join(os.tmpdir(), 'mocoi-' + process.pid + '-' + t.replace(/[^a-zA-Z0-9]/g, '_') + '.json'); }
async function doc(duongDan) {
  kiem(duongDan); if (EMU) return emuRest('GET', duongDan);
  const f = tmp('doc' + duongDan);
  try { fb(['database:get', duongDan, '-o', f]); const s = fs.readFileSync(f, 'utf8').trim(); return s && s !== 'null' ? JSON.parse(s) : null; }
  finally { try { fs.unlinkSync(f); } catch (e) {} }
}
async function ghi(duongDan, data) {
  kiem(duongDan); if (!XOA) return; if (EMU) return emuRest('PUT', duongDan, data);
  const f = tmp('ghi' + duongDan);
  try { fs.writeFileSync(f, JSON.stringify(data)); fb(['database:set', duongDan, f, '--force']); }
  finally { try { fs.unlinkSync(f); } catch (e) {} }
}
async function xoa(duongDan) { kiem(duongDan); if (!XOA) return; if (EMU) return emuRest('DELETE', duongDan); fb(['database:remove', duongDan, '--force']); }

(async function main() {
  console.log((XOA ? '' : '[CHẠY THỬ — chỉ đếm] ') + 'Tìm lần trả nợ không còn khoản vay trong /pva379/cashflow (project ' + DU_AN + ')');
  const cf = (await doc('/pva379/cashflow')) || {};
  const ids = Object.keys(cf);
  const loanIds = new Set(ids.filter(k => cf[k] && cf[k].type === 'loan'));
  const repays = ids.filter(k => cf[k] && cf[k].type === 'repay');
  const moCoi = repays.filter(k => !loanIds.has(cf[k].loanId));
  console.log('  khoản trong sổ: ' + ids.length + ' · khoản vay: ' + loanIds.size + ' · lần trả nợ: ' + repays.length + ' · KHÔNG còn khoản vay: ' + moCoi.length);
  for (const k of moCoi) {
    const r = cf[k];
    console.log('  - ' + k + ' · ngày ' + (r.date || '?') + ' · loanId cũ ' + (r.loanId || '(trống)') + (r.pending ? ' · đang chờ H duyệt' : '') + (XOA ? ' → bỏ vào thùng rác + xoá' : ''));
    if (XOA) {
      await ghi('/pva379/trash/cashflow/' + k, { rec: r, kind: 'cashflow', deletedBy: 'github-actions', deletedByName: 'Tác vụ xoá trả nợ mồ côi (D bảo 26/11/2026)', deletedAt: Date.now() });
      await xoa('/pva379/cashflow/' + k);
    }
  }
  console.log(XOA ? ('XONG — đã xoá ' + moCoi.length + ' lần trả nợ mồ côi (có trong Thùng rác, Dũng khôi phục được).') : 'Chạy thử xong — KHÔNG xoá gì.');
})().catch(e => { console.error('LỖI: ' + (e && e.message || e)); process.exit(1); });
