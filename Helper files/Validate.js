/**
 * Toàn bộ validate & helper: Booking, Pricing, Availability, Email, Phone, Tên
 */

// --- User / form ---
function validateEmail(email) {
  if (!email || typeof email !== 'string') return { valid: false, message: 'Email không được để trống.' };
  const t = email.trim();
  if (!t) return { valid: false, message: 'Email không được để trống.' };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(t)) return { valid: false, message: 'Email không đúng định dạng (vd: user@mail.com).' };
  return { valid: true };
}

function validatePhone(phone) {
  if (!phone || typeof phone !== 'string') return { valid: false, message: 'Số điện thoại không được để trống.' };
  const t = phone.trim();
  if (!t) return { valid: false, message: 'Số điện thoại không được để trống.' };
  if (!/^[0-9]{10,11}$/.test(t)) return { valid: false, message: 'Số điện thoại 10–11 chữ số (vd: 0936929381).' };
  return { valid: true };
}

function validateName(name) {
  if (!name || typeof name !== 'string') return { valid: false, message: 'Tên không được để trống.' };
  if (name.trim().length < 2) return { valid: false, message: 'Tên cần ít nhất 2 ký tự.' };
  return { valid: true };
}

// --- Booking ---
function validateBooking(booking) {
  const { carId, startDate, endDate } = booking;
  if (!carId || String(carId).trim() === '') return { valid: false, message: 'Lỗi: Mã xe (carId) không được để trống.' };
  const start = new Date(startDate);
  const end = new Date(endDate);
  if (isNaN(start.getTime()) || isNaN(end.getTime())) return { valid: false, message: 'Lỗi: Định dạng ngày tháng không hợp lệ (Dùng YYYY-MM-DD).' };
  // So sánh theo ngày (năm-tháng-ngày) trên server, tránh lệch timezone
  const now = new Date();
  const startDay = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const todayDay = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  if (startDay < todayDay) return { valid: false, message: 'Lỗi: Ngày bắt đầu không được ở trong quá khứ.' };
  if (end <= start) return { valid: false, message: 'Lỗi: Ngày kết thúc phải sau ngày bắt đầu.' };
  return { valid: true, message: 'Thành công: Dữ liệu đặt xe hợp lệ.' };
}

// --- Pricing (tính tiền thuê) ---
function calculateRentalCost(startDate, endDate, pricePerDay) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  let diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
  if (diffDays === 0 && start.toDateString() === end.toDateString()) diffDays = 1;
  return diffDays > 0 ? diffDays * pricePerDay : 0;
}

// --- Availability (trùng lịch) ---
function isOverlapping(newStart, newEnd, existingStart, existingEnd) {
  const nS = new Date(newStart);
  const nE = new Date(newEnd);
  const eS = new Date(existingStart);
  const eE = new Date(existingEnd);
  return nS <= eE && nE >= eS;
}

module.exports = {
  validateEmail,
  validatePhone,
  validateName,
  validateBooking,
  calculateRentalCost,
  isOverlapping,
};
