import { useEffect, useState } from "react";
import { SuperAdminGetDashboard } from "@/services/data";
import { toast } from "sonner";
import { MdBusiness, MdPeople, MdDevices } from "react-icons/md";
import { FaUserTie } from "react-icons/fa";

interface DashboardStats {
    objects_count: number;
    users_count: number;
    employees_count: number;
    terminals_count: number;
}
interface ObjectEmployeeCount { object_id: string; object_name: string; employees_count: string; }
interface ObjectTerminalCount  { object_id: string; object_name: string; terminals_count: string; }
interface UserObjectBinding    {
    user_id: string; firstname: string; lastname: string;
    login: string; role_id: string; object_id: string;
    object_name: string; binding_active: string;
}
interface DashboardData {
    stats: DashboardStats;
    objects_employees_count: ObjectEmployeeCount[];
    objects_terminals_count: ObjectTerminalCount[];
    user_object_bindings: UserObjectBinding[];
}

const STAT_CARDS = [
    { key: "objects_count"   as const, label: "Объекты",      icon: MdBusiness, color: "text-blue-600",    bg: "bg-blue-50"   },
    { key: "users_count"     as const, label: "Пользователи", icon: MdPeople,   color: "text-violet-600",  bg: "bg-violet-50" },
    { key: "employees_count" as const, label: "Сотрудники",   icon: FaUserTie,  color: "text-emerald-600", bg: "bg-emerald-50"},
    { key: "terminals_count" as const, label: "Терминалы",    icon: MdDevices,  color: "text-orange-600",  bg: "bg-orange-50" },
];

const AdminDashboard = () => {
    const [data, setData]       = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        SuperAdminGetDashboard()
            .then((res) => setData(res))
            .catch(() => toast.error("Не удалось загрузить статистику"))
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-7 h-7 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin" />
                    <p className="text-[12px] text-slate-400 font-medium">Загрузка...</p>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const maxEmp = Math.max(...data.objects_employees_count.map((o) => Number(o.employees_count)), 1);

    return (
        <div className="space-y-5 pb-8">

            {/* ── Stat row ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                {STAT_CARDS.map(({ key, label, icon: Icon, color, bg }) => (
                    <div
                        key={key}
                        className="bg-white rounded-xl border border-slate-200/80 px-5 py-4 shadow-sm"
                    >
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-[0.08em]">
                                    {label}
                                </p>
                                <p className="text-3xl font-bold text-slate-900 mt-2 leading-none tabular-nums">
                                    {data.stats[key].toLocaleString()}
                                </p>
                            </div>
                            <span className={`w-9 h-9 rounded-lg ${bg} ${color} flex items-center justify-center shrink-0`}>
                                <Icon className="w-4 h-4" />
                            </span>
                        </div>
                        {/* thin color accent bottom border */}
                        <div className={`mt-4 h-0.5 w-full rounded-full ${bg.replace("bg-", "bg-").replace("50", "200")}`} />
                    </div>
                ))}
            </div>

            {/* ── Middle row ───────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                {/* Employees per object */}
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <p className="text-[13px] font-semibold text-slate-800">Сотрудники по объектам</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Распределение персонала</p>
                        </div>
                        <span className="text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                            {data.objects_employees_count.length} объектов
                        </span>
                    </div>
                    <div className="px-5 py-4 space-y-4">
                        {data.objects_employees_count.map((obj) => {
                            const pct = Math.round((Number(obj.employees_count) / maxEmp) * 100);
                            return (
                                <div key={obj.object_id}>
                                    <div className="flex items-center justify-between mb-1.5">
                                        <span className="text-[13px] text-slate-700 truncate flex-1 mr-3">
                                            {obj.object_name}
                                        </span>
                                        <span className="text-[13px] font-semibold text-slate-900 tabular-nums whitespace-nowrap">
                                            {obj.employees_count}
                                        </span>
                                    </div>
                                    <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full transition-all"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                        {data.objects_employees_count.length === 0 && (
                            <p className="text-[13px] text-slate-400 text-center py-6">Нет данных</p>
                        )}
                    </div>
                </div>

                {/* Terminals per object */}
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <p className="text-[13px] font-semibold text-slate-800">Терминалы по объектам</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Покрытие устройствами</p>
                        </div>
                        <span className="text-[11px] font-semibold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded-full">
                            {data.stats.terminals_count} устройств
                        </span>
                    </div>
                    <div className="px-5 py-4 space-y-2">
                        {data.objects_terminals_count.map((obj) => (
                            <div
                                key={obj.object_id}
                                className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-slate-50 hover:bg-slate-100/80 transition-colors"
                            >
                                <div className="flex items-center gap-2.5">
                                    <span className="w-6 h-6 rounded-md bg-orange-100 flex items-center justify-center shrink-0">
                                        <MdDevices className="w-3.5 h-3.5 text-orange-600" />
                                    </span>
                                    <span className="text-[13px] text-slate-700">{obj.object_name}</span>
                                </div>
                                <span className="text-[13px] font-bold text-slate-900 tabular-nums">
                                    {obj.terminals_count}
                                </span>
                            </div>
                        ))}
                        {data.objects_terminals_count.length === 0 && (
                            <p className="text-[13px] text-slate-400 text-center py-6">Нет данных</p>
                        )}
                    </div>
                </div>
            </div>

            {/* ── User bindings table ───────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div>
                        <p className="text-[13px] font-semibold text-slate-800">Привязки пользователей к объектам</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Назначения системных пользователей</p>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                        {data.user_object_bindings.length} записей
                    </span>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-slate-100 bg-slate-50/80">
                                {["Пользователь", "Логин", "Объект", "Статус"].map((h) => (
                                    <th key={h} className="px-4 py-3 text-left text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {data.user_object_bindings.map((b) => (
                                <tr key={`${b.user_id}-${b.object_id}`} className="hover:bg-slate-50/60 transition-colors">
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">
                                                {b.lastname.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-[13px] font-medium text-slate-800">
                                                {b.lastname} {b.firstname}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 font-mono text-[12px] text-slate-400">{b.login}</td>
                                    <td className="px-4 py-3 text-[13px] text-slate-600">{b.object_name}</td>
                                    <td className="px-4 py-3">
                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border ${
                                            b.binding_active === "1"
                                                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                : "bg-slate-50 text-slate-400 border-slate-100"
                                        }`}>
                                            <span className={`w-1.5 h-1.5 rounded-full ${b.binding_active === "1" ? "bg-emerald-500" : "bg-slate-300"}`} />
                                            {b.binding_active === "1" ? "Активен" : "Неактивен"}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                            {data.user_object_bindings.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-4 py-14 text-center text-[13px] text-slate-400">
                                        Нет данных
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
