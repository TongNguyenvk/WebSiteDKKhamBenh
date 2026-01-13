'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { getAllDoctors, getDoctorSchedulesForPatient } from '@/lib/api';
import { SlidePanel, DataTable } from '@/components/ui';
import { format, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { getAvatarUrl } from '@/lib/utils';

interface Doctor {
    id: number;
    firstName: string;
    lastName: string;
    email?: string;
    image?: string;
    specialtyData?: { name: string };
    positionData?: { valueVi: string };
    description?: string;
}

interface Schedule {
    id: number;
    date: string;
    timeType: string;
    maxNumber: number;
    currentNumber?: number;
    timeTypeData?: { valueVi: string };
}

export default function DoctorsPage() {
    const router = useRouter();
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterSpecialty, setFilterSpecialty] = useState('');
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loadingSchedules, setLoadingSchedules] = useState(false);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    useEffect(() => {
        fetchDoctors();
    }, []);

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            const data = await getAllDoctors();
            setDoctors(data);
        } catch (error) {
            toast.error('Lỗi khi tải danh sách bác sĩ');
        } finally {
            setLoading(false);
        }
    };

    const fetchSchedules = async (doctorId: number, date: string) => {
        try {
            setLoadingSchedules(true);
            const data = await getDoctorSchedulesForPatient(doctorId, date);
            setSchedules(data);
        } catch (error) {
            setSchedules([]);
        } finally {
            setLoadingSchedules(false);
        }
    };

    const handleSelectDoctor = async (doctor: Doctor) => {
        setSelectedDoctor(doctor);
        setIsPanelOpen(true);
        await fetchSchedules(doctor.id, selectedDate);
    };

    const handleDateChange = async (date: string) => {
        setSelectedDate(date);
        if (selectedDoctor) {
            await fetchSchedules(selectedDoctor.id, date);
        }
    };

    const handleBookAppointment = (schedule: Schedule) => {
        if (!selectedDoctor) return;
        router.push(`/patient/book_appointment?doctorId=${selectedDoctor.id}&scheduleId=${schedule.id}&date=${selectedDate}&timeType=${schedule.timeType}`);
    };

    const specialties = useMemo(() => {
        return Array.from(new Set(doctors.map(d => d.specialtyData?.name).filter(Boolean)));
    }, [doctors]);

    const filteredDoctors = useMemo(() => {
        return doctors.filter(d => {
            if (filterSpecialty && d.specialtyData?.name !== filterSpecialty) return false;
            if (searchTerm) {
                const search = searchTerm.toLowerCase();
                return `${d.firstName} ${d.lastName}`.toLowerCase().includes(search) ||
                    d.specialtyData?.name?.toLowerCase().includes(search) ||
                    d.positionData?.valueVi?.toLowerCase().includes(search);
            }
            return true;
        });
    }, [doctors, searchTerm, filterSpecialty]);

    // Generate next 7 days for date selection
    const dateOptions = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => {
            const date = addDays(new Date(), i);
            return {
                value: format(date, 'yyyy-MM-dd'),
                label: i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : format(date, 'EEEE, dd/MM', { locale: vi })
            };
        });
    }, []);

    const columns = useMemo(() => [
        {
            key: 'doctor', header: 'Bác sĩ',
            render: (d: Doctor) => (
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {d.image ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                                src={getAvatarUrl(d.image)}
                                alt=""
                                className="w-12 h-12 rounded-full object-cover"
                            />
                        ) : (
                            <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                            </svg>
                        )}
                    </div>
                    <div>
                        <p className="font-medium text-gray-900">BS. {d.firstName} {d.lastName}</p>
                        <p className="text-sm text-gray-500">{d.positionData?.valueVi || 'Bác sĩ'}</p>
                    </div>
                </div>
            )
        },
        {
            key: 'specialty', header: 'Chuyên khoa',
            render: (d: Doctor) => (
                <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                    {d.specialtyData?.name || 'Chưa có'}
                </span>
            )
        },
        {
            key: 'actions', header: '', width: 'w-32',
            render: (d: Doctor) => (
                <button
                    onClick={() => handleSelectDoctor(d)}
                    className="px-4 py-2 text-sm font-medium text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition"
                >
                    Đặt lịch
                </button>
            )
        },
    ], []);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b bg-white flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">Danh sách bác sĩ</h1>
                <p className="text-sm text-gray-500 mt-1">Tìm và đặt lịch khám với bác sĩ phù hợp</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 px-6 py-4 bg-gray-50 border-b flex-shrink-0">
                <div className="bg-white rounded-xl p-4 border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{doctors.length}</p>
                            <p className="text-sm text-gray-500">Tổng bác sĩ</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{specialties.length}</p>
                            <p className="text-sm text-gray-500">Chuyên khoa</p>
                        </div>
                    </div>
                </div>
                <div className="bg-white rounded-xl p-4 border">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div>
                            <p className="text-2xl font-bold text-gray-900">{filteredDoctors.length}</p>
                            <p className="text-sm text-gray-500">Kết quả tìm kiếm</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Toolbar */}
            <div className="flex items-center gap-4 px-6 py-3 border-b bg-white flex-shrink-0">
                <div className="relative flex-1 max-w-sm">
                    <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    <input
                        type="text"
                        placeholder="Tìm theo tên, chuyên khoa..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <select
                    value={filterSpecialty}
                    onChange={(e) => setFilterSpecialty(e.target.value)}
                    className="px-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                    <option value="">Tất cả chuyên khoa</option>
                    {specialties.map(s => (
                        <option key={s} value={s}>{s}</option>
                    ))}
                </select>
                {(searchTerm || filterSpecialty) && (
                    <button
                        onClick={() => { setSearchTerm(''); setFilterSpecialty(''); }}
                        className="flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        Xóa bộ lọc
                    </button>
                )}
            </div>

            {/* Table */}
            <div className="flex-1 overflow-hidden bg-white">
                <DataTable
                    columns={columns}
                    data={filteredDoctors}
                    keyField="id"
                    pageSize={10}
                    emptyMessage="Không tìm thấy bác sĩ nào"
                />
            </div>

            {/* Booking Panel */}
            <SlidePanel
                isOpen={isPanelOpen}
                onClose={() => setIsPanelOpen(false)}
                title="Đặt lịch khám"
                width="lg"
            >
                {selectedDoctor && (
                    <div className="space-y-6">
                        {/* Doctor Info */}
                        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl">
                            <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                                {selectedDoctor.image ? (
                                    /* eslint-disable-next-line @next/next/no-img-element */
                                    <img
                                        src={getAvatarUrl(selectedDoctor.image)}
                                        alt=""
                                        className="w-20 h-20 rounded-full object-cover"
                                    />
                                ) : (
                                    <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                    </svg>
                                )}
                            </div>
                            <div>
                                <h3 className="text-lg font-semibold text-gray-900">
                                    BS. {selectedDoctor.firstName} {selectedDoctor.lastName}
                                </h3>
                                <p className="text-gray-600">{selectedDoctor.positionData?.valueVi || 'Bác sĩ'}</p>
                                <span className="inline-block mt-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                    {selectedDoctor.specialtyData?.name || 'Chưa có chuyên khoa'}
                                </span>
                            </div>
                        </div>

                        {/* Date Selection */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày khám</label>
                            <div className="flex flex-wrap gap-2">
                                {dateOptions.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => handleDateChange(opt.value)}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                                            selectedDate === opt.value
                                                ? 'bg-blue-600 text-white'
                                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                    >
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Available Schedules */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Chọn giờ khám</label>
                            {loadingSchedules ? (
                                <div className="flex items-center justify-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                                </div>
                            ) : schedules.length === 0 ? (
                                <div className="text-center py-8 bg-gray-50 rounded-xl">
                                    <svg className="w-12 h-12 mx-auto text-gray-300 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    <p className="text-gray-500">Không có lịch khám trong ngày này</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-2 gap-3">
                                    {schedules.map(sch => {
                                        const isFull = (sch.currentNumber || 0) >= sch.maxNumber;
                                        return (
                                            <button
                                                key={sch.id}
                                                onClick={() => !isFull && handleBookAppointment(sch)}
                                                disabled={isFull}
                                                className={`p-4 rounded-xl border text-left transition ${
                                                    isFull
                                                        ? 'bg-gray-100 border-gray-200 cursor-not-allowed opacity-60'
                                                        : 'bg-white border-gray-200 hover:border-blue-500 hover:bg-blue-50'
                                                }`}
                                            >
                                                <p className="font-medium text-gray-900">{sch.timeTypeData?.valueVi || sch.timeType}</p>
                                                <div className="flex items-center justify-between mt-2">
                                                    <span className={`text-sm ${isFull ? 'text-red-600' : 'text-green-600'}`}>
                                                        {isFull ? 'Đã đầy' : `Còn ${sch.maxNumber - (sch.currentNumber || 0)} chỗ`}
                                                    </span>
                                                    {!isFull && (
                                                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </SlidePanel>
        </div>
    );
}
