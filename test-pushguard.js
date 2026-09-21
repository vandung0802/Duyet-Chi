// Kiểm thử LỚP BẢO VỆ thông báo đẩy (functions/pushGuard.js) — chạy: node test-pushguard.js
// Mỗi nhóm là một KIỂU TẤN CÔNG thật. Sửa pushGuard.js xong PHẢI chạy lại, tất cả phải ĐÚNG.
// LƯU Ý: không viết ký tự điều khiển / escape \u trong file này (công cụ soạn thảo biến thành byte thật,
// git sẽ coi file là nhị phân). Cần ký tự lạ thì dùng String.fromCharCode(mã).
const crypto = require('crypto');
const g = require('./functions/pushGuard');

let pass = true; let n = 0;
function ok(name, cond) { n++; if (!cond) pass = false; console.log((cond ? '  OK  ' : '  SAI ') + name); }
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const big = (ch, len) => new Array(len + 1).join(ch);
const C = (code) => String.fromCharCode(code);

const STRANGER = { authType: 'USER', uid: 'kelaU1D', email: 'hacker@evil.com', profile: { approved: null } };
const UNAPPROVED = { authType: 'USER', uid: 'moiDangKy', email: 'nguoimoi@gmail.com', profile: { approved: null } };
const REVOKED = { authType: 'USER', uid: 'biThuHoi', email: 'cu@gmail.com', profile: { approved: false } };
const APPROVED = { authType: 'USER', uid: 'nhanVien', email: 'nv@gmail.com', profile: { approved: true } };
const DUNG_NO_FLAG = { authType: 'USER', uid: 'dungUid', email: 'VanDung0802@Gmail.com', profile: { approved: null } };
const ADMIN = { authType: 'ADMIN' };
const ANON = { authType: 'UNAUTHENTICATED' };
const ALL = ['dung', 'hien', 'trang', 'kt', 'kh', 'other'];

console.log('== 1. NGUOI LA tu dang ky tai khoan roi ghi vao hang doi ==');
let d = g.authorizeQueueItem({ title: 'Bam vao link nay', body: 'http://lua-dao.com/nhan-thuong', roles: ALL }, STRANGER);
ok('chu lua dao, KHONG co ma 6 so -> CHAN han (khong phai luong dang ky)', !d.ok);
d = g.authorizeQueueItem({ title: 'x: Ke La', body: 'Ma xac nhan: 123456', roles: ALL }, STRANGER);
ok('co ma 6 so, gui toi MOI kenh -> chi con kenh dung', d.ok && eq(d.roles, ['dung']) && d.tier === 'unapproved');
d = g.authorizeQueueItem({ title: 'x', body: '123456', roles: ['hien', 'trang', 'kt'] }, STRANGER);
ok('gui toi nhan vien (khong co dung) -> CHAN', !d.ok);
d = g.authorizeQueueItem({ title: 'x', body: '123456', roles: ALL }, REVOKED);
ok('tai khoan DA BI THU HOI (approved=false) -> cung chi toi duoc Dung', d.ok && eq(d.roles, ['dung']) && d.tier === 'unapproved');

console.log('\n== 2. NOI DUNG cua nguoi chua duyet do MAY CHU SOAN (khong chuyen tiep chu cua ho) ==');
d = g.authorizeQueueItem({ title: 'Dang ky moi: Nguyễn Văn An', body: 'Mã xác nhận: 482913', roles: ['dung'], ts: 1 }, UNAPPROVED);
ok('DUNG goi tin that cua app (luong OTP) -> duoc, con nguyen TEN + MA', d.ok && d.title.indexOf('Nguyễn Văn An') > 0 && d.body.indexOf('482913') > 0);
ok('  kem EMAIL DANG NHAP THAT do Google xac thuc (nguoi gui khong gia duoc)', d.body.indexOf('nguoimoi@gmail.com') > 0);
d = g.authorizeQueueItem({ title: 'KHAN: Ngan hang thong bao http://evil.io/login 0909123456', body: 'Bam http://evil.io ngay! ma 654321 het han', roles: ['dung'] }, STRANGER);
const tenSauKhuon = d.ok ? d.title.slice(d.title.indexOf(':') + 1) : 'LOI';
ok('nhet LINK + so dien thoai vao tieu de -> phan ten chi con CHU CAI (khong so, khong : / .)', d.ok && !/[0-9:/.@]/.test(tenSauKhuon) && tenSauKhuon.length <= g.MAX_NAME + 1);
ok('  noi dung KHONG con chu cua ke tan cong, chi con ma + email that', d.ok && d.body.indexOf('evil.io') < 0 && d.body.indexOf('Bam') < 0 && d.body.indexOf('654321') > 0 && d.body.indexOf('hacker@evil.com') > 0);
d = g.authorizeQueueItem({ title: 'A: ' + big('Tên Rất Dài ', 500), body: '111222', roles: ['dung'] }, STRANGER);
ok('ten dai 6000 ky tu -> cat con <= 40', d.ok && g.safeName('A: ' + big('Tên Rất Dài ', 500)).length <= g.MAX_NAME);
ok('ma 7 so / 5 so -> khong tinh la ma 6 so', !g.composeUnapproved({ title: 'x', body: '1234567' }, 'a@b.c') && !g.composeUnapproved({ title: 'x', body: '12345' }, 'a@b.c'));
ok('body khong phai chuoi -> null', g.composeUnapproved({ title: 'x', body: { a: 1 } }, 'a@b.c') === null);
ok('email nguoi gui rong -> van soan duoc, ghi "khong ro email"', g.composeUnapproved({ title: 'x: An', body: '123456' }, '').body.indexOf('không rõ email') > 0);

console.log('\n== 3. GIA MAO quyen bang cach nhet truong vao goi tin ==');
d = g.authorizeQueueItem({ title: 'x', roles: ['hien'], authType: 'ADMIN', approved: true, uid: 'dungUid', email: 'vandung0802@gmail.com', tier: 'admin', profile: { approved: true } }, STRANGER);
ok('tu khai authType/approved/email trong goi tin -> van CHAN', !d.ok);
d = g.authorizeQueueItem({ title: 'x', roles: ['hien'] }, { authType: 'USER', uid: 'u', email: 'vandung0802@gmail.com.evil.com', profile: null });
ok('email gan giong email Dung -> van la nguoi la', !d.ok);
d = g.authorizeQueueItem({ title: 'x', roles: ['hien'] }, { authType: 'USER', uid: 'u', email: null, profile: { approved: 'true' } });
ok('approved la CHUOI "true" (khong phai boolean) -> khong tinh', !d.ok);
d = g.authorizeQueueItem({ title: 'x', roles: ['hien'] }, { authType: 'USER', uid: 'u', email: null, profile: { approved: 1 } });
ok('approved = 1 -> khong tinh', !d.ok);

console.log('\n== 4. Nguoi hop le KHONG bi anh huong ==');
d = g.authorizeQueueItem({ title: 'Phiếu mới cần duyệt', body: 'Mua cát — 1.000.000 đ', roles: ['dung', 'hien', 'trang', 'kt'], ts: 1 }, APPROVED);
ok('nhan vien da duyet gui 4 kenh -> du 4, NGUYEN VAN tieu de + noi dung', d.ok && eq(d.roles, ['dung', 'hien', 'trang', 'kt']) && d.tier === 'approved' && d.title === 'Phiếu mới cần duyệt' && d.body === 'Mua cát — 1.000.000 đ');
d = g.authorizeQueueItem({ title: 'x', roles: ['hien'] }, DUNG_NO_FLAG);
ok('Dung (email co dinh, viet HOA lan lon, chua co co approved) -> duoc', d.ok && d.tier === 'approved');
d = g.authorizeQueueItem({ title: 'x', roles: { 0: 'dung', 1: 'hien' } }, APPROVED);
ok('roles dang object {0:..,1:..} (RTDB luu mang thanh object) -> doc dung', d.ok && eq(d.roles, ['dung', 'hien']));
d = g.authorizeQueueItem({ title: 'x', roles: ['dung'] }, ADMIN);
ok('ghi bang quyen quan tri (Console/CLI) -> duoc', d.ok && d.tier === 'admin');
d = g.authorizeQueueItem({ title: 'Tiêu đề có dấu: ạ ẽ ỡ ữ 🔔', body: 'dòng 1' + C(10) + 'dòng 2', roles: ['kt'] }, APPROVED);
ok('tieng Viet co dau + emoji + xuong dong -> giu nguyen', d.ok && d.title === 'Tiêu đề có dấu: ạ ẽ ỡ ữ 🔔' && d.body === 'dòng 1' + C(10) + 'dòng 2');

console.log('\n== 5. Khong dang nhap / ngu canh bat thuong ==');
ok('UNAUTHENTICATED -> CHAN', !g.authorizeQueueItem({ title: 'x', roles: ['dung'] }, ANON).ok);
ok('sender = null -> CHAN', !g.authorizeQueueItem({ title: 'x', roles: ['dung'] }, null).ok);
ok('authType USER nhung thieu uid -> CHAN', !g.authorizeQueueItem({ title: 'x', roles: ['dung'] }, { authType: 'USER' }).ok);
ok('authType la ("admin" viet thuong) -> CHAN', !g.authorizeQueueItem({ title: 'x', roles: ['dung'] }, { authType: 'admin' }).ok);

console.log('\n== 6. Nhoi du lieu rac ==');
d = g.authorizeQueueItem({ title: big('A', 100000), body: big('B', 500000), roles: ['dung'] }, APPROVED);
ok('tieu de 100.000 ky tu -> cat con 140; noi dung -> 400', d.ok && d.title.length === 140 && d.body.length === 400);
ok('tieu de la object -> CHAN', !g.authorizeQueueItem({ title: { a: 1 }, roles: ['dung'] }, APPROVED).ok);
ok('tieu de la so -> CHAN', !g.authorizeQueueItem({ title: 12345, roles: ['dung'] }, APPROVED).ok);
ok('goi tin null -> CHAN', !g.authorizeQueueItem(null, APPROVED).ok);
ok('goi tin la chuoi -> CHAN', !g.authorizeQueueItem('hack', APPROVED).ok);
d = g.authorizeQueueItem({ title: 'a' + C(0) + 'b' + C(7) + 'c' + C(31) + 'd' + C(127), roles: ['dung'] }, APPROVED);
ok('ky tu dieu khien (0, 7, 31, 127) trong tieu de -> bi loc', d.ok && d.title === 'abcd');
ok('tieu de CHI toan ky tu dieu khien -> coi nhu rong -> CHAN', !g.authorizeQueueItem({ title: C(0) + C(1) + C(2), roles: ['dung'] }, APPROVED).ok);
d = g.authorizeQueueItem({ title: 'x', roles: ['dung', 'DUNG', 'admin', '__proto__', 'constructor', '../hien', 'gb:dung', '', null, 7, {}, ['hien']] }, APPROVED);
ok('kenh la / __proto__ / duong dan / khong phai chuoi -> bo het, chi con dung', d.ok && eq(d.roles, ['dung']));
const many = []; for (let i = 0; i < 5000; i++) many.push('dung', 'hien', 'trang', 'kt', 'kh', 'other');
d = g.authorizeQueueItem({ title: 'x', roles: many }, APPROVED);
ok('30.000 kenh lap lai -> chi xet 64 muc dau, khu trung, toi da 6', d.ok && d.roles.length <= 6);
ok('roles rong -> CHAN', !g.authorizeQueueItem({ title: 'x', roles: [] }, APPROVED).ok);
ok('roles la chuoi "dung" -> CHAN (khong tach ky tu)', !g.authorizeQueueItem({ title: 'x', roles: 'dung' }, APPROVED).ok);
ok('Object.prototype khong bi ban', ({}).polluted === undefined && !Object.prototype.hasOwnProperty.call(Object.prototype, 'approved'));
ok('emoji o dung ranh gioi cat -> khong cat doi ky tu', (function () { const t = g.cleanText(big('a', 139) + '🔔', 140); return t.length === 139; })());

console.log('\n== 7. KHOA sendPush ==');
const KEY = crypto.randomBytes(32).toString('base64url');
const HASH = crypto.createHash('sha256').update(KEY, 'utf8').digest('hex');
ok('khoa dung -> qua', g.keyMatchesHash(KEY, HASH) === true);
ok('sai 1 ky tu cuoi -> chan', g.keyMatchesHash(KEY.slice(0, -1) + (KEY.slice(-1) === 'A' ? 'B' : 'A'), HASH) === false);
ok('khoa rong -> chan', g.keyMatchesHash('', HASH) === false);
ok('khoa ngan (<32) -> chan', g.keyMatchesHash('abc', HASH) === false);
ok('khoa khong lo 1MB -> chan (khong bam)', g.keyMatchesHash(big('k', 1000000), HASH) === false);
ok('gui chinh cai BAM lam khoa -> chan', g.keyMatchesHash(HASH, HASH) === false);
ok('khoa khong phai chuoi (mang/object/null) -> chan', !g.keyMatchesHash([KEY], HASH) && !g.keyMatchesHash({ k: 1 }, HASH) && !g.keyMatchesHash(null, HASH));
ok('may chu CHUA cau hinh khoa (hash null) -> chan', g.keyMatchesHash(KEY, null) === false);
ok('hash hong / rong / viet HOA -> chan', !g.keyMatchesHash(KEY, '') && !g.keyMatchesHash(KEY, 'zz') && !g.keyMatchesHash(KEY, HASH.toUpperCase()));
ok('header x-push-key', g.keyFromHeaders({ 'x-push-key': ' ' + KEY + ' ' }) === KEY);
ok('header Authorization: Bearer', g.keyFromHeaders({ authorization: 'Bearer ' + KEY }) === KEY);
ok('khong co header -> rong', g.keyFromHeaders({}) === '' && g.keyFromHeaders(null) === '');
ok('header la MANG (gui trung 2 lan) -> rong, khong vo', g.keyFromHeaders({ 'x-push-key': [KEY, KEY] }) === '');
ok('Authorization: Basic ... -> rong', g.keyFromHeaders({ authorization: 'Basic ' + KEY }) === '');

console.log('\n== 8. Khoa gui thu Telegram (so thoi-gian-hang) ==');
ok('giong nhau -> true', g.secretEquals('abc123', 'abc123') === true);
ok('khac nhau -> false', g.secretEquals('abc124', 'abc123') === false);
ok('khoa may chu rong/thieu -> LUON false (khong "mo cua" khi chua cau hinh)', !g.secretEquals('', '') && !g.secretEquals('x', '') && !g.secretEquals('x', null) && !g.secretEquals(undefined, undefined));
ok('dau vao khong phai chuoi -> false', !g.secretEquals(['abc123'], 'abc123') && !g.secretEquals({}, 'abc123'));
ok('dau vao khong lo -> false (khong bam)', g.secretEquals(big('x', 100000), 'abc123') === false);

console.log('\n== 9. Gioi han tan suat ==');
const W = 600000;
let st = null; const t0 = 1000000;
for (let i = 0; i < 5; i++) st = g.nextRateState(st, t0 + i * 1000, W);
ok('5 lan trong cua so -> dem 5', st.count === 5 && st.start === t0);
ok('nguoi chua duyet: lan thu 5 VUOT han muc 4', st.count > g.RATE.unapproved.limit);
st = g.nextRateState(st, t0 + W, W);
ok('het cua so -> dem lai tu 1', st.count === 1 && st.start === t0 + W);
// VONG 2: now < start la chuyen THAT (now chup truoc transaction, lenh thua luot chay lai tren trang thai moi hon)
// -> phai GIU so da dem, khong duoc dat lai ve 1
ok('now < start -> GIU so dem (99 -> 100), lui start ve now', (() => { const r = g.nextRateState({ start: 5000, count: 99 }, 1000, W); return r.count === 100 && r.start === 1000; })());
ok('4 lenh dong thoi dau cua so (now = 1005,1004,1003,1000) -> dem du 4', (() => { let x = null; [1005, 1004, 1003, 1000].forEach((n) => { x = g.nextRateState(x, n, W); }); return x.count === 4; })());
ok('chua duyet: cua so 1 GIO, 4 tin', g.RATE.unapproved.limit === 4 && g.RATE.unapproved.windowMs === 3600000);
ok('email CHUA xac minh -> thong bao ghi ro canh bao', g.composeUnapproved({ title: 'x: An', body: '123456' }, 'a@b.c').body.indexOf('CHƯA xác minh') > 0 && g.composeUnapproved({ title: 'x: An', body: '123456' }, 'a@b.c', false).body.indexOf('CHƯA xác minh') > 0);
ok('email DA xac minh -> khong canh bao', g.composeUnapproved({ title: 'x: An', body: '123456' }, 'a@b.c', true).body.indexOf('CHƯA') < 0);
ok('emailVerified phai dung la true (chuoi "true" khong tinh)', g.composeUnapproved({ title: 'x: An', body: '123456' }, 'a@b.c', 'true').body.indexOf('CHƯA xác minh') > 0);
ok('authorize truyen emailVerified tu sender', g.authorizeQueueItem({ title: 'Dang ky: An', body: 'ma 123456', roles: ['dung'] }, { authType: 'USER', uid: 'u1', email: 'a@b.c', emailVerified: true, profile: { approved: null } }).body.indexOf('đã xác minh') > 0);
ok('trang thai hong (chuoi/thieu truong) -> dem lai', g.nextRateState('rac', t0, W).count === 1 && g.nextRateState({ start: 'x', count: 'y' }, t0, W).count === 1);
ok('han muc nguoi da duyet du rong cho duyet don (>=100/10 phut)', g.RATE.approved.limit >= 100);
ok('CO tran chung cho ca nhom chua duyet (chong tao hang loat tai khoan)', g.RATE.unapprovedGlobal && g.RATE.unapprovedGlobal.limit <= 30 && g.RATE.unapprovedGlobal.windowMs >= 3600000);

console.log('\n== 10. Cong tac enforce/monitor CO HAN DUNG ==');
const NOW = 2000000000000;
ok('thieu / null -> enforce', g.resolveAuthMode(null, NOW) === 'enforce' && g.resolveAuthMode(undefined, NOW) === 'enforce');
ok('chuoi "monitor" tran (khong co han) -> enforce (khong the quen bat lai)', g.resolveAuthMode('monitor', NOW) === 'enforce');
ok('{mode:monitor, until: +1 gio} -> monitor', g.resolveAuthMode({ mode: 'monitor', until: NOW + 3600000 }, NOW) === 'monitor');
ok('het han -> tu ve enforce', g.resolveAuthMode({ mode: 'monitor', until: NOW - 1 }, NOW) === 'enforce');
ok('dat han xa hon 24 gio -> khong nhan, enforce', g.resolveAuthMode({ mode: 'monitor', until: NOW + 25 * 3600000 }, NOW) === 'enforce');
ok('until khong phai so -> enforce', g.resolveAuthMode({ mode: 'monitor', until: '9999999999999' }, NOW) === 'enforce');

console.log(pass ? '\n*** TAT CA ' + n + ' PHEP THU DUNG ***' : '\n*** CO LOI ***');
process.exit(pass ? 0 : 1);
