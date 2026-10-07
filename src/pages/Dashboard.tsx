import { cn } from "@/lib/utils";
import { useMemo, useState, useEffect } from "react";
import {
    FiCalendar,
    FiClock,
    FiUserCheck,
    FiUsers,
    FiUserX,
    // FiDownload,
} from "react-icons/fi";
import { MdOutlineEventAvailable } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { ru as ruDateLocale, uz as uzDateLocale } from "date-fns/locale";
import { GetDailyAttendance } from "@/services/data";
import { formatFullDate, formatWeekday } from "@/i18n/dateFormat";
import { DatePicker } from "@/components/ui/date-picker";
import { Skeleton } from "@/components/ui/skeleton";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
// import {
//     Select,
//     SelectContent,
//     SelectItem,
//     SelectTrigger,
//     SelectValue,
// } from "@/components/ui/select";
// import { Button } from "@/components/ui/button";
// import CustomModal from "@/components/ui/custom-modal";
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
type Statistics = AttendanceData["statistics"];

// ─── Constants ────────────────────────────────────────────────────────────────

// const months = [
//     { name: "Январь",   value: "01" },
//     { name: "Февраль",  value: "02" },
//     { name: "Март",     value: "03" },
//     { name: "Апрель",   value: "04" },
//     { name: "Май",      value: "05" },
//     { name: "Июнь",     value: "06" },
//     { name: "Июль",     value: "07" },
//     { name: "Август",   value: "08" },
//     { name: "Сентябрь", value: "09" },
//     { name: "Октябрь",  value: "10" },
//     { name: "Ноябрь",   value: "11" },
//     { name: "Декабрь",  value: "12" },
// ];

const statusCfg: Record<AttendanceItem["status"], { badge: string; dot: string }> = {
    present: { badge: "bg-emerald-50 text-emerald-700 border-emerald-100", dot: "bg-emerald-500" },
    late:    { badge: "bg-amber-50  text-amber-700  border-amber-100",    dot: "bg-amber-400"  },
    absent:  { badge: "bg-red-50    text-red-600    border-red-100",       dot: "bg-red-400"    },
};

// Плитки метрик — те же ключи, что и в statistics
const statTiles = [
    {
        key: "present", labelKey: "dashboard.stat.present", icon: FiUsers,
        chip: "bg-blue-100 text-blue-600 ring-blue-200/70",
        wash: "from-blue-50/70", pill: "bg-blue-50 text-blue-600", hover: "hover:border-blue-200",
    },
    {
        key: "on_time", labelKey: "dashboard.stat.onTime", icon: FiUserCheck,
        chip: "bg-emerald-100 text-emerald-600 ring-emerald-200/70",
        wash: "from-emerald-50/70", pill: "bg-emerald-50 text-emerald-700", hover: "hover:border-emerald-200",
    },
    {
        key: "late", labelKey: "dashboard.stat.late", icon: FiClock,
        chip: "bg-amber-100 text-amber-600 ring-amber-200/70",
        wash: "from-amber-50/70", pill: "bg-amber-50 text-amber-700", hover: "hover:border-amber-200",
    },
    {
        key: "absent", labelKey: "dashboard.stat.absent", icon: FiUserX,
        chip: "bg-red-100 text-red-600 ring-red-200/70",
        wash: "from-red-50/70", pill: "bg-red-50 text-red-600", hover: "hover:border-red-200",
    },
    {
        key: "day_off", labelKey: "dashboard.stat.dayOff", icon: MdOutlineEventAvailable,
        chip: "bg-slate-200 text-slate-600 ring-slate-300/60",
        wash: "from-slate-100/80", pill: "bg-slate-100 text-slate-500", hover: "hover:border-slate-300",
    },
] as const;

// Сегменты полосы распределения — только непересекающиеся статусы
// (present = on_time + late, поэтому в полосу не входит)
const barSegments = [
    { key: "on_time", labelKey: "dashboard.stat.onTime", color: "bg-emerald-400" },
    { key: "late",    labelKey: "dashboard.stat.late",   color: "bg-amber-400"   },
    { key: "absent",  labelKey: "dashboard.stat.absent", color: "bg-rose-400"    },
    { key: "day_off", labelKey: "dashboard.stat.dayOff", color: "bg-slate-500"   },
] as const;

const deltaTone = {
    red:     "bg-red-50     text-red-600     border-red-100",
    amber:   "bg-amber-50   text-amber-700   border-amber-100",
    emerald: "bg-emerald-50 text-emerald-700 border-emerald-100",
    blue:    "bg-blue-50    text-blue-600    border-blue-100",
    slate:   "bg-slate-50   text-slate-500   border-slate-200",
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

const today = () => fmt(new Date());

const hhmm = (time?: string | null) => (time ? time.slice(0, 5) : null);

const minutesOfDay = (time?: string | null) => {
    const m = time ? /^(\d{1,2}):(\d{2})/.exec(time) : null;
    return m ? +m[1] * 60 + +m[2] : null;
};

// Минуты от эпохи в UTC-арифметике — без сдвигов часового пояса
const dayAbsMinutes = (date?: string | null) => {
    const m = date ? /^(\d{4})-(\d{2})-(\d{2})/.exec(date) : null;
    return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) / 60000 : null;
};

const absMinutes = (datetime?: string | null) => {
    const m = datetime ? /^(\d{4})-(\d{2})-(\d{2})[ T](\d{1,2}):(\d{2})/.exec(datetime) : null;
    return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) / 60000 + +m[4] * 60 + +m[5] : null;
};

// Отклонение факта от границ смены в минутах: >0 — позже, <0 — раньше.
// Считается по абсолютным датам-времени, поэтому корректно и для ночных смен
// (если shift_end <= shift_start, конец смены переносится на следующие сутки).
const timingDiff = (item: AttendanceItem, dayAbs: number | null) => {
    const start = minutesOfDay(item.shift_start);
    const end   = minutesOfDay(item.shift_end);
    if (dayAbs === null || start === null) return { arrival: null, leave: null };

    const startAbs = dayAbs + start;
    const endAbs   = end === null ? null : dayAbs + end + (end <= start ? 1440 : 0);
    const inAbs    = absMinutes(item.check_in_datetime);
    const outAbs   = absMinutes(item.check_out_datetime);

    return {
        arrival: inAbs  !== null ? inAbs - startAbs : null,
        leave:   outAbs !== null && endAbs !== null ? outAbs - endAbs : null,
    };
};

// bg-muted в Skeleton = slate-100 = фон страницы, поэтому цвет задаём явно
const BAR = "bg-slate-200";

const TH = "h-10 px-4 text-[11px] font-semibold uppercase tracking-[0.04em] text-slate-400";

const Dash = () => <span className="text-slate-300">—</span>;

const Delta = ({ tone, label, value, title }: {
    tone: keyof typeof deltaTone;
    label: string;
    value: string;
    title: string;
}) => (
    <span
        title={title}
        className={cn(
            "inline-flex items-center gap-1 rounded-md border px-1.5 py-0.5 text-[11px] whitespace-nowrap",
            deltaTone[tone]
        )}
    >
        <span className="font-medium opacity-80">{label}</span>
        <span className="font-semibold tabular-nums">{value}</span>
    </span>
);

// ─── Component ────────────────────────────────────────────────────────────────

const Dashboard = () => {
    const { t, i18n } = useTranslation();
    const [loading,        setLoading]        = useState(true);
    const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(null);
    const [error,          setError]          = useState<string | null>(null);
    const [selectedDate,   setSelectedDate]   = useState<string>(today());
    const [modalImage,     setModalImage]     = useState<string | null>(null);
    // const [selectedYear,   setSelectedYear]   = useState<number>(new Date().getFullYear());
    // const [selectedMonth,  setSelectedMonth]  = useState<string>(String(new Date().getMonth() + 1).padStart(2, "0"));
    // const [downloading,    setDownloading]    = useState(false);
    // const [excelModalOpen, setExcelModalOpen] = useState(false);
    const [currentPage,    setCurrentPage]    = useState(1);
    const [reloadKey,      setReloadKey]      = useState(0);

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
                const message = err?.response?.data?.message || t("dashboard.loadError");
                // Первая загрузка — экран ошибки; дозагрузка — тост, данные на экране остаются
                if (attendanceData) toast.error(message);
                else setError(message);
            } finally {
                setLoading(false);
            }
        }, 100);
        return () => clearTimeout(id);
    }, [selectedDate, currentPage, reloadKey]);

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

    // const handleDownloadExcel = async () => {
    //     if (!selectedMonth || !selectedYear) return;
    //     const monthYear = `${selectedYear}-${selectedMonth}`;
    //     try {
    //         setDownloading(true);
    //         const blob = await DownloadAttendanceExcel(monthYear);
    //         const url  = window.URL.createObjectURL(blob);
    //         const a    = document.createElement("a");
    //         a.href     = url;
    //         a.download = `attendance_${monthYear}.xlsx`;
    //         document.body.appendChild(a);
    //         a.click();
    //         document.body.removeChild(a);
    //         window.URL.revokeObjectURL(url);
    //         setExcelModalOpen(false);
    //     } catch (err: any) {
    //         setExcelModalOpen(false);
    //         setError(err?.response?.data?.message || "Не удалось загрузить Excel файл");
    //     } finally {
    //         setDownloading(false);
    //     }
    // };

    // ── Derived ──────────────────────────────────────────────────────────────
    const dateLocale = i18n.language === "uz" ? uzDateLocale : ruDateLocale;

    const header = useMemo(() => {
        const p = new Date(attendanceData?.date ?? "");
        if (Number.isNaN(p.getTime())) return { full: "", weekday: "" };
        try { return { full: formatFullDate(p), weekday: formatWeekday(p) }; }
        catch { return { full: "", weekday: "" }; }
    }, [attendanceData, i18n.language]);

    // Человекочитаемые минуты для значений, которые считаем сами
    // (для опоздания и овертайма берём готовый текст бэкенда)
    const fmtMinutes = (total: number) => {
        const abs = Math.abs(total);
        const hours = Math.floor(abs / 60);
        const minutes = abs % 60;
        if (hours === 0) return t("dashboard.lateMinutes", { count: minutes });
        if (minutes === 0) return t("dashboard.hoursOnly", { hours });
        return t("dashboard.hoursMinutes", { hours, minutes });
    };

    const arrivalDelta = (item: AttendanceItem, diff: number | null) => {
        if ((item.late_minutes ?? 0) > 0)
            return <Delta tone="red" label={t("dashboard.delta.labelLate")} title={t("dashboard.delta.late")}
                value={item.late_minutes_text || fmtMinutes(item.late_minutes)} />;
        if (diff === null || diff === 0) return <Dash />;
        if (diff < 0)
            return <Delta tone="emerald" label={t("dashboard.delta.labelEarly")} title={t("dashboard.delta.earlyArrival")}
                value={fmtMinutes(diff)} />;
        return <Delta tone="slate" label={t("dashboard.delta.labelLater")} title={t("dashboard.delta.withinTolerance")}
            value={fmtMinutes(diff)} />;
    };

    const leaveDelta = (item: AttendanceItem, diff: number | null) => {
        if ((item.overtime_minutes ?? 0) > 0)
            return <Delta tone="blue" label={t("dashboard.delta.labelOvertime")} title={t("dashboard.delta.overtime")}
                value={item.overtime_minutes_text || fmtMinutes(item.overtime_minutes)} />;
        if (diff === null || diff >= 0) return <Dash />;
        return <Delta tone="amber" label={t("dashboard.delta.labelEarly")} title={t("dashboard.delta.earlyLeave")}
            value={fmtMinutes(diff)} />;
    };

    // ── Loading / error states ────────────────────────────────────────────────
    // Скелетон только при первой загрузке: при смене даты/страницы прошлые данные
    // остаются на экране под оверлеем (см. ниже), чтобы страница не «мигала»
    if (loading && !attendanceData) return (
        <div className="space-y-5 pb-8">
            {/* Шапка */}
            <div className="rounded-xl bg-[#0D1117] shadow-sm">
                <div className="px-5 py-5 flex items-start justify-between gap-3">
                    <div className="space-y-3">
                        <Skeleton className="h-2.5 w-36 bg-white/10" />
                        <Skeleton className="h-6 w-56 bg-white/10" />
                        <Skeleton className="h-6 w-44 rounded-full bg-white/10" />
                    </div>
                    <Skeleton className="h-9 w-44 rounded-lg shrink-0 bg-white/10" />
                </div>
                <div className="border-t border-white/[0.06] px-5 py-4">
                    <Skeleton className="h-2.5 w-full rounded-full bg-white/10" />
                </div>
            </div>

            {/* Плитки */}
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="bg-white rounded-xl border border-slate-200/80 shadow-sm px-4 py-4">
                        <div className="flex items-center gap-2">
                            <Skeleton className={cn(BAR, "w-7 h-7 rounded-lg shrink-0")} />
                            <Skeleton className={cn(BAR, "h-2.5 w-20")} />
                        </div>
                        <Skeleton className={cn(BAR, "mt-3.5 h-7 w-16")} />
                    </div>
                ))}
            </div>

            {/* Таблица */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                    <div className="space-y-2">
                        <Skeleton className={cn(BAR, "h-3 w-40")} />
                        <Skeleton className={cn(BAR, "h-2.5 w-56")} />
                    </div>
                    <Skeleton className={cn(BAR, "h-5 w-20 rounded-full shrink-0")} />
                </div>
                <div className="divide-y divide-slate-100">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-4 px-5 py-3.5">
                            <Skeleton className={cn(BAR, "w-10 h-10 rounded-full shrink-0")} />
                            <div className="flex-1 space-y-2">
                                <Skeleton className={cn(BAR, "h-3 w-40 max-w-full")} />
                                <Skeleton className={cn(BAR, "h-2.5 w-28 max-w-full")} />
                            </div>
                            <Skeleton className={cn(BAR, "h-3 w-14 hidden sm:block")} />
                            <Skeleton className={cn(BAR, "h-5 w-24 rounded-md hidden md:block")} />
                            <Skeleton className={cn(BAR, "h-5 w-20 rounded-full hidden lg:block")} />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );

    if (error) return (
        <div className="h-[70vh] flex flex-col items-center justify-center gap-4">
            <p className="text-red-500 text-[14px]">{error}</p>
            <button onClick={() => { setError(null); setReloadKey((k) => k + 1); }}
                className="px-4 py-2 bg-blue-600 text-white text-[13px] rounded-lg hover:bg-blue-700 transition-colors">
                {t("common.tryAgain")}
            </button>
        </div>
    );

    if (!attendanceData) return (
        <div className="h-[70vh] flex items-center justify-center">
            <p className="text-slate-400 text-[14px]">{t("common.noData")}</p>
        </div>
    );

    const statsSafe: Statistics = attendanceData.statistics ?? { on_time: 0, late: 0, absent: 0, day_off: 0, present: 0 };
    const totalSafe   = attendanceData.total_employees ?? 0;
    const listSafe    = attendanceData.attendance ?? [];

    // Полоса распределения считается от числа сотрудников со сменой на этот день,
    // а проценты в плитках — от общего штата (как было раньше).
    const scheduled = statsSafe.on_time + statsSafe.late + statsSafe.absent + statsSafe.day_off;
    const pctOfTotal = (n: number) => (totalSafe > 0 ? Math.round((n / totalSafe) * 100) : 0);

    // База для расчёта отклонений от смены (сутки отчёта)
    const dayAbs = dayAbsMinutes(attendanceData.date);

    // ── Render ───────────────────────────────────────────────────────────────
    return (
        <div className="space-y-5 pb-8">

            {/* ── Header: дата, штат, полоса распределения ───────────────── */}
            <div className="relative overflow-hidden rounded-xl bg-[#0D1117] shadow-sm">
                {/* акцентное свечение */}
                <div className="pointer-events-none absolute -right-20 -top-28 h-64 w-64 rounded-full bg-blue-500/20 blur-3xl" />
                <div className="pointer-events-none absolute -left-24 bottom-[-6rem] h-56 w-56 rounded-full bg-emerald-500/10 blur-3xl" />

                <div className="relative px-5 py-5 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-white/[0.06] ring-1 ring-inset ring-white/10">
                                <FiCalendar className="h-3 w-3 text-blue-400" />
                            </span>
                            <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-white/35">
                                {t("dashboard.dayAttendance")}
                            </p>
                        </div>
                        <div className="mt-3 flex flex-wrap items-baseline gap-x-3 gap-y-1">
                            <h1 className="text-[24px] font-semibold text-white leading-tight">
                                {header.full}
                            </h1>
                            <span className="text-[13px] text-white/40 first-letter:uppercase">
                                {header.weekday}
                            </span>
                        </div>
                        <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-white/60 ring-1 ring-inset ring-white/10">
                            <FiUsers className="w-3.5 h-3.5 text-white/40" />
                            {t("dashboard.totalEmployees")}
                            <span className="font-semibold text-white">{totalSafe}</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap shrink-0">
                        <DatePicker
                            date={selectedDateValue}
                            onSelect={(d) => d && setSelectedDate(fmt(d))}
                            placeholder={t("common.selectDate")}
                            locale={dateLocale}
                            className="h-9 text-[13px] rounded-lg bg-white/[0.06] border-white/10 text-white hover:bg-white/10 hover:text-white"
                        />
                        {/* <CustomModal
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
                        </CustomModal> */}
                    </div>
                </div>

                <div className="relative border-t border-white/[0.06] px-5 py-4">
                    <div className="flex h-2.5 w-full gap-1 rounded-full bg-white/[0.06] p-[3px]">
                        {scheduled > 0 && barSegments.map((seg) => {
                            const value = statsSafe[seg.key] ?? 0;
                            if (value <= 0) return null;
                            return (
                                <div
                                    key={seg.key}
                                    className={cn("h-full rounded-full transition-[width] duration-500", seg.color)}
                                    style={{ width: `${(value / scheduled) * 100}%` }}
                                    title={`${t(seg.labelKey)} — ${value}`}
                                />
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* ── Stat tiles ─────────────────────────────────────────────── */}
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5">
                {statTiles.map((tile) => {
                    const Icon  = tile.icon;
                    const value = statsSafe[tile.key] ?? 0;
                    return (
                        <div key={tile.key}
                            className={cn(
                                "group relative overflow-hidden rounded-xl border border-slate-200/80 bg-white px-4 py-4 shadow-sm",
                                "transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md",
                                tile.hover
                            )}>
                            {/* цветовая подложка статуса */}
                            <div className={cn("pointer-events-none absolute inset-0 bg-gradient-to-br to-white", tile.wash)} />

                            <div className="relative">
                                <span className={cn(
                                    "flex h-9 w-9 items-center justify-center rounded-xl ring-1 ring-inset transition-transform duration-200 group-hover:scale-105",
                                    tile.chip
                                )}>
                                    <Icon className="h-4 w-4" />
                                </span>
                                {/* min-h — чтобы цифры стояли на одной линии, когда подпись переносится в две строки */}
                                <p className="mt-3 min-h-[25px] text-[10px] font-bold uppercase leading-tight tracking-[0.07em] text-slate-400">
                                    {t(tile.labelKey)}
                                </p>
                                <div className="mt-2 flex items-end justify-between gap-2">
                                    <span className={cn(
                                        "text-[32px] font-bold leading-none tabular-nums",
                                        value === 0 ? "text-slate-300" : "text-slate-900"
                                    )}>
                                        {value}
                                    </span>
                                    <span className={cn(
                                        "rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums",
                                        value === 0 ? "bg-slate-100 text-slate-400" : tile.pill
                                    )}>
                                        {pctOfTotal(value)}%
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* ── Attendance table ───────────────────────────────────────── */}
            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-slate-800">{t("dashboard.employeeList")}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">{t("dashboard.employeeListSub")}</p>
                    </div>
                    <span className="text-[11px] font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full shrink-0">
                        {t("dashboard.recordsCount", { count: listSafe.length })}
                    </span>
                </div>

                <div className="relative">
                <div className={cn("overflow-x-auto scrollbar-hide transition-opacity", loading && "opacity-40")}>
                    <Table className="min-w-[1140px]">
                        <TableHeader className="bg-slate-50/80">
                            <TableRow className="border-slate-200 hover:bg-transparent">
                                <TableHead className={cn(TH, "px-5")}>{t("dashboard.col.employee")}</TableHead>
                                <TableHead className={TH}>{t("dashboard.col.shift")}</TableHead>
                                <TableHead className={cn(TH, "text-right")}>{t("dashboard.col.arrived")}</TableHead>
                                <TableHead className={TH}>{t("dashboard.col.arrivalDelta")}</TableHead>
                                <TableHead className={cn(TH, "text-right")}>{t("dashboard.col.left")}</TableHead>
                                <TableHead className={TH}>{t("dashboard.col.leaveDelta")}</TableHead>
                                <TableHead className={cn(TH, "px-5 text-right")}>{t("dashboard.col.status")}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {listSafe.length === 0 ? (
                                <TableRow className="hover:bg-transparent">
                                    <TableCell colSpan={7} className="py-16">
                                        <div className="flex flex-col items-center gap-2.5">
                                            <span className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center">
                                                <FiUsers className="w-5 h-5" />
                                            </span>
                                            <p className="text-[13px] text-slate-400">{t("common.noData")}</p>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                listSafe.map((item) => {
                                    const st = statusCfg[item.status ?? "absent"] ?? statusCfg.absent;
                                    const { arrival, leave } = timingDiff(item, dayAbs);
                                    return (
                                        <TableRow key={item.faceid_user_id ?? Math.random()}
                                            className="border-slate-100 hover:bg-slate-50/60">

                                            {/* Сотрудник */}
                                            <TableCell className="px-5 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <div className="relative shrink-0">
                                                        <div
                                                            className="w-10 h-10 rounded-full overflow-hidden border border-slate-200 cursor-zoom-in transition-all hover:ring-2 hover:ring-blue-400 hover:ring-offset-1"
                                                            onClick={() => setModalImage(item.image_path || "/avatar-1.webp")}
                                                        >
                                                            <img
                                                                src={item.image_path || "/avatar-1.webp"}
                                                                alt={item.name ?? ""}
                                                                className="w-full h-full object-cover"
                                                                onError={(e) => { (e.target as HTMLImageElement).src = "/avatar-1.webp"; }}
                                                            />
                                                        </div>
                                                        <span className={cn("absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white", st.dot)} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <Link to={`/users/report/${item.faceid_user_id}`}
                                                            className="text-[13px] font-semibold text-slate-900 hover:text-blue-600 transition-colors truncate block max-w-[220px]">
                                                            {item.name ?? "—"}
                                                        </Link>
                                                        <p className="text-[11px] text-slate-400 truncate max-w-[220px]">{item.position ?? "—"}</p>
                                                    </div>
                                                </div>
                                            </TableCell>

                                            {/* Смена */}
                                            <TableCell className="px-4 py-3 whitespace-nowrap">
                                                <p className="text-[12px] font-semibold text-slate-800 tabular-nums">
                                                    {hhmm(item.shift_start) ?? "—"} – {hhmm(item.shift_end) ?? "—"}
                                                </p>
                                                <p className="text-[11px] text-slate-400 truncate max-w-[170px]">{item.shift_name ?? "—"}</p>
                                            </TableCell>

                                            {/* Пришёл */}
                                            <TableCell className="px-4 py-3 text-right text-[13px] font-semibold text-slate-800 tabular-nums whitespace-nowrap">
                                                {item.check_in_time ?? <Dash />}
                                            </TableCell>

                                            {/* Опоздание / ранний приход */}
                                            <TableCell className="px-4 py-3">{arrivalDelta(item, arrival)}</TableCell>

                                            {/* Ушёл */}
                                            <TableCell className="px-4 py-3 text-right text-[13px] font-semibold text-slate-800 tabular-nums whitespace-nowrap">
                                                {item.check_out_time ?? <Dash />}
                                            </TableCell>

                                            {/* Овертайм / ранний уход */}
                                            <TableCell className="px-4 py-3">{leaveDelta(item, leave)}</TableCell>

                                            {/* Статус */}
                                            <TableCell className="px-5 py-3 text-right">
                                                <span className={cn(
                                                    "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border whitespace-nowrap",
                                                    st.badge
                                                )}>
                                                    <span className={cn("w-1.5 h-1.5 rounded-full", st.dot)} />
                                                    {t(`dashboard.status.${item.status ?? "absent"}`)}
                                                </span>
                                            </TableCell>
                                        </TableRow>
                                    );
                                })
                            )}
                        </TableBody>
                    </Table>
                </div>
                {loading && (
                    <div className="absolute inset-0 bg-white/50">
                        {/* sticky — чтобы индикатор был виден, с какого места таблицы ни нажали пагинацию */}
                        <div className="sticky top-1/2 flex justify-center">
                        <span className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-medium text-slate-500 shadow-sm">
                            <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin" />
                            {t("common.loadingData")}
                        </span>
                        </div>
                    </div>
                )}
                </div>

                {attendanceData.pagination && attendanceData.pagination.total_pages > 1 && (
                    <div className="px-5 py-3 border-t border-slate-100">
                        <CustomPagination
                            currentPage={loading ? currentPage : attendanceData.pagination.current_page}
                            totalPages={attendanceData.pagination.total_pages}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}
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
                            alt={t("dashboard.zoomedImage")}
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
