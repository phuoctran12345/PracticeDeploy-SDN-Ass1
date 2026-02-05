# Hướng dẫn deploy: Frontend (Vercel) + Backend (Railway)

## Cấu trúc dự án hiện tại

- **autorent-pro** là app **Express fullstack**: vừa render giao diện (EJS), vừa có API (`/api/v1/*`).
- **Backend** = toàn bộ Express (API + MongoDB + session).
- **Frontend** = EJS đang được serve từ chính Express (không tách riêng như React/Vue).

---

## 1. Deploy Backend lên Railway

Backend (Express + EJS + API) nên deploy **toàn bộ** lên Railway.

### Bước 1: Đẩy code lên GitHub

```bash
git add .
git commit -m "Prepare for Railway deploy"
git push origin main
```

### Bước 2: Tạo project trên Railway

1. Vào [railway.app](https://railway.app) → đăng nhập (có thể dùng GitHub).
2. **New Project** → **Deploy from GitHub repo** → chọn repo **autorent-pro** (hoặc repo bạn dùng).
3. Railway sẽ tự nhận **Node.js**, dùng lệnh:
   - **Build:** `npm install`
   - **Start:** `npm start` (trong `package.json` đã có `"start": "node app.js"`).

### Bước 3: Cấu hình biến môi trường (Environment Variables)

Trong project Railway → **Variables** → thêm đúng tên như trong `.env` của bạn (copy từ .env sang):

| Biến | Bắt buộc | Ghi chú |
|------|----------|--------|
| `MONGODB_CONNECTION_STRING` | Có | Chuỗi kết nối MongoDB (Atlas/Azure). Copy từ .env |
| `JWT_SECRET_KEY` | Có | Secret cho JWT. Copy từ .env |
| `SESSION_SECRET` | Nên có | Secret cho session web (đặt chuỗi bí mật bất kỳ nếu chưa có) |
| `COOKIE_SECURE` | Không | Nếu **đăng nhập không được** (sau khi submit vẫn thấy Khách): set `COOKIE_SECURE=false` (khi truy cập qua HTTP hoặc proxy đặc biệt) |
| `PORT` | Không | Railway tự gán, không cần tạo |

App đã đọc `MONGODB_CONNECTION_STRING` và `JWT_SECRET_KEY` giống .env local.

### Bước 4: Deploy và lấy URL

- Railway sẽ build và chạy, sau đó cho bạn **URL public** (dạng `https://xxx.up.railway.app`).
- Truy cập URL đó = vào luôn cả **web EJS** và **API** (vì cùng 1 app Express).

**Đăng nhập không được?** (submit xong vẫn thấy "Khách" / chưa đăng nhập): App đã bật `trust proxy` và cookie có thể tắt Secure. Trên Railway Variables thử thêm `COOKIE_SECURE=false` rồi redeploy. Nếu dùng đúng URL HTTPS của Railway thì thường không cần.

**Tóm tắt Backend:** 1 app Express trên Railway = cả giao diện (EJS) + API. Frontend (EJS) đang chạy cùng backend trên Railway.

---

## 2. Frontend trên Vercel (khi nào dùng?)

- Trong repo hiện tại **không có** frontend tách riêng (không có React/Vue/build static). Giao diện là **EJS** do Express render.
- Nếu bạn **chỉ** muốn:
  - **Backend (API + cả web EJS)** → dùng **Railway** như trên là đủ. **Không bắt buộc** dùng Vercel.

- Nếu bạn **muốn** “frontend Vercel” thật sự:
  - Cần làm **frontend riêng** (ví dụ React/Vue) gọi API từ **URL Railway**.
  - Deploy frontend đó (build static hoặc Next.js) lên **Vercel**.
  - Backend vẫn là Express trên **Railway** (chỉ cần API, có thể ẩn bớt route EJS nếu không dùng).

Trong ảnh bạn gửi, Vercel đang nhận repo là **Express** là đúng (vì đây là app Express). Nếu bạn deploy **cả repo này** lên Vercel thì sẽ thành **serverless functions** (Express trên Vercel), dễ phức tạp với MongoDB + session. Cách đơn giản: **backend (cả app) → Railway**, còn Vercel dùng sau khi có frontend riêng.

---

## 3. Tóm tắt nhanh

| Phần | Nên deploy ở đâu | Ghi chú |
|------|-------------------|--------|
| Backend (Express + EJS + API) | **Railway** | Set `MONGODB_CONNECTION_STRING`, `JWT_SECRET_KEY`, `SESSION_SECRET`; dùng `npm start` |
| Frontend (EJS hiện tại) | Đang nằm trong Backend → cũng trên **Railway** | Cùng 1 app |
| Frontend riêng (React/Vue sau này) | **Vercel** | Tách project mới, gọi API qua URL Railway |

Đã sửa `app.js` dùng `process.env.PORT || 3000` để chạy đúng trên Railway.
