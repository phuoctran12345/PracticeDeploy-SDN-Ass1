// Chạy: node tests/validationTests.js
const { validateBooking, calculateRentalCost, isOverlapping, validateEmail, validatePhone, validateName } = require('../Helper files/Validate');

const ok = (name, cond) => (cond ? (console.log('  ✓', name), true) : (console.log('  ✗', name), false));
let pass = 0, fail = 0;
const t = (name, cond) => { if (cond) pass++; else fail++; return ok(name, cond); };

const tom = new Date(); tom.setDate(tom.getDate() + 1);
const day2 = new Date(); day2.setDate(day2.getDate() + 2);
const iso = (d) => d.toISOString().slice(0, 16);

console.log('\n--- Booking ---');
t('carId rỗng', !validateBooking({ carId: '', startDate: iso(tom), endDate: iso(day2) }).valid);
t('endDate ≤ startDate', !validateBooking({ carId: 'X', startDate: iso(tom), endDate: iso(tom) }).valid);
const yesterday = new Date(); yesterday.setDate(yesterday.getDate() - 1);
t('ngày bắt đầu quá khứ → invalid', !validateBooking({ carId: 'X', startDate: iso(yesterday), endDate: iso(tom) }).valid);
t('hợp lệ', validateBooking({ carId: 'CAR-1', startDate: iso(tom), endDate: iso(day2) }).valid);

console.log('\n--- Pricing ---');
const d1 = new Date('2026-02-01'), d2 = new Date('2026-02-02'), d5 = new Date('2026-02-05');
t('1 ngày = 800k', calculateRentalCost(d1, d2, 800000) === 800000);
t('4 ngày = 3.2M', calculateRentalCost(d1, d5, 800000) === 3200000);

console.log('\n--- Trùng lịch ---');
const e1 = new Date('2026-02-01'), e3 = new Date('2026-02-03');
t('trùng', isOverlapping('2026-02-02', '2026-02-02', e1, e3));
t('không trùng', !isOverlapping('2026-02-05', '2026-02-06', e1, e3));

console.log('\n--- Email / Phone / Tên ---');
t('email sai', !validateEmail('x').valid);
t('email đúng', validateEmail('a@b.com').valid);
t('phone sai', !validatePhone('abc').valid);
t('phone đúng', validatePhone('0936929381').valid);
t('tên ngắn', !validateName('A').valid);
t('tên đủ', validateName('THP').valid);

console.log('\nKết quả: Pass', pass, '| Fail', fail);
