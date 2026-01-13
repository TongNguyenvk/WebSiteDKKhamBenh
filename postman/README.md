# Medical Booking API - Postman Collection

## Hướng dẫn sử dụng

### 1. Import Collection
1. Mở Postman
2. Click **Import** > **Upload Files**
3. Chọn file `Medical_Booking_API.postman_collection.json`

### 2. Cấu hình
Collection đã được cấu hình sẵn với các biến:
- `baseUrl`: `http://localhost:8080/api`
- `token`: Tự động lưu sau khi login
- `userId`, `doctorId`, `patientId`: Tự động lưu
- `specialtyId`, `scheduleId`, `bookingId`: Tự động lưu

### 3. Thứ tự test

#### Bước 1: Authentication
1. **Login - Admin**: Đăng nhập với admin để test các API admin
2. **Login - Doctor**: Đăng nhập với bác sĩ để test API bác sĩ
3. **Login - Patient**: Đăng nhập với bệnh nhân để test API bệnh nhân

#### Bước 2: Test theo role

**Admin (R3):**
- Users: Get All, Register Doctor/Admin, Delete User
- Specialties: Create, Update, Delete, Upload Image
- Schedules: Get Pending, Approve, Reject
- Allcodes: All operations

**Doctor (R2):**
- Schedules: Create, Update, Delete (own schedules)
- Bookings: Get by Doctor

**Patient (R1):**
- Bookings: Create, Get by Patient, Cancel
- Doctors: View all
- Specialties: View all
- Schedules: View doctor schedules

### 4. Tài khoản test
```
Admin:    admin@example.com / 123456
Doctor:   doctor16@example.com / 123456
Patient:  patient@example.com / 123456
```

### 5. Tự động lưu token
Khi login thành công, token sẽ tự động được lưu vào biến `{{token}}` và sử dụng cho các request tiếp theo.

### 6. API Endpoints

| Module | Endpoint | Method | Auth |
|--------|----------|--------|------|
| Auth | /auth/login | POST | No |
| Auth | /auth/me | GET | Yes |
| Users | /users/register-patient | POST | No |
| Users | /users/register-doctor | POST | Admin |
| Users | /users/all | GET | Admin |
| Users | /users/:id | GET/PUT/DELETE | Yes |
| Doctors | /doctor | GET/POST | No/Admin |
| Doctors | /doctor/:id | GET/PUT/DELETE | No/Admin |
| Specialties | /specialties | GET/POST | No/Admin |
| Specialties | /specialties/:id | GET/PUT/DELETE | No/Admin |
| Schedules | /schedule | GET/POST | No/Doctor |
| Schedules | /schedule/doctor/:id | GET | No |
| Schedules | /schedule/doctor/:id?includeAll=false | GET | No (Patient view) |
| Schedules | /schedule/pending/list | GET | Admin |
| Schedules | /schedule/:id/approve | PUT | Admin |
| Bookings | /bookings | POST | Patient |
| Bookings | /bookings/doctor/:id | GET | Doctor |
| Bookings | /bookings/patient/:id | GET | Patient |

### 7. Test Case: Lọc lịch theo trạng thái duyệt

**Mục đích**: Đảm bảo bệnh nhân chỉ thấy lịch đã được admin duyệt

**Các bước test**:

1. **Login với Doctor** → Tạo lịch mới (status = pending)
2. **Test với includeAll=true** (Doctor/Admin view):
   - Request: `Get Doctor Schedules (with includeAll)`
   - Kết quả: Thấy cả lịch pending và approved
3. **Test với includeAll=false** (Patient view):
   - Request: `Get Doctor Schedules (Patient View - Only Approved)`
   - Kết quả: KHÔNG thấy lịch pending, chỉ thấy approved
4. **Login với Admin** → Duyệt lịch (approve)
5. **Test lại với includeAll=false**:
   - Kết quả: Bây giờ thấy lịch vì đã approved

**So sánh response**:
```json
// includeAll=true (thấy tất cả)
{
  "success": true,
  "data": [
    {"id": 1, "status": "pending", ...},
    {"id": 2, "status": "approved", ...}
  ]
}

// includeAll=false (chỉ approved)
{
  "success": true,
  "data": [
    {"id": 2, "status": "approved", ...}
  ]
}
```
