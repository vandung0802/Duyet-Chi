/**
 * THÔNG BÁO ĐẨY của app Duyệt Chi PVA 379 — sendPush + processPushQueue
 * ─────────────────────────────────────────────────────────────────────────────
 * LAI LỊCH: 2 hàm này trước đây được deploy từ MÁY KHÁC, mã nguồn KHÔNG có trong repo
 * → mỗi lần deploy phải né chúng, và sau khi Google khai tử Node.js 20 (30/10/2026) sẽ
 * không sửa được nữa. Ngày 21/09/2026 đã tải nguyên mã nguồn đang chạy về từ Google Cloud
 * (bản gốc cất ở backups/cloud-functions-goc-node20/, KHÔNG lên repo vì có khoá bí mật),
 * đưa vào đây và nâng lên Node.js 22.
 *
 * HÀNH VI GIỮ NGUYÊN so với bản gốc. Khác duy nhất: khoá VAPID.
 *   Bản gốc viết CỨNG khoá bí mật trong mã + file .env. Repo này PUBLIC nên không thể làm vậy.
 *   Nay khoá nằm ở RTDB: fn-secrets/vapid379 {publicKey, privateKey, subject} — nhánh không có
 *   luật đọc nên mọi client bị từ chối, chỉ admin SDK (Cloud Functions) đọc được.
 *   Nạp LƯỜI (lúc gửi lần đầu) chứ không nạp lúc khởi động: nếu thiếu khoá thì chỉ push lỗi,
 *   các hàm khác trong cùng gói (báo cáo Telegram, gbRelay) không bị kéo chết theo.
 *   Vẫn ưu tiên biến môi trường VAPID_* nếu có (tương thích bản gốc).
 *
 * Deploy (chọn lọc):
 *   firebase deploy --only functions:sendPush,functions:processPushQueue --project duyetchi-pva379
 */
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const webpush = require('web-push');

const DB_URL = 'https://duyetchi-pva379-default-rtdb.asia-southeast1.firebasedatabase.app';

function rtdb() {
  return admin.app().database(DB_URL);
}

let _vapidReady = false;
async function ensureVapid() {
  if (_vapidReady) return;
  let pub = process.env.VAPID_PUBLIC;
  let priv = process.env.VAPID_PRIVATE;
  let subject = process.env.VAPID_EMAIL;
  if (!pub || !priv) {
    const v = (await rtdb().ref('fn-secrets/vapid379').once('value')).val() || {};
    pub = pub || v.publicKey;
    priv = priv || v.privateKey;
    subject = subject || v.subject;
  }
  if (!pub || !priv) throw new Error('Thiếu khoá VAPID (fn-secrets/vapid379)');
  webpush.setVapidDetails(subject || 'mailto:vandung0802@gmail.com', pub, priv);
  _vapidReady = true;
}

async function sendToRoles(title, body, roles) {
  await ensureVapid();
  const db = rtdb();
  const subs = []; // [{role, key, sub}]
  for (const role of roles) {
    const snap = await db.ref('push-subs/' + role).get();
    if (snap.exists()) {
      Object.entries(snap.val()).forEach(([key, s]) => {
        try { subs.push({ role, key, sub: typeof s === 'string' ? JSON.parse(s) : s }); } catch (e) { /* bỏ qua bản ghi hỏng */ }
      });
    }
  }
  if (!subs.length) return { sent: 0, failed: 0 };
  const payload = JSON.stringify({ title, body });
  let sent = 0;
  let failed = 0;
  await Promise.all(subs.map(async ({ role, key, sub }) => {
    try {
      await webpush.sendNotification(sub, payload);
      sent++;
    } catch (e) {
      failed++;
      console.error('Push failed:', e.statusCode, e.message, String(sub && sub.endpoint || '').substring(0, 50));
      // Xóa subscription hết hạn (410 Gone hoặc 404)
      if (e.statusCode === 410 || e.statusCode === 404) {
        await db.ref('push-subs/' + role + '/' + key).remove().catch(() => {});
        console.log('Removed expired sub for', role, key.substring(0, 20));
      }
    }
  }));
  return { sent, failed };
}

// HTTP endpoint (vẫn giữ để test từ PowerShell) — hành vi y bản gốc
exports.sendPush = functions.https.onRequest(async (req, res) => {
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.status(204).send(''); return; }
  const { title, body, roles } = req.body || {};
  if (!roles || !roles.length) { res.json({ sent: 0 }); return; }
  const result = await sendToRoles(title, body, roles);
  res.json(result);
});

// Database trigger - lắng nghe push-queue từ app — hành vi y bản gốc
exports.processPushQueue = functions.database.ref('/push-queue/{id}').onCreate(async (snap, context) => {
  const { title, body, roles } = snap.val() || {};
  console.log(`processPushQueue: title="${title}" roles=${JSON.stringify(roles)}`);
  if (!roles || !roles.length) { await snap.ref.remove(); return; }
  const result = await sendToRoles(title, body, roles);
  console.log(`processPushQueue result: sent=${result.sent} failed=${result.failed}`);
  await snap.ref.remove();
});
