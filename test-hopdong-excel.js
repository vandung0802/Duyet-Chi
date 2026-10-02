// Kiểm tra các hàm đọc ô Excel của hopdong.html (ngày, tháng, tiền dạng chữ) — tự cắt mã giữa 2 mốc nên sửa file vẫn chạy được.
// Chạy: node test-hopdong-excel.js
const fs = require('fs'), vm = require('vm');
const L = fs.readFileSync(__dirname + '/hopdong.html', 'utf8').split(/\r?\n/);
const a = L.findIndex(x => x.startsWith('function docNgayExcel')), b = L.findIndex(x => x.startsWith('const timKhoa'));
if (a < 0 || b < 0) { console.log('Không tìm thấy khối đọc Excel'); process.exit(1); }
const ctx = { pad: n => String(n).padStart(2, '0'), docTien: s => Number(String(s || '').replace(/[^\d]/g, '')) || 0 }; vm.createContext(ctx);
vm.runInContext(L.slice(a, b).join('\n') + '\nthis.F={docNgayExcel,docThangExcel,docSoExcel,docSoAmExcel};', ctx);
const F = ctx.F; let sai = 0;
const check = (ten, co, muon) => { const ok = JSON.stringify(co) === JSON.stringify(muon); console.log((ok ? '  OK   ' : '  SAI  ') + ten + (ok ? '' : '  có ' + JSON.stringify(co) + ' muốn ' + JSON.stringify(muon))); if (!ok) sai++; };
check('ngày dd/mm/yyyy', F.docNgayExcel('15/01/2026'), '2026-01-15');
check('ngày kiểu Mỹ 1/15/2026 → bị loại', F.docNgayExcel('1/15/2026'), '');
check('ngày 31/02 → bị loại? (chỉ kiểm tháng ≤12, ngày ≤31)', F.docNgayExcel('31/02/2026'), '2026-02-31');
check('số serial Excel 46037', F.docNgayExcel(46037), '2026-01-15');
const D = (y, m, d) => vm.runInContext('new Date(' + y + ',' + m + ',' + d + ')', ctx); // Date phải tạo trong cùng realm với mã (instanceof)
check('Date object', F.docNgayExcel(D(2026, 0, 15)), '2026-01-15');
check('yyyy-mm-dd', F.docNgayExcel('2026-1-5'), '2026-01-05');
check('tháng 10/2026', F.docThangExcel('10/2026'), '2026-10');
check('tháng Excel đổi thành ngày (Date 01/10/2026)', F.docThangExcel(D(2026, 9, 1)), '2026-10');
check('tháng dạng serial', F.docThangExcel(46296), '2026-10');
check('tiền số', F.docSoExcel(12.7), 13);
check('tiền chữ có phần lẻ 1.136.363.636,36', F.docSoExcel('1.136.363.636,36'), 1136363636);
check('tiền chữ 1234.5', F.docSoExcel('1234.5'), 1234);
check('tiền chữ 12.500.000', F.docSoExcel('12.500.000'), 12500000);
check('tiền âm -200.000.000', F.docSoAmExcel('-200.000.000'), -200000000);
check('tiền âm có lẻ -200.000.000,50', F.docSoAmExcel('-200.000.000,50'), -200000000);
console.log(sai ? '\n❌ ' + sai + ' SAI' : '\n✅ Đọc ô Excel đúng'); process.exit(sai ? 1 : 0);
