'use client';

import { useEffect, useState } from 'react';
import { getDashboardStats, DashboardStats, getPendingSchedules } from '@/lib/api';
import Link from 'next/link';
import { toast } from 'react-hot-toast';

type StatColor = 'blue' | 'green' | 'purple' | 'amber'

interface StatCard {
    label: string
    value: number
    icon: string
    color: StatColor
    href: string
}

interface QuickLinkItem {
    label: string
    href: string
    icon: string
}

const colorClasses: Record<StatColor, { bg: string; text: string; iconBg: string; border: string }> = {
    blue: { bg: 'bg-blue-50', text: 'text-blue-600', iconBg: 'bg-blue-100', border: 'border-blue-600' },
    green: { bg: 'bg-green-50', text: 'text-green-600', iconBg: 'bg-green-100', border: 'border-green-600' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-600', iconBg: 'bg-purple-100', border: 'border-purple-600' },
    amber: { bg: 'bg-amber-50', text: 'text-amber-600', iconBg: 'bg-amber-100', border: 'border-amber-600' },
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [pendingCount, setPendingCount] = useState(0);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [dashboardStats, pending] = await Promise.all([
                    getDashboardStats(),
                    getPendingSchedules()
                ]);
                setStats(dashboardStats);
                setPendingCount(pending.length);
            } catch (error) {
                toast.error('Lỗi khi tải dữ liệu');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const statCards: StatCard[] = [
        { label: 'Tổng người dùng', value: stats?.totalUsers || 0, icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z', color: 'blue', href: '/admin/users' },
        { label: 'Bác sĩ', value: stats?.totalDoctors || 0, icon: 'M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z', color: 'green', href: '/admin/doctors' },
        { label: 'Chuyên khoa', value: stats?.totalSpecialties || 0, icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z', color: 'purple', href: '/admin/specialties' },
        { label: 'Lịch khám hôm nay', value: stats?.todayAppointments || 0, icon: '8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z', color: 'amber', href: '/admin/appointments' },
    ];

    const quickLinks: QuickLinkItem[] = [
        { label: 'Quản lý người dùng', href: '/admin/users', icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z' },
        { label: 'Quản lý chuyên khoa', href: '/admin/specialties', icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z' },
        { label: 'Quản lý lịch phân công', href: '/admin/schedules', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
        { label: 'Quản lý lịch khám', href: '/admin/appointments', icon: 'M9 5H7a2 2 0 00-2 2v11a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2' },
    ];

    

    return (
        <div className="h-full flex flex-col overflow-auto">
            {/* Header */}
            <div className="px-6 py-4 border-b bg-white flex-shrink-0">
                <h1 className="text-xl font-bold text-gray-900">Dashboard</h1>
                <p className="text-sm text-gray-500">Tổng quan hệ thống quản lý phòng khám</p>
            </div>

            <div className="flex-1 p-6 space-y-6 overflow-auto">
                {/* Alert for pending schedules */}
                {pendingCount > 0 && (
                    <Link href="/admin/schedules">
                        <div className="flex items-center justify-between p-4 bg-amber-50 border border-amber-200 rounded-xl hover:bg-amber-100 transition cursor-pointer">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-amber-100 rounded-lg">
                                    <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-medium text-amber-900">Có {pendingCount} lịch phân công đang chờ duyệt</p>
                                    <p className="text-sm text-amber-700">Nhấn để xem và xử lý</p>
                                </div>
                            </div>
                            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </div>
                    </Link>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map((stat) => {
                        const colors = colorClasses[stat.color];
                        return (
                            <Link key={stat.label} href={stat.href}>
                                <div className={`p-4 rounded-xl border transition-all hover:shadow-md cursor-pointer ${colors.bg} ${colors.border}`}>
                                    <div className="flex items-center justify-between mb-3">
                                        <div className={`p-2 rounded-lg ${colors.iconBg}`}>
                                            <svg className={`w-5 h-5 ${colors.text}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={stat.icon} />
                                            </svg>
                                        </div>
                                    </div>
                                    <p className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</p>
                                    <p className="text-sm text-gray-600">{stat.label}</p>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Quick Links */}
                <div>
                    <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Truy cập nhanh</h2>
                    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                        {quickLinks.map((link) => (
                            <Link key={link.href} href={link.href}>
                                <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 transition">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={link.icon} />
                                    </svg>
                                    <span className="text-sm font-medium text-gray-700">{link.label}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>

                {/* Additional Stats */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    <div className="bg-white rounded-xl border p-5">
                        <h3 className="font-semibold text-gray-900 mb-4">Thống kê lịch khám</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Tổng lịch khám</span>
                                <span className="font-semibold">{stats?.totalAppointments?.toLocaleString() || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Lịch khám hôm nay</span>
                                <span className="font-semibold text-blue-600">{stats?.todayAppointments || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Chờ xác nhận</span>
                                <span className="font-semibold text-amber-600">{stats?.pendingAppointments || 0}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl border p-5">
                        <h3 className="font-semibold text-gray-900 mb-4">Thống kê hệ thống</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Lịch làm việc đang hoạt động</span>
                                <span className="font-semibold">{stats?.activeSchedules || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Người dùng online</span>
                                <span className="font-semibold text-green-600">{stats?.activeUsers || 0}</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span className="text-gray-600">Hiệu suất hệ thống</span>
                                <span className="font-semibold text-green-600">{stats?.systemHealth || 100}%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
