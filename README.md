# AutoRent Pro – Hệ thống thuê xe (Chương 1–10)

Backend + View EJS cho hệ thống quản lý thuê xe. Có Auth (JWT), phân quyền Customer / Owner / Admin.

## Yêu cầu

- Node.js (khuyến nghị 18+)
- MongoDB (local hoặc Atlas)
- npm

## Cài đặt

```bash
# Clone / mở thư mục project
cd autorent-pro

# Cài dependency
npm install
```

## Biến môi trường

Tạo file `.env` trong thư mục gốc:

```env
MONGO_URI=mongodb://localhost:27017/autorent
JWT_SECRET=do-doi-secret-nay-trong-production
JWT_EXPIRES=7d
```

- `MONGO_URI`: Chuỗi kết nối MongoDB (vd: `mongodb://localhost:27017/autorent` hoặc MongoDB Atlas).
- `JWT_SECRET`: Secret dùng ký JWT (bắt buộc đổi khi deploy).
- `JWT_EXPIRES`: Thời hạn token (vd: `7d`, `24h`).

## Chạy project

```bash
# Chạy server (port 3000)
npm start

# Hoặc chạy với nodemon (tự reload khi đổi code)
npm run dev
```

Mở trình duyệt:

- **Web (EJS):** http://localhost:3000  
- **API:** http://localhost:3000/api/v1/...

## API (Chương 10 – Auth & Security)

### Auth (không cần token)

| Method | URL | Mô tả |
|--------|-----|--------|
| POST | `/api/v1/auth/register` | Đăng ký (name, email, phone, password, role?) |
| POST | `/api/v1/auth/login` | Đăng nhập (email, password) → trả về `token` |

**Header cho các API cần đăng nhập:**  
`Authorization: Bearer <token>`

### Cars (public)

| Method | URL | Mô tả |
|--------|-----|--------|
| GET | `/api/v1/cars` | Danh sách xe (query: `?status=AVAILABLE`) |

### Bookings (cần đăng nhập)

| Method | URL | Mô tả | Phân quyền |
|--------|-----|--------|------------|
| GET | `/api/v1/bookings` | Danh sách booking | Customer: chỉ của mình; Admin: có thể `?userId=...` |
| POST | `/api/v1/bookings` | Tạo booking (body: carId, startDate, endDate) | Mọi role |
| GET | `/api/v1/bookings/:id` | Chi tiết booking | Customer: chỉ của mình; Owner: xe mình; Admin: tất cả |
| PATCH | `/api/v1/bookings/:id/cancel` | Hủy booking | Chủ booking hoặc Admin |
| GET | `/api/v1/bookings/owner/bookings` | Booking của xe thuộc owner | Chỉ **owner** |
| GET | `/api/v1/bookings/admin/bookings/summary` | Tổng hợp booking | Chỉ **admin** |

### Users (cần đăng nhập)

| Method | URL | Mô tả | Phân quyền |
|--------|-----|--------|------------|
| GET | `/api/v1/users/:id/bookings` | Lịch sử thuê xe của user | Customer: chỉ `id` = mình; Admin/Owner: xem user khác |

## Phân quyền (Chương 10)

- **Customer:** Chỉ xem/tạo/hủy booking của mình, xem lịch sử của mình.
- **Owner:** Quản lý xe của mình; xem booking liên quan xe mình (`/api/v1/bookings/owner/bookings`).
- **Admin:** Xem toàn hệ thống, tổng hợp booking, hủy booking bất kỳ.

## Business rules

- Ngày bắt đầu thuê không được trong quá khứ; ngày kết thúc phải sau ngày bắt đầu.
- Mật khẩu mã hóa bằng bcrypt; API đăng nhập trả JWT.
- Booking: `pending` → `confirmed` / `cancelled` / `completed`.

## Cấu trúc thư mục (chính)

```
├── app.js
├── db.js
├── .env
├── Helper files/
│   └── Validate.js       # Validate booking, email, phone, pricing, overlap
├── models/
│   ├── user.js           # User + password (bcrypt)
│   ├── cars.js
│   ├── booking.js
│   └── contract.js
├── controllers/
│   ├── authController.js
│   ├── bookingController.js
│   ├── carController.js
│   └── viewController.js
├── middlewares/
│   ├── auth.js           # JWT
│   └── authorize.js      # Phân quyền theo role
├── routes/
│   ├── auth.js
│   ├── bookings.js
│   ├── cars.js
│   ├── users.js
│   └── views.js
├── views/                # EJS (Bootstrap 5)
├── public/
├── tests/
│   └── validationTests.js
└── README.md
```

## Test validation

```bash
node tests/validationTests.js
```

## Postman

Import file `AutoRent_Pro_Postman_Collection.json` vào Postman để test API.

1. **Auth:** Gọi `Register` hoặc `Login` → copy `data.token`.
2. **Các request cần token:** Tab **Authorization** chọn **Bearer Token**, dán token.
# PracticeDeploy-SDN-Ass1
