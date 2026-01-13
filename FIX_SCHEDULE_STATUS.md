# Sửa lỗi hiển thị lịch làm việc chưa duyệt cho bệnh nhân

## Vấn đề
Bệnh nhân đang thấy được lịch làm việc của bác sĩ ngay cả khi lịch đó chưa được admin duyệt (status = 'pending').

## Nguyên nhân
- Hàm `getDoctorSchedulesPT` trong `frontend/src/lib/api.ts` không truyền tham số `includeAll: 'false'`
- Hàm này cũng parse response sai (return `response.data` thay vì `response.data.data`)

## Giải pháp đã thực hiện

### 1. Backend (đã có sẵn logic đúng)
File: `backend/src/controllers/scheduleController.js`
- Hàm `getDoctorSchedules` đã có logic kiểm tra tham số `includeAll`
- Khi `includeAll = false`, chỉ lấy lịch có `status = 'approved'`
- Đã thêm log để debug

### 2. Frontend
File: `frontend/src/lib/api.ts`

#### Đã sửa hàm `getDoctorSchedulesPT`:
- Thêm tham số `includeAll: 'false'` vào params
- Sửa cách parse response từ `response.data` thành `response.data.data`

#### Đã thêm log vào hàm `getDoctorSchedulesForPatient`:
- Log khi gọi API
- Log số lượng schedules nhận được

## Cách test

### 1. Restart backend
```bash
cd backend
npm start
```

### 2. Restart frontend
```bash
cd frontend
npm run dev
```

### 3. Clear cache browser
- Mở DevTools (F12)
- Vào tab Application/Storage
- Xóa Local Storage và Session Storage
- Hard refresh (Ctrl + Shift + R)

### 4. Test flow
1. Login với tài khoản bác sĩ (doctor17@example.com)
2. Tạo lịch làm việc mới → Status sẽ là "Chờ duyệt" (pending)
3. Logout và login với tài khoản bệnh nhân
4. Vào trang "Danh sách bác sĩ" hoặc "Xem lịch khám"
5. Chọn bác sĩ vừa tạo lịch
6. **Kết quả mong đợi**: Không thấy lịch chưa duyệt
7. Login với tài khoản admin
8. Duyệt lịch làm việc của bác sĩ
9. Logout và login lại với tài khoản bệnh nhân
10. **Kết quả mong đợi**: Bây giờ mới thấy lịch đã duyệt

### 5. Kiểm tra log
Mở DevTools Console và kiểm tra:
- Frontend log: `[Patient] Fetching schedules for doctor X on Y with includeAll=false`
- Backend log: `includeAll parameter: false`, `Filtering schedules: only approved status`

## Các file đã sửa
1. `backend/src/controllers/scheduleController.js` - Thêm log debug
2. `frontend/src/lib/api.ts` - Sửa hàm `getDoctorSchedulesPT` và thêm log

## Lưu ý
- Hàm `getDoctorSchedulesPT` hiện không được sử dụng ở đâu, nhưng đã được sửa để đảm bảo tính nhất quán
- Tất cả các trang bệnh nhân đều sử dụng hàm `getDoctorSchedulesForPatient` đúng cách
- Logic backend đã đúng từ đầu, chỉ cần đảm bảo frontend gọi đúng
