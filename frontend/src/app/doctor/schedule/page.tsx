'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import { getDoctorSchedules, getDoctorSchedulesRange, createSchedule, deleteDoctorSchedule } from '@/lib/api';
import { SlidePanel, DataTable } from '@/components/ui';
import { format, addDays, isBefore, startOfDay } from 'date-fns';
import { vi } from 'date-fns/locale';
import { toast } from 'react-hot-toast';

interface Schedule {
    id: number;
    date: string;
    doctorId: number;
    timeType: string;
    maxNumber: number;
    currentNumber?: number;
    status?: 'pending' | 'approved' | 'rejected';
    timeTypeData?: { valueVi: string };
}

const timeSlots = [
    { key: 'T1', label: '08:00 - 09:00' }, { key: 'T2', label: '09:00 - 10:00' },
    { key: 'T3', label: '10:00 - 11:00' }, { key: 'T4', label: '11:00 - 12:00' },
    { key: 'T5', label: '13:00 - 14:00' }, { key: 'T6', label: '14:00 - 15:00' },
    { key: 'T7', label: '15:00 - 16:00' }, { key: 'T8', label: '16:00 - 17:00' },
];

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
    pending: { label: 'Chờ duyệt', bg: 'bg-yellow-100', color: 'text-yellow-700' },
    approved: { label: 'Đã duyệt', bg: 'bg-green-100', color: 'text-green-700' },
    rejected: { label: 'Từ chối', bg: 'bg-red-100', color: 'text-red-700' },
};

function DoctorScheduleContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();

    // URL state - lấy ngày từ URL hoặc mặc định là hôm nay
    const selectedDate = searchParams.get('date') || format(new Date(), 'yyyy-MM-dd');

    const updateUrl = (date: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (date && date !== format(new Date(), 'yyyy-MM-dd')) {
            params.set('date', date);
        } else {
            params.delete('date');
        }
        router.replace(`${pathname}?${params.toString()}`, { scroll: false });
    };

    const [schedules, setSchedules] = useState<Schedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [userId, setUserId] = useState<number | null>(null);
    const [viewRange, setViewRange] = useState<boolean>(false);
    
    // Ngày tối thiểu là ngày mai
    const minDate = format(addDays(new Date(), 1), 'yyyy-MM-dd');
    
    const [formData, setFormData] = useState({ date: minDate, timeType: '', maxNumber: 5 });

    useEffect(() => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            const user = JSON.parse(userStr);
            setUserId(user.userId);
            fetchSchedules(user.userId);
        }
    }, [selectedDate, viewRange]);

    const fetchSchedules = async (doctorId: number) => {
        try {
            setLoading(true);
            let data: Schedule[] = [];
            if (viewRange) {
                const start = format(new Date(), 'yyyy-MM-dd');
                const end = format(addDays(new Date(), 30), 'yyyy-MM-dd');
                data = await getDoctorSchedulesRange(doctorId, start, end, true);
            } else {
                data = await getDoctorSchedules(doctorId, selectedDate);
            }
            setSchedules(data);
        } catch (error) {
            console.error('Error:', error);
            toast.error('Không thể tải lịch làm việc');
        } finally {
            setLoading(false);
        }
    };

    const openCreatePanel = () => {
        setFormData({ date: minDate, timeType: '', maxNumber: 5 });
        setIsPanelOpen(true);
    };

    const handleCreate = async () => {
        if (!userId || !formData.timeType || !formData.date) {
            toast.error('Vui lòng chọn ngày và khung giờ');
            return;
        }
        
        // Validate ngày phải >= ngày mai
        const selectedDateObj = startOfDay(new Date(formData.date));
        const tomorrow = startOfDay(addDays(new Date(), 1));
        if (isBefore(selectedDateObj, tomorrow)) {
            toast.error('Ngày đăng ký phải từ ngày mai trở đi');
            return;
        }
        
        setSubmitting(true);
        try {
            await createSchedule({ doctorId: userId, date: formData.date, timeType: formData.timeType, maxNumber: Number(formData.maxNumber) });
            toast.success('Đăng ký lịch thành công! Đang chờ Admin duyệt.');
            setIsPanelOpen(false);
            fetchSchedules(userId);
        } catch (error: unknown) {
            toast.error(error instanceof Error ? error.message : 'Lỗi khi đăng ký lịch');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDelete = async (id: number, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!window.confirm('Bạn có chắc chắn muốn hủy lịch này?')) return;
        try {
            await deleteDoctorSchedule(id);
            toast.success('Hủy lịch thành công!');
            if (userId) fetchSchedules(userId);
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Lỗi khi hủy lịch');
        }
    };

    const getTimeLabel = (timeType: string) => timeSlots.find(s => s.key === timeType)?.label || timeType;

    const columns = useMemo(() => [
        {
            key: 'date', header: 'Ngày',
            render: (s: Schedule) => <span className="font-medium">{format(new Date(s.date), 'dd/MM/yyyy', { locale: vi })}</span>
        },
        {
            key: 'timeType', header: 'Khung giờ',
            render: (s: Schedule) => <span>{s.timeTypeData?.valueVi || getTimeLabel(s.timeType)}</span>
        },
        {
            key: 'slots', header: 'Số lượng',
            render: (s: Schedule) => (
                <div className="flex items-center gap-3">
                    <span className="font-medium">{s.currentNumber || 0}/{s.maxNumber}</span>
                    <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="bg-blue-500 h-2 rounded-full transition-all" 
                            style={{ width: `${Math.min(((s.currentNumber || 0) / s.maxNumber) * 100, 100)}%` }}></div>
                    </div>
                </div>
            )
        },
        {
            key: 'status', header: 'Trạng thái',
            render: (s: Schedule) => {
                const status = statusConfig[s.status || 'approved'];
                return <span className={`px-2.5 py-1 rounded-full text-sm font-medium ${status.bg} ${status.color}`}>{status.label}</span>;
            }
        },
        {
            key: 'actions', header: '', width: 'w-20',
            render: (s: Schedule) => (
                (s.status === 'pending' || (s.currentNumber || 0) === 0) ? (
                    <button onClick={(e) => handleDelete(s.id, e)} className="p-2 hover:bg-red-50 rounded-lg transition" title="Hủy">
                        <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                    </button>
                ) : null
            )
        },
    ], []);

    if (loading) {
        return <div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>;
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b bg-white flex-shrink-0">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Lịch làm việc</h1>
                    <p className="text-sm text-gray-500">{schedules.length} lịch đã đăng ký</p>
                </div>
                <button onClick={openCreatePanel} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Đăng ký lịch
                </button>
            </div>

            <div className="px-6 py-3 bg-blue-50 border-b flex-shrink-0">
                <p className="text-sm text-blue-700">
                    <strong>Lưu ý:</strong> Lịch đăng ký mới sẽ ở trạng thái &quot;Chờ duyệt&quot; cho đến khi Admin phê duyệt.
                </p>
            </div>

            <div className="flex items-center gap-4 px-6 py-3 border-b bg-white flex-shrink-0">
                <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Chọn ngày xem</label>
                    <input type="date" value={selectedDate} onChange={(e) => updateUrl(e.target.value)}
                        className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div className="mt-6 flex items-center gap-2">
                    <input id="viewRange" type="checkbox" checked={viewRange} onChange={(e) => setViewRange(e.target.checked)} />
                    <label htmlFor="viewRange" className="text-sm text-gray-700">Hiển thị 30 ngày tới (tất cả trạng thái)</label>
                </div>
            </div>

            <div className="flex-1 overflow-hidden bg-white">
                <DataTable columns={columns} data={schedules} keyField="id" pageSize={15} emptyMessage={viewRange ? "Không có lịch làm việc nào trong 30 ngày tới" : "Không có lịch làm việc nào cho ngày này"} />
            </div>

            <SlidePanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} title="Đăng ký lịch làm việc" width="md">
                <div className="space-y-5">
                    <div>
                        <label className="block font-medium text-gray-700 mb-2">Ngày <span className="text-red-500">*</span></label>
                        <input type="date" value={formData.date} min={minDate}
                            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                            className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                        <p className="text-xs text-gray-500 mt-1">Chỉ được chọn từ ngày mai trở đi</p>
                    </div>
                    <div>
                        <label className="block font-medium text-gray-700 mb-2">Khung giờ <span className="text-red-500">*</span></label>
                        <select value={formData.timeType} onChange={(e) => setFormData({ ...formData, timeType: e.target.value })}
                            className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500">
                            <option value="">Chọn khung giờ</option>
                            {timeSlots.map(slot => <option key={slot.key} value={slot.key}>{slot.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block font-medium text-gray-700 mb-2">Số bệnh nhân tối đa</label>
                        <input type="number" min="1" max="20" value={formData.maxNumber}
                            onChange={(e) => setFormData({ ...formData, maxNumber: parseInt(e.target.value) || 1 })}
                            className="w-full px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-blue-500" />
                    </div>
                    <div className="flex gap-3 pt-4 border-t">
                        <button onClick={() => setIsPanelOpen(false)} className="flex-1 px-4 py-2.5 font-medium border rounded-lg hover:bg-gray-50 transition">Hủy</button>
                        <button onClick={handleCreate} disabled={submitting}
                            className="flex-1 px-4 py-2.5 font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50">
                            {submitting ? 'Đang đăng ký...' : 'Đăng ký'}
                        </button>
                    </div>
                </div>
            </SlidePanel>
        </div>
    );
}

export default function DoctorSchedulePage() {
    return (
        <Suspense fallback={<div className="h-full flex items-center justify-center"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div></div>}>
            <DoctorScheduleContent />
        </Suspense>
    );
}
