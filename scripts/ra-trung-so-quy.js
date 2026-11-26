// RÀ KHOẢN GHI TRÙNG trong sổ quỹ PVA-379 + xoá đúng bản thừa theo mã — chạy trên GitHub Actions (workflow ra-trung-so-quy.yml).
// D 26/11/2026: "TM nộp Vietin 379 40tr rồi Vietin 379 chuyển cào bóc — Trang làm trùng, xoá đi 1 lần".
//
//   node scripts/ra-trung-so-quy.js                          → RÀ (chỉ đọc): liệt kê nhóm khoản sổ quỹ giống hệt nhau
//                                                               (loại, số tiền, tài khoản, ngày) và phiếu có 2 lần chuyển cùng số cùng ngày
//   node scripts/ra-trung-so-quy.js --xoa-khoan ID1,ID2      → bỏ các khoản sổ quỹ đó vào thùng rác rồi xoá
//   node scripts/ra-trung-so-quy.js --bo-lan-chuyen PID:IDX  → bỏ lần chuyển thứ IDX (0-based) trên phiếu PID (lưu bản sao vào thùng rác),
//                                                               tính lại trạng thái phiếu như nút "Hoàn tác" trong app
//
// Nhật ký Actions công khai → in mã bản ghi, ngày, loại, tên tài khoản, số tiền LÀM TRÒN TRIỆU; KHÔNG in nội dung / người.
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');

const DU_AN = process.env.FB_PROJECT || 'duyetchi-pva379';
const EMU = process.env.FIREBASE_DATABASE_EMULATOR_HOST || '';
const argv = process.argv.slice(2);
const arg = k => { const i = argv.indexOf(k); return i >= 0 ? (argv[i + 1] || '') : ''; };
const XOA_KHOAN = arg('--xoa-khoan').split(',').map(s => s.trim()).filter(Boolean);
const BO_LAN = arg('--bo-lan-chuyen').split(',').map(s => s.trim()).filter(Boolean);
const GHI = XOA_KHOAN.length > 0 || BO_LAN.length > 0;
const SO_TIEN = parseFloat(arg('--so-tien')) || 0;   // rà theo số tiền: mọi khoản sổ quỹ + mọi lần chuyển trên phiếu đúng số tiền này

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
function kiem(p) { if (!/^\/pva379\/(cashflow|proposals|meta\/accounts|trash\/(cashflow|transfer))(\/|$)/.test(p) || /duyetchi|giabinh|gb-|push-/.test(p)) throw new Error('Đường dẫn bị chặn: ' + p); }
function tmp(t) { return path.join(os.tmpdir(), 'ratrung-' + process.pid + '-' + t.replace(/[^a-zA-Z0-9]/g, '_') + '.json'); }
async function doc(p) {
  kiem(p); if (EMU) return emuRest('GET', p);
  const f = tmp('doc' + p);
  try { fb(['database:get', p, '-o', f]); const s = fs.readFileSync(f, 'utf8').trim(); return s && s !== 'null' ? JSON.parse(s) : null; }
  finally { try { fs.unlinkSync(f); } catch (e) {} }
}
async function ghi(p, data) {
  kiem(p); if (EMU) return emuRest('PUT', p, data);
  const f = tmp('ghi' + p);
  try { fs.writeFileSync(f, JSON.stringify(data)); fb(['database:set', p, f, '--force']); }
  finally { try { fs.unlinkSync(f); } catch (e) {} }
}
async function xoa(p) { kiem(p); if (EMU) return emuRest('DELETE', p); fb(['database:remove', p, '--force']); }
const tr = v => (Math.round((+v || 0) / 100000) / 10) + 'tr';

(async function main() {
  console.log((GHI ? '' : '[RÀ — chỉ đọc] ') + 'Sổ quỹ PVA-379 (project ' + DU_AN + ')');
  const acc = (await doc('/pva379/meta/accounts')) || {};
  const ten = k => (acc[k] && (acc[k].group ? acc[k].group + '·' : '') + (acc[k].name || k)) || (k || '?');
  const cf = (await doc('/pva379/cashflow')) || {};
  const pr = (await doc('/pva379/proposals')) || {};

  if (SO_TIEN > 0) {
    console.log('C. Mọi khoản sổ quỹ đúng ' + tr(SO_TIEN) + ':');
    Object.keys(cf).sort((a, b) => (cf[a].ts || 0) - (cf[b].ts || 0)).forEach(k => { const r = cf[k]; if (!r || Math.abs((+r.amount || 0) - SO_TIEN) > 0.5) return;
      console.log('   • ' + k + ' · ' + r.type + (r.kind ? '/' + r.kind : '') + ' · ' + (r.date || '?') + ' · ' + (r.type === 'xfer' ? ten(r.from) + ' → ' + ten(r.to) : 'TK ' + ten(r.acct)) + (r.pending ? ' · chờ H' : '') + ' · ghi ' + new Date(r.ts || 0).toISOString().replace('T', ' ').slice(0, 16) + 'Z'); });
    console.log('D. Mọi lần chuyển trên phiếu đúng ' + tr(SO_TIEN) + ':');
    Object.keys(pr).forEach(pid => { const p = pr[pid]; const t = p && p.transfers; if (!t) return;
      const arr = Array.isArray(t) ? t : Object.keys(t).map(k => t[k]);
      arr.forEach((x, i) => { if (!x || Math.abs((+x.amount || 0) - SO_TIEN) > 0.5) return;
        console.log('   • phiếu ' + pid + ' · lần #' + i + ' · ' + new Date(x.ts || 0).toISOString().replace('T', ' ').slice(0, 16) + 'Z · TK ' + ten(x.acct) + ' · phiếu đề xuất ' + tr(p.amount) + ' · duyệt ' + tr(p.approvedHAmount || 0) + ' · đã chuyển ' + tr(arr.reduce((a, y) => a + (+y.amount || 0), 0)) + ' · ' + arr.length + ' lần · trạng thái ' + p.status); }); });
    console.log('Rà xong — KHÔNG ghi gì.');
    return;
  }
  if (!GHI) {
    // A. khoản sổ quỹ giống hệt nhau
    const nhom = {};
    Object.keys(cf).forEach(k => { const r = cf[k]; if (!r || !r.type) return;
      const key = [r.type, r.kind || '', +r.amount || 0, r.acct || '', r.from || '', r.to || '', r.date || '', r.loanId || ''].join('|');
      (nhom[key] = nhom[key] || []).push(k); });
    const dup = Object.keys(nhom).filter(k => nhom[k].length > 1);
    console.log('A. Khoản sổ quỹ: ' + Object.keys(cf).length + ' khoản · nhóm giống hệt nhau: ' + dup.length);
    dup.forEach(key => { const [type, kind, amount, acct, from, to, date] = key.split('|');
      const ids = nhom[key].sort((a, b) => (cf[a].ts || 0) - (cf[b].ts || 0));
      console.log('   • ' + type + (kind ? '/' + kind : '') + ' · ' + tr(amount) + ' · ' + date + (type === 'xfer' ? ' · ' + ten(from) + ' → ' + ten(to) : ' · TK ' + ten(acct)));
      ids.forEach((id, i) => console.log('       ' + (i ? 'TRÙNG ' : 'gốc   ') + id + ' · ghi lúc ' + new Date(cf[id].ts || 0).toISOString().replace('T', ' ').slice(0, 19) + 'Z')); });
    // B. phiếu có 2 lần chuyển cùng số tiền cùng ngày
    let nB = 0;
    Object.keys(pr).forEach(pid => { const p = pr[pid]; const t = p && p.transfers; if (!t) return;
      const arr = Array.isArray(t) ? t : Object.keys(t).map(k => t[k]);
      const seen = {}; arr.forEach((x, i) => { if (!x) return; const d = new Date(x.ts || 0).toISOString().slice(0, 10); const key = (+x.amount || 0) + '|' + d; (seen[key] = seen[key] || []).push(i); });
      Object.keys(seen).forEach(key => { if (seen[key].length > 1) { nB++; const [amount, d] = key.split('|');
        console.log('B. Phiếu ' + pid + ' · ' + seen[key].length + ' lần chuyển ' + tr(amount) + ' cùng ngày ' + d + ' · chỉ số lần: ' + seen[key].join(', ') + ' · TK: ' + seen[key].map(i => ten(arr[i].acct)).join(', ') + ' · tổng đã chuyển ' + tr(arr.reduce((a, x) => a + (+x.amount || 0), 0)) + ' / duyệt ' + tr(p.approvedHAmount || p.approvedDAmount || p.amount)); } }); });
    if (!nB) console.log('B. Không có phiếu nào có 2 lần chuyển cùng số cùng ngày.');
    console.log('Rà xong — KHÔNG ghi gì. Muốn xoá: --xoa-khoan ID1,ID2 hoặc --bo-lan-chuyen PID:IDX');
    return;
  }
  for (const id of XOA_KHOAN) {
    const r = cf[id]; if (!r) { console.log('  ! Không thấy khoản ' + id + ' — bỏ qua'); continue; }
    await ghi('/pva379/trash/cashflow/' + id, { rec: r, kind: 'cashflow', deletedBy: 'github-actions', deletedByName: 'Tác vụ rà trùng sổ quỹ (D bảo 26/11/2026)', deletedAt: Date.now() });
    await xoa('/pva379/cashflow/' + id);
    console.log('  ✓ đã xoá khoản ' + id + ' (' + r.type + ' · ' + tr(r.amount) + ' · ' + (r.date || '') + ') → thùng rác');
  }
  for (const spec of BO_LAN) {
    const [pid, idxS] = spec.split(':'); const idx = parseInt(idxS, 10);
    const p = pr[pid]; if (!p) { console.log('  ! Không thấy phiếu ' + pid); continue; }
    if (p.costType === 'kyquy') { console.log('  ! Phiếu ' + pid + ' là ký quỹ — không bỏ lần chuyển bằng tác vụ này (làm trong app)'); continue; }
    const t = p.transfers; const arr = Array.isArray(t) ? t.slice() : Object.keys(t || {}).map(k => t[k]);
    if (!(idx >= 0 && idx < arr.length)) { console.log('  ! Phiếu ' + pid + ' không có lần chuyển số ' + idx + ' (có ' + arr.length + ')'); continue; }
    const removed = arr.splice(idx, 1)[0];
    await ghi('/pva379/trash/transfer/' + pid + '_' + idx + '_' + Date.now(), { rec: removed, pid, idx, kind: 'transfer', deletedBy: 'github-actions', deletedByName: 'Tác vụ rà trùng sổ quỹ (D bảo 26/11/2026)', deletedAt: Date.now() });
    const totalLeft = arr.reduce((a, x) => a + (+x.amount || 0), 0);
    const official = +(p.approvedHAmount || 0) || 0;
    let status = p.status;
    if (totalLeft <= 0) status = 'approved'; else if (status === 'transferred' && totalLeft < official - 0.0001) status = 'approved';
    await ghi('/pva379/proposals/' + pid + '/transfers', arr);
    if (status !== p.status) await ghi('/pva379/proposals/' + pid + '/status', status);
    console.log('  ✓ phiếu ' + pid + ': bỏ lần chuyển #' + idx + ' (' + tr(removed.amount) + ') → còn ' + arr.length + ' lần, tổng ' + tr(totalLeft) + (status !== p.status ? ' · trạng thái ' + p.status + ' → ' + status : ''));
  }
  console.log('XONG.');
})().catch(e => { console.error('LỖI: ' + (e && e.message || e)); process.exit(1); });
