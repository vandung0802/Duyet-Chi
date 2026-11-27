// KIỂM / THÊM CÔNG TRÌNH trong danh sách của app PVA-379 (/pva379/meta/sites) từ máy chủ — D 27/11/2026: "thêm CT Cầu xã ĐA
// trên app, thấy rồi lại mất — bạn thử thêm cho mình". Chạy trên GitHub Actions (workflow cong-trinh.yml) bằng FIREBASE_TOKEN.
//
//   node scripts/cong-trinh.js --kiem "Tên CT"          → đọc danh sách, in SỐ LƯỢNG + có / không có tên này (không in các tên khác)
//   node scripts/cong-trinh.js --them "Tên CT"          → thêm vào cuối danh sách nếu chưa có (không đè, không xoá gì)
//
// AN TOÀN: chỉ đọc / ghi đúng /pva379/meta/sites. Nhật ký công khai → không in tên công trình khác.
'use strict';
const { execFileSync } = require('child_process');
const fs = require('fs'), path = require('path'), os = require('os');
const DU_AN = process.env.FB_PROJECT || 'duyetchi-pva379';
const EMU = process.env.FIREBASE_DATABASE_EMULATOR_HOST || '';
const argv = process.argv.slice(2);
const val = f => { const i = argv.indexOf(f); return i >= 0 ? String(argv[i + 1] || '').trim() : ''; };
const KIEM = val('--kiem'), THEM = val('--them');
const P = '/pva379/meta/sites';
function fb(args) { const a = args.concat(['--project', DU_AN]); if (process.env.FIREBASE_TOKEN) a.push('--token', process.env.FIREBASE_TOKEN); return execFileSync('firebase', a, { encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, stdio: ['ignore', 'pipe', 'inherit'] }); }
async function emuRest(m, body) { const r = await fetch('http://' + EMU + P + '.json?ns=' + DU_AN + '-default-rtdb', { method: m, headers: { Authorization: 'Bearer owner' }, body: body === undefined ? undefined : JSON.stringify(body) }); if (!r.ok) throw new Error('emulator ' + m + ' → ' + r.status); return r.json(); }
function tmp(t) { return path.join(os.tmpdir(), 'ct-' + process.pid + '-' + t + '.json'); }
async function doc() { if (EMU) return emuRest('GET'); const f = tmp('doc'); try { fb(['database:get', P, '-o', f]); const s = fs.readFileSync(f, 'utf8').trim(); return s && s !== 'null' ? JSON.parse(s) : null; } finally { try { fs.unlinkSync(f); } catch (e) {} } }
async function ghi(arr) { if (EMU) return emuRest('PUT', arr); const f = tmp('ghi'); try { fs.writeFileSync(f, JSON.stringify(arr)); fb(['database:set', P, f, '--force']); } finally { try { fs.unlinkSync(f); } catch (e) {} } }
const norm = s => String(s || '').normalize('NFC').trim().toLowerCase().replace(/\s+/g, ' ');
(async function main() {
  const ten = THEM || KIEM; if (!ten) { console.log('Thiếu tên công trình (--kiem / --them).'); process.exit(1); }
  const raw = await doc(); const list = (Array.isArray(raw) ? raw : Object.values(raw || {})).filter(x => typeof x === 'string' && x.trim());
  const co = list.some(x => norm(x) === norm(ten));
  console.log('Danh sách công trình trên máy chủ: ' + list.length + ' mục · "' + ten + '": ' + (co ? 'ĐÃ CÓ' : 'CHƯA CÓ'));
  if (THEM) {
    if (co) { console.log('Không thêm (đã có).'); return; }
    const moi = list.concat([ten.normalize('NFC').trim().replace(/\s+/g, ' ')]);
    await ghi(moi);
    const lai = await doc(); const l2 = (Array.isArray(lai) ? lai : Object.values(lai || {})).filter(Boolean);
    console.log('ĐÃ THÊM → máy chủ nay có ' + l2.length + ' mục · kiểm lại: ' + (l2.some(x => norm(x) === norm(ten)) ? 'CÓ' : 'KHÔNG THẤY (lạ — báo Claude)'));
  }
})().catch(e => { console.error('LỖI: ' + (e && e.message || e)); process.exit(1); });
