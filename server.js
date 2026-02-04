const http = require("http");

const fs = require("fs");
const path = require("path");


const { isOverlapping, validateBooking, calculateRentalCost } = require('./Helper files/Validate');

const PORT= 3000;

//============================================================
// mockup data
const cars = [
    {
        carId: "CAR-101",
        brand: "Toyota",
        model: "Camry",
        status: "AVAILABLE",
        pricePerDay: 800000
    },
    {  carId: "CAR-101",
    brand: "Toyota",
    model: "Camry",
    status: "AVAILABLE",
    pricePerDay: 800000},
    
    {  carId: "CAR-101",
    brand: "Toyota",
    model: "Camry",
    status: "AVAILABLE",
    pricePerDay: 800000}
]

//============================================================
// READ -WRITE FILE
const BOOKINGS_FILE = path.join(__dirname, 'data', 'bookings.json');

// READ FILE
function readBookings() {
    try {
        const data = fs.readFileSync(BOOKINGS_FILE,'utf8');
        return JSON.parse(data);
    } catch(error) {
        return [];
    }
}

// WRITE FILE
function writeBookings(bookings) {
    fs.writeFileSync(BOOKINGS_FILE, JSON.stringify(bookings, null, 2));
}


//============================================================
// FILLTER DATA
const url = require('url');



const server = http.createServer((req, res) => {
    const { method } = req;

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;  // '/cars'
    const query = parsedUrl.query;        // { status: 'AVAILABLE' }

    // Set header
    res.setHeader("Content-Type", "application/json");

    // Routing
    if (method === 'GET' && pathname === '/cars') {
        let result = cars; // khởi tạo giá trị trả về

        if (query.status) {
            result = result.filter(car => 
                car.status.toUpperCase() === query.status.toUpperCase()
            );
        }

        if (query.brand) {
            result = result.filter(car => 
                car.brand.toLowerCase() === query.brand.toLowerCase()
            );
        }
        
        res.statusCode = 200;
        res.end(JSON.stringify({data: result})); 
    } else if (method === 'POST' && pathname === '/bookings') {
        let body = '';

        // chunk: Nghĩa là "một mảnh". Khi khách gửi một file hoặc một đoạn JSON lớn, Node.js sẽ chia nhỏ nó ra.
        req.on('data', (chunk) => { 
            body += chunk.toString();
        });

        req.on('end' , () => {
            const bookingData = JSON.parse(body);



            const validation = validateBooking(bookingData);
            
            // 1.Validate dữ liệu đầu vào
            if (!validation.valid) {
                res.statusCode = 400;
                res.end(JSON.stringify({message:"Booking không hợp lệ!"}));
                return;
            }

            // 2. check xe có tồn tại không
            const car = cars.find(c => c.carId === bookingData.carId);
            if (!car) {
                res.statusCode = 404;
                res.end(JSON.stringify({message:"Xe không tồn tại!"}));
                return;
            }

            // 3. Kiểm tra trùng lịch
            const bookings = readBookings();
            let available = true;
            
            for (let existingBooking of bookings) {
                if (existingBooking.carId === bookingData.carId) {
                    const overlap = isOverlapping(
                        new Date(bookingData.startDate),
                        new Date(bookingData.endDate),
                        new Date(existingBooking.startDate),
                        new Date(existingBooking.endDate)
                    );
                    if (overlap) {
                        available = false;
                        break;
                    }
                }
            }
            
            if (!available) {
                res.statusCode = 400;
                res.end(JSON.stringify({message:"Xe không sẵn sàng!"}));
                return;
            }
            
            // 4. Tính tiền
            const price = calculateRentalCost(
                new Date(bookingData.startDate),
                new Date(bookingData.endDate),
                car.pricePerDay
            );

            // 5. Tạo booking object hoàn chỉnh
            const newBooking = {
                bookingId: `BK-${Date.now()}`,
                ...bookingData,
                totalPrice: price,
                paymentStatus: 'unpaid',
                bookingStatus: 'pending',
                createdAt: new Date().toISOString()
            };

            // 6. Đọc lại bookings (đã đọc ở bước 3)
            
            // 7. Thêm booking mới vào mảng
            bookings.push(newBooking);
            
            // 8. Lưu lại vào file
            writeBookings(bookings);
            
            // Thông báo thành công
            res.statusCode = 201;
            res.end(JSON.stringify({message: "Booking thành công!", data: newBooking})); 
        })
    } else if(method === 'GET' && pathname === '/bookings') {
        let bookings = readBookings();

        if (query.userId) {
            bookings = bookings.filter(b => b.customerId === query.userId);
        }

        res.statusCode = 200;
        res.end(JSON.stringify({message:"Danh sách booking", data: bookings}));
    } else {
        res.statusCode = 404;
        res.end(JSON.stringify({message:"Route không tồn tại!"}));
    }
})

server.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
})