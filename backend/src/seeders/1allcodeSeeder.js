// seeders/[timestamp]-demo-allcodes.js
module.exports = {
    up: async (queryInterface, Sequelize) => {
        return queryInterface.bulkInsert('Allcodes', [
            // Vai trò (ROLE)
            { keyMap: 'R1', type: 'ROLE', valueEn: 'Patient', valueVi: 'Bệnh nhân', createdAt: new Date(), updatedAt: new Date() },
            { keyMap: 'R2', type: 'ROLE', valueEn: 'Doctor', valueVi: 'Bác sĩ', createdAt: new Date(), updatedAt: new Date() },
            { keyMap: 'R3', type: 'ROLE', valueEn: 'Admin', valueVi: 'Quản trị viên', createdAt: new Date(), updatedAt: new Date() },

            // Chức vụ (POSITION)
            { keyMap: 'P0', type: 'POSITION', valueEn: 'Doctor', valueVi: 'Bác sĩ', createdAt: new Date(), updatedAt: new Date() },
            { keyMap: 'P1', type: 'POSITION', valueEn: 'Specialist', valueVi: 'Thạc sĩ', createdAt: new Date(), updatedAt: new Date() },
            { keyMap: 'P2', type: 'POSITION', valueEn: 'Head of Department', valueVi: 'Tiến sĩ', createdAt: new Date(), updatedAt: new Date() },
            { keyMap: 'P3', type: 'POSITION', valueEn: 'Associate Professor', valueVi: 'Phó giáo sư', createdAt: new Date(), updatedAt: new Date() },
            { keyMap: 'P4', type: 'POSITION', valueEn: 'Professor', valueVi: 'Giáo sư', createdAt: new Date(), updatedAt: new Date() },

            // Giờ khám (TIME)
            { keyMap: 'T1', type: 'TIME', valueEn: '8:00 - 9:00', valueVi: '8:00 - 9:00', createdAt: new Date(), updatedAt: new Date() },
            { keyMap: 'T2', type: 'TIME', valueEn: '9:00 - 10:00', valueVi: '9:00 - 10:00', createdAt: new Date(), updatedAt: new Date() },
            { keyMap: 'T3', type: 'TIME', valueEn: '10:00 - 11:00', valueVi: '10:00 - 11:00', createdAt: new Date(), updatedAt: new Date() },
            { keyMap: 'T4', type: 'TIME', valueEn: '11:00 - 12:00', valueVi: '11:00 - 12:00', createdAt: new Date(), updatedAt: new Date() },
            { keyMap: 'T5', type: 'TIME', valueEn: '13:00 - 14:00', valueVi: '13:00 - 14:00', createdAt: new Date(), updatedAt: new Date() },
            { keyMap: 'T6', type: 'TIME', valueEn: '14:00 - 15:00', valueVi: '14:00 - 15:00', createdAt: new Date(), updatedAt: new Date() },
            { keyMap: 'T7', type: 'TIME', valueEn: '15:00 - 16:00', valueVi: '15:00 - 16:00', createdAt: new Date(), updatedAt: new Date() },
            { keyMap: 'T8', type: 'TIME', valueEn: '16:00 - 17:00', valueVi: '16:00 - 17:00', createdAt: new Date(), updatedAt: new Date() },

            // Trạng thái booking (STATUS)
            { keyMap: 'S1', type: 'STATUS', valueEn: 'Pending', valueVi: 'Chờ xác nhận', createdAt: new Date(), updatedAt: new Date() },
            { keyMap: 'S2', type: 'STATUS', valueEn: 'Confirmed', valueVi: 'Đã xác nhận', createdAt: new Date(), updatedAt: new Date() },
            { keyMap: 'S3', type: 'STATUS', valueEn: 'Cancelled', valueVi: 'Đã hủy', createdAt: new Date(), updatedAt: new Date() },
        ], {});
    },

    down: async (queryInterface, Sequelize) => {
        return queryInterface.bulkDelete('Allcodes', null, {});
    }
};