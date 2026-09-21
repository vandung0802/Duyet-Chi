/**
 * LỚP BẢO VỆ dùng chung cho mọi hàm gửi thông báo đẩy (push379.js, gbRelay.js)
 * ─────────────────────────────────────────────────────────────────────────────
 * Phần THUẦN LOGIC (không đụng Firebase) tách riêng ở đây để kiểm thử được bằng `node test-pushguard.js`
 * mà không cần máy chủ. Mọi quyết định "cho gửi / chặn" đều đi qua file này.
 *
 * MÔ HÌNH ĐE DOẠ (vì sao có từng lớp):
 *  1. Người lạ trên internet gọi thẳng hàm HTTP           → khoá bí mật 256-bit, so sánh thời-gian-hằng
 *  2. Người lạ TỰ ĐĂNG KÝ tài khoản rồi ghi vào hàng đợi   → chỉ tài khoản ĐÃ ĐƯỢC DUYỆT mới gửi tuỳ ý.
 *     (app cho đăng ký tự do!)                                Chưa duyệt: chỉ tới được Dũng, và NỘI DUNG DO
 *                                                             MÁY CHỦ SOẠN theo khuôn (tên + 6 số + email thật)
 *                                                             → không nhét được chữ lừa đảo / đường link.
 *  3. Tạo hàng loạt tài khoản để lách giới hạn theo người  → thêm TRẦN CHUNG cho cả nhóm "chưa duyệt"
 *  4. Tài khoản bị chiếm / nội gián spam hàng loạt         → giới hạn tần suất theo từng tài khoản
 *  5. Nhồi dữ liệu rác, kênh lạ, chuỗi khổng lồ            → danh sách trắng kênh + cắt độ dài
 *  6. Đốt tiền bằng cách gọi hàm liên tục                  → maxInstances (đặt ở nơi khai báo hàm)
 *  7. Dò khoá qua chênh lệch thời gian trả lời             → băm SHA-256 rồi timingSafeEqual
 *
 * LƯU Ý KHI SỬA FILE NÀY: KHÔNG viết ký tự điều khiển (mã < 32) trực tiếp hay dạng escape trong chuỗi/regex —
 * công cụ soạn thảo từng biến escape thành byte thật, làm git coi file là nhị phân. Dùng mã số ký tự.
 */
const crypto = require('crypto');

// Kênh hợp lệ của app 379 (đúng bằng tập kênh app3.html đăng ký + gửi tới)
const ROLES_379 = ['dung', 'hien', 'trang', 'other', 'kt', 'kh'];
// 3 email "người nhà" của app 379 — luật database 379 coi như đã duyệt kể cả khi cờ approved chưa đặt.
// An toàn Ở 379 vì cả 3 đều ĐÃ đăng ký (Firebase không cho 2 tài khoản trùng email). KHÔNG dùng danh sách
// này cho project nào mà 3 email chưa đăng ký đủ (vd Gia Bình) — người lạ đăng ký trước là chiếm được.
const FIXED_EMAILS = ['vandung0802@gmail.com', 'hiensbgt@gmail.com', 'phantrang770@gmail.com'];

const MAX_TITLE = 140;
const MAX_BODY = 400;
const MAX_ROLES = 8;
const MAX_NAME = 40;

// Giới hạn tần suất (số thông báo / cửa sổ).
const RATE = {
  approved: { limit: 150, windowMs: 10 * 60 * 1000 },        // rộng rãi: duyệt dồn vài chục phiếu vẫn lọt
  unapproved: { limit: 4, windowMs: 10 * 60 * 1000 },        // 1 người chưa duyệt: chỉ có luồng mã đăng ký
  unapprovedGlobal: { limit: 20, windowMs: 60 * 60 * 1000 }, // CẢ NHÓM chưa duyệt cộng lại (chống tạo hàng loạt tài khoản)
};

/** Ký tự điều khiển: 0-8, 11, 12, 14-31, 127 (giữ lại tab=9, xuống dòng=10, về đầu dòng=13). */
function isControl(code) {
  return (code >= 0 && code <= 8) || code === 11 || code === 12 || (code >= 14 && code <= 31) || code === 127;
}

/** Cắt chuỗi + bỏ ký tự điều khiển. Không phải chuỗi → ''. Chỉ duyệt tối đa 4×max ký tự đầu (không quét chuỗi khổng lồ). */
function cleanText(v, max) {
  if (typeof v !== 'string') return '';
  const src = v.length > max * 4 ? v.slice(0, max * 4) : v;
  let out = '';
  for (const ch of src) {
    if (isControl(ch.codePointAt(0))) continue;
    if (out.length + ch.length > max) break;
    out += ch;
  }
  return out;
}

/** roles có thể tới dưới dạng mảng HOẶC object {0:..,1:..} (RTDB lưu mảng thưa thành object). */
function cleanRoles(v, whitelist) {
  let arr = [];
  if (Array.isArray(v)) arr = v.slice(0, 64);
  else if (v && typeof v === 'object') arr = Object.keys(v).slice(0, 64).map((k) => v[k]);
  const out = [];
  for (const r of arr) {
    if (typeof r !== 'string') continue;
    if (whitelist.indexOf(r) < 0) continue; // kênh lạ → bỏ, KHÔNG báo lỗi (không lộ danh sách kênh)
    if (out.indexOf(r) < 0) out.push(r);
    if (out.length >= MAX_ROLES) break;
  }
  return out;
}

function isApproved(profile, email) {
  if (profile && profile.approved === true) return true;
  return FIXED_EMAILS.indexOf(String(email || '').toLowerCase()) >= 0;
}

/** Tên người: chỉ giữ chữ cái (mọi ngôn ngữ, kể cả dấu tiếng Việt) và dấu cách → không còn chỗ cho link/số/ký hiệu. */
function safeName(v) {
  const s = cleanText(v, 300);
  const afterColon = s.indexOf(':') >= 0 ? s.slice(s.indexOf(':') + 1) : s; // "🔐 Đăng ký mới: Tên" → "Tên"
  const only = afterColon.replace(/[^\p{L}\p{M} ]/gu, ' ').replace(/ +/g, ' ').trim();
  return only.slice(0, MAX_NAME);
}

/**
 * Thông báo của người CHƯA được duyệt: MÁY CHỦ tự soạn theo khuôn, không chuyển tiếp chữ của người gửi.
 * Giữ lại đúng 3 thứ: tên (chỉ chữ cái, ≤40), mã 6 số, và EMAIL ĐĂNG NHẬP THẬT do Google xác thực
 * (người gửi không giả được) → Dũng nhìn là biết tài khoản nào đang xin vào.
 * Không có mã 6 số → không phải luồng đăng ký → trả null (chặn).
 */
function composeUnapproved(item, senderEmail) {
  const it = (item && typeof item === 'object') ? item : {};
  const m = /(?:^|[^0-9])([0-9]{6})(?:[^0-9]|$)/.exec(cleanText(it.body, 200));
  if (!m) return null;
  const name = safeName(it.title) || 'chưa rõ tên';
  const email = cleanText(String(senderEmail || ''), 80) || 'không rõ email';
  return {
    title: cleanText('🔐 Đăng ký mới: ' + name, MAX_TITLE),
    body: cleanText('Mã xác nhận: ' + m[1] + ' | Tài khoản: ' + email, MAX_BODY),
  };
}

/**
 * Quyết định 1 gói tin trong hàng đợi push-queue của app 379 có được gửi không.
 * @param item    dữ liệu thô người dùng ghi vào (KHÔNG tin bất cứ trường nào)
 * @param sender  {authType:'ADMIN'|'USER'|'UNAUTHENTICATED', uid, email, profile:{approved}}
 *                — lấy từ context của Cloud Functions (do Google xác thực), KHÔNG lấy từ item
 * @returns {ok, reason, title, body, roles, tier}
 */
function authorizeQueueItem(item, sender) {
  const it = (item && typeof item === 'object') ? item : {};
  const title = cleanText(it.title, MAX_TITLE);
  const body = cleanText(it.body, MAX_BODY);
  let roles = cleanRoles(it.roles, ROLES_379);
  if (!title) return { ok: false, reason: 'thieu-tieu-de' };
  if (!roles.length) return { ok: false, reason: 'khong-co-kenh-hop-le' };

  const s = sender || {};
  // Ghi bằng quyền quản trị (Console / CLI / Admin SDK) — đã qua xác thực của Google Cloud
  if (s.authType === 'ADMIN') return { ok: true, tier: 'admin', title, body, roles };
  // Không đăng nhập: luật database vốn đã chặn; tới được đây là bất thường → từ chối
  if (s.authType !== 'USER' || !s.uid) return { ok: false, reason: 'chua-dang-nhap' };

  if (isApproved(s.profile, s.email)) return { ok: true, tier: 'approved', title, body, roles };

  // CHƯA được duyệt (kể cả người lạ vừa tự đăng ký): chỉ tới được Dũng, nội dung do máy chủ soạn
  roles = roles.filter((r) => r === 'dung');
  if (!roles.length) return { ok: false, reason: 'chua-duyet-khong-duoc-gui-kenh-nay' };
  const composed = composeUnapproved(it, s.email);
  if (!composed) return { ok: false, reason: 'chua-duyet-khong-phai-luong-dang-ky' };
  return { ok: true, tier: 'unapproved', title: composed.title, body: composed.body, roles };
}

/** So khoá bí mật an toàn: băm cả hai về 32 byte rồi so thời-gian-hằng (không lộ độ dài, không lộ vị trí sai). */
function keyMatchesHash(providedKey, storedHashHex) {
  if (typeof providedKey !== 'string' || providedKey.length < 32 || providedKey.length > 256) return false;
  if (typeof storedHashHex !== 'string' || !/^[0-9a-f]{64}$/.test(storedHashHex)) return false;
  const a = crypto.createHash('sha256').update(providedKey, 'utf8').digest();
  const b = Buffer.from(storedHashHex, 'hex');
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

/** So 2 chuỗi bí mật thời-gian-hằng (dùng cho khoá gửi thử Telegram đang lưu dạng rõ). */
function secretEquals(provided, expected) {
  if (typeof provided !== 'string' || typeof expected !== 'string' || !expected) return false;
  if (provided.length > 512) return false;
  const a = crypto.createHash('sha256').update(provided, 'utf8').digest();
  const b = crypto.createHash('sha256').update(expected, 'utf8').digest();
  return crypto.timingSafeEqual(a, b);
}

/** Lấy khoá từ HEADER (không nhận qua URL/body: URL hay bị ghi vào nhật ký, lịch sử trình duyệt, proxy). */
function keyFromHeaders(headers) {
  const h = headers || {};
  const direct = h['x-push-key'];
  if (typeof direct === 'string' && direct) return direct.trim();
  const auth = h.authorization;
  if (typeof auth === 'string' && /^Bearer\s+/i.test(auth)) return auth.replace(/^Bearer\s+/i, '').trim();
  return '';
}

/**
 * Giới hạn tần suất theo cửa sổ cố định — hàm THUẦN, dùng bên trong transaction của RTDB.
 * @returns trạng thái mới {start, count}
 */
function nextRateState(cur, now, windowMs) {
  if (!cur || typeof cur.start !== 'number' || typeof cur.count !== 'number' || now - cur.start >= windowMs || now < cur.start) {
    return { start: now, count: 1 };
  }
  return { start: cur.start, count: cur.count + 1 };
}

/**
 * Công tắc enforce/monitor CÓ HẠN DÙNG. Chỉ coi là 'monitor' khi giá trị là object {mode:'monitor', until:<ms>}
 * với until còn hiệu lực và không xa quá 24 giờ. Mọi dạng khác (kể cả chuỗi 'monitor' trần) = 'enforce'
 * → không thể "quên bật lại": hết hạn là tự đóng.
 */
function resolveAuthMode(raw, now) {
  if (!raw || typeof raw !== 'object') return 'enforce';
  if (raw.mode !== 'monitor' || typeof raw.until !== 'number') return 'enforce';
  if (raw.until <= now || raw.until - now > 24 * 60 * 60 * 1000) return 'enforce';
  return 'monitor';
}

module.exports = {
  ROLES_379, FIXED_EMAILS, RATE, MAX_TITLE, MAX_BODY, MAX_NAME,
  cleanText, cleanRoles, isApproved, safeName, composeUnapproved, authorizeQueueItem,
  keyMatchesHash, secretEquals, keyFromHeaders, nextRateState, resolveAuthMode,
};
