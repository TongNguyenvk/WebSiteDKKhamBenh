'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { getSpecialtyById, getDoctorsBySpecialty, getDoctorSchedulesForPatient } from '@/lib/api';
import { SlidePanel } from '@/components/ui';
import { format, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { getAvatarUrl, getSpecialtyImageUrl } from '@/lib/utils';

interface Specialty {
    id: number;
    name: string;
    description?: string;
    image?: string;
}

interface Doctor {
    id: number;
    firstName: string;
    lastName: string;
    image?: string;
    positionData?: { valueVi: string };
    specialtyData?: { name: string };
}

interface Schedule {
    id: number;
    date: string;
    timeType: string;
    maxNumber: number;
    currentNumber?: number;
    timeTypeData?: { valueVi: string };
}

export default function SpecialtyDetailPage() {
    const params = useParams<{ id: string }>();
    const router = useRouter();
    const [specialty, setSpecialty] = useState<Specialty | null>(null);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loadingSchedules, setLoadingSchedules] = useState(false);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    useEffect(() => {
        if (!params?.id) return;
        fetchData();
    }, [params?.id]);

    const fetchData = async () => {
        try {
            setLoading(true);
            const specialtyId = Number(params?.id);
            const [specialtyData, doctorsData] = await Promise.all([
                getSpecialtyById(specialtyId),
                getDoctorsBySpecialty(specialtyId)
            ]);
            setSpecialty(specialtyData as Specialty);
            setDoctors(Array.isArray(doctorsData) ? doctorsData : []);
        } catch (error) {
            toast.error('Lỗi khi tải thông tin chuyên khoa');
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

    if (!specialty) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-500 mb-4">Không tìm thấy thông tin chuyên khoa</p>
                    <button
                        onClick={() => router.push('/patient/specialties')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Quay lại
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b bg-white flex-shrink-0">
                <div className="flex items-center gap-3">
                    <button
                        onClick={() => router.push('/patient/specialties')}
                        className="p-2 hover:bg-gray-100 rounded-lg transition"
                    >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900">{specialty.name}</h1>
                        <p className="text-sm text-gray-500">{doctors.length} bác sĩ</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                {/* Specialty Info */}
                <div className="bg-white rounded-xl border overflow-hidden mb-6">
                    <div className="relative h-48">
                        {specialty.image ? (
                            <Image
                                src={getSpecialtyImageUrl(specialty.image)}
                                alt={specialty.name}
                                fill
                                className="object-cover"
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
                                <svg className="w-16 h-16 text-white/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                        <div className="absolute bottom-4 left-4 right-4">
                            <h2 className="text-white text-2xl font-bold">{specialty.name}</h2>
                        </div>
                    </div>
                    {specialty.description && (
                        <div className="p-5">
                            <p className="text-gray-600">{specialty.description}</p>
                        </div>
                    )}
                </div>

                {/* Doctors List */}
                <div className="bg-white rounded-xl border">
                    <div className="px-5 py-4 border-b">
                        <h2 className="font-semibold text-gray-900">Danh sách bác sĩ</h2>
                    </div>
                    {doctors.length === 0 ? (
                        <div className="text-center py-12">
                            <svg className="w-16 h-16 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <p className="text-gray-500">Chưa có bác sĩ nào trong chuyên khoa này</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {doctors.map(doctor => (
                                <div
                                    key={doctor.id}
                                    className="flex items-center justify-between p-4 hover:bg-gray-50 transition"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                                            {doctor.image ? (
                                                <Image
                                                    src={getAvatarUrl(doctor.image)}
                                                    alt=""
                                                    width={56}
                                                    height={56}
                                                    className="w-14 h-14 rounded-full object-cover"
                                                    unoptimized
                                                />
                                            ) : (
                                                <svg className="w-7 h-7 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                </svg>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-gray-900">BS. {doctor.firstName} {doctor.lastName}</h3>
                                            <p className="text-sm text-gray-500">{doctor.positionData?.valueVi || 'Bác sĩ'}</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleSelectDoctor(doctor)}
                                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition"
                                    >
                                        Đặt lịch
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
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
                            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                                {selectedDoctor.image ? (
                                    <Image
                                        src={getAvatarUrl(selectedDoctor.image)}
                                        alt=""
                                        width={64}
                                        height={64}
                                        className="w-16 h-16 rounded-full object-cover"
                                        unoptimized
                                    />
                                ) : (
                                    <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                                    {specialty.name}
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
