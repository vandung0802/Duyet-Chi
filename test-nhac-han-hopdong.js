// Kiểm tra logic kịch bản nhắc hạn (scripts/nhac-han-hopdong.js) bằng dữ liệu MẪU, không đụng Firebase. Chạy: node test-nhac-han-hopdong.js
const N = require('./scripts/nhac-han-hopdong.js');
let sai = 0; const check = (ten, co, muon) => { const ok = JSON.stringify(co) === JSON.stringify(muon); console.log((ok ? '  OK   ' : '  SAI  ') + ten + (ok ? '' : '\n         có: ' + JSON.stringify(co) + '\n         muốn: ' + JSON.stringify(muon))); if (!ok) sai++; };
const homNay = '2026-10-02';
const hopDong = { hd1: { congTyId: 'PVA', soHopDong: 'MẪU-01', tenGoiThau: 'Cầu Trà Ly (MẪU)', trangThai: 'dangThiCong', ngayHoanThanhHopDong: '2026-10-20', baoHanh: { ngayNghiemThuBanGiao: '', soThang: 12 } },
  hd2: { congTyId: '379', soHopDong: 'MẪU-02', tenGoiThau: 'Đường MẪU', trangThai: 'biChamDut', ngayHoanThanhHopDong: '2026-10-05' } };
const phuLuc = { hd1: { p1: { ngayKy: '2026-05-01', ngayHoanThanhMoi: '2026-10-25' } } };
const baoLanh = { b1: { app: 'hopDong', hopDongId: 'hd1', loai: 'thucHienHopDong', ngayHetHan: '2026-10-14' }, b2: { app: 'congNo', hopDongId: 'hd1', loai: 'tamUng', ngayHetHan: '2027-03-01' },
  b3: { app: 'congNo', loai: 'duThau', ngayHetHan: '2026-10-03' }, b4: { hopDongId: 'hd2', loai: 'baoHanh', ngayHetHan: '2026-10-03' } };

console.log('== 1. Đồng bộ mốc nhắc từ dữ liệu ==');
const d1 = N.dongBoNhac({ hopDong, phuLuc, baoLanh, nhacNho: { 'hd1__hoanThanhHopDong__x': { app: 'hopDong', hopDongId: 'hd1', loai: 'hoanThanhHopDong', ngayMoc: '2026-10-20', soLanDaNhac: 2, lanNhacCuoi: '2026-09-30' }, cu1: { app: 'hopDong', hopDongId: 'hdXoa', loai: 'hetBaoHanh', ngayMoc: '2026-01-01' }, cn1: { app: 'congNo', loai: 'traLai', ngayMoc: '2026-10-03' }, tu1: { app: 'hopDong', hopDongId: 'hd1', loai: 'khac', ngayMoc: '2026-10-10', ghiChu: 'nộp hồ sơ' } } }, homNay);
check('tạo mốc hết bảo lãnh b1 và b2 (cả thư Công Nợ của hợp đồng), bỏ dự thầu, bỏ hợp đồng bị chấm dứt', Object.keys(d1.up).filter(k => /^nhacNho\/hd1__hetBaoLanh__b\d$/.test(k)).sort(), ['nhacNho/hd1__hetBaoLanh__b1', 'nhacNho/hd1__hetBaoLanh__b2']);
check('mốc hoàn thành đổi ngày theo phụ lục (20/10 → 25/10): mở lại, về 0 lần', [d1.up['nhacNho/hd1__hoanThanhHopDong__x/ngayMoc'], d1.up['nhacNho/hd1__hoanThanhHopDong__x/daXong'], d1.up['nhacNho/hd1__hoanThanhHopDong__x/soLanDaNhac']], ['2026-10-25', false, 0]);
check('mốc của hợp đồng đã xoá → xoá; mốc app Công Nợ và mốc tự thêm → giữ', [d1.up['nhacNho/cu1'], 'cn1' in d1.nhacNho, 'tu1' in d1.nhacNho, 'cu1' in d1.nhacNho], [null, true, true, false]);
check('mốc mới có app = hopDong', d1.nhacNho['hd1__hetBaoLanh__b1'].app, 'hopDong');

console.log('== 2. Chọn việc đến hạn ==');
const nhacNho = { a: { app: 'hopDong', hopDongId: 'hd1', loai: 'hetBaoLanh', loaiBaoLanh: 'thucHienHopDong', ngayMoc: '2026-10-14' },            // còn 12 ngày, chưa nhắc → nhắc
  b: { app: 'hopDong', hopDongId: 'hd1', loai: 'hoanThanhHopDong', ngayMoc: '2026-10-25', soLanDaNhac: 1, lanNhacCuoi: '2026-09-30' },   // nhắc cách 2 ngày → chưa
  c: { app: 'hopDong', hopDongId: 'hd1', loai: 'hetBaoHanh', ngayMoc: '2026-09-20', soLanDaNhac: 3, lanNhacCuoi: '2026-09-27' },          // quá hạn 12 ngày, cách 5 ngày → nhắc
  d: { app: 'hopDong', hopDongId: 'hd1', loai: 'hetBaoLanh', ngayMoc: '2026-12-01' },                                                     // còn 60 ngày → chưa
  e: { app: 'hopDong', hopDongId: 'hd1', loai: 'hetBaoLanh', ngayMoc: '2026-10-05', daXong: true },                                       // đã xong → không
  f: { app: 'congNo', loai: 'traLai', ngayMoc: '2026-10-03' },                                                                            // app khác → không
  g: { app: 'hopDong', hopDongId: 'hd1', loai: 'khac', ghiChu: 'nộp hồ sơ hoàn trả BH', ngayMoc: '2026-10-02' } };                        // hôm nay → nhắc
const ds = N.chonViecNhac(nhacNho, homNay);
check('chọn đúng a, c, g; xếp quá hạn trước', ds.map(n => n.id), ['c', 'g', 'a']);
check('không có gì đến hạn → danh sách rỗng (không gửi)', N.chonViecNhac({ d: nhacNho.d, e: nhacNho.e }, homNay), []);

console.log('== 3. Nội dung thông báo ==');
check('quy tắc 20: tên gói thầu — loại — sau N ngày', N.soanThongBao(ds[2], hopDong), { title: 'Cầu Trà Ly (MẪU) — hết bảo lãnh thực hiện HĐ', body: 'sau 12 ngày (14/10/2026)', tag: 'hd-a' });
check('quá hạn + số lần đã nhắc', N.soanThongBao(ds[0], hopDong).body, 'QUÁ HẠN 12 ngày (20/09/2026) · đã nhắc 3 lần');
check('mốc tự thêm: ghi chú làm loại, HÔM NAY', N.soanThongBao(ds[1], hopDong), { title: 'Cầu Trà Ly (MẪU) — nộp hồ sơ hoàn trả BH', body: 'HÔM NAY (02/10/2026)', tag: 'hd-g' });
const nhieu = Array.from({ length: 9 }, (_, i) => Object.assign({ id: 'x' + i, conNgay: i, soLanDaNhac: 0 }, nhacNho.a));
check('9 việc → 5 riêng + 1 gộp', N.goiThongBao(nhieu, hopDong).length, 6);
check('dòng gộp nói rõ còn 4 việc', N.goiThongBao(nhieu, hopDong)[5].body, 'và 4 việc khác — mở app, tab Nhắc hạn');

console.log('== 4. Ghi lại sau khi nhắc ==');
check('tăng số lần, lần nhắc cuối = hôm nay, nhắc tiếp = +5 ngày', N.capNhatSauNhac([ds[0]], homNay), { 'nhacNho/c/soLanDaNhac': 4, 'nhacNho/c/lanNhacCuoi': '2026-10-02', 'nhacNho/c/ngayNhacTiep': '2026-10-07' });
check('cộng ngày qua tháng', N.congNgay('2026-10-30', 5), '2026-11-04');

console.log(sai ? '\n❌ ' + sai + ' kiểm tra SAI' : '\n✅ Kịch bản nhắc hạn đúng');
process.exit(sai ? 1 : 0);
