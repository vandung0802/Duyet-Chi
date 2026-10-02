// Kiểm tra khối 6. TINH_TOAN của congno.html bằng MỘT KHOẢN VAY THỬ có 2 lần giải ngân, 2 giai đoạn lãi suất,
// 1 lần trả trước hạn — so lãi ước tính với số TÍNH TAY (quy tắc 25 trong docs/hopdong/CLAUDE-cong-no.md).
// Chạy: node test-congno-tinhtoan.js   (tự tìm khối theo 2 dòng đánh dấu nên sửa congno.html bao nhiêu lần test vẫn chạy)
const fs = require('fs'), vm = require('vm');
const L = fs.readFileSync(__dirname + '/congno.html', 'utf8').split(/\r?\n/);
const a = L.findIndex(x => x.startsWith('// ===== 6. TINH_TOAN'));
const b = L.findIndex(x => x.startsWith('// ===== HẾT 6. TINH_TOAN'));
if (a < 0 || b < 0) { console.log('Không tìm thấy khối TINH_TOAN'); process.exit(1); }
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(L.slice(a, b + 1).join('\n') + '\nthis.TINH_TOAN = TINH_TOAN;', ctx);
const T = ctx.TINH_TOAN;

let sai = 0, n = 0;
const tien = x => (typeof x === 'number' ? x.toLocaleString('vi-VN') : JSON.stringify(x));
function check(ten, co, muon) {
  const ok = JSON.stringify(co) === JSON.stringify(muon); n++;
  if (!ok) sai++;
  console.log((ok ? '  OK   ' : '  SAI  ') + ten.padEnd(58) + tien(co) + (ok ? '' : '   <-- mong đợi ' + tien(muon)));
}

// ===== KHOẢN VAY THỬ "MẪU" (số liệu bịa để kiểm tra phép tính, KHÔNG phải khoản vay thật) =====
// Giải ngân: 01/01/2026 1 tỷ; 15/02/2026 500 triệu.  Lãi suất: 9,5% từ 01/01; 10% từ 01/03.
// 20/03 trả trước hạn 300 triệu gốc.  Trả lãi ngày 25 hằng tháng.  Đến hạn 01/07/2026 (một kỳ gốc 1,5 tỷ).
const khoan = () => ({
  soKheUoc: 'MẪU-01', ngayTraLaiTrongThang: 25, ngayDenHan: '2026-07-01', theoDoiLaiTu: '2026-02-01',
  giaiNgan: { g1: { ngay: '2026-01-01', soTien: 1000000000 }, g2: { ngay: '2026-02-15', soTien: 500000000 } },
  laiSuat: { l1: { tuNgay: '2026-01-01', phanTramNam: 9.5 }, l2: { tuNgay: '2026-03-01', phanTramNam: 10 } },
  kyTra: { k1: { ky: 1, ngay: '2026-07-01', goc: 1500000000 } },
  traNo: { t0: { ngay: '2026-02-25', goc: 0, lai: 9400000, kyLai: '2026-02-25' },
           t1: { ngay: '2026-03-20', goc: 300000000, lai: 0, kyTraId: 'k1' } }
});
const A = khoan();

console.log('--- tiện ích ngày ---');
check('congThang 31/01 + 1 tháng', T.congThang('2026-01-31', 1), '2026-02-28');
check('congThang 15/03 + 6 tháng', T.congThang('2026-03-15', 6), '2026-09-15');
check('congNgay 27/02 + 3 ngày', T.congNgay('2026-02-27', 3), '2026-03-02');
check('soNgayGiua 01/01 → 15/02', T.soNgayGiua('2026-01-01', '2026-02-15'), 45);

console.log('--- dư nợ gốc = Σ giải ngân − Σ gốc đã trả ---');
check('duNoGoc hiện tại', T.duNoGoc(A), 1200000000);
check('duNoGoc cuối ngày 14/02 (trước giải ngân 2)', T.duNoGoc(A, '2026-02-14'), 1000000000);
check('duNoGoc cuối ngày 15/02 (đã giải ngân 2)', T.duNoGoc(A, '2026-02-15'), 1500000000);
check('duNoGoc cuối ngày 19/03 (trước trả gốc)', T.duNoGoc(A, '2026-03-19'), 1500000000);
check('duNoGoc cuối ngày 20/03 (đã trả 300tr)', T.duNoGoc(A, '2026-03-20'), 1200000000);

console.log('--- lãi suất áp dụng theo ngày ---');
check('laiSuatTai 31/12/2025 (chưa có)', T.laiSuatTai(A, '2025-12-31'), 0);
check('laiSuatTai 28/02', T.laiSuatTai(A, '2026-02-28'), 9.5);
check('laiSuatTai 01/03 (đổi lãi suất)', T.laiSuatTai(A, '2026-03-01'), 10);

console.log('--- lãi ước tính (TÍNH TAY: dư nợ × lãi suất / 365 × số ngày, từng giai đoạn) ---');
// 01/01→15/02: 45 ngày × 1 tỷ × 9,5%/365      = 11.712.328,77
// 15/02→01/03: 14 ngày × 1,5 tỷ × 9,5%/365    =  5.465.753,42
// 01/03→20/03: 19 ngày × 1,5 tỷ × 10%/365     =  7.808.219,18
// 20/03→01/04: 12 ngày × 1,2 tỷ × 10%/365     =  3.945.205,48     cộng = 28.931.506,85
check('laiUocTinh 01/01 → 01/04 (cả 4 giai đoạn)', T.laiUocTinh(A, '2026-01-01', '2026-04-01'), 28931507);
check('laiUocTinh tháng 1 (31 ngày × 1 tỷ × 9,5%)', T.laiUocTinh(A, '2026-01-01', '2026-02-01'), 8068493);
check('laiUocTinh tháng 2 (14 ngày 1 tỷ + 14 ngày 1,5 tỷ)', T.laiUocTinh(A, '2026-02-01', '2026-03-01'), 9109589);
check('laiUocTinh tháng 3 (19 ngày 1,5 tỷ + 12 ngày 1,2 tỷ, 10%)', T.laiUocTinh(A, '2026-03-01', '2026-04-01'), 11753425);
check('3 tháng cộng lại = cả kỳ (lệch làm tròn ≤ 1 đ)', Math.abs(8068493 + 9109589 + 11753425 - 28931507) <= 1, true);
check('laiUocTinh khoảng rỗng', T.laiUocTinh(A, '2026-03-01', '2026-03-01'), 0);

console.log('--- các kỳ trả lãi: ngày 25 hằng tháng, kỳ cuối = ngày đến hạn ---');
check('cacKyLai cả khoản', T.cacKyLai(A, '2026-12-31').map(k => k.ngay),
  ['2026-01-25', '2026-02-25', '2026-03-25', '2026-04-25', '2026-05-25', '2026-06-25', '2026-07-01']);
check('kỳ 25/01: 24 ngày × 1 tỷ × 9,5%', T.laiUocTinh(A, '2026-01-01', '2026-01-25'), 6246575);
check('kỳ 25/02: 21 ngày 1 tỷ + 10 ngày 1,5 tỷ', T.laiUocTinh(A, '2026-01-25', '2026-02-25'), 9369863);
check('ngày trả lãi 31 → cuối tháng', T.cacKyLai({ giaiNgan: { g: { ngay: '2026-01-15', soTien: 1 } }, ngayTraLaiTrongThang: 31, ngayDenHan: '2026-04-30' }, '2026-12-31').map(k => k.ngay),
  ['2026-01-31', '2026-02-28', '2026-03-31', '2026-04-30']);

console.log('--- lịch phải trả (kỳ chưa trả, kể cả quá hạn) ---');
// kỳ lãi 25/01 trước ngày bắt đầu theo dõi (01/02) → bỏ; kỳ 25/02 đã có dòng trả lãi → tắt; còn kỳ 25/03:
// 25/02→01/03: 4 ngày × 1,5 tỷ × 9,5% = 1.561.643,84; 01/03→20/03: 19 ngày × 1,5 tỷ × 10% = 7.808.219,18; 20/03→25/03: 5 ngày × 1,2 tỷ × 10% = 1.643.835,62
check('lichTra đến 31/03', T.lichTra(A, '2026-03-31').map(x => [x.loai, x.ngay, x.goc, x.laiUoc]), [['lai', '2026-03-25', 0, 11013699]]);
check('lichTra đến 31/07', T.lichTra(A, '2026-07-31').map(x => [x.loai, x.ngay, x.goc, x.laiUoc]), [
  ['lai', '2026-03-25', 0, 11013699], ['lai', '2026-04-25', 0, 10191781], ['lai', '2026-05-25', 0, 9863014], ['lai', '2026-06-25', 0, 10191781],
  ['goc', '2026-07-01', 1200000000, 0], ['lai', '2026-07-01', 0, 1972603]]);

console.log('--- kỳ gốc tự tắt khi trả đủ ---');
check('trả 300tr / kỳ 1,5 tỷ → chưa xong', T.coKyTra(A).k1, { daTra: false, traNoId: '', daTraGoc: 300000000 });
const B = khoan(); B.traNo.t2 = { ngay: '2026-07-01', goc: 1200000000, lai: 1972603, kyTraId: 'k1', kyLai: '2026-07-01' };
check('trả nốt 1,2 tỷ → kỳ đã trả, gắn dòng trả cuối', T.coKyTra(B).k1, { daTra: true, traNoId: 't2', daTraGoc: 1500000000 });

console.log('--- trạng thái (mục 1.5) ---');
check('25/03: còn xa hạn → dangVay', T.trangThai(A, '2026-03-25'), 'dangVay');
check('23/06: còn 8 ngày → dangVay', T.trangThai(A, '2026-06-23'), 'dangVay');
check('24/06: còn 7 ngày → sapDenHan', T.trangThai(A, '2026-06-24'), 'sapDenHan');
check('01/07: đúng hạn → sapDenHan (chưa quá)', T.trangThai(A, '2026-07-01'), 'sapDenHan');
check('02/07: quá hạn chưa trả → quaHan', T.trangThai(A, '2026-07-02'), 'quaHan');
const C = khoan(); C.coCauLai = { co: true };
check('02/07 + kế toán tích cơ cấu lại → coCauLai', T.trangThai(C, '2026-07-02'), 'coCauLai');
B.kyTra.k1.daTra = true;
check('trả hết + kỳ đã trả → daTatToan', T.trangThai(B, '2026-07-02'), 'daTatToan');
check('đã tất toán → không còn kỳ GỐC phải trả', T.lichTra(B, '2026-12-31').filter(x => x.loai === 'goc').length, 0);
check('4 kỳ lãi chưa có dòng trả (25/03→25/06) vẫn còn nhắc', T.lichTra(B, '2026-12-31').map(x => x.ngay), ['2026-03-25', '2026-04-25', '2026-05-25', '2026-06-25']);

console.log('--- bảng số một khoản ---');
const t = T.tinhKhoan(A, '2026-03-25');
check('tongGiaiNgan', t.tongGiaiNgan, 1500000000);
check('gocDaTra', t.gocDaTra, 300000000);
check('duNoGoc', t.duNoGoc, 1200000000);
check('laiDaTra (số thật)', t.laiDaTra, 9400000);
check('laiSuatHienHanh', t.laiSuatHienHanh, 10);
check('gocConTheoLich (khớp dư nợ)', t.gocConTheoLich, 1200000000);
check('laiUocThangNay (tháng 3)', t.laiUocThangNay, 11753425);

console.log('--- bảo lãnh tính vào hạn mức: cùng ngân hàng VÀ cùng công ty, đang hiệu lực (chốt 02/10) ---');
const hmPVA = { nganHangId: 'nh1', congTyVay: 'PVA', soTien: 5000000000 };
const bangBaoLanh = {
  b1: { nganHangId: 'nh1', congTyId: 'PVA', soTien: 200000000, ngayPhatHanh: '2026-01-10', ngayHetHan: '2026-12-31' },  // tính
  b2: { nganHangId: 'nh1', congTyId: '379', soTien: 300000000, ngayPhatHanh: '2026-01-10', ngayHetHan: '2026-12-31' },  // công ty khác → không
  b3: { nganHangId: 'nh2', congTyId: 'PVA', soTien: 400000000, ngayPhatHanh: '2026-01-10', ngayHetHan: '2026-12-31' },  // ngân hàng khác → không
  b4: { nganHangId: 'nh1', congTyId: 'PVA', soTien: 500000000, ngayPhatHanh: '2026-01-10', ngayHetHan: '2026-03-01' },  // đã hết hạn → không
  b5: { nganHangId: 'nh1', congTyId: 'PVA', soTien: 600000000, ngayPhatHanh: '2026-06-01', ngayHetHan: '2026-12-31' },  // chưa phát hành → không
  b6: { nganHang: 'tên gõ tay từ app Hợp Đồng', congTyId: 'PVA', soTien: 700000000, ngayHetHan: '2026-12-31' },         // chưa gắn nganHangId → không
  b7: { nganHangId: 'nh1', congTyId: 'PVA', soTien: 50000000, ngayPhatHanh: '2026-01-10', ngayHetHan: '2026-03-25' }    // hết hạn đúng hôm nay → còn tính
};
check('bảo lãnh của PVA tại nh1 vào 25/03', T.baoLanhCuaHanMuc(hmPVA, bangBaoLanh, '2026-03-25'), 250000000);
check('bảo lãnh của 379 tại nh1', T.baoLanhCuaHanMuc({ nganHangId: 'nh1', congTyVay: '379' }, bangBaoLanh, '2026-03-25'), 300000000);
check('bảng bảo lãnh rỗng', T.baoLanhCuaHanMuc(hmPVA, null, '2026-03-25'), 0);

console.log('--- hạn mức ---');
check('đã dùng, bảo lãnh DÙNG CHUNG hạn mức (200tr)', T.hanMucDaDung({ soTien: 5000000000, hanMucBaoLanhRieng: false }, [A], 200000000), 1400000000);
check('đã dùng, bảo lãnh tách RIÊNG', T.hanMucDaDung({ soTien: 5000000000, hanMucBaoLanhRieng: true }, [A], 200000000), 1200000000);
check('còn trống = hạn mức − đã dùng', T.hanMucConTrong({ soTien: 5000000000 }, 1400000000), 3600000000);

console.log(sai ? '\n❌ ' + sai + '/' + n + ' phép tính SAI' : '\n✅ ' + n + ' phép tính đều đúng');
process.exit(sai ? 1 : 0);
