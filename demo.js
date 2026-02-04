const { calculateRentalCost, isOverlapping, validateBooking } = require("./Helper files/Validate");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const existingBooking = { start: "2026-01-10", end: "2026-01-15" };
const pricePerDay = 500000;

console.log("=== HỆ THỐNG ĐẶT XE AUTORENT PRO ===");
console.log(
  `Lưu ý: Xe đang bận từ ${existingBooking.start} đến ${existingBooking.end}`
);

rl.question("Nhập ngày bắt đầu (YYYY-MM-DD): ", (startDateInput) => {
  rl.question("Nhập ngày kết thúc (YYYY-MM-DD): ", (endDateInput) => {
    const startDate = startDateInput.trim();
    const endDate = endDateInput.trim();

    if (!startDate || !endDate) {
      console.log("❌ Lỗi: Bạn không được để trống ngày tháng!");
      rl.close();
      return;
    }

    const newRequest = {
      carId: "CAR-999",
      startDate: startDate,
      endDate: endDate,
    };

    console.log("\n--- ĐANG XỬ LÝ ---");

    const checkValidation = validateBooking(newRequest);
    if (!checkValidation.valid) {
      console.log(checkValidation.message);
      rl.close();
      return;
    }

    const hasOverlap = isOverlapping(
      newRequest.startDate,
      newRequest.endDate,
      existingBooking.start,
      existingBooking.end
    );

    if (hasOverlap) {
      console.log("❌ THẤT BẠI: Xe đã có người đặt trong thời gian này!");
    } else {
      console.log("✅ THÀNH CÔNG: Xe còn trống.");

      const totalAmount = calculateRentalCost(
        newRequest.startDate,
        newRequest.endDate,
        pricePerDay
      );
      console.log(`💰 Tổng tiền thuê: ${totalAmount.toLocaleString()} VND`);
    }

    rl.close();
  });
});
