/**
 * Cloud Functions — App Duyệt Chi PVA 379
 *
 * baoCaoTelegram6h  : hẹn giờ 6h00 sáng (giờ VN) mỗi ngày, gửi 2 tin bảng kê
 *                     vào nhóm Telegram "Báo cáo hằng ngày".
 * baoCaoTelegramTest: gọi tay bằng URL để gửi thử (có khoá bảo vệ).
 *
 * BẢO MẬT: mã bot + chatId KHÔNG nằm trong file này (repo công khai).
 * Hàm đọc chúng từ Realtime Database: duyetchi/meta/telegramBotToken|telegramChatId
 * — đúng chỗ app3.html đang đọc.
 *
 * LƯU Ý KHI DEPLOY: repo này còn 2 hàm cũ (processPushQueue, sendPush) KHÔNG có
 * source ở đây. Luôn deploy có chọn lọc, đừng deploy cả nhóm:
 *   firebase deploy --only functions:baoCaoTelegram6h,functions:baoCaoTelegramTest
 */
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
admin.initializeApp();

const DB_URL = 'https://duyetchi-pva379-default-rtdb.asia-southeast1.firebasedatabase.app';
// App SỔ QUỸ GIA BÌNH dùng database RIÊNG. Gói Spark bên đó không chạy được Cloud
// Functions nên báo cáo của nó cũng chạy nhờ ở đây — chỉ khác mỗi database đọc vào.
const DB_URL_GB = 'https://so-quy-gia-binh-default-rtdb.asia-southeast1.firebasedatabase.app';
// KHÔNG dùng biến toàn cục để chọn database: 2 hàm có thể chạy chồng nhau trong cùng
// tiến trình → báo cáo đọc nhầm database = báo sai tiền. Truyền thẳng url xuống.
const TG_LIMIT = 4096;      // giới hạn 1 tin nhắn Telegram
const SAFE_LIMIT = 3900;    // chừa chỗ cho phần đầu tin khi phải tách
const NGAY_DA_CHUYEN = 5;   // "đã chuyển" = 5 ngày gần nhất
const MAX_DESC = 400;       // nội dung dài hơn thì cắt (thực tế dài nhất ~130)

// ─────────────────────────── Tiện ích ───────────────────────────

function db(path, url) {
  return admin.app().database(url || DB_URL).ref(path);
}

/** Số chính thức = tổng H duyệt (nếu có), không thì tổng D duyệt. Giống app. */
function soChinhThuc(p) {
  const h = (p.approvedHHistory || []).reduce((a, t) => a + (parseFloat(t.amount) || 0), 0);
  if (h > 0) return h;
  return (p.approvedDHistory || []).reduce((a, t) => a + (parseFloat(t.amount) || 0), 0);
}

/** Tổng đã chuyển. Giống app. */
function daChuyen(p) {
  return (p.transfers || []).reduce((a, t) => a + (parseFloat(t.amount) || 0), 0);
}

/** Ngày hoạt động cuối trên phiếu (tạo / duyệt / chuyển) — app không có updatedAt riêng. */
function hoatDongCuoi(p) {
  let t = p.ts || 0;
  [p.approvedDHistory, p.approvedHHistory, p.transfers].forEach((a) => {
    if (Array.isArray(a) && a.length) {
      const x = a[a.length - 1].ts || 0;
      if (x > t) t = x;
    }
  });
  return t;
}

function tien(n) {
  return Math.round(n).toLocaleString('vi-VN');
}

/** Giờ Việt Nam (UTC+7) — server chạy giờ UTC nên phải tự cộng. */
function gioVN(ts) {
  return new Date((ts || Date.now()) + 7 * 3600 * 1000);
}

function ngayThang(ts) {
  const d = gioVN(ts);
  return ('0' + d.getUTCDate()).slice(-2) + '/' + ('0' + (d.getUTCMonth() + 1)).slice(-2);
}

function ngayDayDu(ts) {
  const d = gioVN(ts);
  return d.getUTCDate() + '/' + (d.getUTCMonth() + 1) + '/' + d.getUTCFullYear();
}

// ─────────────────────────── Gom dữ liệu ───────────────────────────

/**
 * Đọc phiếu chi (duyetchi/proposals) + phiếu P.Kế hoạch (duyetchi/khProposals),
 * bỏ phiếu lương, trả về 2 danh sách: chưa chuyển (toàn bộ tồn) và đã chuyển (5 ngày).
 */
async function layDuLieu(url) {
  // Gia Bình không có nhánh khProposals (đã bỏ P.Kế hoạch) → đọc hụt thì coi như rỗng
  const [snapChi, snapKh] = await Promise.all([
    db('duyetchi/proposals', url).once('value'),
    db('duyetchi/khProposals', url).once('value').catch(() => ({ val: () => null })),
  ]);

  const tatCa = [];
  const chi = snapChi.val() || {};
  Object.keys(chi).forEach((k) => {
    const p = chi[k];
    if (p && p.kind !== 'salary') tatCa.push({ p: p, kh: false });
  });
  const kh = snapKh.val() || {};
  Object.keys(kh).forEach((k) => {
    const p = kh[k];
    if (p) tatCa.push({ p: p, kh: true });
  });

  const chua = [];
  const da = [];
  const moc = Date.now() - NGAY_DA_CHUYEN * 86400000;

  tatCa.forEach((o) => {
    const p = o.p;
    // P.KH để cụm riêng để không cộng lẫn tiền 2 phòng
    const ct = o.kh ? 'P.KH — ' + (p.site || 'Chi phí chung') : (p.site || 'Khác');
    const off = soChinhThuc(p);
    const tr = daChuyen(p);

    if (p.status !== 'rejected' && off > 0 && off - tr > 0.001) {
      chua.push({
        site: ct, desc: p.desc || '', person: p.person || '',
        m1: off, m2: off - tr, cn: hoatDongCuoi(p),
      });
    }

    const ds = Array.isArray(p.transfers) ? p.transfers : [];
    const lanCuoi = ds.length ? (ds[ds.length - 1].ts || 0) : 0;
    if (tr > 0.001 && lanCuoi >= moc) {
      da.push({
        site: ct, desc: p.desc || '', person: p.person || '',
        m1: tr, m2: Math.max(0, off - tr), cn: lanCuoi,
      });
    }
  });

  return { chua: chua, da: da };
}

// ─────────────────────────── Dựng chữ ───────────────────────────

/**
 * Dựng phần thân bảng kê: gom theo công trường (A→Z), trong mỗi công trường xếp
 * theo ngày cũ → mới, có dòng cộng từng công trường và tổng cộng cuối.
 */
function thanBang(rows, nhan) {
  if (!rows.length) return 'Không có khoản nào 🎉\n';

  const nhom = {};
  rows.forEach((r) => { (nhom[r.site] = nhom[r.site] || []).push(r); });
  const ten = Object.keys(nhom).sort((a, b) => a.localeCompare(b, 'vi'));

  let s = '';
  let stt = 0;
  let T1 = 0;
  let T2 = 0;

  ten.forEach((k) => {
    const rs = nhom[k].slice().sort((a, b) => a.cn - b.cn);
    let s1 = 0;
    let s2 = 0;
    s += '\n🏗 ' + k + '\n';
    rs.forEach((r) => {
      stt++;
      s1 += r.m1;
      s2 += r.m2;
      // nội dung dài bất thường thì cắt bớt, nếu không 1 khoản có thể vượt cả 1 tin
      const nd = r.desc.length > MAX_DESC ? r.desc.slice(0, MAX_DESC) + '…' : r.desc;
      s += stt + '. ' + nd + '\n';
      s += '    ' + (r.person ? r.person + ' · ' : '') + nhan + ' ' + tien(r.m1) + 'đ' +
           (r.m2 > 0.001 ? ' · còn ' + tien(r.m2) + 'đ' : '') +
           ' · ' + ngayThang(r.cn) + '\n';
    });
    T1 += s1;
    T2 += s2;
    s += '    ── Cộng: ' + tien(s1) + 'đ' + (s2 > 0.001 ? ' (còn ' + tien(s2) + 'đ)' : '') + '\n';
  });

  s += '\n💰 TỔNG CỘNG: ' + tien(T1) + 'đ' +
       (T2 > 0.001 ? ' · còn phải chuyển ' + tien(T2) + 'đ' : '') + '\n';
  return s;
}

/**
 * Chia một cụm công trường quá dài (bản thân nó đã vượt giới hạn) thành nhiều
 * mảnh, cắt ở ranh giới từng khoản — mỗi khoản là 2 dòng "N. …" + dòng thụt lề.
 * Mảnh sau được lặp lại tên công trường để đọc vẫn hiểu.
 */
function chiaCum(cum, tran) {
  if (cum.length <= tran) return [cum];

  const dong = cum.split('\n');
  const tenCT = dong[0].indexOf('🏗') === 0 ? dong[0] : '';
  // gộp lại thành từng khoản: mỗi khoản bắt đầu bằng "số. "
  const khoan = [];
  dong.forEach((l) => {
    if (/^\d+\. /.test(l) || !khoan.length) khoan.push(l);
    else khoan[khoan.length - 1] += '\n' + l;
  });

  const ra = [];
  let hienTai = '';
  khoan.forEach((k) => {
    const them = hienTai ? hienTai + '\n' + k : k;
    if (them.length > tran && hienTai) {
      ra.push(hienTai);
      hienTai = tenCT ? tenCT + ' (tiếp)\n' + k : k;
    } else {
      hienTai = them;
    }
  });
  if (hienTai) ra.push(hienTai);
  return ra;
}

/**
 * Nếu tin dài quá giới hạn Telegram thì cắt thành nhiều tin — ưu tiên cắt ở
 * ranh giới công trường (dòng bắt đầu bằng 🏗); công trường nào tự nó đã quá dài
 * thì cắt tiếp theo từng khoản. Không bao giờ để mất dòng.
 */
function tachTin(dau, than) {
  const nguyen = dau + than;
  if (nguyen.length <= TG_LIMIT) return [nguyen];

  const tran = SAFE_LIMIT - dau.length;              // chỗ thực còn cho phần thân
  const cum = [];
  than.split(/\n(?=🏗 )/).forEach((c) => {           // giữ nguyên từng cụm công trường
    chiaCum(c, tran).forEach((x) => cum.push(x));    // cụm khổng lồ thì chia nhỏ tiếp
  });

  const ra = [];
  let hienTai = '';
  cum.forEach((c) => {
    const them = hienTai ? hienTai + '\n' + c : c;
    if ((dau + them).length > SAFE_LIMIT && hienTai) {
      ra.push(hienTai);
      hienTai = c;
    } else {
      hienTai = them;
    }
  });
  if (hienTai) ra.push(hienTai);

  return ra.map((phan, i) => {
    const nhan = ra.length > 1 ? '  (phần ' + (i + 1) + '/' + ra.length + ')' : '';
    return dau.replace(/\n━+\n$/, nhan + '\n━━━━━━━━━━━━━━━━━━━\n') + phan;
  });
}

/** Dựng đủ các tin cần gửi cho hôm nay. */
function dungTin(d) {
  const homNay = ngayDayDu(Date.now());
  const tuNgay = ngayDayDu(Date.now() - NGAY_DA_CHUYEN * 86400000);

  const dau1 = '🏢 PHÚC VINH AN · 379 VIỆT NAM\n' +
               '📋 BẢNG KÊ CÁC KHOẢN CHƯA CHUYỂN\n' +
               'Toàn bộ tồn đọng · ' + homNay + '\n' +
               '━━━━━━━━━━━━━━━━━━━\n';

  const dau2 = '✅ BẢNG KÊ CÁC KHOẢN ĐÃ CHUYỂN\n' +
               NGAY_DA_CHUYEN + ' ngày gần nhất (' + tuNgay + ' → ' + homNay + ')\n' +
               '━━━━━━━━━━━━━━━━━━━\n';

  return [].concat(
    tachTin(dau1, thanBang(d.chua, 'duyệt')),
    tachTin(dau2, thanBang(d.da, 'chuyển'))
  );
}

// ─────────────────────────── Gửi Telegram ───────────────────────────

async function guiTelegram(token, chatId, text) {
  const res = await fetch('https://api.telegram.org/bot' + token + '/sendMessage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ chat_id: chatId, text: text, disable_web_page_preview: true }),
  });
  const kq = await res.json().catch(() => ({}));
  if (!kq.ok) throw new Error('Telegram từ chối: ' + (kq.description || res.status));
  return kq;
}

/** Chạy toàn bộ: đọc khoá, gom dữ liệu, dựng tin, gửi lần lượt. */
async function chayBaoCao(nguon, url) {
  const meta = (await db('duyetchi/meta', url).once('value')).val() || {};
  const token = meta.telegramBotToken;
  const chatId = meta.telegramChatId;
  if (!token || !chatId) {
    throw new Error('Thiếu telegramBotToken / telegramChatId trong duyetchi/meta');
  }

  const d = await layDuLieu(url);
  const tins = dungTin(d);

  for (let i = 0; i < tins.length; i++) {
    await guiTelegram(token, chatId, tins[i]);
    if (i < tins.length - 1) await new Promise((r) => setTimeout(r, 900)); // tránh bị chặn tốc độ
  }

  const ghi = {
    luc: Date.now(),
    nguon: nguon,
    soTin: tins.length,
    chuaChuyen: d.chua.length,
    daChuyen: d.da.length,
  };
  await db('duyetchi/meta/telegramLastAuto', url).set(ghi);
  functions.logger.info('Đã gửi báo cáo Telegram', ghi);
  return ghi;
}

// ─────────────────────────── Hàm xuất ───────────────────────────

/** 6h00 sáng giờ Việt Nam, mỗi ngày. */
exports.baoCaoTelegram6h = functions
  .region('us-central1')
  .runWith({ memory: '256MB', timeoutSeconds: 120 })
  .pubsub.schedule('0 6 * * *')
  .timeZone('Asia/Ho_Chi_Minh')
  .onRun(async () => {
    try {
      await chayBaoCao('hen-gio');
    } catch (e) {
      functions.logger.error('Báo cáo Telegram lỗi', e);
      throw e;
    }
    return null;
  });

/**
 * Gửi thử bằng tay: mở URL kèm ?key=<duyetchi/meta/telegramTestKey>
 * (khoá đặt tay trong Console, không nằm trong repo). Không có khoá thì từ chối.
 */
exports.baoCaoTelegramTest = functions
  .region('us-central1')
  .runWith({ memory: '256MB', timeoutSeconds: 120 })
  .https.onRequest(async (req, res) => {
    try {
      const khoa = (await db('duyetchi/meta/telegramTestKey').once('value')).val();
      if (!khoa || req.query.key !== khoa) {
        res.status(403).send('Sai khoá');
        return;
      }
      const kq = await chayBaoCao('gui-thu');
      res.status(200).json(Object.assign({ ok: true }, kq));
    } catch (e) {
      functions.logger.error('Gửi thử lỗi', e);
      res.status(500).send('Lỗi: ' + e.message);
    }
  });

// ══════════════════ SỔ QUỸ GIA BÌNH (database riêng) ══════════════════
// Cùng logic, chỉ đổi database đọc vào. Token/chatId đọc từ duyetchi/meta
// của CHÍNH database Gia Bình → 2 app gửi vào 2 nhóm Telegram khác nhau.

/** 6h00 sáng giờ Việt Nam, mỗi ngày — báo cáo Sổ Quỹ Gia Bình. */
exports.baoCaoTelegram6hGB = functions
  .region('us-central1')
  .runWith({ memory: '256MB', timeoutSeconds: 120 })
  .pubsub.schedule('5 6 * * *')          // 6h05 — lệch 5 phút với 379 để 2 báo cáo không chen nhau
  .timeZone('Asia/Ho_Chi_Minh')
  .onRun(async () => {
    try {
      await chayBaoCao('hen-gio', DB_URL_GB);
    } catch (e) {
      functions.logger.error('Báo cáo Telegram Gia Bình lỗi', e);
      throw e;
    }
    return null;
  });

/** Gửi thử bằng tay: mở URL kèm ?key=<duyetchi/meta/telegramTestKey của Gia Bình>. */
exports.baoCaoTelegramTestGB = functions
  .region('us-central1')
  .runWith({ memory: '256MB', timeoutSeconds: 120 })
  .https.onRequest(async (req, res) => {
    try {
      const khoa = (await db('duyetchi/meta/telegramTestKey', DB_URL_GB).once('value')).val();
      if (!khoa || req.query.key !== khoa) {
        res.status(403).send('Sai khoá');
        return;
      }
      const kq = await chayBaoCao('gui-thu', DB_URL_GB);
      res.status(200).json(Object.assign({ ok: true }, kq));
    } catch (e) {
      functions.logger.error('Gửi thử Gia Bình lỗi', e);
      res.status(500).send('Lỗi: ' + e.message);
    }
  });

// ══════════════════ TRẠM TRUNG CHUYỂN cho SỔ QUỸ GIA BÌNH ══════════════════
// Thông báo đẩy + kho ảnh của app Gia Bình đi qua hàm này (chi tiết trong gbRelay.js).
exports.gbRelay = require('./gbRelay').gbRelay;
