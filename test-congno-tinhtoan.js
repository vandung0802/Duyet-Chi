// Kiểm tra khối 6. TINH_TOAN của congno.html bằng MỘT KHOẢN VAY THỬ có 2 lần giải ngân, 2 giai đoạn lãi suất,
// 1 lần trả trước hạn — so lãi ước tính với số TÍNH TAY (quy tắc 25 trong docs/hopdong/CLAUDE-cong-no.md).
// Chạy: node test-congno-tinhtoan.js   (tự tìm khối theo 2 dòng đánh dấu nên sửa congno.html bao nhiêu lần test vẫn chạy)
const fs = require('fs'), vm = require('vm');
const L = fs.readFileSync(__dirname + '/congno.html', 'utf8').split(/\r?\n/);
const a = L.findIndex(x => x.startsWith('// ===== 6. TINH_TOAN'));
const b = L.findIndex(x => x.startsWith('// ===== HẾT 7. SINH_LICH'));   // lấy cả khối 6. TINH_TOAN và 7. SINH_LICH (nằm liền nhau)
if (a < 0 || b < 0) { console.log('Không tìm thấy khối TINH_TOAN / SINH_LICH'); process.exit(1); }
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(L.slice(a, b + 1).join('\n') + '\nthis.TINH_TOAN = TINH_TOAN; this.SINH_LICH = SINH_LICH;', ctx);
const T = ctx.TINH_TOAN, S = ctx.SINH_LICH;

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

console.log('--- SINH LỊCH trả gốc vay trung dài hạn (khối 7) ---');
check('1 tỷ / 3 kỳ chia đều, kỳ đầu 31/01 → cuối tháng, kỳ cuối gánh phần lẻ',
  S.sinhLich({ soTien: 1000000000, soKy: 3, ngayTraDau: '2026-01-31' }).map(x => [x.ky, x.ngay, x.goc]),
  [[1, '2026-01-31', 333333333], [2, '2026-02-28', 333333333], [3, '2026-03-31', 333333334]]);
check('1 tỷ / 3 kỳ, mỗi kỳ 400tr → kỳ cuối 200tr',
  S.sinhLich({ soTien: 1000000000, soKy: 3, gocMoiKy: 400000000, ngayTraDau: '2026-03-25' }).map(x => x.goc), [400000000, 400000000, 200000000]);
check('trả gốc 3 tháng một lần, qua năm',
  S.sinhLich({ soTien: 900000000, soKy: 3, kyCachThang: 3, ngayTraDau: '2026-11-15' }).map(x => x.ngay), ['2026-11-15', '2027-02-15', '2027-05-15']);
check('60 kỳ: tổng các kỳ đúng bằng số tiền vay', S.sinhLich({ soTien: 2350000000, soKy: 60, ngayTraDau: '2026-01-25' }).reduce((s, x) => s + x.goc, 0), 2350000000);
check('thiếu số liệu → không sinh', S.sinhLich({ soTien: 0, soKy: 3, ngayTraDau: '2026-01-31' }).length, 0);

console.log('--- KHỚP LỊCH sau trả trước hạn: trừ dần từ các kỳ cuối ---');
// Vay 1,2 tỷ, 3 kỳ × 400tr. Đã trả kỳ 1 (400tr). Dư nợ 800tr.
const D = () => ({ loai: 'daiHan', soTien: 1200000000, giaiNgan: { g: { ngay: '2026-01-01', soTien: 1200000000 } },
  kyTra: { k1: { ky: 1, ngay: '2026-03-25', goc: 400000000, daTra: true }, k2: { ky: 2, ngay: '2026-04-25', goc: 400000000 }, k3: { ky: 3, ngay: '2026-05-25', goc: 400000000 } },
  traNo: { t1: { ngay: '2026-03-25', goc: 400000000, kyTraId: 'k1' } } });
check('lịch đang khớp → không đổi gì', S.khopLich(D()), { sua: {}, xoa: [], thua: 0 });
const D1 = D(); D1.traNo.t2 = { ngay: '2026-04-01', goc: 100000000, traTruocHan: true };   // trả trước 100tr → còn 700tr
check('trả trước 100tr → kỳ cuối còn 300tr', S.khopLich(D1), { sua: { k3: 300000000 }, xoa: [], thua: 0 });
const D2 = D(); D2.traNo.t2 = { ngay: '2026-04-01', goc: 500000000, traTruocHan: true };   // trả trước 500tr → còn 300tr
check('trả trước 500tr → kỳ 2 còn 300tr, bỏ kỳ 3', S.khopLich(D2), { sua: { k2: 300000000 }, xoa: ['k3'], thua: 0 });
const D3 = D(); D3.traNo.t2 = { ngay: '2026-04-10', goc: 100000000, kyTraId: 'k2' };       // trả một phần kỳ 2 (gắn kỳ) → lịch vẫn khớp
check('trả một phần có gắn kỳ → lịch vẫn khớp', S.khopLich(D3), { sua: {}, xoa: [], thua: 0 });
const D4 = D(); D4.soTien = 1500000000;                                                     // hợp đồng tăng 300tr chưa giải ngân → cộng vào kỳ cuối
check('hợp đồng tăng 300tr → cộng vào kỳ cuối', S.khopLich(D4), { sua: { k3: 700000000 }, xoa: [], thua: 0 });
check('chuaGiaiNgan trong bảng số', T.tinhKhoan(D4, '2026-04-01').chuaGiaiNgan, 300000000);
check('khế ước (không có soTien) → chuaGiaiNgan = 0', T.tinhKhoan(A, '2026-03-25').chuaGiaiNgan, 0);

console.log('--- THẤU CHI: số đang dùng = Σ rút − Σ nộp gốc; lãi ước theo số dư từng ngày ---');
// Rút 01/03 200tr; rút 11/03 100tr; nộp gốc 21/03 150tr. Lãi suất 12%/năm. Nộp tiền ngày 25 hằng tháng. Hạn mức 500tr.
const TC = () => ({ hanMuc: 500000000, ngayNopHangThang: 25, theoDoiTu: '2026-03-01',
  laiSuat: { l1: { tuNgay: '2026-01-01', phanTramNam: 12 } },
  giaoDich: { r1: { ngay: '2026-03-01', loai: 'rut', soTien: 200000000 }, r2: { ngay: '2026-03-11', loai: 'rut', soTien: 100000000 },
              n1: { ngay: '2026-03-21', loai: 'nop', soTien: 150000000 } } });
check('thauChiDangDung', T.thauChiDangDung(TC()), 150000000);
check('thauChiDangDung cuối ngày 15/03', T.thauChiDangDung(TC(), '2026-03-15'), 300000000);
// kỳ 25/03 (TÍNH TAY): 10 ngày × 200tr + 10 ngày × 300tr + 4 ngày × 150tr = 5.600tr·ngày × 12%/365 = 1.841.095,89
// kỳ 25/04: 31 ngày × 150tr × 12%/365 = 1.528.767,12
check('lịch nộp hằng tháng đến 30/04', T.lichNopThauChi(TC(), '2026-04-30').map(x => [x.ngay, x.laiUoc]), [['2026-03-25', 1841096], ['2026-04-25', 1528767]]);
const TC1 = TC(); TC1.giaoDich.n2 = { ngay: '2026-03-25', loai: 'nop', soTien: 0, lai: 1850000, kyNop: '2026-03-25' };   // nộp lãi kỳ 25/03 (số thật)
check('nộp gắn kỳ 25/03 → kỳ đó tự tắt, số đang dùng không đổi', [T.lichNopThauChi(TC1, '2026-04-30').map(x => x.ngay), T.thauChiDangDung(TC1)], [['2026-04-25'], 150000000]);
const TC2 = TC(); TC2.theoDoiTu = '2026-04-01';
check('kỳ trước ngày bắt đầu theo dõi → không nhắc', T.lichNopThauChi(TC2, '2026-04-30').map(x => x.ngay), ['2026-04-25']);
const TC3 = TC(); TC3.giaoDich.n3 = { ngay: '2026-03-25', loai: 'nop', soTien: 150000000, kyNop: '2026-03-25' };          // nộp hết gốc
check('nộp hết → tháng sau không còn gì để nhắc', T.lichNopThauChi(TC3, '2026-06-30').length, 0);
const tt = T.tinhThauChi(TC1, '2026-03-26');
check('bảng số thấu chi', [tt.tongRut, tt.tongNop, tt.dangDung, tt.conTrong, tt.laiDaTra, tt.laiSuatHienHanh], [300000000, 150000000, 150000000, 350000000, 1850000, 12]);
// anh Dũng chốt 02/10: có hạn mức mỗi tháng chỉ nộp lãi, có hạn mức phải nộp CẢ GỐC VÀ LÃI (gốc = số đang dùng cuối ngày phải nộp)
const TC4 = TC(); TC4.nopHangThang = 'gocLai';
check('hạn mức nộp cả gốc và lãi: mỗi kỳ có gốc = số đang dùng', T.lichNopThauChi(TC4, '2026-04-30').map(x => [x.ngay, x.goc, x.laiUoc]), [['2026-03-25', 150000000, 1841096], ['2026-04-25', 150000000, 1528767]]);
const TC5 = TC4; TC5.giaoDich.n4 = { ngay: '2026-03-25', loai: 'nop', soTien: 150000000, lai: 1841096, kyNop: '2026-03-25' };
check('nộp đủ gốc + lãi kỳ 25/03 → hết nhắc', T.lichNopThauChi(TC5, '2026-06-30').length, 0);
check('chưa rút lần nào → không có kỳ nộp', T.lichNopThauChi({ hanMuc: 1, ngayNopHangThang: 25, laiSuat: {} }, '2026-12-31').length, 0);

console.log('--- BẢO LÃNH: hiệu lực, ký quỹ đang giữ, kỳ phí tới ---');
const thu = { loai: 'tamUng', soTien: 1000000000, ngayPhatHanh: '2026-01-10', ngayHetHan: '2026-12-31',
  phi: { hinhThuc: 'dinhKy', kyThuPhiThang: 3, soTienMoiKy: 5000000 }, kyQuy: { banDau: 300000000, hoanTra: 0 } };
check('hiệu lực trong hạn', T.baoLanhHieuLuc(thu, '2026-06-01'), true);
check('hết hạn đúng hôm nay vẫn còn hiệu lực', T.baoLanhHieuLuc(thu, '2026-12-31'), true);
check('qua ngày hết hạn → hết hiệu lực', T.baoLanhHieuLuc(thu, '2027-01-01'), false);
check('chưa đến ngày phát hành → chưa hiệu lực', T.baoLanhHieuLuc(thu, '2026-01-09'), false);
// kyQuyDangGiu = ban đầu − Σ giảm trừ − hoàn trả
check('ký quỹ đang giữ: 300tr − 100tr − 50tr', T.kyQuyDangGiu(thu, { a: { soTien: 100000000 }, b: { soTien: 50000000 } }), 150000000);
check('ký quỹ sau khi hoàn nốt', T.kyQuyDangGiu(Object.assign({}, thu, { kyQuy: { banDau: 300000000, hoanTra: 150000000 } }), { a: { soTien: 100000000 }, b: { soTien: 50000000 } }), 0);
check('chưa nộp phí lần nào → kỳ đầu vào ngày phát hành, cho 3 tháng', T.kyPhiToi(thu, null), { ngay: '2026-01-10', kyDen: '2026-04-10', soTien: 5000000 });
check('đã nộp tới 10/04 → kỳ tới 10/04 → 10/07', T.kyPhiToi(thu, { p1: { kyTu: '2026-01-10', kyDen: '2026-04-10', soTien: 5000000 } }), { ngay: '2026-04-10', kyDen: '2026-07-10', soTien: 5000000 });
check('kỳ cuối không vượt ngày hết hạn thư', T.kyPhiToi(thu, { p1: { kyDen: '2026-10-10' } }), { ngay: '2026-10-10', kyDen: '2026-12-31', soTien: 5000000 });
check('đã nộp tới ngày hết hạn → hết kỳ', T.kyPhiToi(thu, { p1: { kyDen: '2026-12-31' } }), null);
check('thư cũ: phí đã nộp đến 10/07 (nhập tay)', T.kyPhiToi(Object.assign({}, thu, { phi: Object.assign({ daNopDen: '2026-07-10' }, thu.phi) }), null).ngay, '2026-07-10');
check('thư thu phí MỘT LẦN → không có kỳ phí', T.kyPhiToi(Object.assign({}, thu, { phi: { hinhThuc: 'motLan' } }), null), null);

console.log(sai ? '\n❌ ' + sai + '/' + n + ' phép tính SAI' : '\n✅ ' + n + ' phép tính đều đúng');
process.exit(sai ? 1 : 0);
