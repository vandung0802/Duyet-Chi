/**
 * TRẠM TRUNG CHUYỂN cho app SỔ QUỸ GIA BÌNH (gbRelay)
 * ─────────────────────────────────────────────────────────────────────────────
 * Gia Bình chạy gói Spark: không có Cloud Functions, không có Storage vùng Singapore.
 * Cách cũ (cho app Gia Bình "đăng nhập chéo" sang project 379) KHÔNG chạy được: token đăng
 * nhập của project này không dùng để đăng nhập project kia → thông báo đẩy + kho ảnh hỏng.
 *
 * Cách đúng: app Gia Bình gọi 1 hàm HTTPS ở đây, kèm ID token CỦA CHÍNH GIA BÌNH. Hàm tự xác
 * minh token (chữ ký Google + đúng project so-quy-gia-binh) rồi làm hộ bằng quyền admin:
 *   sub / unsub : ghi/xoá đăng ký nhận thông báo → gb-push-subs/<kênh>/<khoá> (client không đọc/ghi được)
 *   send        : gửi thông báo đẩy tới các kênh  → tự gửi bằng web-push, khoá VAPID RIÊNG của Gia Bình
 *   upload      : đưa ảnh lên kho 379, thư mục giabinh/ → trả về link tải
 *   revoke      : (chỉ Dũng) gỡ mọi đăng ký nhận của 1 tài khoản vừa bị thu hồi/xoá
 *
 * Khoá VAPID bí mật KHÔNG nằm trong repo (repo public): cất ở RTDB 379, nhánh gb-secrets/vapid
 * (luật database cấm tường minh mọi client, chỉ admin SDK đọc được).
 *
 * ĐÃ QUA ĐỘI ĐỎ (22/09/2026). Các chỗ họ bắt được và đã vá, ghi chú ngay tại dòng:
 *   - đọc CẢ hồ sơ người gọi (tự họ ghi được, không giới hạn cỡ) → nay chỉ đọc 2 trường nhỏ
 *   - người chưa duyệt gửi chữ tuỳ ý cho Dũng + lách giới hạn bằng nhiều tài khoản → máy chủ soạn nội dung + trần chung
 *   - upload cho GHI ĐÈ file của người khác → tên file do máy chủ đặt, chỉ-tạo-mới
 *   - gửi tuần tự, không hạn chờ → gửi song song, hạn chờ 10 giây
 *
 * Deploy (LUÔN chọn lọc):
 *   firebase deploy --only functions:gbRelay --project duyetchi-pva379
 */
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const webpush = require('web-push');
const crypto = require('crypto');
const guard = require('./pushGuard');
const { rateAllow } = require('./fnState');

const DB_URL_379 = 'https://duyetchi-pva379-default-rtdb.asia-southeast1.firebasedatabase.app';
const DB_URL_GB = 'https://so-quy-gia-binh-default-rtdb.asia-southeast1.firebasedatabase.app';
const GB_PROJECT_ID = 'so-quy-gia-binh';
const GB_ORIGINS = ['https://vandung0802.github.io'];
const GB_BUCKET = 'duyetchi-pva379.firebasestorage.app';
const GB_VAPID_PUBLIC = 'BMhZrvBFIKLJ19QsU_R2Ohy9lcZXWsueRX_VblUwBUZcRc1_EKkjk_Ki1ZajzvruLAvzuZI-bRHOYWpGav13LZw';
const GB_VAPID_SUBJECT = 'https://vandung0802.github.io/Duyet-Chi/giabinh.html';
const GB_CHANNELS = ['dung', 'hien', 'toan', 'trang', 'kt']; // 'kt' = mọi thành viên thường (vai other)
// Ở Gia Bình CHỈ email Dũng được coi là quản trị (tài khoản này chắc chắn đã đăng ký). KHÔNG thêm email
// Hiền/Trang vào đây: ở project Gia Bình 2 email đó CHƯA đăng ký → người lạ đăng ký trước là chiếm được.
const GB_ADMIN_EMAIL = 'vandung0802@gmail.com';
const SEND_TIMEOUT_MS = 10000;
const UID_RE = /^[A-Za-z0-9_-]{1,128}$/;

function db379(path) {
  return admin.app().database(DB_URL_379).ref(path);
}

let _verifyApp = null;
function gbAuth() {
  // App phụ CHỈ để xác minh ID token của project Gia Bình (cần mỗi projectId + khoá công khai của Google)
  if (!_verifyApp) _verifyApp = admin.initializeApp({ projectId: GB_PROJECT_ID }, 'gb-verify');
  return _verifyApp.auth();
}

let _vapidReady = false;
async function gbVapid() {
  if (_vapidReady) return;
  const priv = (await db379('gb-secrets/vapid/privateKey').once('value')).val();
  if (!priv) throw new Error('Thiếu gb-secrets/vapid/privateKey');
  webpush.setVapidDetails(GB_VAPID_SUBJECT, GB_VAPID_PUBLIC, priv);
  _vapidReady = true;
}

function subKey(endpoint) {
  return Buffer.from(String(endpoint)).toString('base64').replace(/[^a-zA-Z0-9]/g, '').substring(0, 80);
}

/**
 * Đọc 1 TRƯỜNG NHỎ trong hồ sơ người gọi bằng chính token của họ (luật Gia Bình cho tự đọc hồ sơ mình).
 * KHÔNG đọc cả nút hồ sơ: người dùng tự ghi được hồ sơ mình nên có thể nhồi hàng chục MB để ép trạm tải về
 * mỗi lần gọi (tràn bộ nhớ + đốt hạn mức 10GB/tháng của gói Spark). Phòng xa: bỏ qua phản hồi > 2KB.
 */
async function gbField(uid, field, idToken) {
  const url = DB_URL_GB + '/duyetchi/userRoles/' + encodeURIComponent(uid) + '/' + field + '.json?auth=' + encodeURIComponent(idToken);
  const r = await fetch(url);
  if (!r.ok) return null;
  const len = parseInt(r.headers.get('content-length') || '0', 10);
  if (len > 2048) return null;
  const txt = await r.text();
  if (txt.length > 2048) return null;
  try { return JSON.parse(txt); } catch (e) { return null; }
}

function channelOf(role) {
  return ['dung', 'hien', 'toan', 'trang'].includes(role) ? role : 'kt';
}

exports.gbRelay = functions
  .region('us-central1')
  .runWith({ memory: '256MB', timeoutSeconds: 60, maxInstances: 5 }) // trần số máy chạy song song → bị gọi dồn dập thì chi phí bị CHẶN TRẦN (không phải bằng 0)
  .https.onRequest(async (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.set('X-Content-Type-Options', 'nosniff');
    const origin = req.headers.origin || '';
    if (GB_ORIGINS.includes(origin)) res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'POST only' }); return; }

    try {
      const b = (req.body && typeof req.body === 'object') ? req.body : {};
      if (typeof b.idToken !== 'string' || !b.idToken || b.idToken.length > 4096) { res.status(401).json({ ok: false, error: 'Thiếu idToken' }); return; }
      let who;
      try { who = await gbAuth().verifyIdToken(b.idToken); }
      catch (e) { res.status(401).json({ ok: false, error: 'Token không hợp lệ' }); return; }
      const uid = who.uid;
      if (!UID_RE.test(String(uid || ''))) { res.status(401).json({ ok: false, error: 'Token không hợp lệ' }); return; }
      const isAdmin = String(who.email || '').toLowerCase() === GB_ADMIN_EMAIL;
      // approved: chỉ Dũng đặt được (luật cấm tự đổi) → tin được. role: tự đặt chỉ được 'other' → tin được.
      const [apv, roleRaw] = await Promise.all([gbField(uid, 'approved', b.idToken), gbField(uid, 'role', b.idToken)]);
      const approved = apv === true || isAdmin;
      const role = (typeof roleRaw === 'string' && roleRaw.length <= 20) ? roleRaw : 'other';

      // ── Đăng ký nhận thông báo ──
      if (b.action === 'sub') {
        if (!approved) { res.status(403).json({ ok: false, error: 'Tài khoản chưa được duyệt' }); return; }
        const s = (b.sub && typeof b.sub === 'object') ? b.sub : {};
        const k = (s.keys && typeof s.keys === 'object') ? s.keys : {};
        if (typeof s.endpoint !== 'string' || s.endpoint.indexOf('https://') !== 0 || s.endpoint.length > 1000
          || typeof k.p256dh !== 'string' || k.p256dh.length > 200 || typeof k.auth !== 'string' || k.auth.length > 100) {
          res.status(400).json({ ok: false, error: 'Đăng ký không hợp lệ' }); return;
        }
        if (!(await rateAllow('gb-sub', uid, { limit: 30, windowMs: 10 * 60 * 1000 }))) { res.status(429).json({ ok: false, error: 'Thử lại sau ít phút' }); return; }
        const key = subKey(s.endpoint);
        const ch = channelOf(role); // kênh do MÁY CHỦ quyết theo vai thật — client không tự chọn được
        await db379('gb-push-subs/' + ch + '/' + key).set({
          endpoint: s.endpoint, keys: { p256dh: k.p256dh, auth: k.auth }, uid: uid, ts: Date.now(),
        });
        // 1 máy chỉ nằm ở 1 kênh (đổi vai → dọn kênh cũ, chống nhận 2 lần)
        await Promise.all(GB_CHANNELS.filter((c) => c !== ch).map((c) => db379('gb-push-subs/' + c + '/' + key).remove()));
        res.json({ ok: true, channel: ch }); return;
      }

      // ── Huỷ đăng ký của CHÍNH máy này (đăng xuất). Chỉ gỡ bản ghi đúng uid người gọi. ──
      if (b.action === 'unsub') {
        if (typeof b.endpoint !== 'string' || !b.endpoint || b.endpoint.length > 1000) { res.status(400).json({ ok: false, error: 'Thiếu endpoint' }); return; }
        const key = subKey(b.endpoint);
        await Promise.all(GB_CHANNELS.map(async (c) => {
          const ref = db379('gb-push-subs/' + c + '/' + key);
          const owner = (await ref.child('uid').once('value')).val();
          if (owner === uid) await ref.remove();
        }));
        res.json({ ok: true }); return;
      }

      // ── (Chỉ Dũng) gỡ mọi đăng ký nhận của 1 tài khoản vừa bị thu hồi / xoá ──
      if (b.action === 'revoke') {
        if (!isAdmin) { res.status(403).json({ ok: false, error: 'Chỉ quản trị' }); return; }
        const target = String(b.uid || '');
        if (!UID_RE.test(target)) { res.status(400).json({ ok: false, error: 'uid không hợp lệ' }); return; }
        let removed = 0;
        for (const c of GB_CHANNELS) {
          const snap = await db379('gb-push-subs/' + c).orderByChild('uid').equalTo(target).once('value');
          const del = {};
          snap.forEach((x) => { del[x.key] = null; removed++; });
          if (Object.keys(del).length) await db379('gb-push-subs/' + c).update(del);
        }
        res.json({ ok: true, removed: removed }); return;
      }

      // ── Gửi thông báo ──
      if (b.action === 'send') {
        let title = guard.cleanText(b.title, guard.MAX_TITLE);
        let body = guard.cleanText(b.body, guard.MAX_BODY);
        let roles = (Array.isArray(b.roles) ? b.roles.slice(0, 32) : [])
          .map((r) => (r === 'other' ? 'kt' : String(r)))
          .filter((r, i, a) => GB_CHANNELS.includes(r) && a.indexOf(r) === i);
        if (!approved) {
          // Người CHƯA duyệt: chỉ tới được Dũng, và NỘI DUNG DO MÁY CHỦ SOẠN (tên + mã 6 số + email thật)
          roles = roles.filter((r) => r === 'dung');
          const composed = guard.composeUnapproved({ title: b.title, body: b.body }, who.email, who.email_verified === true);
          if (!roles.length || !composed) { res.json({ ok: true, sent: 0, note: 'không hợp lệ' }); return; }
          title = composed.title; body = composed.body;
          // theo TỪNG tài khoản trước, qua được mới tính vào trần chung (xem push379.js)
          if (!(await rateAllow('gb-send-unapproved', uid, guard.RATE.unapproved))
            || !(await rateAllow('gb-send-unapproved-all', 'tat-ca', guard.RATE.unapprovedGlobal))) {
            res.status(429).json({ ok: false, error: 'Gửi quá nhanh — thử lại sau' }); return;
          }
        } else {
          if (!title || !roles.length) { res.json({ ok: true, sent: 0, note: 'không có kênh hợp lệ' }); return; }
          if (!(await rateAllow('gb-send-approved', uid, guard.RATE.approved))) {
            res.status(429).json({ ok: false, error: 'Gửi quá nhanh — thử lại sau ít phút' }); return;
          }
        }
        await gbVapid();
        const payload = JSON.stringify({ title: title, body: body });
        const targets = []; const seen = new Set();
        for (const ch of roles) {
          const subs = (await db379('gb-push-subs/' + ch).once('value')).val() || {};
          for (const key of Object.keys(subs)) {
            if (seen.has(key)) continue;
            seen.add(key);
            targets.push({ ch: ch, key: key, s: subs[key] });
          }
        }
        let sent = 0; let gone = 0; let failed = 0;
        await Promise.all(targets.map(async (t) => {
          try {
            await webpush.sendNotification({ endpoint: t.s.endpoint, keys: t.s.keys }, payload, { TTL: 86400, urgency: 'high', timeout: SEND_TIMEOUT_MS });
            sent++;
          } catch (e) {
            if (e && (e.statusCode === 404 || e.statusCode === 410)) { // máy đã gỡ app / thu hồi quyền → dọn
              gone++;
              await db379('gb-push-subs/' + t.ch + '/' + t.key).remove().catch(() => {});
            } else {
              failed++;
              functions.logger.warn('gbRelay push lỗi', t.ch, e && e.statusCode);
            }
          }
        }));
        res.json({ ok: true, sent: sent, gone: gone, failed: failed }); return;
      }

      // ── Đưa ảnh lên kho (thư mục giabinh/) ──
      if (b.action === 'upload') {
        if (!approved) { res.status(403).json({ ok: false, error: 'Tài khoản chưa được duyệt' }); return; }
        if (!(await rateAllow('gb-upload', uid, { limit: 200, windowMs: 10 * 60 * 1000 }))) {
          res.status(429).json({ ok: false, error: 'Tải ảnh quá nhanh — thử lại sau ít phút' }); return;
        }
        const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(String(b.dataUrl || ''));
        if (!m) { res.status(400).json({ ok: false, error: 'Ảnh không hợp lệ' }); return; }
        const buf = Buffer.from(m[2], 'base64');
        if (buf.length > 4 * 1024 * 1024) { res.status(413).json({ ok: false, error: 'Ảnh quá lớn' }); return; }
        // Thư mục: lấy phần đường dẫn client gợi ý (đã lọc ký tự) — nhưng TÊN FILE do máy chủ đặt (ngẫu nhiên)
        // và chỉ-tạo-mới (ifGenerationMatch:0) → không ai ghi đè / phá được ảnh chứng từ của người khác.
        const dir = String(b.path || '')
          .replace(/[^a-zA-Z0-9/_-]/g, '')
          .split('/').filter((x) => x && x !== '.' && x !== '..').slice(0, 4).join('/')
          .slice(0, 120) || 'misc';
        const path = 'giabinh/' + dir + '/' + crypto.randomUUID();
        const token = crypto.randomUUID();
        await admin.storage().bucket(GB_BUCKET).file(path).save(buf, {
          resumable: false,
          preconditionOpts: { ifGenerationMatch: 0 },
          metadata: {
            contentType: m[1],
            cacheControl: 'public, max-age=31536000',
            metadata: { firebaseStorageDownloadTokens: token, uploadedBy: uid },
          },
        });
        const url = 'https://firebasestorage.googleapis.com/v0/b/' + GB_BUCKET + '/o/' + encodeURIComponent(path) + '?alt=media&token=' + token;
        res.json({ ok: true, url: url }); return;
      }

      res.status(400).json({ ok: false, error: 'action không hợp lệ' });
    } catch (e) {
      functions.logger.error('gbRelay lỗi', e && e.message);
      res.status(500).json({ ok: false, error: 'Lỗi máy chủ' });
    }
  });
