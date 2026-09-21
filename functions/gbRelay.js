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
 * Không phụ thuộc 2 hàm push cũ của 379 (không có mã nguồn trong repo).
 *
 * Khoá VAPID bí mật KHÔNG nằm trong repo (repo public): cất ở RTDB 379, nhánh gb-secrets/vapid
 * (không có luật đọc → mọi client bị từ chối, chỉ admin SDK đọc được).
 *
 * Deploy (LUÔN chọn lọc — xem cảnh báo đầu index.js):
 *   firebase deploy --only functions:gbRelay --project duyetchi-pva379
 */
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const webpush = require('web-push');
const crypto = require('crypto');

const DB_URL_379 = 'https://duyetchi-pva379-default-rtdb.asia-southeast1.firebasedatabase.app';
const DB_URL_GB = 'https://so-quy-gia-binh-default-rtdb.asia-southeast1.firebasedatabase.app';
const GB_PROJECT_ID = 'so-quy-gia-binh';
const GB_ORIGINS = ['https://vandung0802.github.io'];
const GB_BUCKET = 'duyetchi-pva379.firebasestorage.app';
const GB_VAPID_PUBLIC = 'BMhZrvBFIKLJ19QsU_R2Ohy9lcZXWsueRX_VblUwBUZcRc1_EKkjk_Ki1ZajzvruLAvzuZI-bRHOYWpGav13LZw';
const GB_VAPID_SUBJECT = 'https://vandung0802.github.io/Duyet-Chi/giabinh.html';
const GB_CHANNELS = ['dung', 'hien', 'toan', 'trang', 'kt']; // 'kt' = mọi thành viên thường (vai other)
const GB_ADMIN_EMAIL = 'vandung0802@gmail.com';

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

/** Hồ sơ người gọi, đọc từ RTDB Gia Bình BẰNG CHÍNH token của họ (luật bên đó cho tự đọc hồ sơ mình). */
async function gbProfile(uid, idToken) {
  const url = DB_URL_GB + '/duyetchi/userRoles/' + encodeURIComponent(uid) + '.json?auth=' + encodeURIComponent(idToken);
  const r = await fetch(url);
  if (!r.ok) return {};
  return (await r.json()) || {};
}

function channelOf(role) {
  return ['dung', 'hien', 'toan', 'trang'].includes(role) ? role : 'kt';
}

exports.gbRelay = functions
  .region('us-central1')
  .runWith({ memory: '256MB', timeoutSeconds: 60 })
  .https.onRequest(async (req, res) => {
    const origin = req.headers.origin || '';
    if (GB_ORIGINS.includes(origin)) res.set('Access-Control-Allow-Origin', origin);
    res.set('Vary', 'Origin');
    res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Content-Type');
    res.set('Access-Control-Max-Age', '3600');
    if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
    if (req.method !== 'POST') { res.status(405).json({ ok: false, error: 'POST only' }); return; }

    try {
      const b = req.body || {};
      if (!b.idToken) { res.status(401).json({ ok: false, error: 'Thiếu idToken' }); return; }
      let who;
      try { who = await gbAuth().verifyIdToken(String(b.idToken)); }
      catch (e) { res.status(401).json({ ok: false, error: 'Token không hợp lệ' }); return; }
      const uid = who.uid;
      const prof = await gbProfile(uid, b.idToken);
      const role = prof.role || 'other';
      const approved = prof.approved === true || (who.email || '').toLowerCase() === GB_ADMIN_EMAIL;

      // ── Đăng ký nhận thông báo ──
      if (b.action === 'sub') {
        if (!approved) { res.status(403).json({ ok: false, error: 'Tài khoản chưa được duyệt' }); return; }
        const s = b.sub || {};
        if (!s.endpoint || !s.keys || !s.keys.p256dh || !s.keys.auth || String(s.endpoint).indexOf('https://') !== 0) {
          res.status(400).json({ ok: false, error: 'Đăng ký không hợp lệ' }); return;
        }
        const key = subKey(s.endpoint);
        const ch = channelOf(role); // kênh do MÁY CHỦ quyết theo vai thật — client không tự chọn được
        await db379('gb-push-subs/' + ch + '/' + key).set({
          endpoint: s.endpoint, keys: { p256dh: s.keys.p256dh, auth: s.keys.auth },
          uid: uid, name: prof.name || '', ts: Date.now(),
        });
        // 1 máy chỉ nằm ở 1 kênh (đổi vai → dọn kênh cũ, chống nhận 2 lần)
        await Promise.all(GB_CHANNELS.filter((c) => c !== ch).map((c) => db379('gb-push-subs/' + c + '/' + key).remove()));
        res.json({ ok: true, channel: ch }); return;
      }

      // ── Huỷ đăng ký (đăng xuất) ──
      if (b.action === 'unsub') {
        if (!b.endpoint) { res.status(400).json({ ok: false, error: 'Thiếu endpoint' }); return; }
        const key = subKey(b.endpoint);
        await Promise.all(GB_CHANNELS.map((c) => db379('gb-push-subs/' + c + '/' + key).remove()));
        res.json({ ok: true }); return;
      }

      // ── Gửi thông báo ──
      if (b.action === 'send') {
        const title = String(b.title || '').slice(0, 140);
        const body = String(b.body || '').slice(0, 400);
        let roles = (Array.isArray(b.roles) ? b.roles : [])
          .map((r) => (r === 'other' ? 'kt' : String(r)))
          .filter((r, i, a) => GB_CHANNELS.includes(r) && a.indexOf(r) === i);
        // Người CHƯA được duyệt chỉ được báo cho Dũng (luồng đăng ký: gửi mã xác nhận)
        if (!approved) roles = roles.filter((r) => r === 'dung');
        if (!title || !roles.length) { res.json({ ok: true, sent: 0, note: 'không có kênh hợp lệ' }); return; }
        await gbVapid();
        const payload = JSON.stringify({ title: title, body: body });
        let sent = 0; let gone = 0; let failed = 0;
        const seen = new Set();
        for (const ch of roles) {
          const subs = (await db379('gb-push-subs/' + ch).once('value')).val() || {};
          for (const key of Object.keys(subs)) {
            if (seen.has(key)) continue;
            seen.add(key);
            const s = subs[key];
            try {
              await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, payload, { TTL: 86400, urgency: 'high' });
              sent++;
            } catch (e) {
              if (e && (e.statusCode === 404 || e.statusCode === 410)) { // máy đã gỡ app / thu hồi quyền → dọn
                gone++;
                await db379('gb-push-subs/' + ch + '/' + key).remove();
              } else {
                failed++;
                functions.logger.warn('gbRelay push lỗi', ch, e && e.statusCode, e && e.body);
              }
            }
          }
        }
        res.json({ ok: true, sent: sent, gone: gone, failed: failed }); return;
      }

      // ── Đưa ảnh lên kho (thư mục giabinh/) ──
      if (b.action === 'upload') {
        if (!approved) { res.status(403).json({ ok: false, error: 'Tài khoản chưa được duyệt' }); return; }
        const m = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(String(b.dataUrl || ''));
        if (!m) { res.status(400).json({ ok: false, error: 'Ảnh không hợp lệ' }); return; }
        const buf = Buffer.from(m[2], 'base64');
        if (buf.length > 4 * 1024 * 1024) { res.status(413).json({ ok: false, error: 'Ảnh quá lớn' }); return; }
        const clean = String(b.path || '')
          .replace(/[^a-zA-Z0-9/_.-]/g, '')
          .replace(/\.{2,}/g, '.')
          .replace(/^\/+/, '')
          .slice(0, 200) || ('misc/' + Date.now());
        const path = 'giabinh/' + clean;
        const token = crypto.randomUUID();
        await admin.storage().bucket(GB_BUCKET).file(path).save(buf, {
          resumable: false,
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
      functions.logger.error('gbRelay lỗi', e);
      res.status(500).json({ ok: false, error: 'Lỗi máy chủ' });
    }
  });
