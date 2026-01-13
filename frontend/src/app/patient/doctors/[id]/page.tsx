'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { getDoctorById, getDoctorSchedulesForPatient } from '@/lib/api';
import { format, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { getAvatarUrl } from '@/lib/utils';

interface Schedule {
    id: number;
    date: string;
    timeType: string;
    maxNumber: number;
    currentNumber?: number;
    timeTypeData?: { valueVi: string };
}

interface Doctor {
    id: number;
    email?: string;
    firstName: string;
    lastName: string;
    address?: string;
    phoneNumber?: string;
    gender?: boolean;
    image?: string;
    Specialty?: { id: number; name: string };
    specialtyData?: { id: number; name: string; description?: string };
    positionData?: { keyMap: string; valueVi: string };
    doctorDetail?: { descriptionMarkdown?: string; descriptionHTML?: string } | null;
}

export default function DoctorDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const [doctor, setDoctor] = useState<Doctor | null>(null);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingSchedules, setLoadingSchedules] = useState(false);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    useEffect(() => {
        if (!params?.id) return;
        fetchDoctor();
    }, [params?.id]);

    useEffect(() => {
        if (!params?.id || !selectedDate) return;
        fetchSchedules();
    }, [params?.id, selectedDate]);

    const fetchDoctor = async () => {
        try {
            setLoading(true);
            const data = await getDoctorById(Number(params?.id));
            setDoctor(data);
        } catch (error) {
            toast.error('Lỗi khi tải thông tin bác sĩ');
        } finally {
            setLoading(false);
        }
    };

    const fetchSchedules = async () => {
        try {
            setLoadingSchedules(true);
            const data = await getDoctorSchedulesForPatient(Number(params?.id), selectedDate);
            setSchedules(data);
        } catch (error) {
            setSchedules([]);
        } finally {
            setLoadingSchedules(false);
        }
    };

    const handleBookAppointment = (schedule: Schedule) => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Vui lòng đăng nhập để đặt lịch');
            router.push(`/auth/login?redirect=/patient/doctors/${params?.id}`);
            return;
        }
        router.push(`/patient/book_appointment?doctorId=${doctor?.id}&scheduleId=${schedule.id}&date=${selectedDate}&timeType=${schedule.timeType}`);
    };

    const dateOptions = Array.from({ length: 7 }, (_, i) => {
        const date = addDays(new Date(), i);
        return {
            value: format(date, 'yyyy-MM-dd'),
            label: i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : format(date, 'EEEE, dd/MM', { locale: vi })
        };
    });

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!doctor) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500 mb-4">Không tìm thấy thông tin bác sĩ</p>
                    <button
                        onClick={() => router.push('/patient/doctors')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    const specialtyName = doctor.specialtyData?.name || doctor.Specialty?.name || 'Chưa cập nhật';

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b bg-white flex-shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/patient/doctors')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">Thông tin bác sĩ</h1>
                        <p className="text-sm text-gray-500">Xem chi tiết và đặt lịch khám</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-4xl mx-auto space-y-6">
                    {/* Doctor Info Card */}
                    <div className="bg-white rounded-xl border overflow-hidden">
                        <div className="p-6">
                            <div className="flex flex-col sm:flex-row items-start gap-6">
                                <div className="w-32 h-32 bg-blue-100 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0">
                                    {doctor.image ? (
                                        <Image
                                            src={getAvatarUrl(doctor.image)}
                                            alt=""
                                            width={128}
                                            height={128}
                                            className="w-32 h-32 rounded-xl object-cover"
                                            unoptimized
                                        />
                                    ) : (
                                        <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                        </svg>
                                    )}
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-2xl font-bold text-gray-900">
                                        BS. {doctor.firstName} {doctor.lastName}
                                    </h2>
                                    <p className="text-gray-600 mt-1">{doctor.positionData?.valueVi || 'Bác sĩ'}</p>
                                    <span className="inline-block mt-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                        {specialtyName}
                                    </span>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Email</p>
                                                <p className="font-medium text-gray-900">{doctor.email || 'Chưa cập nhật'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Điện thoại</p>
                                                <p className="font-medium text-gray-900">{doctor.phoneNumber || 'Chưa cập nhật'}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 sm:col-span-2">
                                            <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center">
                                                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                </svg>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500">Địa chỉ</p>
                                                <p className="font-medium text-gray-900">{doctor.address || 'Chưa cập nhật'}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {doctor.doctorDetail?.descriptionMarkdown && (
                        <div className="bg-white rounded-xl border p-6">
                            <h3 className="font-semibold text-gray-900 mb-4">Giới thiệu</h3>
                            <div className="prose prose-sm max-w-none text-gray-600">
                                <p className="whitespace-pre-wrap">{doctor.doctorDetail.descriptionMarkdown}</p>
                            </div>
                        </div>
                    )}

                    {/* Schedule Booking */}
                    <div className="bg-white rounded-xl border p-6">
                        <h3 className="font-semibold text-gray-900 mb-4">Đặt lịch khám</h3>

                        {/* Date Selection */}
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Chọn ngày khám</label>
                            <div className="flex flex-wrap gap-2">
                                {dateOptions.map(opt => (
                                    <button
                                        key={opt.value}
                                        onClick={() => setSelectedDate(opt.value)}
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

                        {/* Time Slots */}
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
                                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
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
                </div>
            </div>
        </div>
    );
}
