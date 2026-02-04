# 📚 TỔNG HỢP TẤT CẢ COLLECTIONS/OBJECTS TRONG DATABASE

## 1. Collection: `users`

### Schema:
```javascript
{
  _id: ObjectId,                    // Tự động tạo
  name: String,                     // Bắt buộc
  email: String,                    // Bắt buộc, unique
  phone: String,                    // Bắt buộc
  role: String,                     // Enum: 'customer', 'admin', 'owner'
                                    // Default: 'customer'
  status: String,                  // Enum: 'active', 'inactive'
                                    // Default: 'active'
  createdAt: Date,                 // Tự động tạo
  updatedAt: Date                  // Tự động cập nhật
}
```

### Ví dụ Object:
```json
{
  "_id": ObjectId("67890abcdef1234567890126"),
  "name": "Car Owner",
  "email": "owner@example.com",
  "phone": "0901234567",
  "role": "owner",
  "status": "active",
  "createdAt": "2026-01-19T07:00:00.000Z",
  "updatedAt": "2026-01-19T07:00:00.000Z"
}
```

---

## 2. Collection: `cars`

### Schema:
```javascript
{
  _id: ObjectId,                    // Tự động tạo
  carId: String,                    // Bắt buộc, unique (ví dụ: "CAR-101")
  brand: String,                    // Bắt buộc (ví dụ: "Toyota")
  model: String,                    // Bắt buộc (ví dụ: "Camry")
  pricePerDay: Number,              // Bắt buộc (ví dụ: 800000)
  status: String,                   // Enum: 'AVAILABLE', 'RENTED', 'MAINTENANCE'
                                    // Default: 'AVAILABLE'
  ownerId: ObjectId,                // Bắt buộc, ref: "User"
                                    // Lưu ý: Trong database vẫn dùng ownerId
                                    // Nhưng API nhận userId từ query params
  createdAt: Date,                 // Tự động tạo
  updatedAt: Date                  // Tự động cập nhật
}
```

### Ví dụ Object:
```json
{
  "_id": ObjectId("67890abcdef1234567890124"),
  "carId": "CAR-101",
  "brand": "Toyota",
  "model": "Camry",
  "pricePerDay": 800000,
  "status": "AVAILABLE",
  "ownerId": ObjectId("67890abcdef1234567890126"),
  "createdAt": "2026-01-19T07:00:00.000Z",
  "updatedAt": "2026-01-19T07:00:00.000Z"
}
```

---

## 3. Collection: `bookings`

### Schema:
```javascript
{
  _id: ObjectId,                    // Tự động tạo
  carId: ObjectId,                 // Bắt buộc, ref: "Car"
  customerId: ObjectId,            // Bắt buộc, ref: "User"
  startDate: Date,                 // Bắt buộc
  endDate: Date,                   // Bắt buộc, phải sau startDate
  totalPrice: Number,               // Tự động tính (pre-save hook)
  paymentStatus: String,            // Enum: 'unpaid', 'paid', 'refunded'
                                    // Default: 'unpaid'
  bookingStatus: String,             // Enum: 'pending', 'confirmed', 'cancelled', 'completed'
                                    // Default: 'pending'
  createdAt: Date,                 // Tự động tạo
  updatedAt: Date                  // Tự động cập nhật
}
```

### Ví dụ Object:
```json
{
  "_id": ObjectId("696dd8429c2879cd9c54d0bf"),
  "carId": ObjectId("67890abcdef1234567890124"),
  "customerId": ObjectId("67890abcdef1234567890127"),
  "startDate": "2026-01-20T08:00:00.000Z",
  "endDate": "2026-01-22T17:00:00.000Z",
  "totalPrice": 2400000,
  "paymentStatus": "unpaid",
  "bookingStatus": "pending",
  "createdAt": "2026-01-19T07:07:46.726Z",
  "updatedAt": "2026-01-19T07:07:46.726Z"
}
```

---

## 4. Collection: `contracts` (nếu có)

### Schema:
```javascript
{
  _id: ObjectId,                    // Tự động tạo
  bookingId: ObjectId,             // Bắt buộc, ref: "Booking"
  contractNumber: String,           // Bắt buộc, unique
  status: String,                   // Enum: 'draft', 'signed', 'expired'
                                    // Default: 'draft'
  signedDate: Date,                 // Optional
  createdAt: Date,                 // Tự động tạo
  updatedAt: Date                  // Tự động cập nhật
}
```

---

## 🔗 QUAN HỆ GIỮA CÁC COLLECTIONS

```
User (owner)
  ↓ (ownerId)
Car
  ↓ (carId)
Booking
  ↓ (customerId)
User (customer)
```

### Chi tiết:
- **User** có thể là:
  - `owner`: Sở hữu Car
  - `customer`: Thuê Car (tạo Booking)
  - `admin`: Quản trị viên

- **Car** thuộc về **User** (owner) qua field `ownerId`

- **Booking** liên kết:
  - `carId` → **Car**
  - `customerId` → **User** (customer)

---

## 📝 LƯU Ý QUAN TRỌNG

### Về `ownerId` vs `userId`:

1. **Trong Database (Car model)**:
   - Field vẫn là `ownerId` (không đổi)
   - Đây là field trong schema, cần giữ nguyên

2. **Trong API (query params)**:
   - API nhận `userId` từ query params
   - Code sẽ convert `userId` → `ownerId` để tìm Car

3. **Flow hoạt động**:
   ```
   API nhận: ?userId=123
   ↓
   Code convert: ownerId = userId
   ↓
   Tìm Car: Car.find({ ownerId: userId })
   ```

---

## 🎯 TÓM TẮT

| Collection | Số lượng fields | Key fields | References |
|------------|----------------|------------|------------|
| `users` | 7 | `_id`, `email` | - |
| `cars` | 8 | `_id`, `carId`, `ownerId` | → User |
| `bookings` | 10 | `_id`, `carId`, `customerId` | → Car, User |
| `contracts` | 7 | `_id`, `contractNumber`, `bookingId` | → Booking |

---

## 📋 CHECKLIST KHI TẠO DỮ LIỆU

- [ ] User (owner) có role = "owner"
- [ ] User (customer) có role = "customer"
- [ ] Car có `ownerId` = `_id` của User (owner)
- [ ] Booking có `carId` = `_id` của Car
- [ ] Booking có `customerId` = `_id` của User (customer)
