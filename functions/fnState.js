/**
 * TRẠNG THÁI dùng chung của các Cloud Functions, lưu ở RTDB 379 dưới nhánh fn-state/
 * (nhánh này KHÔNG có luật đọc/ghi → mọi client bị từ chối; chỉ admin SDK chạm được).
 *
 *   fn-state/pushRate/<phạm-vi>/<uid> = {start, count}   bộ đếm giới hạn tần suất
 *   fn-state/config/pushAuthMode      = {mode:'monitor', until:<mốc thời gian ms>}   ← CÔNG TẮC KHẨN CẤP CÓ HẠN
 *        Bình thường KHÔNG có nút này → 'enforce': gói tin không hợp lệ bị CHẶN.
 *        Nếu nghi thông báo thật bị chặn nhầm: vào Firebase Console tạo nút trên với until = giờ hiện tại
 *        + vài giờ (tối đa 24 giờ) → hàm vẫn gửi như cũ và chỉ GHI NHẬT KÝ "lẽ ra chặn", không cần deploy.
 *        HẾT HẠN LÀ TỰ ĐÓNG LẠI (đội đỏ bắt: công tắc không hạn = mở toang rồi quên). Chuỗi 'monitor'
 *        trần, hạn quá 24 giờ, hay bất kỳ dạng lạ nào đều bị coi là 'enforce'.
 */
const admin = require('firebase-admin');
const { nextRateState, resolveAuthMode } = require('./pushGuard');

const DB_URL_379 = 'https://duyetchi-pva379-default-rtdb.asia-southeast1.firebasedatabase.app';

function rtdb379() {
  return admin.app().database(DB_URL_379);
}

/** uid chỉ gồm ký tự an toàn cho đường dẫn RTDB; khác thường → coi như 1 khoá chung 'la' (vẫn bị đếm). */
function safeKey(uid) {
  const s = String(uid || '');
  return /^[A-Za-z0-9_-]{1,128}$/.test(s) ? s : 'la';
}

/**
 * Tăng bộ đếm của (phạm vi, uid) và cho biết còn trong hạn mức không. Dùng transaction nên
 * nhiều lời gọi đồng thời không đếm hụt. Lỗi database → TỪ CHỐI (đóng khi hỏng, không mở).
 */
async function rateAllow(scope, uid, cfg) {
  const ref = rtdb379().ref('fn-state/pushRate/' + safeKey(scope) + '/' + safeKey(uid));
  const now = Date.now();
  try {
    const r = await ref.transaction((cur) => nextRateState(cur, now, cfg.windowMs));
    if (!r.committed || !r.snapshot.exists()) return false;
    return (r.snapshot.val().count || 0) <= cfg.limit;
  } catch (e) {
    console.error('rateAllow lỗi — từ chối cho an toàn', scope, e && e.message);
    return false;
  }
}

let _mode = { value: 'enforce', at: 0 };
/** Đọc công tắc enforce/monitor, nhớ 60 giây. Đọc lỗi hoặc giá trị lạ → 'enforce'. */
async function pushAuthMode() {
  const now = Date.now();
  if (now - _mode.at < 60 * 1000) return _mode.value;
  let v = 'enforce';
  try {
    const raw = (await rtdb379().ref('fn-state/config/pushAuthMode').once('value')).val();
    v = resolveAuthMode(raw, now);
  } catch (e) { /* giữ enforce */ }
  _mode = { value: v, at: now };
  return v;
}

module.exports = { DB_URL_379, rtdb379, rateAllow, pushAuthMode, safeKey };
