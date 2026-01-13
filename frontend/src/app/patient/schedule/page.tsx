'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { getDoctorSchedulesForPatient, getAllDoctors } from '@/lib/api';
import { format, addDays } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'react-hot-toast';
import { getAvatarUrl } from '@/lib/utils';

interface Doctor {
    id: number;
    firstName: string;
    lastName: string;
    image?: string;
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

export default function PatientSchedulePage() {
    const router = useRouter();
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [selectedDoctorId, setSelectedDoctorId] = useState<number>(0);
    const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingSchedules, setLoadingSchedules] = useState(false);

    useEffect(() => {
        fetchDoctors();
    }, []);

    useEffect(() => {
        if (selectedDoctorId && selectedDate) {
            fetchSchedules();
        }
    }, [selectedDoctorId, selectedDate]);

    const fetchDoctors = async () => {
        try {
            setLoading(true);
            const data = await getAllDoctors();
            setDoctors(data);
            if (data.length > 0) {
                setSelectedDoctorId(data[0].id);
            }
        } catch (error) {
            toast.error('Không thể tải danh sách bác sĩ');
        } finally {
            setLoading(false);
        }
    };

    const fetchSchedules = async () => {
        try {
            setLoadingSchedules(true);
            const data = await getDoctorSchedulesForPatient(selectedDoctorId, selectedDate);
            setSchedules(data);
        } catch (error) {
            setSchedules([]);
        } finally {
            setLoadingSchedules(false);
        }
    };

    const selectedDoctor = useMemo(() => {
        return doctors.find(d => d.id === selectedDoctorId);
    }, [doctors, selectedDoctorId]);

    const dateOptions = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => {
            const date = addDays(new Date(), i);
            return {
                value: format(date, 'yyyy-MM-dd'),
                label: i === 0 ? 'Hôm nay' : i === 1 ? 'Ngày mai' : format(date, 'EEEE, dd/MM', { locale: vi })
            };
        });
    }, []);

    const handleBookAppointment = (schedule: Schedule) => {
        const token = localStorage.getItem('token');
        if (!token) {
            toast.error('Vui lòng đăng nhập để đặt lịch');
            router.push('/auth/login?redirect=/patient/schedule');
            return;
        }
        router.push(`/patient/book_appointment?doctorId=${selectedDoctorId}&scheduleId=${schedule.id}&date=${selectedDate}&timeType=${schedule.timeType}`);
    };

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
                <h1 className="text-xl font-bold text-gray-900">Xem lịch khám</h1>
                <p className="text-sm text-gray-500 mt-1">Tìm và đặt lịch khám với bác sĩ</p>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-6">
                <div className="max-w-3xl mx-auto space-y-6">
                    {/* Doctor Selection */}
                    <div className="bg-white rounded-xl border p-6">
                        <h2 className="font-semibold text-gray-900 mb-4">Chọn bác sĩ</h2>
                        <select
                            value={selectedDoctorId}
                            onChange={(e) => setSelectedDoctorId(Number(e.target.value))}
                            className="w-full px-4 py-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value={0}>-- Chọn bác sĩ --</option>
                            {doctors.map(doc => (
                                <option key={doc.id} value={doc.id}>
                                    BS. {doc.firstName} {doc.lastName} {doc.specialtyData?.name ? `- ${doc.specialtyData.name}` : ''}
                                </option>
                            ))}
                        </select>

                        {selectedDoctor && (
                            <div className="flex items-center gap-4 mt-4 p-4 bg-gray-50 rounded-xl">
                                <div className="w-14 h-14 bg-blue-100 rounded-full flex items-center justify-center overflow-hidden">
                                    {selectedDoctor.image ? (
                                        <Image
                                            src={getAvatarUrl(selectedDoctor.image)}
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
                                    <h3 className="font-medium text-gray-900">BS. {selectedDoctor.firstName} {selectedDoctor.lastName}</h3>
                                    {selectedDoctor.specialtyData?.name && (
                                        <span className="inline-block mt-1 px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                                            {selectedDoctor.specialtyData.name}
                                        </span>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Date Selection */}
                    {selectedDoctorId > 0 && (
                        <div className="bg-white rounded-xl border p-6">
                            <h2 className="font-semibold text-gray-900 mb-4">Chọn ngày khám</h2>
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
                    )}

                    {/* Schedules */}
                    {selectedDoctorId > 0 && (
                        <div className="bg-white rounded-xl border p-6">
                            <h2 className="font-semibold text-gray-900 mb-4">Lịch khám có sẵn</h2>
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
                    )}
                </div>
            </div>
        </div>
    );
}
