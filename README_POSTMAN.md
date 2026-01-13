# 🚀 Postman Collection - Medical Booking API

## Quick Start

### 1. Import vào Postman
```
File: postman/Medical_Booking_API.postman_collection.json
```

### 2. Start backend
```bash
cd backend
npm start
```

### 3. Test ngay!
- Login Doctor → Create Schedule
- Test "Get Doctor Schedules (Patient View)"
- Xem kết quả!

---

## 📚 Tài liệu

| File | Mô tả |
|------|-------|
| `QUICK_START_POSTMAN.md` | ⚡ Hướng dẫn nhanh 5 phút |
| `HUONG_DAN_POSTMAN.md` | 📖 Hướng dẫn chi tiết đầy đủ |
| `TOM_TAT_FIX.md` | 📝 Tóm tắt fix lỗi |
| `CHECKLIST_FIX.md` | ✅ Danh sách kiểm tra |
| `FIX_SCHEDULE_STATUS.md` | 🔧 Chi tiết kỹ thuật |

---

## ❓ Tại sao cần Postman?

### 1. Test API không cần frontend
✅ Kiểm tra backend hoạt động đúng  
✅ Debug lỗi nhanh hơn  
✅ Xem request/response chi tiết  

### 2. Test vấn đề "bệnh nhân thấy lịch chưa duyệt"
✅ Test với `includeAll=false` (bệnh nhân)  
✅ Test với `includeAll=true` (bác sĩ/admin)  
✅ So sánh kết quả  
✅ Xác định lỗi ở đâu  

### 3. Chia sẻ với team
✅ 1 file .json chứa tất cả API  
✅ Không cần giải thích từng endpoint  
✅ Import và dùng ngay  

---

## 🎯 Test Case: Lọc lịch theo status

```
1. Login Doctor → Tạo lịch (status = pending)
2. Test includeAll=false → Không thấy lịch ✅
3. Login Admin → Approve lịch
4. Test lại includeAll=false → Bây giờ thấy lịch ✅
```

---

## 🔑 Tài khoản test

```
Doctor:  doctor17@example.com / 123456
Admin:   admin@example.com / 123456
Patient: patient@example.com / 123456
```

---

## 📖 Đọc gì trước?

**Nếu bạn mới dùng Postman:**  
👉 Đọc `QUICK_START_POSTMAN.md` (5 phút)

**Nếu muốn hiểu chi tiết:**  
👉 Đọc `HUONG_DAN_POSTMAN.md` (15 phút)

**Nếu muốn test ngay:**  
👉 Đọc `TOM_TAT_FIX.md` (2 phút)

---

## 💡 Tips

- Token tự động lưu sau khi login
- Biến `{{doctorId}}`, `{{scheduleId}}` tự động set
- Xem Console log để debug (View → Show Postman Console)
- Clear cache nếu kết quả không đúng

---

**Happy Testing! 🎉**
