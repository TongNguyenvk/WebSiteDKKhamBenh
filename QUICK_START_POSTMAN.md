# 🚀 Quick Start: Import Postman Collection

## Bước 1: Tải Postman
👉 https://www.postman.com/downloads/

## Bước 2: Import file
1. Mở Postman
2. Click **Import** (góc trên trái)
3. Chọn file: `postman/Medical_Booking_API.postman_collection.json`
4. Click **Import**

## Bước 3: Test ngay
1. Đảm bảo backend đang chạy: `cd backend && npm start`
2. Click **"Login - Doctor"** → Send
3. Click **"Get Doctor Schedules (Patient View)"** → Send
4. Xem kết quả!

---

## ❓ Tại sao cần Postman?

### 1. Test API không cần frontend
- Kiểm tra backend hoạt động đúng chưa
- Debug lỗi nhanh hơn
- Xem request/response chi tiết

### 2. Test vấn đề "bệnh nhân thấy lịch chưa duyệt"
Với Postman, bạn có thể:
- ✅ Test API với `includeAll=false` (bệnh nhân)
- ✅ Test API với `includeAll=true` (bác sĩ/admin)
- ✅ So sánh kết quả trả về
- ✅ Xác định lỗi ở backend hay frontend

### 3. Chia sẻ với team
- 1 file .json chứa tất cả API
- Không cần giải thích từng endpoint
- Team members import và dùng ngay

---

## 🎯 Test Case: Lọc lịch theo status

### Scenario: Bệnh nhân KHÔNG được thấy lịch chưa duyệt

**Bước 1**: Login Doctor → Tạo lịch mới
```
Request: "Create Schedule (Doctor/Admin)"
Body: {
  "doctorId": 17,
  "date": "2026-01-15",
  "timeType": "T1",
  "maxNumber": 10
}
Response: status = "pending"
```

**Bước 2**: Test với includeAll=false (Patient view)
```
Request: "Get Doctor Schedules (Patient View - Only Approved)"
URL: /schedule/doctor/17?date=2026-01-15&includeAll=false
Response: [] (mảng rỗng - ĐÚNG!)
```

**Bước 3**: Login Admin → Approve lịch
```
Request: "Approve Schedule (Admin)"
URL: /schedule/{scheduleId}/approve
Response: status = "approved"
```

**Bước 4**: Test lại với includeAll=false
```
Request: "Get Doctor Schedules (Patient View - Only Approved)"
Response: [{ id: X, status: "approved", ... }] (có lịch - ĐÚNG!)
```

---

## 📝 Tài khoản test

```
Doctor:  doctor17@example.com / 123456
Admin:   admin@example.com / 123456
Patient: patient@example.com / 123456
```

---

## 🔍 So sánh kết quả

### includeAll=true (Bác sĩ/Admin)
```json
{
  "success": true,
  "data": [
    { "id": 1, "status": "pending", "date": "2026-01-15" },
    { "id": 2, "status": "approved", "date": "2026-01-15" }
  ]
}
```

### includeAll=false (Bệnh nhân)
```json
{
  "success": true,
  "data": [
    { "id": 2, "status": "approved", "date": "2026-01-15" }
  ]
}
```

---

## 📚 Đọc thêm
- Chi tiết: `HUONG_DAN_POSTMAN.md`
- API docs: `postman/README.md`
- Fix log: `FIX_SCHEDULE_STATUS.md`
