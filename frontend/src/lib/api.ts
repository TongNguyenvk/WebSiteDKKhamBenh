import axios from 'axios';
import { getApiUrl } from './config';

// Utility function to get token from localStorage
const getToken = () => {
    if (typeof window !== 'undefined') {
        return localStorage.getItem('token') || '';
    }
    return '';
};

// Get API URL from config
const getApiBaseUrl = () => {
    return getApiUrl();
};

const apiClient = axios.create({
    baseURL: getApiBaseUrl(),
    headers: {
        'Content-Type': 'application/json',
    },
});

// Types
interface LoginData {
    email: string;
    password: string;
}

interface RegisterData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    gender: boolean;
    phoneNumber: string;
    address: string;
    roleId?: string;
}

interface ApiError extends Error {
    status?: number;
    data?: unknown;
}

export interface LoginResponse {
    message: string;
    token: string;
    userId: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string; // roleId từ database
}

export interface RegisterResponse {
    message: string;
    userId: number;
    email: string;
    firstName: string;
    lastName: string;
    role: string; // roleId từ database
}

interface Appointment {
    id: number;
    date: string;
    timeType: string;
    statusId: string;
    patientId: number;
    doctorId: number;
    patientData?: {
        firstName: string;
        lastName: string;
        email: string;
    };
    doctorData?: {
        firstName: string;
        lastName: string;
        email: string;
        image: string;
        Specialty?: {
            name: string;
        };
    };
    statusData?: {
        keyMap: string;
        valueVi: string;
        valueEn: string;
    };
}

export interface TimeState {
    keyMap: string;
    type: string;
    valueVi: string;
    valueEn: string;
}

export interface Schedule {
    id: number;
    doctorId: number;
    date: string;
    timeType: string;
    maxNumber: number;
    currentNumber?: number;
    status?: 'pending' | 'approved' | 'rejected';
    createdAt?: string;
    updatedAt?: string;
    timeTypeData?: TimeState;
    User?: {
        firstName: string;
        lastName: string;
        Specialty?: {
            name: string;
        };
    };
    doctorData?: {
        id: number;
        firstName: string;
        lastName: string;
        email?: string;
        phoneNumber?: string;
        image?: string;
        specialtyData?: {
            id: number;
            name: string;
        };
    };
}

interface Doctor {
    id: number;
    email?: string;
    firstName: string;
    lastName: string;
    address?: string;
    phoneNumber?: string;
    gender?: boolean;
    roleId?: string;
    positionId?: string;
    image?: string;
    specialtyId?: number;
    createdAt?: string;
    updatedAt?: string;
    doctorDetail?: {
        descriptionMarkdown?: string;
        descriptionHTML?: string;
    };
    specialtyData?: {
        id: number;
        name: string;
        description?: string;
        image?: string;
    };
    positionData?: {
        keyMap: string;
        valueVi: string;
        valueEn: string;
    };
}

interface Specialty {
    id?: number;
    name: string;
}

interface ApiResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    error?: string;
    errorCode?: string;
}

// User Profile Types
interface UserProfile {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    address?: string;
    gender?: boolean;
    roleId: string;
    image?: string;
    createdAt?: string;
    updatedAt?: string;
    specialtyId?: number;
    positionId?: string;
    specialtyData?: {
        id: number;
        name: string;
    };
    positionData?: {
        keyMap: string;
        valueVi: string;
        valueEn: string;
    };
}

interface UpdateUserProfileData {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    address?: string;
    gender?: boolean;
}

interface CreateUserData {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    roleId: string;
    phoneNumber?: string;
    address?: string;
    gender?: boolean;
    positionId?: string;
    specialtyId?: number;
    image?: string;
}

interface UpdateUserData {
    firstName?: string;
    lastName?: string;
    roleId?: string;
    phoneNumber?: string;
    address?: string;
    gender?: boolean;
    isActive?: boolean;
}

interface CreateDoctorData {
    email: string;
    password?: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    address?: string;
    gender?: boolean;
    specialtyId?: number;
    positionId?: string;
    roleId?: string;
    image?: string;
    descriptionMarkdown?: string;
    descriptionHTML?: string;
}

interface UpdateDoctorData {
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    address?: string;
    gender?: boolean;
    specialtyId?: number;
    positionId?: string;
    roleId?: string;
    image?: string;
    descriptionMarkdown?: string;
    descriptionHTML?: string;
}

interface TimeType {
    keyMap: string;
    valueVi: string;
    valueEn: string;
}

// Thêm các interface từ file app/lib/api.ts
export interface BookingData {
    statusId: string;
    doctorId: number;
    patientId: number;
    date: string;
    timeType: string;
}

export interface BookingPayload {
    doctorId: number;
    patientId: number;
    date: string;
    timeType: string;
    reason?: string;
}

// Thêm interface cho response mới
export interface UsersByRole {
    R1: UserProfile[]; // Bệnh nhân
    R2: UserProfile[]; // Bác sĩ
    R3: UserProfile[]; // Admin
}

// Thêm token vào header cho mọi request
apiClient.interceptors.request.use((config) => {
    const token = getToken();
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// API Functions
export const loginUser = async (data: LoginData): Promise<LoginResponse> => {
    try {
        console.log('Login attempt with:', { email: data.email });
        const response = await apiClient.post<LoginResponse>('/auth/login', data);
        console.log('Login response:', response.data);

        if (typeof window !== 'undefined') {
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('user', JSON.stringify({
                userId: response.data.userId,
                email: response.data.email,
                firstName: response.data.firstName,
                lastName: response.data.lastName,
                role: response.data.role
            }));
        }
        return response.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Login error details:', {
            status: error.response?.status,
            data: error.response?.data,
            message: error.message
        });
        if (error.response?.data?.message) {
            throw new Error(error.response.data.message);
        }
        throw new Error('Đăng nhập thất bại');
    }
};

export const registerUser = async (data: RegisterData): Promise<RegisterResponse> => {
    try {
        const response = await apiClient.post<RegisterResponse>('/users/register-patient', data);
        // Backend không trả về token ngay sau khi đăng ký, chỉ trả về thông tin user
        // Nên ta không lưu token vào localStorage ở đây
        return response.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Đăng ký thất bại');
    }
};

export const logoutUser = () => {
    if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
};

export const getCurrentUser = (): LoginResponse | null => {
    if (typeof window !== 'undefined') {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            return JSON.parse(userStr);
        }
    }
    return null;
};

// API cho bác sĩ
export const getDoctorAppointments = async (doctorId: number): Promise<Appointment[]> => {
    try {
        const token = localStorage.getItem('token');
        const response = await apiClient.get(`/bookings/doctor/${doctorId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data.data || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lỗi khi lấy lịch khám');
    }
};

export const getDoctorSchedulesPT = async (doctorId: number, date: string): Promise<Schedule[]> => {
    try {
        const response = await apiClient.get(`/schedule/doctor/${doctorId}`, {
            params: { date, includeAll: 'false' }
        });
        if (response.data && response.data.success && Array.isArray(response.data.data)) {
            return response.data.data;
        }
        return [];
    } catch (error) {
        console.error(`Error fetching schedules for doctor ${doctorId} on ${date}:`, error);
        if (axios.isAxiosError(error) && error.response?.status === 404) {
            console.warn(`No schedules found (404) for doctor ${doctorId} on ${date}. Returning empty array.`);
            return [];
        }
        if (axios.isAxiosError(error)) {
            throw new Error(`API Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
        }
        throw new Error('An unexpected error occurred while fetching schedules.');
    }
};

// Interface cho response getDoctorSchedules
export interface TimeTypeData {
    valueVi: string;
    valueEn: string;
}

export interface DoctorData {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    address: string;
    gender: boolean;
    phoneNumber: string;
    image: string | null;
}

export interface DoctorSchedule {
    id: number;
    doctorId: number;
    date: string;
    timeType: string;
    maxNumber: number;
    currentNumber: number;
    createdAt: string;
    updatedAt: string;
    timeTypeData: TimeTypeData;
    doctorData: DoctorData;
}

export const getDoctorSchedules = async (
    doctorId: number,
    date: string,
    includeAll: boolean = true // Mặc định lấy tất cả (cho bác sĩ xem)
): Promise<DoctorSchedule[]> => {
    try {
        const res = await apiClient.get(`/schedule/doctor/${doctorId}`, {
            params: { date, includeAll: includeAll.toString() }
        });
        console.log('API getDoctorSchedules response:', res.data);
        if (res.data && res.data.success && Array.isArray(res.data.data)) {
            return res.data.data as DoctorSchedule[];
        }
        return [];
    } catch (error: any) {
        if (error.response?.status === 404) return [];
        throw new Error(error.response?.data?.message || 'Lỗi khi lấy lịch phân công');
    }
};

// Lấy lịch theo khoảng thời gian (ví dụ: 30 ngày tới)
export const getDoctorSchedulesRange = async (
    doctorId: number,
    startDate: string,
    endDate: string,
    includeAll: boolean = true
): Promise<DoctorSchedule[]> => {
    try {
        const res = await apiClient.get(`/schedule/doctor/${doctorId}`, {
            params: { startDate, endDate, includeAll: includeAll.toString() }
        });
        if (res.data && res.data.success) {
            return res.data.data as DoctorSchedule[];
        }
        return [];
    } catch (error: unknown) {
        console.error('Error fetching schedules range:', error);
        throw new Error(error instanceof Error ? error.message : 'Failed to fetch schedules range');
    }
};

// API lấy lịch cho bệnh nhân (chỉ lấy lịch đã approved)
export const getDoctorSchedulesForPatient = async (
    doctorId: number,
    date: string
): Promise<DoctorSchedule[]> => {
    try {
        console.log(`[Patient] Fetching schedules for doctor ${doctorId} on ${date} with includeAll=false`);
        const res = await apiClient.get(`/schedule/doctor/${doctorId}`, {
            params: { date, includeAll: 'false' }
        });
        console.log(`[Patient] Received ${res.data?.data?.length || 0} schedules:`, res.data?.data);
        if (res.data && res.data.success && Array.isArray(res.data.data)) {
            return res.data.data as DoctorSchedule[];
        }
        return [];
    } catch (error: any) {
        if (error.response?.status === 404) return [];
        throw new Error(error.response?.data?.message || 'Lỗi khi lấy lịch khám');
    }
};

export const getTodayAppointments = async (doctorId: number): Promise<Appointment[]> => {
    try {
        const token = localStorage.getItem('token');
        const today = new Date().toISOString().split('T')[0];
        const response = await apiClient.get(`/bookings/doctor/${doctorId}?date=${today}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data.data || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lỗi khi lấy lịch khám hôm nay');
    }
};

// API cho bệnh nhân
export const getPatientAppointments = async (patientId: number): Promise<Appointment[]> => {
    try {
        const token = localStorage.getItem('token');
        const response = await apiClient.get(`/bookings/patient/${patientId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        console.log('API getPatientAppointments response:', response.data);
        // Đảm bảo trả về đúng mảng booking, mỗi booking có doctorData.Specialty
        return response.data.data || [];
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lỗi khi lấy lịch khám');
    }
};

export const getBookingsByPatientId = async (patientId: number): Promise<Appointment[]> => {
    try {
        const token = localStorage.getItem('token');
        const response = await apiClient.get(`/bookings/patient/${patientId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data.data || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lỗi khi lấy lịch khám');
    }
};

// Booking APIs
export const createBooking = async (data: {
    statusId: string;
    doctorId: number;
    patientId: number;
    date: string;
    timeType: string;
}): Promise<Appointment> => {
    try {
        const token = localStorage.getItem('token');
        const response = await apiClient.post('/bookings', data, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lỗi khi đặt lịch khám');
    }
};

export const getBookingById = async (id: number): Promise<Appointment> => {
    try {
        const token = localStorage.getItem('token');
        const response = await apiClient.get(`/bookings/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lỗi khi lấy thông tin lịch khám');
    }
};

export const cancelBooking = async (bookingId: number): Promise<Appointment> => {
    try {
        const token = localStorage.getItem('token');
        const response = await apiClient.put(`/bookings/cancel/${bookingId}`, {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lỗi khi hủy lịch khám');
    }
};


// Schedule APIs
export const createSchedule = async (data: {
    doctorId: number;
    date: string;
    timeType: string;
    maxNumber: number;
}): Promise<Schedule> => {
    try {
        const token = localStorage.getItem('token');
        const response = await apiClient.post('/schedule', data, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lỗi khi tạo lịch phân công');
    }
};

export const createDoctorSchedule = async (data: {
    doctorId: number;
    date: string;
    timeType: string;
    maxNumber: number;
}): Promise<Schedule> => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Vui lòng đăng nhập để thực hiện chức năng này');
        }

        const response = await apiClient.post<{ message: string; data: Schedule }>('/schedule', data, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.data.data) {
            throw new Error('Không nhận được dữ liệu từ server');
        }

        return response.data.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Error creating doctor schedule:', error);
        throw new Error(error.response?.data?.message || 'Lỗi khi tạo lịch khám');
    }
};

export const getScheduleById = async (id: number): Promise<Schedule> => {
    try {
        const response = await apiClient.get<Schedule>(`/schedule/${id}`);
        return response.data;
    } catch (error) {
        console.error(`Error fetching schedule ${id}:`, error);
        if (axios.isAxiosError(error)) {
            throw new Error(`API Error: ${error.response?.status} - ${error.response?.data?.message || error.message}`);
        }
        throw new Error('An unexpected error occurred while fetching schedule details.');
    }
};

export const getAllSchedules = async (): Promise<Schedule[]> => {
    try {
        const token = localStorage.getItem('token');
        const response = await apiClient.get<{ data: Schedule[] }>('/schedule', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data.data || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lỗi khi lấy danh sách lịch khám');
    }
};

export const updateDoctorSchedule = async (scheduleId: number, data: {
    date?: string;
    timeType?: string;
    maxNumber?: number;
}): Promise<Schedule> => {
    try {
        const token = localStorage.getItem('token');
        const response = await apiClient.put<{ data: Schedule }>(`/schedule/${scheduleId}`, data, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lỗi khi cập nhật lịch khám');
    }
};

export const deleteDoctorSchedule = async (scheduleId: number): Promise<void> => {
    try {
        const token = localStorage.getItem('token');
        await apiClient.delete(`/schedule/${scheduleId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lỗi khi xóa lịch khám');
    }
};

// Schedule Approval APIs (Admin only)
export const getPendingSchedules = async (): Promise<Schedule[]> => {
    try {
        const token = localStorage.getItem('token');
        const response = await apiClient.get<{ success: boolean; data: Schedule[]; count: number }>('/schedule/pending/list', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data.data || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lỗi khi lấy danh sách lịch chờ duyệt');
    }
};

export const approveSchedule = async (scheduleId: number): Promise<Schedule> => {
    try {
        const token = localStorage.getItem('token');
        const response = await apiClient.put<{ success: boolean; data: Schedule }>(`/schedule/${scheduleId}/approve`, {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lỗi khi duyệt lịch khám');
    }
};

export const rejectSchedule = async (scheduleId: number): Promise<Schedule> => {
    try {
        const token = localStorage.getItem('token');
        const response = await apiClient.put<{ success: boolean; data: Schedule }>(`/schedule/${scheduleId}/reject`, {}, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lỗi khi từ chối lịch khám');
    }
};

// Doctor APIs
export const getAllDoctors = async (): Promise<Doctor[]> => {
    try {
        const response = await apiClient.get('/doctor');
        return response.data || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lỗi khi lấy danh sách bác sĩ');
    }
};

export const getDoctorById = async (id: number): Promise<Doctor> => {
    try {
        const token = localStorage.getItem('token');
        console.log('Fetching doctor with id:', id);
        console.log('Using token:', token ? 'Token exists' : 'No token');

        const response = await apiClient.get<Doctor>(`/doctor/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        console.log('API Response:', response.data);

        if (!response.data) {
            console.error('No data in response:', response.data);
            throw new Error('Không tìm thấy thông tin bác sĩ');
        }

        return response.data;
    } catch (error) {
        console.error(`Error fetching doctor with id ${id}:`, error);
        if (axios.isAxiosError(error)) {
            console.error('Axios error details:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });

            if (error.response?.status === 404) {
                throw new Error('Không tìm thấy thông tin bác sĩ');
            }
            if (error.response?.status === 401) {
                throw new Error('Vui lòng đăng nhập để xem thông tin');
            }
            throw new Error(error.response?.data?.message || 'Lỗi khi lấy thông tin bác sĩ');
        }
        throw new Error('Có lỗi xảy ra khi lấy thông tin bác sĩ');
    }
};

export const getDoctorsBySpecialty = async (specialtyId: number): Promise<Doctor[]> => {
    try {
        const response = await apiClient.get(`/doctor/specialty/${specialtyId}`);
        return response.data || [];
    } catch (error: unknown) {
        const err = error as ApiError;
        throw new Error(err.message || 'Failed to fetch doctors');
    }
};

export const createDoctor = async (userData: any) => {
    try {
        const token = getToken();
        if (!token) {
            throw new Error('Vui lòng đăng nhập để thực hiện chức năng này');
        }

        // Sử dụng apiClient
        const response = await apiClient.post('/users/register-doctor', userData);

        // Axios tự động xử lý JSON response và response.ok
        return response.data;
    } catch (error: any) {
        console.error('Error creating doctor:', error);
        // Xử lý lỗi chi tiết hơn từ response của axios
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.message || error.message);
        }
        throw new Error('Đã có lỗi xảy ra trong quá trình tạo bác sĩ');
    }
};

export const updateDoctor = async (doctorId: number, data: UpdateDoctorData): Promise<Doctor> => {
    try {
        const token = localStorage.getItem('token');
        const response = await apiClient.put<Doctor>(`/doctor/${doctorId}`, data, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lỗi khi cập nhật thông tin bác sĩ');
    }
};

export const deleteDoctor = async (doctorId: number): Promise<void> => {
    try {
        const token = localStorage.getItem('token');
        await apiClient.delete(`/doctor/${doctorId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lỗi khi xóa bác sĩ');
    }
};

// Specialty APIs
export const getAllSpecialties = async (): Promise<Specialty[]> => {
    try {
        const response = await apiClient.get('/specialties');
        return response.data || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lỗi khi lấy danh sách chuyên khoa');
    }
};

export const createSpecialty = async (data: { name: string; description: string; image?: string }): Promise<Specialty> => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Vui lòng đăng nhập để thực hiện chức năng này');
        }

        const response = await apiClient.post<{ message: string; specialty: Specialty }>('/specialties', data, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data.specialty;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lỗi khi tạo chuyên khoa');
    }
};

export const updateSpecialty = async (id: number, data: { name: string; description: string; image?: string }): Promise<Specialty> => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Vui lòng đăng nhập để thực hiện chức năng này');
        }

        const response = await apiClient.put<{ message: string; specialty: Specialty }>(`/specialties/${id}`, data, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data.specialty;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lỗi khi cập nhật chuyên khoa');
    }
};

export const deleteSpecialty = async (id: number): Promise<void> => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Vui lòng đăng nhập để thực hiện chức năng này');
        }

        await apiClient.delete(`/specialties/${id}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lỗi khi xóa chuyên khoa');
    }
};

// Doctor Patients API
export interface DoctorPatient {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber?: string;
    address?: string;
    gender?: boolean;
    image?: string;
    createdAt?: string;
    totalAppointments?: number;
    lastAppointment?: string;
    upcomingAppointments?: number;
}

export const getDoctorPatients = async (doctorId: number): Promise<DoctorPatient[]> => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Vui lòng đăng nhập để xem danh sách bệnh nhân');
        }

        // Lấy tất cả appointments của doctor để tìm patients
        const appointments = await getDoctorAppointments(doctorId);

        // Group by patient và tính toán thống kê
        const patientMap = new Map<number, DoctorPatient>();

        appointments.forEach(appointment => {
            if (appointment.patientData) {
                const patientId = appointment.patientId;
                const existing = patientMap.get(patientId);

                if (existing) {
                    existing.totalAppointments = (existing.totalAppointments || 0) + 1;
                    // Update last appointment if this one is more recent
                    if (appointment.date > (existing.lastAppointment || '')) {
                        existing.lastAppointment = appointment.date;
                    }
                    // Count upcoming appointments
                    if (appointment.date >= new Date().toISOString().split('T')[0] && appointment.statusId === 'S1') {
                        existing.upcomingAppointments = (existing.upcomingAppointments || 0) + 1;
                    }
                } else {
                    patientMap.set(patientId, {
                        id: patientId,
                        firstName: appointment.patientData.firstName || '',
                        lastName: appointment.patientData.lastName || '',
                        email: appointment.patientData.email || '',
                        phoneNumber: appointment.patientData.phoneNumber,
                        address: appointment.patientData.address,
                        gender: appointment.patientData.gender,
                        image: appointment.patientData.image,
                        createdAt: appointment.patientData.createdAt,
                        totalAppointments: 1,
                        lastAppointment: appointment.date,
                        upcomingAppointments: appointment.date >= new Date().toISOString().split('T')[0] && appointment.statusId === 'S1' ? 1 : 0
                    });
                }
            }
        });

        return Array.from(patientMap.values());
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        throw new Error(error.message || 'Lỗi khi lấy danh sách bệnh nhân');
    }
};

export const getSpecialtyById = async (id: number): Promise<Specialty> => {
    try {
        const response = await apiClient.get(`/specialties/${id}`);
        return response.data;
    } catch (error: unknown) {
        const err = error as ApiError;
        throw new Error(err.message || 'Failed to fetch specialty');
    }
};

// User Profile APIs
export const getUserProfile = async (): Promise<UserProfile> => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Vui lòng đăng nhập để xem thông tin cá nhân');
        }

        const userStr = localStorage.getItem('user');
        if (!userStr) {
            throw new Error('Không tìm thấy thông tin người dùng');
        }
        const user = JSON.parse(userStr);
        const userId = user.userId;

        const response = await apiClient.get<UserProfile>(`/users/${userId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Error fetching user profile:', error);
        if (error.response?.status === 401) {
            throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }
        throw new Error(error.response?.data?.message || 'Lỗi khi lấy thông tin cá nhân');
    }
};

export const updateUserProfile = async (data: UpdateUserProfileData): Promise<UserProfile> => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Vui lòng đăng nhập để cập nhật thông tin');
        }

        const userStr = localStorage.getItem('user');
        if (!userStr) {
            throw new Error('Không tìm thấy thông tin người dùng');
        }
        const user = JSON.parse(userStr);
        const userId = user.userId;

        const response = await apiClient.put<UserProfile>(`/users/${userId}`, data, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data;
    } catch (error: any) {
        console.error('Error updating user profile:', error);
        if (error.response?.status === 401) {
            throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
        }
        throw new Error(error.response?.data?.message || 'Lỗi khi cập nhật thông tin cá nhân');
    }
};

export const uploadProfileImage = async (file: File): Promise<{ imageUrl: string }> => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Vui lòng đăng nhập để tải lên ảnh');
        }

        const formData = new FormData();
        formData.append('image', file);

        // Dùng axios gốc, KHÔNG dùng apiClient để tránh lỗi Content-Type
        const response = await axios.post('http://localhost:8080/api/users/profile/image', formData, {
            headers: {
                'Authorization': `Bearer ${token}`
                // KHÔNG set Content-Type ở đây!
            }
        });
        return response.data;
    } catch (error: any) {
        console.error('Error uploading profile image:', error);
        if (axios.isAxiosError(error)) {
            console.error('Axios error details:', {
                status: error.response?.status,
                data: error.response?.data,
                message: error.message
            });
            if (error.response?.status === 401) {
                throw new Error('Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            }
            throw new Error(error.response?.data?.message || error.message || 'Lỗi khi tải lên ảnh đại diện');
        }
        throw new Error('Đã có lỗi xảy ra trong quá trình tải lên ảnh đại diện');
    }
};

export const updateBookingStatus = async (bookingId: number, statusId: string): Promise<Appointment> => {
    try {
        const token = localStorage.getItem('token');
        const response = await apiClient.put(`/bookings/${bookingId}/status`, { statusId }, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data.data;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Error updating booking status:', error);
        throw new Error(error.response?.data?.message || 'Lỗi khi cập nhật trạng thái lịch khám');
    }
};

// Admin APIs
export const createUser = async (userData: CreateUserData): Promise<UserProfile> => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Vui lòng đăng nhập để thực hiện chức năng này');
        }

        // Validate roleId
        if (userData.roleId !== "R2" && userData.roleId !== "R3") {
            throw new Error('RoleId không hợp lệ. Chỉ chấp nhận R2 (Doctor) hoặc R3 (Admin)');
        }

        // Chuẩn bị dữ liệu gửi đi
        const dataToSend = {
            ...userData,
            // Chỉ thêm positionId nếu là bác sĩ (R2)
            positionId: userData.roleId === "R2" ? (userData.positionId || "P1") : undefined,
            // Chỉ gửi specialtyId nếu là bác sĩ (R2)
            specialtyId: userData.roleId === "R2" ? (userData.specialtyId ? Number(userData.specialtyId) : undefined) : undefined
        };

        console.log('Sending data to server:', dataToSend);

        const response = await apiClient.post<ApiResponse<UserProfile>>('/users/register-doctor', dataToSend, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lỗi khi tạo người dùng');
    }
};

export const getAllUsers = async (): Promise<UserProfile[]> => {
    try {
        const token = localStorage.getItem('token');
        const response = await apiClient.get<ApiResponse<UserProfile[]>>('/users', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data.data;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lỗi khi lấy danh sách người dùng');
    }
};

export const updateUser = async (userId: number, data: UpdateUserData): Promise<UserProfile> => {
    try {
        const token = localStorage.getItem('token');
        const response = await apiClient.put<{ message: string; user: UserProfile }>(`/users/${userId}`, data, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        // Backend trả về { message: '...', user: {...} }
        return response.data.user;
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lỗi khi cập nhật người dùng');
    }
};

// Time State and Type APIs
export const getTimeStates = async (): Promise<TimeState[]> => {
    try {
        const token = localStorage.getItem('token');
        const response = await apiClient.get<{ data: TimeState[] }>('/allcode/type', {
            params: { type: 'TIME' },
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data.data || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Error fetching time states:', error);
        throw new Error(error.response?.data?.message || 'Lỗi khi lấy danh sách thời gian');
    }
};

export const getTimeTypes = async (): Promise<TimeType[]> => {
    try {
        const token = localStorage.getItem('token');
        const response = await apiClient.get<{ data: TimeType[] }>('/allcode', {
            params: { type: 'TIME' },
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data.data || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        throw new Error(error.response?.data?.message || 'Lỗi khi lấy danh sách thời gian');
    }
};

export const getAllAppointments = async (): Promise<Appointment[]> => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Vui lòng đăng nhập để xem danh sách lịch hẹn');
        }
        // *** TEMPORARY CHANGE FOR DEBUGGING ***
        // The backend booking controller provided does not have a general /bookings endpoint.
        // To test connectivity to existing booking endpoints, we will temporarily call
        // the getBookingsByDoctor endpoint with a hardcoded doctorId (e.g., 1).
        // A proper fix would involve implementing a backend getAllBookings endpoint
        // or adjusting the frontend component using this function.
        const doctorIdToTest = 1; // Use a known doctor ID for testing

        const response = await apiClient.get<{ data: Appointment[] }>(`/bookings/doctor/${doctorIdToTest}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });
        return response.data.data || [];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Error fetching all appointments (debug call):', error);
        throw new Error(error.response?.data?.message || 'Lỗi khi lấy danh sách lịch hẹn (debug)');
    }
};

// Thêm hàm mới để lấy tất cả user theo role
export const getAllUsersByRole = async (): Promise<UsersByRole> => {
    try {
        const token = localStorage.getItem('token');
        const response = await apiClient.get<ApiResponse<UsersByRole>>('/users/all', {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.data.success) {
            throw new Error(response.data.message || 'Lỗi khi lấy danh sách người dùng');
        }

        return response.data.data;
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.message || 'Lỗi khi lấy danh sách người dùng');
        }
        throw new Error('Đã có lỗi xảy ra khi lấy danh sách người dùng');
    }
};

// Admin APIs
export const deleteUser = async (userId: number): Promise<void> => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Vui lòng đăng nhập để thực hiện chức năng này');
        }

        const response = await apiClient.delete<ApiResponse<void>>(`/users/${userId}`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!response.data.success) {
            throw new Error(response.data.message || 'Lỗi khi xóa người dùng');
        }
    } catch (error) {
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.message || 'Lỗi khi xóa người dùng');
        }
        throw new Error('Đã có lỗi xảy ra khi xóa người dùng');
    }
};

export const createAdmin = async (userData: any) => {
    try {
        const token = getToken();
        if (!token) {
            throw new Error('Vui lòng đăng nhập để thực hiện chức năng này');
        }

        // Sử dụng apiClient
        const response = await apiClient.post('/users/register-admin', userData);

        // Axios tự động xử lý JSON response và response.ok
        return response.data;

    } catch (error: any) {
        console.error('Error creating admin:', error);
        // Xử lý lỗi chi tiết hơn từ response của axios
        if (axios.isAxiosError(error)) {
            throw new Error(error.response?.data?.message || error.message);
        }
        throw new Error('Đã có lỗi xảy ra trong quá trình tạo admin');
    }
};

// Dashboard Stats API
export interface DashboardStats {
    totalUsers: number;
    totalDoctors: number;
    totalPatients: number;
    totalAppointments: number;
    pendingAppointments: number;
    completedAppointments: number;
    totalSpecialties: number;
    activeSchedules: number;
    todayAppointments: number;
    monthlyGrowth: number;
    systemHealth: number;
    activeUsers: number;
}

export const getDashboardStats = async (): Promise<DashboardStats> => {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            throw new Error('Vui lòng đăng nhập để xem thống kê');
        }

        // Gọi nhiều API để lấy thống kê
        const [usersData, appointmentsData, specialtiesData, schedulesData] = await Promise.all([
            getAllUsersByRole(),
            getAllAppointments(),
            getAllSpecialties(),
            getAllSchedules()
        ]);

        // Tính toán thống kê
        const totalPatients = usersData.R1.length;
        const totalDoctors = usersData.R2.length;
        const totalUsers = totalPatients + totalDoctors + usersData.R3.length;
        const totalAppointments = appointmentsData.length;

        // Đếm appointments theo status
        const pendingAppointments = appointmentsData.filter(apt => apt.statusId === 'S1').length;
        const completedAppointments = appointmentsData.filter(apt => apt.statusId === 'S3').length;

        // Đếm appointments hôm nay
        const today = new Date().toISOString().split('T')[0];
        const todayAppointments = appointmentsData.filter(apt => apt.date === today).length;

        return {
            totalUsers,
            totalDoctors,
            totalPatients,
            totalAppointments,
            pendingAppointments,
            completedAppointments,
            totalSpecialties: specialtiesData.length,
            activeSchedules: schedulesData.length,
            todayAppointments,
            monthlyGrowth: 12.5, // Tạm thời hardcode, có thể tính toán sau
            systemHealth: 98.5, // Tạm thời hardcode
            activeUsers: Math.floor(totalUsers * 0.7) // Giả sử 70% users active
        };
    } catch (error: any) {
        console.error('Error fetching dashboard stats:', error);
        throw new Error(error.message || 'Lỗi khi lấy thống kê dashboard');
    }
};