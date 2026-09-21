/**
 * THÔNG BÁO ĐẨY của app Duyệt Chi PVA 379 — sendPush + processPushQueue
 * ─────────────────────────────────────────────────────────────────────────────
 * LAI LỊCH: 2 hàm này trước đây được deploy từ MÁY KHÁC, mã nguồn KHÔNG có trong repo. Ngày 21/09/2026
 * đã tải nguyên mã đang chạy về từ Google Cloud (bản gốc cất ở backups/cloud-functions-goc-node20/,
 * KHÔNG lên repo vì có khoá bí mật), đưa vào đây và nâng lên Node.js 22.
 *
 * BẢN GỐC CÓ 2 CỬA HỞ dẫn tới cùng 1 hậu quả — NGƯỜI LẠ gửi được thông báo nội dung tuỳ ý tới điện
 * thoại của toàn bộ nhân viên (giả danh app, lừa bấm link, giả mã OTP…):
 *   (1) sendPush: hàm HTTP KHÔNG xác thực gì, CORS '*'.
 *   (2) processPushQueue: tin tuyệt đối mọi thứ ghi vào push-queue, mà luật database cho MỌI tài khoản
 *       đăng nhập ghi vào đó — trong khi app cho ĐĂNG KÝ TỰ DO. Khoá (1) mà để (2) thì vô nghĩa.
 * Bản này bịt cả hai. Mọi quyết định cho/chặn nằm ở pushGuard.js (thuần logic, có 70 phép thử tấn công).
 * Đã qua 1 vòng "đội đỏ" độc lập 28 người soi (22/09/2026) — các ghi chú "ĐỘI ĐỎ" bên dưới là chỗ họ bắt được.
 *
 * KHOÁ BÍ MẬT — không có gì nằm trong repo (repo PUBLIC). Tất cả ở RTDB, nhánh fn-secrets/
 * (luật database cấm tường minh mọi client, chỉ admin SDK đọc được):
 *   fn-secrets/vapid379    {publicKey, privateKey, subject}  khoá ký thông báo đẩy
 *   fn-secrets/sendPushKey {hash}  CHỈ LƯU BĂM SHA-256 của khoá gọi sendPush. Khoá thật chỉ nằm ở
 *                          1 chỗ: file trên máy Dũng (backups/, git bỏ qua). Lộ database cũng không lộ khoá.
 *
 * Deploy (chọn lọc):
 *   firebase deploy --only functions:sendPush,functions:processPushQueue --project duyetchi-pva379
 */
const functions = require('firebase-functions/v1');
const webpush = require('web-push');
const guard = require('./pushGuard');
const { rtdb379, rateAllow, pushAuthMode } = require('./fnState');

const SEND_TIMEOUT_MS = 10000; // ĐỘI ĐỎ: 1 địa chỉ nhận bị treo không được phép giữ cả lượt gửi

let _vapidReady = false;
async function ensureVapid() {
  if (_vapidReady) return;
  let pub = process.env.VAPID_PUBLIC;
  let priv = process.env.VAPID_PRIVATE;
  let subject = process.env.VAPID_EMAIL;
  if (!pub || !priv) {
    const v = (await rtdb379().ref('fn-secrets/vapid379').once('value')).val() || {};
    pub = pub || v.publicKey;
    priv = priv || v.privateKey;
    subject = subject || v.subject;
  }
  if (!pub || !priv) throw new Error('Thiếu khoá VAPID (fn-secrets/vapid379)');
  webpush.setVapidDetails(subject || 'mailto:vandung0802@gmail.com', pub, priv);
  _vapidReady = true;
}

/**
 * Người nhận còn quyền không? ĐỘI ĐỎ: trước đây tài khoản bị Dũng THU HỒI / XOÁ vẫn nhận mọi thông báo
 * tài chính mãi mãi (đăng ký nhận nằm lại trong push-subs). Nay kiểm lại mỗi lần gửi.
 * Chỉ đọc 2 trường nhỏ (approved, role) — KHÔNG đọc cả hồ sơ (người dùng tự ghi được hồ sơ mình).
 * role tin được: luật chỉ cho tự đặt 'other'; dung/hien/trang bị khoá theo email đăng nhập.
 */
async function recipientAllowed(uid, cache) {
  if (cache.has(uid)) return cache.get(uid);
  const db = rtdb379();
  const [a, r] = await Promise.all([
    db.ref('duyetchi/userRoles/' + uid + '/approved').once('value'),
    db.ref('duyetchi/userRoles/' + uid + '/role').once('value'),
  ]);
  const ok = a.val() === true || ['dung', 'hien', 'trang'].indexOf(r.val()) >= 0;
  cache.set(uid, ok);
  return ok;
}

/** Gửi tới các kênh. roles/title/body PHẢI đã qua pushGuard (danh sách trắng + cắt độ dài). */
async function sendToRoles(title, body, roles) {
  await ensureVapid();
  const db = rtdb379();
  const subs = []; // [{role, key, sub}]
  for (const role of roles) {
    const snap = await db.ref('push-subs/' + role).get();
    if (snap.exists()) {
      Object.entries(snap.val()).forEach(([key, s]) => {
        try { subs.push({ role, key, sub: typeof s === 'string' ? JSON.parse(s) : s }); } catch (e) { /* bỏ qua bản ghi hỏng */ }
      });
    }
  }
  if (!subs.length) return { sent: 0, failed: 0, revoked: 0 };
  const payload = JSON.stringify({ title, body });
  const cache = new Map();
  let sent = 0;
  let failed = 0;
  let revoked = 0;
  await Promise.all(subs.map(async ({ role, key, sub }) => {
    try {
      if (!sub || typeof sub.endpoint !== 'string' || sub.endpoint.indexOf('https://') !== 0) { failed++; return; }
      // Bản ghi CŨ chưa có uid (trước v137) → vẫn gửi, để máy đang chạy không bị cắt; app ghi lại kèm uid mỗi lần mở.
      const uid = (typeof sub.uid === 'string' && /^[A-Za-z0-9_-]{1,128}$/.test(sub.uid)) ? sub.uid : '';
      if (uid && !(await recipientAllowed(uid, cache))) {
        revoked++;
        await db.ref('push-subs/' + role + '/' + key).remove().catch(() => {});
        return;
      }
      await webpush.sendNotification({ endpoint: sub.endpoint, keys: sub.keys }, payload, { timeout: SEND_TIMEOUT_MS });
      sent++;
    } catch (e) {
      failed++;
      console.error('Push failed:', e && e.statusCode, e && e.message);
      // Xóa subscription hết hạn (410 Gone hoặc 404)
      if (e && (e.statusCode === 410 || e.statusCode === 404)) {
        await db.ref('push-subs/' + role + '/' + key).remove().catch(() => {});
      }
    }
  }));
  return { sent, failed, revoked };
}

// ───────────────────────── sendPush: hàm HTTP để THỬ TAY ─────────────────────────
// App KHÔNG gọi hàm này. Bảo vệ:
//  • POST only, KHÔNG có header CORS nào → trình duyệt ở trang khác không gọi được
//  • khoá 256-bit gửi qua HEADER (x-push-key / Authorization: Bearer) — không nhận qua URL hay body
//  • máy chủ chỉ giữ BĂM của khoá; so sánh thời-gian-hằng; sai khoá và thiếu khoá trả về y hệt nhau
//  • kênh theo danh sách trắng, tiêu đề/nội dung bị cắt độ dài
//  • maxInstances nhỏ → có bị gọi dồn dập cũng không đốt được tiền
let _keyHash = { value: null, at: 0 };
async function sendPushKeyHash() {
  const now = Date.now();
  if (_keyHash.at && now - _keyHash.at < 5 * 60 * 1000) return _keyHash.value; // nhớ cả kết quả "chưa có khoá" → bị gọi dồn cũng không đọc database liên tục
  const v = (await rtdb379().ref('fn-secrets/sendPushKey/hash').once('value')).val();
  _keyHash = { value: (typeof v === 'string' ? v : null), at: now };
  return _keyHash.value;
}

exports.sendPush = functions
  .runWith({ memory: '256MB', timeoutSeconds: 30, maxInstances: 3 })
  .https.onRequest(async (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.set('X-Content-Type-Options', 'nosniff');
    try {
      if (req.method !== 'POST') { res.status(405).json({ error: 'method' }); return; }
      const hash = await sendPushKeyHash();
      // Chưa cấu hình khoá → ĐÓNG (không bao giờ "mở tạm")
      if (!hash || !guard.keyMatchesHash(guard.keyFromHeaders(req.headers), hash)) {
        res.status(403).json({ error: 'forbidden' });
        return;
      }
      const b = (req.body && typeof req.body === 'object') ? req.body : {};
      const d = guard.authorizeQueueItem({ title: b.title, body: b.body, roles: b.roles }, { authType: 'ADMIN' });
      if (!d.ok) { res.json({ sent: 0, failed: 0 }); return; }
      console.log(`sendPush (có khoá): title="${d.title}" roles=${JSON.stringify(d.roles)}`);
      const result = await sendToRoles(d.title, d.body, d.roles);
      res.json(result);
    } catch (e) {
      console.error('sendPush lỗi', e && e.message);
      res.status(500).json({ error: 'server' });
    }
  });

// ───────────────────────── processPushQueue: bộ kích hoạt khi app ghi vào push-queue ─────────────────────────
// NGƯỜI GỬI lấy từ context (do Google xác thực lúc ghi database) — KHÔNG đọc từ nội dung gói tin.
exports.processPushQueue = functions
  .runWith({ memory: '256MB', timeoutSeconds: 60, maxInstances: 10 })
  .database.ref('/push-queue/{id}')
  .onCreate(async (snap, context) => {
    try {
      const item = snap.val();
      const auth = (context && context.auth) || null;
      const sender = {
        authType: (context && context.authType) || 'UNAUTHENTICATED',
        uid: auth && auth.uid,
        email: auth && auth.token && auth.token.email,
        profile: null,
      };
      if (sender.authType === 'USER' && sender.uid) {
        // ĐỘI ĐỎ (mức CAO): CHỈ đọc đúng cờ approved. Hồ sơ userRoles/<uid> do chính người dùng ghi được —
        // người lạ nhồi hồ sơ vài trăm MB rồi bắn hàng loạt gói tin nhỏ là ép hàm tải cả đống đó mỗi lần
        // (tràn bộ nhớ, tốn tiền, nghẽn database). Cờ approved thì chỉ Dũng đặt được → luôn là null/true/false.
        const a = await rtdb379().ref('duyetchi/userRoles/' + sender.uid + '/approved').once('value');
        sender.profile = { approved: a.val() };
      }

      let d = guard.authorizeQueueItem(item, sender);
      if (d.ok && d.tier === 'approved') {
        if (!(await rateAllow('q379-approved', sender.uid, guard.RATE.approved))) d = { ok: false, reason: 'vuot-tan-suat-approved' };
      } else if (d.ok && d.tier === 'unapproved') {
        // ĐỘI ĐỎ: giới hạn theo TỪNG tài khoản là chưa đủ vì tài khoản tạo miễn phí → thêm TRẦN CHUNG cả nhóm.
        // Kiểm trần chung TRƯỚC: khi đang bị dội, mỗi gói rác chỉ tốn đúng 1 lượt đếm.
        if (!(await rateAllow('q379-unapproved-all', 'tat-ca', guard.RATE.unapprovedGlobal))) d = { ok: false, reason: 'vuot-tran-chung-chua-duyet' };
        else if (!(await rateAllow('q379-unapproved', sender.uid, guard.RATE.unapproved))) d = { ok: false, reason: 'vuot-tan-suat-unapproved' };
      }

      if (!d.ok) {
        const mode = await pushAuthMode();
        console.warn(`processPushQueue CHẶN: ${d.reason} | authType=${sender.authType} uid=${sender.uid || '-'} | mode=${mode}`);
        if (mode !== 'monitor') return;
        // CHẾ ĐỘ THEO DÕI (có hạn, tối đa 24 giờ — xem fnState.js): gửi như trước đây nhưng vẫn qua danh sách
        // trắng + cắt độ dài, và CHỈ cho người đã đăng nhập. Dùng khi nghi chặn nhầm thông báo thật.
        if (sender.authType !== 'USER') return;
        const t = guard.cleanText(item && item.title, guard.MAX_TITLE);
        const r = guard.cleanRoles(item && item.roles, guard.ROLES_379);
        if (!t || !r.length) return;
        const lr = await sendToRoles(t, guard.cleanText(item && item.body, guard.MAX_BODY), r);
        console.log(`processPushQueue (monitor) sent=${lr.sent} failed=${lr.failed}`);
        return;
      }

      // Chỉ ghi TIÊU ĐỀ vào nhật ký — nội dung có thể chứa mã xác nhận
      console.log(`processPushQueue: tier=${d.tier} title="${d.title}" roles=${JSON.stringify(d.roles)}`);
      const result = await sendToRoles(d.title, d.body, d.roles);
      console.log(`processPushQueue result: sent=${result.sent} failed=${result.failed} revoked=${result.revoked}`);
    } catch (e) {
      console.error('processPushQueue lỗi', e && e.message);
    } finally {
      await snap.ref.remove().catch(() => {});
    }
  });

