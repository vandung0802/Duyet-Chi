// Kiểm tra khối 6. TINH_TOAN của hopdong.html bằng MỘT HỢP ĐỒNG THỬ có đủ tạm ứng, thanh toán, phụ lục âm dương,
// hoàn trả tiền giữ, quyết toán (quy tắc 21 trong docs/hopdong/CLAUDE.md). Chạy: node test-hopdong-tinhtoan.js
// Tự tìm khối theo 2 dòng đánh dấu nên sửa hopdong.html bao nhiêu lần test vẫn chạy đúng.
const fs = require('fs'), vm = require('vm');
const L = fs.readFileSync(__dirname + '/hopdong.html', 'utf8').split(/\r?\n/);
const a = L.findIndex(x => x.startsWith('// ===== 6. TINH_TOAN'));
const b = L.findIndex(x => x.startsWith('// ===== HẾT 6. TINH_TOAN'));
if (a < 0 || b < 0) { console.log('Không tìm thấy khối TINH_TOAN'); process.exit(1); }
const ctx = { console }; vm.createContext(ctx);
vm.runInContext(L.slice(a, b + 1).join('\n') + '\nthis.TINH_TOAN = TINH_TOAN;', ctx);
const T = ctx.TINH_TOAN;

let sai = 0;
const tien = n => (typeof n === 'number' ? n.toLocaleString('vi-VN') : JSON.stringify(n));
function check(ten, co, muon) {
  const ok = JSON.stringify(co) === JSON.stringify(muon);
  if (!ok) sai++;
  console.log((ok ? '  OK   ' : '  SAI  ') + ten.padEnd(52) + tien(co) + (ok ? '' : '   <-- mong đợi ' + tien(muon)));
}

// ===== HỢP ĐỒNG THỬ "MẪU" (số liệu bịa để kiểm tra phép tính, KHÔNG phải hợp đồng thật) =====
const hopDong = {
  congTyId: 'PVA', soHopDong: 'MẪU-01/2026', tenGoiThau: 'MẪU – gói thầu thử', trangThai: 'dangThiCong',
  giaTriGoc: 10000000000, ngayHoanThanhHopDong: '2026-12-31',
  baoHanh: { hinhThuc: 'giuTien', ngayNghiemThuBanGiao: '2026-08-31', soThang: 12 },
  quyetToan: {},
  keHoachTienVe: { '2026-04': 2000000000, '2026-08': 2500000000 },
};
const phuLuc = {                                              // 1 phụ lục cộng + gia hạn, 1 phụ lục trừ
  p1: { soPhuLuc: 'PL01', ngayKy: '2026-03-01', loai: 'caHai', giaTriDieuChinh: 500000000, ngayHoanThanhMoi: '2027-03-31' },
  p2: { soPhuLuc: 'PL02', ngayKy: '2026-06-01', loai: 'dieuChinhGia', giaTriDieuChinh: -200000000 },
};
const tamUng = { t1: { dot: 1, ngay: '2026-02-10', soTien: 2000000000 }, t2: { dot: 2, ngay: '2026-05-05', soTien: 1000000000 } };
const thanhToan = {
  d1: { dot: 1, ngayNghiemThu: '2026-04-01', giaTriNghiemThu: 3000000000, soTienDeNghi: 3000000000, thuHoiTamUng: 900000000, giuBaoHanh: 150000000, giuQuyetToan: 100000000, soTienThucNhan: 1850000000, ngayTienVe: '2026-04-15' },
  d2: { dot: 2, ngayNghiemThu: '2026-08-01', giaTriNghiemThu: 4000000000, soTienDeNghi: 4000000000, thuHoiTamUng: 1200000000, giuBaoHanh: 200000000, giuQuyetToan: 150000000, soTienThucNhan: 2450000000, ngayTienVe: '2026-08-20' },
};
const hoanTra = { h1: { loai: 'baoHanh', ngay: '2026-09-01', soTien: 150000000, lyDo: 'phatHanhBaoLanh' } };
const baoLanh = { b1: { id: 'b1', loai: 'thucHienHopDong', nganHang: 'MẪU Bank', soTien: 500000000, ngayPhatHanh: '2026-01-15', ngayHetHan: '2027-01-15' } };

console.log('== 1. Công thức mục 1.5 trên hợp đồng thử ==');
const k = T.tinhHopDong({ hopDong, phuLuc, tamUng, thanhToan, hoanTra });
check('giaTriHienHanh = 10 tỷ + 500 tr − 200 tr', k.giaTriHienHanh, 10300000000);
check('nghiemThuLuyKe = 3 tỷ + 4 tỷ', k.nghiemThuLuyKe, 7000000000);
check('tamUngLuyKe = 2 tỷ + 1 tỷ', k.tamUngLuyKe, 3000000000);
check('thuHoiTamUngLuyKe = 900 tr + 1,2 tỷ', k.thuHoiTamUngLuyKe, 2100000000);
check('tamUngChuaThuHoi = 3 tỷ − 2,1 tỷ', k.tamUngChuaThuHoi, 900000000);
check('thucNhanLuyKe = 1,85 tỷ + 2,45 tỷ', k.thucNhanLuyKe, 4300000000);
check('tienDaVe = tạm ứng + thực nhận', k.tienDaVe, 7300000000);
check('giuBaoHanhDangGiu = 350 tr − 150 tr hoàn trả', k.giuBaoHanhDangGiu, 200000000);
check('giuQuyetToanDangGiu = 250 tr (chưa hoàn)', k.giuQuyetToanDangGiu, 250000000);
check('conPhaiThu = 7 tỷ − 2,1 tỷ − 4,3 tỷ', k.conPhaiThu, 600000000);
check('  trong đó giữ bảo hành', k.conPhaiThuTrongDo.giuBaoHanh, 200000000);
check('  trong đó giữ quyết toán', k.conPhaiThuTrongDo.giuQuyetToan, 250000000);
check('  trong đó khác (= 150 tr đã hoàn trả — xem câu hỏi 3)', k.conPhaiThuTrongDo.khac, 150000000);
check('conLaiChuaNghiemThu = 10,3 tỷ − 7 tỷ', k.conLaiChuaNghiemThu, 3300000000);
check('conLaiChuaThiCong = 0 vì đã bàn giao', k.conLaiChuaThiCong, 0);
check('conLaiChuaThiCong chưa bàn giao, KL nhập tay 8 tỷ → 2,3 tỷ', T.tinhHopDong({ hopDong: { giaTriGoc: 10300000000, khoiLuongDaThucHien: { soTien: 8000000000 } }, thanhToan }).conLaiChuaThiCong, 2300000000);
check('conLaiChuaThiCong không nhập KL → = chưa nghiệm thu', T.tinhHopDong({ hopDong: { giaTriGoc: 10300000000 }, thanhToan }).conLaiChuaThiCong, 3300000000);
check('doanhThuCuoiCung khi CHƯA duyệt QT = giá trị hiện hành', k.doanhThuCuoiCung, 10300000000);
check('ngayHoanThanhHienHanh = phụ lục gia hạn sau cùng', k.ngayHoanThanhHienHanh, '2027-03-31');
check('ngayHetBaoHanh = 31/08/2026 + 12 tháng', k.ngayHetBaoHanh, '2027-08-31');
check('đếm phụ lục / tạm ứng / thanh toán', [k.soPhuLuc, k.soDotTamUng, k.soDotThanhToan], [2, 2, 2]);

console.log('== 2. Quyết toán được duyệt → doanh thu theo giá trị duyệt ==');
const hdQT = Object.assign({}, hopDong, { trangThai: 'choQuyetToan', quyetToan: { ngayNop: '2026-10-01', ngayDuyet: '2026-12-01', giaTriDuyet: 10150000000 } });
check('doanhThuCuoiCung = giaTriDuyet', T.tinhHopDong({ hopDong: hdQT, phuLuc, tamUng, thanhToan, hoanTra }).doanhThuCuoiCung, 10150000000);
check('có ngày duyệt nhưng chưa có số → chưa tính là duyệt', T.daDuyetQuyetToan({ quyetToan: { ngayDuyet: '2026-12-01' } }), false);

console.log('== 3. Ngày tháng ==');
check('31/01 + 1 tháng (năm thường) → 28/02', T.congThang('2026-01-31', 1), '2026-02-28');
check('31/01 + 1 tháng (năm nhuận) → 29/02', T.congThang('2024-01-31', 1), '2024-02-29');
check('15/03 + 24 tháng', T.congThang('2026-03-15', 24), '2028-03-15');
check('ngày rác → rỗng', T.congThang('15/03/2026', 12), '');
check('không có số tháng → không tính ngày hết BH', T.ngayHetBaoHanh('2026-03-15', 0), '');
check('soNgayGiua', T.soNgayGiua('2026-09-29', '2026-10-29'), 30);
check('quý của tháng', [T.quyCua('2026-01-05'), T.quyCua('2026-06-30'), T.quyCua('2026-12-31')], ['2026-Q1', '2026-Q2', '2026-Q4']);

console.log('== 4. Cả 3 công ty loại hợp đồng nội bộ; từng công ty giữ nguyên ==');
const kA = k;                                                                                   // PVA, 10,3 tỷ
const kB = T.tinhHopDong({ hopDong: { congTyId: '379', giaTriGoc: 5000000000, trangThai: 'daXong' } });     // 379, đã xong
const kC = T.tinhHopDong({ hopDong: { congTyId: '279', giaTriGoc: 1000000000, trangThai: 'dangThiCong', noiBo: { co: true, hopDongGocId: 'A' } } }); // 279 nhận khoán nội bộ từ PVA
const caBa = T.tinhTongHop([kA, kB, kC], '');
check('cả 3: số hợp đồng (loại nội bộ)', caBa.soHopDong, 2);
check('cả 3: tổng giá trị hiện hành = 10,3 tỷ + 5 tỷ', caBa.giaTriHienHanh, 15300000000);
check('cả 3: giá trị ĐANG THỰC HIỆN (bỏ hợp đồng đã xong)', caBa.giaTriDangThucHien, 10300000000);
check('cả 3: tiền đã về', caBa.tienDaVe, 7300000000);
check('riêng 279: vẫn tính hợp đồng nội bộ', T.tinhTongHop([kA, kB, kC], '279').giaTriHienHanh, 1000000000);
check('riêng PVA', T.tinhTongHop([kA, kB, kC], 'PVA').conPhaiThu, 600000000);
const kQT = T.tinhHopDong({ hopDong: hdQT, phuLuc, tamUng, thanhToan, hoanTra });
check('chờ quyết toán: đếm + tiền còn đọng', [T.tinhTongHop([kQT, kB], '').soChoQuyetToan, T.tinhTongHop([kQT, kB], '').conDongChoQuyetToan], [1, 600000000]);

console.log('== 5. Dòng tiền kế hoạch / thực tế theo tháng và quý ==');
const du = [{ hopDong, phuLuc, tamUng, thanhToan, hoanTra }];
const theoThang = T.dongTien(du, 'thang', '');
check('tháng: các kỳ có số', theoThang.map(x => x.ky), ['2026-02', '2026-04', '2026-05', '2026-08']);
check('tháng 04: kế hoạch 2 tỷ / thực tế 1,85 tỷ', theoThang.find(x => x.ky === '2026-04'), { ky: '2026-04', keHoach: 2000000000, thucTe: 1850000000 });
check('tháng 02: chỉ có tạm ứng 2 tỷ', theoThang.find(x => x.ky === '2026-02'), { ky: '2026-02', keHoach: 0, thucTe: 2000000000 });
const theoQuy = T.dongTien(du, 'quy', '');
check('quý: Q2 = kế hoạch 2 tỷ / thực tế 1,85 + 1 tỷ', theoQuy.find(x => x.ky === '2026-Q2'), { ky: '2026-Q2', keHoach: 2000000000, thucTe: 2850000000 });
check('quý: Q3 = kế hoạch 2,5 tỷ / thực tế 2,45 tỷ', theoQuy.find(x => x.ky === '2026-Q3'), { ky: '2026-Q3', keHoach: 2500000000, thucTe: 2450000000 });
check('đợt chưa có ngày tiền về → không rơi vào kỳ nào', T.dongTien([{ hopDong: {}, thanhToan: { x: { soTienThucNhan: 1, ngayTienVe: '' } } }], 'thang', '').length, 0);

console.log('== 6. Các mốc cần nhắc ==');
check('mốc: hết bảo lãnh, hết BH, hoàn thành HĐ (xếp theo ngày)', T.cacMoc({ hopDong, phuLuc, tamUng, thanhToan, hoanTra, baoLanh }).map(m => m.loai + ' ' + m.ngayMoc),
  ['hetBaoLanh 2027-01-15', 'hoanThanhHopDong 2027-03-31', 'hetBaoHanh 2027-08-31']);
// (02/10) bảng baoLanh PHẲNG dùng chung với app Công Nợ: chỉ lấy thư có hopDongId trùng, bỏ thư của hợp đồng khác và thư dự thầu
const baoLanhPhang = { b1: { id: 'b1', hopDongId: 'MAU-HD', loai: 'thucHienHopDong', soTien: 500000000, ngayHetHan: '2027-01-15' },
  b2: { id: 'b2', hopDongId: 'HD-KHAC', loai: 'tamUng', soTien: 1, ngayHetHan: '2026-02-01' },
  b3: { id: 'b3', loai: 'duThau', tenGoiThau: 'MẪU dự thầu', soTien: 1, ngayHetHan: '2026-03-01' },
  b4: { id: 'b4', hopDongId: 'MAU-HD', loai: 'baoHanh', soTien: 2, ngayHetHan: '2028-06-30' } };
check('baoLanhCua: lọc đúng thư của hợp đồng (bảng phẳng)', T.baoLanhCua({ hopDong: Object.assign({ id: 'MAU-HD' }, hopDong), baoLanh: baoLanhPhang }).map(b => b.id).join(), 'b1,b4');
check('baoLanhCua: bảng con cũ chưa có hopDongId vẫn nhận', T.baoLanhCua({ hopDong: Object.assign({ id: 'MAU-HD' }, hopDong), baoLanh }).map(b => b.id).join(), 'b1');
check('cacMoc với bảng phẳng: 2 mốc bảo lãnh của đúng hợp đồng', T.cacMoc({ hopDong: Object.assign({ id: 'MAU-HD' }, hopDong), phuLuc, tamUng, thanhToan, hoanTra, baoLanh: baoLanhPhang }).filter(m => m.loai === 'hetBaoLanh').map(m => m.thamChieuId).join(), 'b1,b4');

console.log('== 7. Dữ liệu rác không làm sập ==');
check('không có gì → toàn 0', T.tinhHopDong({}).giaTriHienHanh, 0);
check('chuỗi số / null / undefined', T.tinhHopDong({ hopDong: { giaTriGoc: '1000' }, phuLuc: [null, { giaTriDieuChinh: undefined }, { giaTriDieuChinh: 'abc' }] }).giaTriHienHanh, 1000);
check('mảng thay vì object cũng được', T.tinhHopDong({ tamUng: [{ soTien: 5 }, { soTien: 7 }] }).tamUngLuyKe, 12);

console.log(sai ? '\n❌ ' + sai + ' phép tính SAI' : '\n✅ Tất cả phép tính đúng');
process.exit(sai ? 1 : 0);
