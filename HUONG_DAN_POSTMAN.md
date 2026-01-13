# Hướng dẫn sử dụng Postman để test API

## 🎯 Tại sao phải dùng Postman?

### 1. **Test API nhanh chóng và chính xác**
- Không cần viết code frontend để test backend
- Kiểm tra API hoạt động đúng trước khi tích hợp vào frontend
- Debug lỗi dễ dàng hơn (xem request/response chi tiết)

### 2. **Tái sử dụng và chia sẻ**
- Lưu tất cả API endpoints vào 1 file .json
- Chia sẻ cho team members để cùng test
- Không cần nhớ URL, headers, body của từng API

### 3. **Tự động hóa**
- Token được lưu tự động sau khi login
- Các biến (userId, doctorId, scheduleId) được set tự động
- Không cần copy-paste token cho mỗi request

### 4. **Kiểm tra vấn đề của bạn**
Với vấn đề "bệnh nhân thấy lịch chưa duyệt", bạn có thể:
- Test trực tiếp API `/schedule/doctor/:id` với tham số `includeAll=false`
- Xem response trả về có đúng chỉ lịch `status=approved` không
- So sánh kết quả giữa role bệnh nhân và bác sĩ

---

## 📥 Cách import Postman Collection

### Bước 1: Cài đặt Postman
1. Tải Postman tại: https://www.postman.com/downloads/
2. Cài đặt và mở Postman

### Bước 2: Import Collection
1. Mở Postman
2. Click nút **Import** (góc trên bên trái)
3. Chọn tab **Upload Files**
4. Duyệt đến file: `postman/Medical_Booking_API.postman_collection.json`
5. Click **Import**

### Bước 3: Kiểm tra Collection
Sau khi import, bạn sẽ thấy collection **"Medical Booking API"** với các folder:
- 1. Authentication (Login, Get Current User)
- 2. Users (Register, CRUD users)
- 3. Doctors (Get doctors, by specialty)
- 4. Specialties (CRUD specialties)
- 5. Schedules (CRUD schedules, approve/reject)
- 6. Bookings (Create, get, cancel bookings)
- 7. Allcodes (CRUD allcodes)

---

## 🚀 Cách sử dụng để test vấn đề của bạn

### Test Case: Bệnh nhân không được thấy lịch chưa duyệt

#### **Bước 1: Đảm bảo backend đang chạy**
```bash
cd backend
npm start
```
Backend phải chạy ở `http://localhost:8080`

#### **Bước 2: Login với tài khoản bác sĩ**
1. Mở folder **"1. Authentication"**
2. Click request **"Login - Doctor"**
3. Click nút **Send**
4. Kiểm tra response:
   ```json
   {
     "success": true,
     "token": "eyJhbGc...",
     "userId": 17,
     "roleId": "R2"
   }
   ```
5. Token sẽ tự động được lưu vào biến `{{token}}`

#### **Bước 3: Tạo lịch làm việc (status = pending)**
1. Mở folder **"5. Schedules"**
2. Click request **"Create Schedule (Doctor)"**
3. Sửa body nếu cần:
   ```json
   {
     "doctorId": 17,
     "date": "2026-01-15",
     "timeType": "T1",
     "maxNumber": 10
   }
   ```
4. Click **Send**
5. Lưu ý `scheduleId` trong response (ví dụ: `id: 123`)

#### **Bước 4: Kiểm tra lịch với includeAll=true (Bác sĩ/Admin)**
1. Click request **"Get Doctor Schedules (with includeAll)"**
2. Sửa URL params:
   - `doctorId`: 17
   - `date`: 2026-01-15
   - `includeAll`: true
3. Click **Send**
4. **Kết quả mong đợi**: Thấy cả lịch `status: "pending"`

#### **Bước 5: Kiểm tra lịch với includeAll=false (Bệnh nhân)**
1. Click request **"Get Doctor Schedules (Patient View)"**
2. Sửa URL params:
   - `doctorId`: 17
   - `date`: 2026-01-15
   - `includeAll`: false
3. Click **Send**
4. **Kết quả mong đợi**: KHÔNG thấy lịch `status: "pending"` (mảng rỗng hoặc chỉ có lịch approved)

#### **Bước 6: Duyệt lịch (Admin)**
1. Login với admin: Click **"Login - Admin"** → Send
2. Click request **"Approve Schedule"**
3. Sửa URL: `/schedule/123/approve` (thay 123 bằng scheduleId của bạn)
4. Click **Send**

#### **Bước 7: Kiểm tra lại với includeAll=false**
1. Lặp lại Bước 5
2. **Kết quả mong đợi**: Bây giờ thấy lịch vì `status: "approved"`

---

## 🔍 Debug với Postman

### Xem Request Details
- Tab **Headers**: Xem token có được gửi đúng không
- Tab **Body**: Xem dữ liệu gửi lên
- Tab **Params**: Xem query parameters (includeAll, date, etc.)

### Xem Response Details
- Tab **Body**: Xem dữ liệu trả về
- Tab **Headers**: Xem response headers
- **Status Code**: 200 (OK), 400 (Bad Request), 401 (Unauthorized), etc.

### Console Log
- Mở **Postman Console** (View → Show Postman Console)
- Xem chi tiết request/response
- Xem log từ backend (nếu có)

---

## 📝 Các biến trong Collection

Collection đã cấu hình sẵn các biến:

| Biến | Mô tả | Tự động set |
|------|-------|-------------|
| `{{baseUrl}}` | http://localhost:8080/api | Không |
| `{{token}}` | JWT token sau khi login | Có (sau login) |
| `{{userId}}` | ID của user hiện tại | Có (sau login) |
| `{{doctorId}}` | ID của bác sĩ | Có (sau get doctors) |
| `{{patientId}}` | ID của bệnh nhân | Có (sau login patient) |
| `{{specialtyId}}` | ID của chuyên khoa | Có (sau get specialties) |
| `{{scheduleId}}` | ID của lịch làm việc | Thủ công |
| `{{bookingId}}` | ID của booking | Thủ công |

### Cách xem/sửa biến:
1. Click vào collection **"Medical Booking API"**
2. Tab **Variables**
3. Xem/sửa giá trị trong cột **Current Value**

---

## 🎓 Tài khoản test có sẵn

```
Admin:
  Email: admin@example.com
  Password: 123456
  Role: R3

Doctor:
  Email: doctor16@example.com (hoặc doctor17@example.com)
  Password: 123456
  Role: R2

Patient:
  Email: patient@example.com
  Password: 123456
  Role: R1
```

---

## ⚠️ Lưu ý

1. **Backend phải chạy trước**: Đảm bảo `npm start` trong folder backend
2. **Port đúng**: Mặc định là 8080, nếu khác thì sửa biến `{{baseUrl}}`
3. **Token hết hạn**: Nếu API trả về 401, login lại để lấy token mới
4. **Database**: Đảm bảo database có dữ liệu test

---

## 🐛 Troubleshooting

### Lỗi "Could not get response"
- Kiểm tra backend có đang chạy không
- Kiểm tra port có đúng không (8080)
- Kiểm tra firewall/antivirus

### Lỗi 401 Unauthorized
- Token hết hạn → Login lại
- Token không được gửi → Kiểm tra header Authorization

### Lỗi 400 Bad Request
- Kiểm tra body request có đúng format không
- Kiểm tra required fields có đủ không

### Lỗi 404 Not Found
- Kiểm tra URL có đúng không
- Kiểm tra ID có tồn tại trong database không

---

## 📚 Tài liệu thêm

- Postman Documentation: https://learning.postman.com/
- API Testing Best Practices: https://www.postman.com/api-platform/api-testing/
- File README chi tiết: `postman/README.md`
