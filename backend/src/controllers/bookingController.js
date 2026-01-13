const db = require("../models"); // Import toàn bộ models
const sequelize = require("../config/database");
const { Op } = require("sequelize");

// 🏥 1. Tạo lịch đặt khám mới (ĐÃ FIX: Race condition, validation, authorization)
exports.createBooking = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { doctorId, date, timeType } = req.body;
        // Lấy patientId từ user đang đăng nhập (không cho phép đặt hộ người khác)
        const patientId = req.user.id;

        // ===== VALIDATION =====
        if (!doctorId || !date || !timeType) {
            await transaction.rollback();
            return res.status(400).json({ 
                success: false, 
                message: "Vui lòng cung cấp đầy đủ thông tin: doctorId, date, timeType" 
            });
        }

        // Validate date format (YYYY-MM-DD)
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            await transaction.rollback();
            return res.status(400).json({ 
                success: false, 
                message: "Định dạng ngày không hợp lệ. Vui lòng sử dụng YYYY-MM-DD" 
            });
        }

        // FIX: Không cho đặt lịch ngày quá khứ
        const bookingDate = new Date(date);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        if (bookingDate < today) {
            await transaction.rollback();
            return res.status(400).json({ 
                success: false, 
                message: "Không thể đặt lịch cho ngày đã qua" 
            });
        }

        // Validate timeType có hợp lệ không (T1-T8)
        const validTimeTypes = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'];
        if (!validTimeTypes.includes(timeType)) {
            await transaction.rollback();
            return res.status(400).json({ 
                success: false, 
                message: "Khung giờ không hợp lệ. Vui lòng chọn từ T1 đến T8" 
            });
        }

        // Kiểm tra bác sĩ có tồn tại và có role R2 không
        const doctor = await db.User.findOne({ 
            where: { id: doctorId, roleId: 'R2' },
            transaction 
        });
        if (!doctor) {
            await transaction.rollback();
            return res.status(404).json({ 
                success: false, 
                message: "Không tìm thấy bác sĩ" 
            });
        }

        // ===== FIX: Kiểm tra schedule tồn tại và đã được duyệt =====
        const schedule = await db.Schedule.findOne({
            where: {
                doctorId,
                date,
                timeType,
                status: 'approved' // CHỈ cho đặt lịch đã được duyệt
            },
            lock: transaction.LOCK.UPDATE, // Lock để tránh race condition
            transaction
        });

        if (!schedule) {
            await transaction.rollback();
            return res.status(404).json({ 
                success: false, 
                message: "Không tìm thấy lịch khám hoặc lịch chưa được duyệt" 
            });
        }

        // ===== FIX: Kiểm tra còn chỗ trống không =====
        if (schedule.currentNumber >= schedule.maxNumber) {
            await transaction.rollback();
            return res.status(400).json({ 
                success: false, 
                message: "Lịch khám đã đầy, vui lòng chọn khung giờ khác" 
            });
        }

        // ===== FIX: Kiểm tra bệnh nhân đã đặt lịch này chưa (tránh đặt trùng) =====
        const existingBooking = await db.Booking.findOne({
            where: {
                patientId,
                doctorId,
                date,
                timeType,
                statusId: { [Op.notIn]: ['S3'] } // Không tính lịch đã hủy
            },
            transaction
        });

        if (existingBooking) {
            await transaction.rollback();
            return res.status(400).json({ 
                success: false, 
                message: "Bạn đã đặt lịch với bác sĩ này vào thời gian này rồi" 
            });
        }

        // ===== FIX: Kiểm tra bệnh nhân có lịch khám khác cùng thời điểm không =====
        const conflictBooking = await db.Booking.findOne({
            where: {
                patientId,
                date,
                timeType,
                statusId: { [Op.notIn]: ['S3'] } // Không tính lịch đã hủy
            },
            transaction
        });

        if (conflictBooking) {
            await transaction.rollback();
            return res.status(400).json({ 
                success: false, 
                message: "Bạn đã có lịch khám khác vào thời gian này" 
            });
        }

        // Tạo mã token (UUID) cho booking
        const token = require("crypto").randomUUID();

        // Tạo booking mới
        const newBooking = await db.Booking.create({
            statusId: 'S1', // Luôn bắt đầu với trạng thái "Chờ xác nhận"
            doctorId,
            patientId,
            date,
            timeType,
            token,
        }, { transaction });

        // ===== FIX: Cập nhật currentNumber trong transaction =====
        schedule.currentNumber += 1;
        await schedule.save({ transaction });

        await transaction.commit();

        res.status(201).json({ 
            success: true, 
            message: "Đặt lịch thành công",
            data: newBooking 
        });
    } catch (error) {
        await transaction.rollback();
        console.error('Error in createBooking:', error);
        res.status(500).json({ 
            success: false, 
            message: "Lỗi server", 
            error: error.message 
        });
    }
};

// 🔍 2. Lấy danh sách lịch khám theo bác sĩ (ĐÃ FIX: Phân quyền)
exports.getBookingsByDoctor = async (req, res) => {
    try {
        const { doctorId } = req.params;
        const requestedDoctorId = parseInt(doctorId, 10);

        // ===== FIX: Kiểm tra quyền truy cập =====
        // Bác sĩ chỉ được xem lịch của chính mình, Admin xem được tất cả
        const isAdmin = req.user.roleId === 'R3';
        const isOwnData = req.user.id === requestedDoctorId;

        if (!isAdmin && !isOwnData) {
            return res.status(403).json({ 
                success: false, 
                message: "Bạn chỉ có thể xem lịch hẹn của chính mình" 
            });
        }

        const bookings = await db.Booking.findAll({
            where: { doctorId: requestedDoctorId },
            include: [
                {
                    model: db.User,
                    as: 'doctorData',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'address', 'gender', 'phoneNumber', 'image'],
                    include: [
                        {
                            model: db.DoctorDetail,
                            as: 'doctorDetail',
                            attributes: ['descriptionMarkdown', 'descriptionHTML']
                        },
                        {
                            model: db.Specialty,
                            as: 'specialtyData',
                            attributes: ['id', 'name', 'image', 'description']
                        },
                        {
                            model: db.Allcode,
                            as: 'roleData',
                            attributes: ['keyMap', 'valueVi', 'valueEn']
                        },
                        {
                            model: db.Allcode,
                            as: 'positionData',
                            attributes: ['keyMap', 'valueVi', 'valueEn']
                        }
                    ]
                },
                {
                    model: db.User,
                    as: 'patientData',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'address', 'gender', 'phoneNumber', 'image']
                },
                {
                    model: db.Allcode,
                    as: 'statusData',
                    attributes: ['keyMap', 'valueVi', 'valueEn']
                },
                {
                    model: db.Allcode,
                    as: 'timeTypeData',
                    attributes: ['keyMap', 'valueVi', 'valueEn']
                }
            ],
            order: [["date", "ASC"]],
        });

        res.status(200).json({ success: true, data: bookings });
    } catch (error) {
        console.error('Error in getBookingsByDoctor:', error);
        res.status(500).json({
            success: false,
            message: "Lỗi server",
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// 🏥 3. Lấy danh sách lịch khám theo bệnh nhân (ĐÃ FIX: Phân quyền)
exports.getBookingsByPatient = async (req, res) => {
    try {
        const patientId = parseInt(req.params.patientId, 10);
        console.log('Patient ID nhận được:', patientId);

        if (isNaN(patientId) || patientId <= 0) {
            return res.status(400).json({ success: false, message: 'Patient ID không hợp lệ' });
        }

        // ===== FIX: Kiểm tra quyền truy cập =====
        // Bệnh nhân chỉ được xem lịch của chính mình, Admin xem được tất cả
        const isAdmin = req.user.roleId === 'R3';
        const isOwnData = req.user.id === patientId;

        if (!isAdmin && !isOwnData) {
            return res.status(403).json({ 
                success: false, 
                message: "Bạn chỉ có thể xem lịch hẹn của chính mình" 
            });
        }

        const bookings = await db.Booking.findAll({
            where: { patientId: patientId },
            include: [
                {
                    model: db.User,
                    as: 'patientData',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'address', 'gender', 'phoneNumber', 'image']
                },
                {
                    model: db.User,
                    as: 'doctorData',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'address', 'gender', 'phoneNumber', 'image'],
                    include: [
                        {
                            model: db.DoctorDetail,
                            as: 'doctorDetail',
                            attributes: ['descriptionMarkdown', 'descriptionHTML']
                        },
                        {
                            model: db.Specialty,
                            as: 'specialtyData',
                            attributes: ['id', 'name', 'image', 'description']
                        },
                        {
                            model: db.Allcode,
                            as: 'roleData',
                            attributes: ['keyMap', 'valueVi', 'valueEn']
                        },
                        {
                            model: db.Allcode,
                            as: 'positionData',
                            attributes: ['keyMap', 'valueVi', 'valueEn']
                        }
                    ]
                },
                {
                    model: db.Allcode,
                    as: 'statusData',
                    attributes: ['keyMap', 'valueVi', 'valueEn']
                },
                {
                    model: db.Allcode,
                    as: 'timeTypeData',
                    attributes: ['keyMap', 'valueVi', 'valueEn']
                }
            ],
            order: [['date', 'ASC']],
        });

        if (!bookings || bookings.length === 0) {
            return res.status(200).json({
                success: true,
                data: [],
                message: 'Không có đặt lịch nào cho bệnh nhân này',
            });
        }

        res.status(200).json({ success: true, data: bookings });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách đặt lịch:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi server',
            error: error.message,
            stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
};

// ❌ 4. Hủy lịch khám (ĐÃ FIX: Phân quyền + Transaction)
exports.cancelBooking = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { id } = req.params;

        const booking = await db.Booking.findByPk(id, { 
            lock: transaction.LOCK.UPDATE,
            transaction 
        });
        
        if (!booking) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: "Không tìm thấy lịch khám" });
        }

        // ===== FIX: Kiểm tra quyền hủy lịch =====
        // Chỉ bệnh nhân sở hữu, bác sĩ liên quan, hoặc Admin mới được hủy
        const isAdmin = req.user.roleId === 'R3';
        const isPatientOwner = req.user.id === booking.patientId;
        const isDoctorOwner = req.user.id === booking.doctorId;

        if (!isAdmin && !isPatientOwner && !isDoctorOwner) {
            await transaction.rollback();
            return res.status(403).json({ 
                success: false, 
                message: "Bạn không có quyền hủy lịch khám này" 
            });
        }

        // ===== FIX: Kiểm tra trạng thái hiện tại =====
        if (booking.statusId === 'S3') {
            await transaction.rollback();
            return res.status(400).json({ 
                success: false, 
                message: "Lịch khám này đã được hủy trước đó" 
            });
        }

        if (booking.statusId === 'S4') {
            await transaction.rollback();
            return res.status(400).json({ 
                success: false, 
                message: "Không thể hủy lịch khám đã hoàn thành" 
            });
        }

        const oldStatus = booking.statusId;

        // Cập nhật trạng thái thành "Đã hủy" (S3)
        booking.statusId = "S3";
        await booking.save({ transaction });

        // ===== FIX: Giảm currentNumber khi hủy lịch =====
        const schedule = await db.Schedule.findOne({
            where: {
                doctorId: booking.doctorId,
                date: booking.date,
                timeType: booking.timeType
            },
            lock: transaction.LOCK.UPDATE,
            transaction
        });

        if (schedule && schedule.currentNumber > 0) {
            schedule.currentNumber -= 1;
            await schedule.save({ transaction });
        }

        await transaction.commit();

        res.status(200).json({ success: true, message: "Hủy lịch thành công", data: booking });
    } catch (error) {
        await transaction.rollback();
        console.error('Error in cancelBooking:', error);
        res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
    }
};

// 🗑 5. Xóa lịch đã hủy sau 1 tuần
exports.deleteOldCancelledBookings = async (req, res) => {
    try {
        const oneWeekAgo = new Date();
        oneWeekAgo.setDate(oneWeekAgo.getDate() - 7); // Lấy thời gian cách đây 7 ngày

        const deleted = await db.Booking.destroy({
            where: {
                statusId: "S2",
                updatedAt: { [Op.lt]: oneWeekAgo },
            },
        });

        res.status(200).json({ success: true, message: `Đã xóa ${deleted} lịch đã hủy quá 1 tuần` });
    } catch (error) {
        res.status(500).json({ success: false, message: "Lỗi server", error });
    }
};

// Lấy chi tiết lịch khám theo id (ĐÃ FIX: Phân quyền)
exports.getBookingById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!id) {
            return res.status(400).json({ success: false, message: 'Thiếu id lịch khám' });
        }
        const booking = await db.Booking.findByPk(id, {
            include: [
                {
                    model: db.User,
                    as: 'patientData',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'address', 'gender', 'phoneNumber', 'image']
                },
                {
                    model: db.User,
                    as: 'doctorData',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'address', 'gender', 'phoneNumber', 'image'],
                    include: [
                        {
                            model: db.DoctorDetail,
                            as: 'doctorDetail',
                            attributes: ['descriptionMarkdown', 'descriptionHTML']
                        },
                        {
                            model: db.Specialty,
                            as: 'specialtyData',
                            attributes: ['id', 'name', 'image', 'description']
                        },
                        {
                            model: db.Allcode,
                            as: 'roleData',
                            attributes: ['keyMap', 'valueVi', 'valueEn']
                        },
                        {
                            model: db.Allcode,
                            as: 'positionData',
                            attributes: ['keyMap', 'valueVi', 'valueEn']
                        }
                    ]
                },
                {
                    model: db.Allcode,
                    as: 'statusData',
                    attributes: ['keyMap', 'valueVi', 'valueEn']
                },
                {
                    model: db.Allcode,
                    as: 'timeTypeData',
                    attributes: ['keyMap', 'valueVi', 'valueEn']
                }
            ]
        });
        if (!booking) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy lịch khám' });
        }

        // ===== FIX: Kiểm tra quyền xem chi tiết =====
        // Chỉ bệnh nhân sở hữu, bác sĩ liên quan, hoặc Admin mới được xem
        const isAdmin = req.user.roleId === 'R3';
        const isPatientOwner = req.user.id === booking.patientId;
        const isDoctorOwner = req.user.id === booking.doctorId;

        if (!isAdmin && !isPatientOwner && !isDoctorOwner) {
            return res.status(403).json({ 
                success: false, 
                message: "Bạn không có quyền xem lịch khám này" 
            });
        }

        res.status(200).json({ success: true, data: booking });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
};

// ĐÃ FIX: Phân quyền + Transaction + Validation
exports.updateBookingStatus = async (req, res) => {
    const transaction = await sequelize.transaction();
    
    try {
        const { id } = req.params;
        const { statusId } = req.body;

        // ===== FIX: Validate statusId =====
        const validStatuses = ['S1', 'S2', 'S3', 'S4'];
        if (!statusId || !validStatuses.includes(statusId)) {
            await transaction.rollback();
            return res.status(400).json({ 
                success: false, 
                message: "Trạng thái không hợp lệ. Vui lòng chọn S1, S2, S3 hoặc S4" 
            });
        }

        const booking = await db.Booking.findByPk(id, {
            lock: transaction.LOCK.UPDATE,
            transaction
        });
        
        if (!booking) {
            await transaction.rollback();
            return res.status(404).json({ success: false, message: "Không tìm thấy lịch khám" });
        }

        // ===== FIX: Kiểm tra quyền cập nhật trạng thái =====
        // Chỉ bác sĩ liên quan hoặc Admin mới được cập nhật trạng thái
        const isAdmin = req.user.roleId === 'R3';
        const isDoctorOwner = req.user.id === booking.doctorId;

        if (!isAdmin && !isDoctorOwner) {
            await transaction.rollback();
            return res.status(403).json({ 
                success: false, 
                message: "Chỉ bác sĩ hoặc Admin mới có quyền cập nhật trạng thái lịch khám" 
            });
        }

        // ===== FIX: Validate state transitions =====
        const oldStatus = booking.statusId;
        
        // Không cho phép thay đổi từ trạng thái đã hoàn thành
        if (oldStatus === 'S4' && statusId !== 'S4') {
            await transaction.rollback();
            return res.status(400).json({ 
                success: false, 
                message: "Không thể thay đổi trạng thái của lịch khám đã hoàn thành" 
            });
        }

        // Không cho phép thay đổi từ trạng thái đã hủy (trừ Admin)
        if (oldStatus === 'S3' && !isAdmin) {
            await transaction.rollback();
            return res.status(400).json({ 
                success: false, 
                message: "Không thể thay đổi trạng thái của lịch khám đã hủy" 
            });
        }

        booking.statusId = statusId;
        await booking.save({ transaction });

        // Lấy schedule liên quan với lock
        const schedule = await db.Schedule.findOne({
            where: {
                doctorId: booking.doctorId,
                date: booking.date,
                timeType: booking.timeType
            },
            lock: transaction.LOCK.UPDATE,
            transaction
        });

        // Nếu hủy (S3) và trước đó chưa hủy thì giảm currentNumber
        if (statusId === 'S3' && oldStatus !== 'S3' && schedule && schedule.currentNumber > 0) {
            schedule.currentNumber -= 1;
            await schedule.save({ transaction });
        }

        await transaction.commit();

        res.status(200).json({ success: true, message: "Cập nhật trạng thái thành công", data: booking });
    } catch (error) {
        await transaction.rollback();
        console.error('Error in updateBookingStatus:', error);
        res.status(500).json({ success: false, message: "Lỗi server", error: error.message });
    }
};
