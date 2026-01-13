// controllers/scheduleController.js
const db = require('../config/database');
const { Schedule, Allcode, User, Specialty } = require('../models');
const { Op } = require('sequelize');



const getDoctorSchedules = async (req, res) => {
    try {
        const doctorId = Number(req.params.doctorId);
        const requestedDate = req.query.date;
        const includeAll = req.query.includeAll === 'true'; // Cho phép lấy tất cả status

        if (isNaN(doctorId)) {
            return res.status(400).json({
                success: false,
                message: "doctorId không hợp lệ"
            });
        }

        let startDate, endDate;

        if (requestedDate) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(requestedDate)) {
                return res.status(400).json({
                    success: false,
                    message: "Định dạng ngày không hợp lệ. Vui lòng sử dụng YYYY-MM-DD."
                });
            }
            startDate = new Date(requestedDate);
            if (isNaN(startDate.getTime())) {
                return res.status(400).json({
                    success: false,
                    message: "Giá trị ngày không hợp lệ."
                });
            }
            endDate = new Date(requestedDate);
        } else {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            startDate = new Date(today);
            endDate = new Date(today);
            endDate.setDate(today.getDate() + 3);
        }

        const startQueryDate = startDate.toISOString().split('T')[0];
        const endQueryDate = endDate.toISOString().split('T')[0];

        console.log(`Querying schedules for doctor ${doctorId} between ${startQueryDate} and ${endQueryDate}`);

        // Điều kiện where
        const whereCondition = {
            doctorId,
            date: {
                [Op.between]: [startQueryDate, endQueryDate]
            }
        };

        // Nếu không phải includeAll, chỉ lấy lịch đã approved (cho bệnh nhân xem)
        if (!includeAll) {
            whereCondition.status = 'approved';
        }

        const schedules = await Schedule.findAll({
            where: whereCondition,
            include: [
                {
                    model: Allcode,
                    as: 'timeTypeData',
                    attributes: ['valueVi', 'valueEn']
                },
                {
                    model: User,
                    as: 'doctorData',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'address', 'gender', 'phoneNumber', 'image'],
                    include: [
                        { model: Specialty, as: 'specialtyData', attributes: ['id', 'name'] }
                    ]
                }
            ],
            order: [['date', 'ASC'], ['timeType', 'ASC']],
            raw: false,
            nest: true
        });

        return res.json({
            success: true,
            data: schedules
        });
    } catch (error) {
        console.error("Error in getDoctorSchedules:", error);
        return res.status(500).json({
            success: false,
            message: "Lỗi server",
            error: error.message
        });
    }
};



const getAllSchedules = async (req, res) => {
    try {
        const schedules = await Schedule.findAll({
            include: [
                { model: Allcode, as: 'timeTypeData', attributes: ['valueVi', 'valueEn'] },
                {
                    model: User,
                    as: 'doctorData',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'address', 'gender', 'phoneNumber', 'image'],
                    include: [
                        { model: Specialty, as: 'specialtyData', attributes: ['id', 'name'] }
                    ]
                }
            ],
            order: [['date', 'ASC'], ['timeType', 'ASC']]
        });
        res.status(200).json({ success: true, data: schedules });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Lấy một schedule theo id
const getScheduleById = async (req, res) => {
    try {
        const { id } = req.params;
        const schedule = await Schedule.findByPk(id, {
            include: [
                { model: Allcode, as: 'timeTypeData', attributes: ['valueVi', 'valueEn'] }
            ]
        });
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule không tồn tại' });
        }
        res.status(200).json(schedule);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Tạo mới một schedule
const createSchedule = async (req, res) => {
    try {
        const { doctorId, date, timeType, maxNumber } = req.body;

        // Validate required fields with specific messages
        if (!doctorId) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chọn bác sĩ'
            });
        }

        if (!date) {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chọn ngày khám'
            });
        }

        if (!timeType || timeType.trim() === '') {
            return res.status(400).json({
                success: false,
                message: 'Vui lòng chọn khung giờ khám'
            });
        }

        // Validate date format
        const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
        if (!dateRegex.test(date)) {
            return res.status(400).json({
                success: false,
                message: 'Định dạng ngày không hợp lệ. Vui lòng sử dụng YYYY-MM-DD'
            });
        }

        // Validate maxNumber
        if (!maxNumber || maxNumber < 1) {
            return res.status(400).json({
                success: false,
                message: 'Số lượng bệnh nhân tối đa phải lớn hơn 0'
            });
        }

        // Check if schedule already exists for this doctor, date and timeType
        const existingSchedule = await Schedule.findOne({
            where: {
                doctorId,
                date,
                timeType
            }
        });

        if (existingSchedule) {
            return res.status(400).json({
                success: false,
                message: 'Đã tồn tại lịch khám cho bác sĩ này vào thời gian này'
            });
        }

        // Xác định status dựa trên role của người tạo
        // Admin (R3) tạo -> approved ngay
        // Bác sĩ (R2) tạo -> pending (chờ duyệt)
        const isAdmin = req.user && req.user.roleId === 'R3';
        const status = isAdmin ? 'approved' : 'pending';

        const newSchedule = await Schedule.create({
            doctorId,
            date,
            timeType,
            maxNumber: maxNumber || 1,
            currentNumber: 0,
            status
        });

        // Include timeTypeData in response
        const scheduleWithTimeType = await Schedule.findByPk(newSchedule.id, {
            include: [
                { model: Allcode, as: 'timeTypeData', attributes: ['valueVi', 'valueEn'] }
            ]
        });

        const message = isAdmin 
            ? 'Tạo lịch khám thành công' 
            : 'Đăng ký lịch khám thành công, đang chờ Admin duyệt';

        res.status(201).json({
            success: true,
            message,
            data: scheduleWithTimeType
        });
    } catch (error) {
        console.error('Error creating schedule:', error);
        res.status(500).json({
            success: false,
            message: 'Lỗi khi tạo lịch khám',
            error: error.message
        });
    }
};

// Cập nhật một schedule theo id (ĐÃ FIX: Validation + Check status)
const updateSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const { doctorId, date, timeType, maxNumber } = req.body;

        const schedule = await Schedule.findByPk(id);
        if (!schedule) {
            return res.status(404).json({ success: false, message: 'Schedule không tồn tại' });
        }

        // FIX: Không cho sửa schedule đã approved (trừ Admin)
        const isAdmin = req.user && req.user.roleId === 'R3';
        if (schedule.status === 'approved' && !isAdmin) {
            return res.status(400).json({ 
                success: false, 
                message: 'Không thể sửa lịch khám đã được duyệt' 
            });
        }

        // FIX: Validate date format nếu có
        if (date) {
            const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
            if (!dateRegex.test(date)) {
                return res.status(400).json({
                    success: false,
                    message: 'Định dạng ngày không hợp lệ. Vui lòng sử dụng YYYY-MM-DD'
                });
            }
            // Không cho sửa sang ngày quá khứ
            const newDate = new Date(date);
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            if (newDate < today) {
                return res.status(400).json({
                    success: false,
                    message: 'Không thể đặt lịch cho ngày đã qua'
                });
            }
        }

        // FIX: Validate maxNumber >= currentNumber
        if (maxNumber !== undefined) {
            if (maxNumber < 1) {
                return res.status(400).json({
                    success: false,
                    message: 'Số lượng bệnh nhân tối đa phải lớn hơn 0'
                });
            }
            if (maxNumber < schedule.currentNumber) {
                return res.status(400).json({
                    success: false,
                    message: `Số lượng tối đa không thể nhỏ hơn số đã đặt (${schedule.currentNumber})`
                });
            }
        }

        // FIX: Validate timeType nếu có
        if (timeType) {
            const validTimeTypes = ['T1', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'T8'];
            if (!validTimeTypes.includes(timeType)) {
                return res.status(400).json({
                    success: false,
                    message: 'Khung giờ không hợp lệ. Vui lòng chọn từ T1 đến T8'
                });
            }
        }

        // FIX: Check trùng lịch nếu thay đổi date hoặc timeType
        if (date || timeType) {
            const newDate = date || schedule.date;
            const newTimeType = timeType || schedule.timeType;
            const newDoctorId = doctorId || schedule.doctorId;
            
            const existingSchedule = await Schedule.findOne({
                where: {
                    doctorId: newDoctorId,
                    date: newDate,
                    timeType: newTimeType,
                    id: { [Op.ne]: id } // Không tính chính nó
                }
            });

            if (existingSchedule) {
                return res.status(400).json({
                    success: false,
                    message: 'Đã tồn tại lịch khám cho bác sĩ này vào thời gian này'
                });
            }
        }

        schedule.doctorId = doctorId !== undefined ? doctorId : schedule.doctorId;
        schedule.date = date !== undefined ? date : schedule.date;
        schedule.timeType = timeType !== undefined ? timeType : schedule.timeType;
        schedule.maxNumber = maxNumber !== undefined ? maxNumber : schedule.maxNumber;

        await schedule.save();
        
        res.status(200).json({ 
            success: true, 
            message: 'Cập nhật lịch khám thành công',
            data: schedule 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
};

// Xoá một schedule theo id (ĐÃ FIX: Check booking active)
const deleteSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        const schedule = await Schedule.findByPk(id);
        if (!schedule) {
            return res.status(404).json({ success: false, message: 'Schedule không tồn tại' });
        }

        // FIX: Không cho xóa schedule đã có booking active
        const { Booking } = require('../models');
        const activeBookings = await Booking.count({
            where: {
                doctorId: schedule.doctorId,
                date: schedule.date,
                timeType: schedule.timeType,
                statusId: { [Op.notIn]: ['S3'] } // Không tính lịch đã hủy
            }
        });

        if (activeBookings > 0) {
            return res.status(400).json({ 
                success: false, 
                message: `Không thể xóa lịch khám này vì đang có ${activeBookings} lịch hẹn chưa hoàn thành` 
            });
        }

        await schedule.destroy();
        res.status(200).json({ success: true, message: 'Xoá schedule thành công' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Lỗi server', error: error.message });
    }
};

const getDoctorSchedule = async (req, res) => {
    try {
        const doctorId = req.params.doctorId;
        const today = new Date();
        const threeDaysLater = new Date();
        threeDaysLater.setDate(today.getDate() + 3); // Ngày sau 3 ngày

        const schedules = await Schedule.findAll({
            where: {
                doctorId: doctorId,
                date: {
                    [Op.between]: [today, threeDaysLater], // Lấy lịch khám trong 3 ngày tới
                },
            },
            order: [["date", "ASC"], ["time", "ASC"]], // Sắp xếp theo ngày & thời gian
        });

        return res.status(200).json(schedules);
    } catch (error) {
        console.error("Lỗi lấy lịch khám:", error);
        return res.status(500).json({ message: "Lỗi server" });
    }
};

// Duyệt lịch khám (chỉ Admin)
const approveSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        
        const schedule = await Schedule.findByPk(id);
        if (!schedule) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy lịch khám' 
            });
        }

        if (schedule.status === 'approved') {
            return res.status(400).json({ 
                success: false, 
                message: 'Lịch khám này đã được duyệt trước đó' 
            });
        }

        schedule.status = 'approved';
        await schedule.save();

        // Lấy lại schedule với đầy đủ thông tin
        const updatedSchedule = await Schedule.findByPk(id, {
            include: [
                { model: Allcode, as: 'timeTypeData', attributes: ['valueVi', 'valueEn'] },
                {
                    model: User,
                    as: 'doctorData',
                    attributes: ['id', 'firstName', 'lastName', 'email'],
                    include: [
                        { model: Specialty, as: 'specialtyData', attributes: ['id', 'name'] }
                    ]
                }
            ]
        });

        res.status(200).json({ 
            success: true, 
            message: 'Duyệt lịch khám thành công',
            data: updatedSchedule 
        });
    } catch (error) {
        console.error('Error approving schedule:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi khi duyệt lịch khám', 
            error: error.message 
        });
    }
};

// Từ chối lịch khám (chỉ Admin)
const rejectSchedule = async (req, res) => {
    try {
        const { id } = req.params;
        
        const schedule = await Schedule.findByPk(id);
        if (!schedule) {
            return res.status(404).json({ 
                success: false, 
                message: 'Không tìm thấy lịch khám' 
            });
        }

        if (schedule.status === 'rejected') {
            return res.status(400).json({ 
                success: false, 
                message: 'Lịch khám này đã bị từ chối trước đó' 
            });
        }

        schedule.status = 'rejected';
        await schedule.save();

        res.status(200).json({ 
            success: true, 
            message: 'Đã từ chối lịch khám',
            data: schedule 
        });
    } catch (error) {
        console.error('Error rejecting schedule:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi khi từ chối lịch khám', 
            error: error.message 
        });
    }
};

// Lấy danh sách lịch chờ duyệt (chỉ Admin)
const getPendingSchedules = async (req, res) => {
    try {
        const schedules = await Schedule.findAll({
            where: { status: 'pending' },
            include: [
                { model: Allcode, as: 'timeTypeData', attributes: ['valueVi', 'valueEn'] },
                {
                    model: User,
                    as: 'doctorData',
                    attributes: ['id', 'firstName', 'lastName', 'email', 'phoneNumber', 'image'],
                    include: [
                        { model: Specialty, as: 'specialtyData', attributes: ['id', 'name'] }
                    ]
                }
            ],
            order: [['createdAt', 'ASC']]
        });

        res.status(200).json({ 
            success: true, 
            data: schedules,
            count: schedules.length
        });
    } catch (error) {
        console.error('Error getting pending schedules:', error);
        res.status(500).json({ 
            success: false, 
            message: 'Lỗi khi lấy danh sách lịch chờ duyệt', 
            error: error.message 
        });
    }
};

module.exports = {
    getDoctorSchedules,
    deleteSchedule,
    createSchedule,
    updateSchedule,
    getAllSchedules,
    getScheduleById,
    approveSchedule,
    rejectSchedule,
    getPendingSchedules
};