import { cn } from "@/lib/utils";
import { useMemo, useState, useEffect } from "react";
import {
    FiClock,
    FiUserCheck,
    FiUsers,
    FiUserX,
    FiDownload,
} from "react-icons/fi";
import { MdOutlineEventAvailable } from "react-icons/md";
import { GetDailyAttendance, DownloadAttendanceExcel } from "@/services/data";
import { DatePicker } from "@/components/ui/date-picker";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import CustomModal from "@/components/ui/custom-modal";
import CustomPagination from "@/components/ui/custom-pagination";
import { Link } from "react-router-dom";

// ─── Types ────────────────────────────────────────────────────────────────────

type AttendanceData = {
    date: string;
    total_employees: number;
    statistics: {
        on_time: number;
        late: number;
        absent: number;
        day_off: number;
        present: number;
    };
    attendance: Array<{
        faceid_user_id: number;
        name: string;
        position: string;
        shift_name: string;
        shift_start: string;
        shift_end: string;
        check_in_datetime: string | null;
        check_in_time: string | null;
        check_out_datetime: string | null;
        check_out_time: string | null;
        late_minutes: number;
        late_minutes_text: string | null;
        overtime_minutes: number;
        overtime_minutes_text: string;
        status: "present" | "late" | "absent";
        is_day_off: boolean;
        late_tolerance_minutes: number;
        image_path?: string | null;
    }>;
    pagination?: {
        current_page: number;
        total_pages: number;
        total_items: number;
        items_per_page: number;
        has_next: boolean;
        has_prev: boolean;
    };
    monthly_top?: {
        frequently_late: Array<{
            faceid_user_id: number;
            name: string;
            position: string;
            late_count: number;
            total_late_minutes: number;
        }>;
        frequently_absent: Array<{
            faceid_user_id: number;
            name: string;
            position: string;
            absent_count: number;
        }>;
        analysis_period?: {
            start_date: string;
            end_date: string;
            actual_start_date: string;
            actual_end_date: string;
            first_record_date: string;
            days_analyzed: number;
            note: string;
        };
    };
};

type AttendanceItem = AttendanceData["attendance"][number];

// ─── Constants ────────────────────────────────────────────────────────────────

const months = [
    { name: "Январь",   value: "01" },
    { name: "Февраль",  value: "02" },
    { name: "Март",     value: "03" },
    { name: "Апрель",   value: "04" },
    { name: "Май",      value: "05" },
    { name: "Июнь",     value: "06" },
    { name: "Июль",     value: "07" },
    { name: "Август",   value: "08" },
    { name: "Сентябрь", value: "09" },
    { name: "Октябрь",  value: "10" },
    { name: "Ноябрь",   value: "11" },
    { name: "Декабрь",  value: "12" },
];

const statusCfg: Record<AttendanceItem["status"], { label: string; badge: string; dot: string }> = {
    present: { label: "На месте",    badge: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
    late:    { label: "Опоздал",     badge: "bg-amber-50  text-amber-700  border-amber-100",    dot: "bg-amber-400"  },
    absent:  { label: "Отсутствует", badge: "bg-red-50    text-red-600    border-red-100",       dot: "bg-red-400"    },
};

const statLabels: Record<keyof AttendanceData["statistics"], string> = {
    on_time: "Вовремя",
    late:    "Опоздали",
    absent:  "Отсутствуют",
    day_off: "Выходной",
    present: "На месте",
};

const statBarColor: Record<string, string> = {
    late:   "bg-amber-400",
    absent: "bg-red-400",
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const today = () => fmt(new Date());

// ─── Component ────────────────────────────────────────────────────────────────

const Dashboard = () => {
    const [loading,        setLoading]        = useState(true);
    const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
    const [error,          setError]          = useState<string | null>(null);
    const [selectedDate,   setSelectedDate]   = useState<string>(today());
    const [modalImage,     setModalImage]     = useState<string | null>(null);
    const [selectedYear,   setSelectedYear]   = useState<number>(new Date().getFullYear());
    const [selectedMonth,  setSelectedMonth]  = useState<string>(String(new Date().getMonth() + 1).padStart(2, "0"));
    const [downloading,    setDownloading]    = useState(false);
    const [excelModalOpen, setExcelModalOpen] = useState(false);
    const [currentPage,    setCurrentPage]    = useState(1);

    const selectedDateValue = useMemo(() => {
        const p = new Date(selectedDate);
        return Number.isNaN(p.getTime()) ? undefined : p;
    }, [selectedDate]);

    // ── Data fetching (unchanged logic) ──────────────────────────────────────
    useEffect(() => { setCurrentPage(1); }, [selectedDate]);

    useEffect(() => {
        const id = setTimeout(async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await GetDailyAttendance(selectedDate, currentPage);
                setAttendanceData(data);
            } catch (err: any) {
                setError(err?.response?.data?.message || "Не удалось загрузить данные посещаемости");
            } finally {
                setLoading(false);
            }
        }, 100);
        return () => clearTimeout(id);
    }, [selectedDate, currentPage]);

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && modalImage) setModalImage(null); };
        if (modalImage) {
            document.addEventListener("keydown", onKey);
            document.body.style.overflow = "hidden";
        }
        return () => {
            document.removeEventListener("keydown", onKey);
            document.body.style.overflow = "unset";
        };
    }, [modalImage]);

    const handleDownloadExcel = async () => {
        if (!selectedMonth || !selectedYear) return;
        const monthYear = `${selectedYear}-${selectedMonth}`;
        try {
            setDownloading(true);
            const blob = await DownloadAttendanceExcel(monthYear);
            const url  = window.URL.createObjectURL(blob);
            const a    = document.createElement("a");
            a.href     = url;
            a.download = `attendance_${monthYear}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            setExcelModalOpen(false);
        } catch (err: any) {
            setExcelModalOpen(false);
            setError(err?.response?.data?.message || "Не удалось загрузить Excel файл");
        } finally {
            setDownloading(false);
        }
    };

    // ── Derived ──────────────────────────────────────────────────────────────
    const summary = useMemo(() => {
        if (!attendanceData) return [];
        const total = attendanceData.total_employees ?? 0;
        const s     = attendanceData.statistics ?? { on_time: 0, late: 0, absent: 0, day_off: 0, present: 0 };
        const pct   = (n: number) => (total > 0 ? `${Math.round((n / total) * 100)}%` : "0%");
        return [
            { label: "Все сотрудники",  value: total,       icon: FiUsers,              pct: `Всего ${total}`,    color: "text-blue-600",    bg: "bg-blue-50"    },
            { label: "Пришли вовремя",  value: s.on_time,   icon: FiUserCheck,          pct: pct(s.on_time),      color: "text-emerald-600", bg: "bg-emerald-50" },
            { label: "Опоздавшие",      value: s.late,      icon: FiClock,              pct: pct(s.late),         color: "text-amber-600",   bg: "bg-amber-50"   },
            { label: "Не пришли",       value: s.absent,    icon: FiUserX,              pct: pct(s.absent),       color: "text-red-600",     bg: "bg-red-50"     },
            { label: "На выходном",     value: s.day_off,   icon: MdOutlineEventAvailable, pct: pct(s.day_off),  color: "text-slate-600",   bg: "bg-slate-100"  },
        ];
    }, [attendanceData]);

    const formattedDate = useMemo(() => {
        if (!attendanceData?.date) return "";
        const p = new Date(attendanceData.date);
        if (Number.isNaN(p.getTime())) return "";
        try { return new Intl.DateTimeFormat("ru-RU", { day: "2-digit", month: "long", year: "numeric" }).format(p); }
        catch { return ""; }
    }, [attendanceData]);

    // ── Loading / error states ────────────────────────────────────────────────
    if (loading) return (
        <div className="h-[70vh] flex flex-col items-center justify-center gap-3">
            <div className="w-7 h-7 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin" />
            <p className="text-[12px] text-slate-400 font-medium">Загрузка данных...</p>
        </div>
    );

    if (error) return (
        <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
            <p className="text-red-500 text-[14px]">{error}</p>
            <button onClick={() => setSelectedDate(today())}
                className="px-4 py-2 bg-blue-600 text-white text-[13px] rounded-lg hover:bg-blue-700 transition-colors">
                Попробовать снова
            </button>
        </div>
    );

    if (!attendanceData) return (
        <div className="h-[70vh] flex items-center justify-center">
            <p className="text-slate-400 text-[14px]">Нет данных для отображения</p>
        </div>
    );

    const statsSafe   = attendanceData.statistics ?? { on_time: 0, late: 0, absent: 0, day_off: 0, present: 0 };
    const totalSafe   = attendanceData.total_employees ?? 0;
    const listSafe    = attendanceData.attendance ?? [];

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="space-y-5 pb-8">

            {/* ── Header bar ─────────────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm px-5 py-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-[0.1em] text-slate-400">
                            Посещаемость за день
                        </p>
                        <h1 className="text-[18px] font-semibold text-slate-900 mt-0.5">
                            {formattedDate}
                        </h1>
                        <p className="text-[12px] text-slate-400 mt-0.5">
                            Всего сотрудников:{" "}
                            <span className="font-semibold text-slate-700">{totalSafe}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                        <DatePicker
                            date={selectedDateValue}
                            onSelect={(d) => d && setSelectedDate(fmt(d))}
                            placeholder="Выберите дату"
                            className="h-9 text-[13px] rounded-lg"
                        />
                        <CustomModal
                            trigger={
                                <Button
                                    onClick={() => setExcelModalOpen(true)}
                                    className="h-9 px-3 bg-blue-600 hover:bg-blue-700 text-white text-[13px] rounded-lg gap-1.5"
                                >
                                    <FiDownload className="w-3.5 h-3.5" />
                                    Excel
                                </Button>
                            }
                            open={excelModalOpen}
                            onOpenChange={setExcelModalOpen}
                            title="Скачать Excel отчёт"
                            showFooter={false}
                            size="md"
                        >
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[12px] font-medium text-slate-600">Год</label>
                                        <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                                            <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {Array.from({ length: 5 }, (_, i) => {
                                                    const y = new Date().getFullYear() - 1 + i;
                                                    return <SelectItem key={y} value={y.toString()}>{y}</SelectItem>;
                                                })}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[12px] font-medium text-slate-600">Месяц</label>
                                        <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                                            <SelectTrigger className="h-9 text-[13px]"><SelectValue /></SelectTrigger>
                                            <SelectContent>
                                                {months.map((m) => (
                                                    <SelectItem key={m.value} value={m.value}>{m.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-end pt-1">
                                    <Button variant="outline" onClick={() => setExcelModalOpen(false)} disabled={downloading} className="h-9 text-[13px] rounded-lg">
                                        Отмена
                                    </Button>
                                    <Button onClick={handleDownloadExcel} disabled={downloading || !selectedMonth || !selectedYear}
                                        className="h-9 bg-blue-600 hover:bg-blue-700 text-white text-[13px] rounded-lg gap-1.5">
                                        <FiDownload className="w-3.5 h-3.5" />
                                        {downloading ? "Загрузка..." : "Скачать"}
                                    </Button>
                                </div>
                            </div>
                        </CustomModal>
                    </div>
                </div>
            </div>

            {/* ── Stat cards ─────────────────────────────────────────────── */}
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 xl:grid-cols-5">
                {summary.map((s) => (
                    <div key={s.label} className="bg-white rounded-xl border border-slate-200/80 shadow-sm px-4 py-4">
                        <div className="flex items-center justify-between">
                            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400 leading-none">
                                {s.label}
                            </p>
                            <span className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", s.bg, s.color)}>
                                <s.icon className="w-3.5 h-3.5" />
                            </span>
                        </div>
                        <p className="text-3xl font-bold text-slate-900 mt-3 tabular-nums leading-none">{s.value}</p>
                        <p className="text-[11px] text-slate-400 mt-1.5">{s.pct}</p>
                    </div>
                ))}
            </div>

            {/* ── Main grid ──────────────────────────────────────────────── */}
            <div className="grid gap-4 lg:grid-cols-3">

                {/* Attendance list */}
                <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm lg:col-span-2 overflow-hidden">
                    <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
                        <div>
                            <p className="text-[13px] font-semibold text-slate-800">Список сотрудников</p>
                            <p className="text-[11px] text-slate-400 mt-0.5">Смена и статус каждого сотрудника</p>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                            {listSafe.length} записей
                        </span>
                    </div>

                    <div className="divide-y divide-slate-100">
                        {listSafe.length === 0 ? (
                            <p className="py-14 text-center text-[13px] text-slate-400">Нет данных для отображения</p>
                        ) : (
                            listSafe.map((item) => {
                                const st  = statusCfg[item.status ?? "absent"] ?? statusCfg.absent;
                                return (
                                    <div key={item.faceid_user_id ?? Math.random()}
                                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-3.5 hover:bg-slate-50/60 transition-colors">

                                        {/* Avatar + info */}
                                        <div className="flex items-center gap-3 min-w-0">
                                            <div
                                                className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 shrink-0 cursor-zoom-in hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 transition-all"
                                                onClick={() => setModalImage(item.image_path || "/avatar-1.webp")}
                                            >
                                                <img
                                                    src={item.image_path || "/avatar-1.webp"}
                                                    alt={item.name ?? ""}
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { (e.target as HTMLImageElement).src = "/avatar-1.webp"; }}
                                                />
                                            </div>
                                            <div className="min-w-0">
                                                <Link to={`/users/report/${item.faceid_user_id}`}
                                                    className="text-[13px] font-semibold text-slate-900 hover:text-blue-600 transition-colors truncate block">
                                                    {item.name ?? "—"}
                                                </Link>
                                                <p className="text-[11px] text-slate-400 truncate">{item.position ?? "—"}</p>
                                                <p className="text-[11px] font-medium text-slate-600">{item.shift_name ?? "—"}</p>
                                            </div>
                                        </div>

                                        {/* Times + status */}
                                        <div className="flex items-center gap-4 sm:gap-6 shrink-0">
                                            <div className="text-[12px] space-y-0.5">
                                                <p className="text-emerald-600">
                                                    Вход: <span className="font-medium">{item.check_in_time ?? "—"}</span>
                                                </p>
                                                <p className="text-blue-500">
                                                    Выход: <span className="font-medium">{item.check_out_time ?? "—"}</span>
                                                </p>
                                                {(item.late_minutes ?? 0) > 0 && (
                                                    <p className="text-red-500 font-semibold">
                                                        Опозд.: {item.late_minutes_text ?? `${item.late_minutes} мин`}
                                                    </p>
                                                )}
                                            </div>
                                            <span className={cn(
                                                "inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border whitespace-nowrap",
                                                st.badge
                                            )}>
                                                <span className={cn("w-1.5 h-1.5 rounded-full", st.dot)} />
                                                {st.label}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {attendanceData.pagination && attendanceData.pagination.total_pages > 1 && (
                        <div className="px-5 py-3 border-t border-slate-100">
                            <CustomPagination
                                currentPage={attendanceData.pagination.current_page}
                                totalPages={attendanceData.pagination.total_pages}
                                onPageChange={setCurrentPage}
                            />
                        </div>
                    )}
                </div>

                {/* Right column */}
                <div className="space-y-4">
                    {/* Status distribution */}
                    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm px-5 py-5">
                        <p className="text-[13px] font-semibold text-slate-800">По статусам</p>
                        <div className="mt-4 space-y-4">
                            {Object.entries(statsSafe).map(([key, value]) => {
                                const pct = totalSafe > 0 ? Math.round((Number(value) / totalSafe) * 100) : 0;
                                const barColor = statBarColor[key] ?? "bg-blue-500";
                                return (
                                    <div key={key}>
                                        <div className="flex items-center justify-between mb-1.5">
                                            <span className="text-[12px] text-slate-600">{statLabels[key as keyof typeof statsSafe]}</span>
                                            <span className="text-[12px] font-semibold text-slate-700 tabular-nums">{pct}%</span>
                                        </div>
                                        <div className="h-1 bg-slate-100 rounded-full overflow-hidden">
                                            <div className={cn("h-full rounded-full transition-all", barColor)} style={{ width: `${pct}%` }} />
                                        </div>
                                        <p className="mt-1 text-[11px] text-slate-400">{value} сотрудников</p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Risk group placeholder */}
                    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm px-5 py-5">
                        <p className="text-[13px] font-semibold text-slate-800">Группа риска</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">Частые опоздания или отсутствие</p>
                        <div className="h-20 flex items-center justify-center">
                            <span className="text-[12px] text-slate-300 font-medium">Скоро...</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* ── Image lightbox ─────────────────────────────────────────── */}
            {modalImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
                    onClick={() => setModalImage(null)}
                    onKeyDown={(e) => { if (e.key === "Escape") setModalImage(null); }}
                    tabIndex={0}
                >
                    <div className="relative w-72 h-72 sm:w-96 sm:h-96" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={modalImage}
                            alt="Увеличенное изображение"
                            className="w-full h-full object-cover rounded-full shadow-2xl ring-4 ring-white/20"
                        />
                        <button
                            onClick={() => setModalImage(null)}
                            className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center text-sm transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
