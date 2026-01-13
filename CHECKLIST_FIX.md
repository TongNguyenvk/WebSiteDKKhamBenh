# ✅ Checklist: Sửa lỗi lịch chưa duyệt

## 📋 Các file đã sửa

- [x] `backend/src/controllers/scheduleController.js` - Thêm log debug
- [x] `frontend/src/lib/api.ts` - Sửa hàm getDoctorSchedulesPT, thêm log
- [x] `postman/Medical_Booking_API.postman_collection.json` - Thêm request test
- [x] `postman/README.md` - Thêm hướng dẫn test case

## 🔧 Các bước kiểm tra

### 1. Backend
- [ ] Code đã có logic filter `status = 'approved'` khi `includeAll = false`
- [ ] Log đã được thêm để debug
- [ ] Backend đang chạy ở `http://localhost:8080`

### 2. Frontend
- [ ] Hàm `getDoctorSchedulesForPatient` truyền `includeAll: 'false'`
- [ ] Tất cả trang bệnh nhân dùng hàm này
- [ ] Log đã được thêm để debug
- [ ] Frontend đang chạy

### 3. Postman
- [ ] File collection đã được import
- [ ] Có 2 request: "with includeAll" và "Patient View"
- [ ] Tài khoản test hoạt động

## 🧪 Test Manual

### Test 1: Tạo lịch chưa duyệt
- [ ] Login với doctor17@example.com
- [ ] Vào trang "Lịch làm việc"
- [ ] Tạo lịch mới cho ngày mai
- [ ] Kiểm tra status = "Chờ duyệt"

### Test 2: Bệnh nhân không thấy lịch chưa duyệt
- [ ] Logout và login với patient@example.com
- [ ] Vào trang "Danh sách bác sĩ"
- [ ] Chọn bác sĩ vừa tạo lịch
- [ ] Chọn ngày đã tạo lịch
- [ ] **Kết quả**: Không thấy lịch (hoặc message "Không có lịch khám")

### Test 3: Admin duyệt lịch
- [ ] Logout và login với admin@example.com
- [ ] Vào trang "Quản lý lịch phân công"
- [ ] Tab "Chờ duyệt" có lịch vừa tạo
- [ ] Click "Duyệt" lịch đó
- [ ] Status chuyển thành "Đã duyệt"

### Test 4: Bệnh nhân thấy lịch đã duyệt
- [ ] Logout và login lại với patient@example.com
- [ ] Vào trang "Danh sách bác sĩ"
- [ ] Chọn bác sĩ đó
- [ ] Chọn ngày đó
- [ ] **Kết quả**: Bây giờ thấy lịch

## 🧪 Test với Postman

### Test 1: includeAll=true (Admin/Doctor view)
- [ ] Login Doctor
- [ ] Request: "Get Doctor Schedules (with includeAll)"
- [ ] Params: doctorId=17, date=2026-01-15, includeAll=true
- [ ] **Kết quả**: Thấy cả lịch pending và approved

### Test 2: includeAll=false (Patient view)
- [ ] Request: "Get Doctor Schedules (Patient View - Only Approved)"
- [ ] Params: doctorId=17, date=2026-01-15, includeAll=false
- [ ] **Kết quả**: Chỉ thấy lịch approved

### Test 3: Approve và test lại
- [ ] Login Admin
- [ ] Request: "Approve Schedule"
- [ ] Test lại với includeAll=false
- [ ] **Kết quả**: Bây giờ thấy lịch

## 🔍 Kiểm tra Log

### Backend Console
```
Querying schedules for doctor 17 between 2026-01-15 and 2026-01-15
includeAll parameter: false (type: string), parsed: false
Filtering schedules: only approved status
```

### Frontend Console (DevTools)
```
[Patient] Fetching schedules for doctor 17 on 2026-01-15 with includeAll=false
[Patient] Received 0 schedules: []
```

## ⚠️ Nếu vẫn lỗi

### Lỗi: Vẫn thấy lịch chưa duyệt
1. [ ] Clear cache browser (Ctrl + Shift + Delete)
2. [ ] Hard refresh (Ctrl + Shift + R)
3. [ ] Kiểm tra Network tab: param `includeAll` có = false không?
4. [ ] Kiểm tra backend log: có filter không?
5. [ ] Restart backend và frontend

### Lỗi: Không thấy lịch đã duyệt
1. [ ] Kiểm tra lịch đã được approve chưa (status = "approved")
2. [ ] Kiểm tra ngày có đúng không
3. [ ] Kiểm tra doctorId có đúng không
4. [ ] Xem response từ API: có data không?

### Lỗi: API trả về 401
1. [ ] Token hết hạn → Login lại
2. [ ] Kiểm tra header Authorization có token không

### Lỗi: API trả về 404
1. [ ] Backend có đang chạy không?
2. [ ] Port có đúng 8080 không?
3. [ ] URL có đúng không?

## 📊 Kết quả mong đợi

| Trường hợp | includeAll | Status lịch | Kết quả |
|------------|-----------|-------------|---------|
| Bệnh nhân xem | false | pending | ❌ Không thấy |
| Bệnh nhân xem | false | approved | ✅ Thấy |
| Bác sĩ xem | true | pending | ✅ Thấy |
| Bác sĩ xem | true | approved | ✅ Thấy |
| Admin xem | true | pending | ✅ Thấy |
| Admin xem | true | approved | ✅ Thấy |

## 🎉 Hoàn thành

- [ ] Tất cả test cases đều pass
- [ ] Log hiển thị đúng
- [ ] Không có lỗi trong console
- [ ] Bệnh nhân chỉ thấy lịch đã duyệt
- [ ] Bác sĩ/Admin thấy tất cả lịch

---

**Ghi chú**: Nếu tất cả checklist đều ✅ mà vẫn lỗi, có thể do:
1. Database có dữ liệu cũ không đúng
2. Cache của browser
3. Code chưa được build lại (nếu dùng production build)
