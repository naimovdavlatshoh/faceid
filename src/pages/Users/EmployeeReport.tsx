import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
    GetEmployeeReport,
    GetDataSimple,
    PostSimple,
    DownloadEmployeePayrollExcel,
    DownloadEmployeePayrollExcelById,
} from "@/services/data";
import { Download, Loader2, X } from "lucide-react";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import CustomModal from "@/components/ui/custom-modal";

import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";
import { formatDayMonth, formatWeekday } from "@/i18n/dateFormat";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";

const MONTHS_PAYROLL = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    labelKey: `months.${i + 1}`,
}));

type DayStatus = "complete" | "partial_in" | "partial_out" | "absent";
type ArrivalStatus = "on_time" | "late" | "unknown";
type DepartureStatus = "on_time" | "early" | "overtime" | "unknown";

type DayData = {
    day_date: string;
    day: number;
    day_status: DayStatus;
    arrival_status: ArrivalStatus;
    departure_status: DepartureStatus;
    status_description: string;
    first_in: string | null;
    last_out: string | null;
    worked_minutes: number;
    worked_hours: number;

    worked_time_formatted: string;
    shift_time_formatted: string;
    late_minutes: number;
    late_minutes_penalty: number;
    early_leave_minutes: number;
    overtime_minutes: number;
    // v2
    early_arrival_minutes?: number;
    break_minutes?: number;
    intervals_count?: number;
    is_day_off?: boolean;
    start_time?: string | null;
    end_time?: string | null;
    late_tolerance_minutes?: number | null;
};

type Statistics = {
    total_days: number;
    complete_days: number;
    partial_days: number;
    absent_days: number;
    on_time_days: number;
    late_days: number;
    early_leave_days: number;
    overtime_days: number;
    total_worked_minutes: number;
    total_worked_hours: number;
    total_shift_minutes: number;
    total_shift_hours: number;
    total_late_minutes: number;
    total_late_penalty_minutes: number;
    total_early_leave_minutes: number;
    total_overtime_minutes: number;
    total_break_minutes: number;
    planned_work_days: number;
    shift_id: number;
    salary_type: number;
    salary_type_name: string;
    salary_amount: number;
    hourly_rate: number;
    minute_rate: number;
    final_salary: number;
    calculation_details: string;
    // v2: расширенная статистика
    early_arrival_days?: number;
    total_early_arrival_minutes?: number;
    overtime_salary?: number;
    penalty_deduction?: number;
    early_arrival_salary?: number;
    total_salary?: number;
    advance_deduction?: number;
    net_salary?: number;
};

type EmployeeReportData = {
    name: string;
    position_name: string;
    statistics: Statistics;
    days: DayData[];
};

interface ApiUser {
    faceid_user_id: number;
    name: string;
    image_path: string | null;
    position_name: string;
}

interface ApiResponse {
    page: number;
    limit: number;
    pages: number;
    result: ApiUser[];
}

// Тихая система статусов дня: одна «полоска-индикатор» в календаре +
// деликатный бейдж. Никаких заливок во всю ячейку и эмодзи.
type DayTone = {
    key:
        | "none"
        | "present"
        | "overtime"
        | "late"
        | "early"
        | "late_early"
        | "partial"
        | "absent";
    labelKey: string;
    bar: string; // цвет нижней полоски в ячейке календаря
    dot: string; // цвет точки в бейдже
    badge: string; // классы бейджа (фон + текст)
    cell: string; // мягкий тон ячейки (в основном нейтральный)
};

const TONE_NONE: DayTone = {
    key: "none",
    labelKey: "report.tone.none",
    bar: "bg-transparent",
    dot: "bg-slate-300",
    badge: "bg-slate-100 text-slate-500",
    cell: "",
};

const getDayTone = (day: DayData | undefined): DayTone => {
    if (!day) return TONE_NONE;

    if (day.day_status === "absent") {
        return {
            key: "absent",
            labelKey: "report.tone.absent",
            bar: "bg-rose-400",
            dot: "bg-rose-500",
            badge: "bg-rose-50 text-rose-600",
            cell: "bg-rose-50/40",
        };
    }

    const hasEntry = day.first_in != null;
    const hasExit = day.last_out != null;

    if ((hasEntry && !hasExit) || (!hasEntry && hasExit)) {
        return {
            key: "partial",
            labelKey: "report.tone.partial",
            bar: "bg-amber-400",
            dot: "bg-amber-500",
            badge: "bg-amber-50 text-amber-700",
            cell: "",
        };
    }

    if (hasEntry && hasExit) {
        const late = day.arrival_status === "late";
        const early = day.departure_status === "early";
        const over = day.departure_status === "overtime";

        if (late && early)
            return {
                key: "late_early",
                labelKey: "report.tone.lateEarly",
                bar: "bg-rose-400",
                dot: "bg-rose-500",
                badge: "bg-rose-50 text-rose-600",
                cell: "",
            };
        if (late)
            return {
                key: "late",
                labelKey: "report.tone.late",
                bar: "bg-amber-400",
                dot: "bg-amber-500",
                badge: "bg-amber-50 text-amber-700",
                cell: "",
            };
        if (early)
            return {
                key: "early",
                labelKey: "report.tone.early",
                bar: "bg-orange-400",
                dot: "bg-orange-500",
                badge: "bg-orange-50 text-orange-600",
                cell: "",
            };
        if (over)
            return {
                key: "overtime",
                labelKey: "report.tone.overtime",
                bar: "bg-emerald-500",
                dot: "bg-emerald-500",
                badge: "bg-emerald-50 text-emerald-700",
                cell: "",
            };
        return {
            key: "present",
            labelKey: "report.tone.present",
            bar: "bg-emerald-400",
            dot: "bg-emerald-500",
            badge: "bg-emerald-50 text-emerald-700",
            cell: "",
        };
    }

    return TONE_NONE;
};

const EmployeeReport = () => {
    const { t } = useTranslation();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState<EmployeeReportData | null>(
        null,
    );
    const [error, setError] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(
        new Date().getMonth() + 1,
    );
    const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);
    const [employees, setEmployees] = useState<ApiUser[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeoutRef = useRef<number | null>(null);
    const hasSearchedRef = useRef(false);

    const [salaryExcelModalOpen, setSalaryExcelModalOpen] = useState(false);
    const [salaryExcelYear, setSalaryExcelYear] = useState(
        () => new Date().getFullYear()
    );
    const [salaryExcelMonth, setSalaryExcelMonth] = useState(
        () => String(new Date().getMonth() + 1)
    );
    const [salaryExcelDownloading, setSalaryExcelDownloading] = useState(false);
    // Область выгрузки: этот сотрудник (report-by-id) или все (report)
    const [salaryExcelScope, setSalaryExcelScope] = useState<"self" | "all">(
        "self"
    );

    const currentDate = useMemo(() => {
        return new Date(selectedYear, selectedMonth - 1, 1);
    }, [selectedYear, selectedMonth]);

    const daysMap = useMemo(() => {
        if (
            !reportData ||
            !reportData.days ||
            !Array.isArray(reportData.days)
        ) {
            return new Map<string, DayData>();
        }
        const map = new Map<string, DayData>();
        reportData.days.forEach((day) => {
            if (day && day.day_date) {
                map.set(day.day_date, day);
            }
        });
        return map;
    }, [reportData]);

    const selectedDayData = useMemo(() => {
        if (!selectedDay) return undefined;
        // Форматируем дату в формате YYYY-MM-DD без учета timezone
        const year = selectedDay.getFullYear();
        const month = String(selectedDay.getMonth() + 1).padStart(2, "0");
        const day = String(selectedDay.getDate()).padStart(2, "0");
        const dateStr = `${year}-${month}-${day}`;
        return daysMap.get(dateStr);
    }, [selectedDay, daysMap]);

    // Разбор расчётного листа (v2). Для старых ответов — безопасные фолбэки.
    const salary = useMemo(() => {
        const st = reportData?.statistics;
        if (!st) return null;
        const finalSalary = st.final_salary ?? 0;
        const overtimeSalary = st.overtime_salary ?? 0;
        const penalty = st.penalty_deduction ?? 0;
        const totalSalary =
            st.total_salary ?? finalSalary + overtimeSalary - penalty;
        const advance = st.advance_deduction ?? 0;
        const netSalary = st.net_salary ?? Math.max(0, totalSalary - advance);
        return {
            finalSalary,
            overtimeSalary,
            penalty,
            totalSalary,
            advance,
            netSalary,
            earlyArrivalSalary: st.early_arrival_salary ?? 0,
        };
    }, [reportData]);

    const workedPct = useMemo(() => {
        const st = reportData?.statistics;
        if (!st || !st.total_shift_minutes) return 0;
        return Math.min(
            100,
            Math.round(
                (st.total_worked_minutes / st.total_shift_minutes) * 100,
            ),
        );
    }, [reportData]);

    const fetchEmployees = async () => {
        try {
            setLoadingEmployees(true);
            const data: ApiResponse = await GetDataSimple(
                `api/faceid/users/list?page=1&limit=100&object_id=1`,
            );
            setEmployees(data.result || []);
        } catch (error) {
            console.error("Error fetching employees:", error);
            setEmployees([]);
        } finally {
            setLoadingEmployees(false);
        }
    };

    const searchEmployees = async (keyword: string) => {
        if (keyword.length < 3) {
            // If keyword is less than 3 characters, fetch all users
            fetchEmployees();
            return;
        }

        try {
            hasSearchedRef.current = true;
            setIsSearching(true);
            const response = await PostSimple(
                `api/faceid/user/search?keyword=${encodeURIComponent(keyword)}`,
                {},
            );

            setEmployees(response.data?.result || []);
        } catch (error) {
            console.error("Error searching employees:", error);
            toast.error(t("report.searchError"));
            setEmployees([]);
        } finally {
            setIsSearching(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    const handleEmployeeSearch = useCallback((term: string) => {
        if (term.length < 3) fetchEmployees();
        else searchEmployees(term);
    }, []);

    const handleDownloadPayrollExcel = async () => {
        const year = salaryExcelYear;
        const month = Number(salaryExcelMonth);
        if (!year || !month) return;
        // «Этот сотрудник» доступен только когда открыт конкретный отчёт
        const byId = salaryExcelScope === "self" && id;
        try {
            setSalaryExcelDownloading(true);
            const blob = byId
                ? await DownloadEmployeePayrollExcelById(
                      parseInt(id),
                      year,
                      month
                  )
                : await DownloadEmployeePayrollExcel(year, month);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            const namePart = byId ? `employee_${id}` : "all";
            link.download = `payroll_${namePart}_${year}_${String(month).padStart(2, "0")}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success(t("report.fileDownloaded"));
            setSalaryExcelModalOpen(false);
        } catch (err: any) {
            console.error(err);
            toast.error(
                err?.response?.data?.message || t("report.fileDownloadError")
            );
        } finally {
            setSalaryExcelDownloading(false);
        }
    };

    // Если id нет, но есть сотрудники, перенаправляем на первого
    useEffect(() => {
        if (!id && employees.length > 0) {
            navigate(`/users/report/${employees[0].faceid_user_id}`, {
                replace: true,
            });
        }
    }, [id, employees, navigate]);

    // Debounced search handler
    useEffect(() => {
        // Пропускаем выполнение при первой загрузке (когда searchQuery пустой и еще не было поиска)
        if (searchQuery.trim().length === 0 && !hasSearchedRef.current) {
            return;
        }

        // Clear any existing timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Set a new timeout for search
        searchTimeoutRef.current = setTimeout(() => {
            if (searchQuery.trim().length >= 3) {
                searchEmployees(searchQuery.trim());
            } else if (
                searchQuery.trim().length === 0 &&
                hasSearchedRef.current
            ) {
                // Если пользователь очистил поиск после того, как уже искал, возвращаем полный список
                fetchEmployees();
                hasSearchedRef.current = false;
            }
        }, 300); // 300ms delay

        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, [searchQuery]);

    useEffect(() => {
        const fetchData = async () => {
            if (!id) return;
            try {
                setLoading(true);
                setError(null);
                const data = await GetEmployeeReport(
                    selectedYear,
                    selectedMonth,
                    parseInt(id),
                );
                setReportData(data);
            } catch (err: any) {
                setError(
                    err?.response?.data?.message ||
                        t("report.loadError"),
                );
                console.error("Error fetching employee report:", err);
                toast.error(t("report.loadDataError"));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, selectedYear, selectedMonth]);

    // Компактная сумма без символа валюты — "3 000 000"
    const formatSum = (amount: number = 0) =>
        new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(
            amount,
        );

    const formatTime = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}${t("report.hourLetter")} ${mins}${t("report.minuteLetter")}`;
    };

    // Компактно: "8ч 05м" всегда с ведущим нулём у минут
    const fmtHM = (minutes: number = 0) => {
        const h = Math.floor(minutes / 60);
        const m = minutes % 60;
        return `${h}${t("report.hourLetter")} ${String(m).padStart(2, "0")}${t("report.minuteLetter")}`;
    };

    // Не показываем полный экран загрузки, список сотрудников должен оставаться видимым

    return (
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 md:min-h-[calc(100vh-100px)] md:items-start">
            {/* Employees Sidebar - hidden on mobile, use dropdown in main instead */}
            <div className="hidden md:flex w-72 bg-white border-r border-slate-200 flex-shrink-0 flex-col md:sticky md:top-0 md:h-[calc(100vh-100px)]">
                <div className="p-4 border-b border-slate-200 flex-shrink-0 space-y-3">
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                        {t("report.employees")}
                    </h3>
                    <div className="relative">
                        <Input
                            type="text"
                            placeholder={t("report.searchPlaceholder")}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-9 text-sm pr-8"
                        />
                        {searchQuery && (
                            <button
                                type="button"
                                onClick={() => {
                                    setSearchQuery("");
                                    hasSearchedRef.current = false;
                                    fetchEmployees();
                                }}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-2 min-h-0">
                    {loadingEmployees || isSearching ? (
                        <div className="flex justify-center items-center py-8">
                            <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                        </div>
                    ) : employees.length === 0 ? (
                        <div className="text-center py-4 text-slate-400 text-sm">
                            {searchQuery
                                ? t("report.notFound")
                                : t("report.empty")}
                        </div>
                    ) : (
                        employees.map((employee) => {
                            const isActive =
                                id === String(employee.faceid_user_id);
                            return (
                                <button
                                    key={employee.faceid_user_id}
                                    onClick={() => {
                                        navigate(
                                            `/users/report/${employee.faceid_user_id}`,
                                        );
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group text-left",
                                        isActive
                                            ? "bg-blue-50 text-blue-700"
                                            : "hover:bg-slate-50 text-slate-700",
                                    )}
                                >
                                    <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-slate-200 group-hover:border-blue-300 transition-colors">
                                        <img
                                            src={
                                                employee.image_path ||
                                                "/avatar-1.webp"
                                            }
                                            alt={employee.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target =
                                                    e.target as HTMLImageElement;
                                                target.src = "/avatar-1.webp";
                                            }}
                                        />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p
                                            className={cn(
                                                "text-sm font-medium truncate",
                                                isActive
                                                    ? "text-slate-500"
                                                    : "text-slate-900",
                                            )}
                                        >
                                            {employee.name}
                                        </p>
                                        <p className="text-xs text-slate-500 truncate">
                                            {employee.position_name || "—"}
                                        </p>
                                    </div>
                                </button>
                            );
                        })
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col gap-4 md:gap-5 min-w-0 md:min-h-[calc(100vh-100px)]">
                {/* Mobile: employee selector — combobox with search */}
                <div className="md:hidden flex-shrink-0">
                    <SearchableCombobox
                        label={t("report.employee")}
                        placeholder={t("report.selectEmployee")}
                        searchPlaceholder={t("report.searchPlaceholder")}
                        emptyMessage={t("report.notFound")}
                        value={id || ""}
                        onChange={(value) =>
                            value && navigate(`/users/report/${value}`)
                        }
                        onSearch={handleEmployeeSearch}
                        options={employees.map((e) => ({
                            value: String(e.faceid_user_id),
                            label: `${e.name}${e.position_name ? ` (${e.position_name})` : ""}`,
                        }))}
                        isLoading={loadingEmployees || isSearching}
                        className="min-w-0"
                    />
                </div>
                {loading ? (
                    <div className="flex-1 flex justify-center items-center">
                        <div className="flex flex-col items-center gap-4">
                            <div className="w-7 h-7 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin" />
                            <p className="text-slate-500 text-sm">
                                {t("common.loadingData")}
                            </p>
                        </div>
                    </div>
                ) : error ? (
                    <div className="flex-1 flex flex-col justify-center items-center">
                        <p className="text-red-500 text-lg mb-4">{error}</p>
                        <Button
                            onClick={() => navigate("/users")}
                            variant="outline"
                        >
                            {t("common.returnToList")}
                        </Button>
                    </div>
                ) : !reportData ? (
                    <div className="flex-1 flex justify-center items-center">
                        <p className="text-slate-500 text-lg">
                            {t("common.noData")}
                        </p>
                    </div>
                ) : reportData &&
                  (!reportData.days ||
                      !Array.isArray(reportData.days) ||
                      reportData.days.length === 0) ? (
                    <div className="flex-1 flex justify-center items-center">
                        <Card className="bg-white rounded-xl border border-slate-200/80 shadow-sm">
                            <CardContent className="pt-12 pb-12">
                                <div className="flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mb-4">
                                        <svg
                                            className="w-8 h-8 text-slate-400"
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                            />
                                        </svg>
                                    </div>
                                    <h3 className="text-xl font-semibold text-slate-900 mb-2">
                                        {t("report.noPeriodData")}
                                    </h3>
                                    <p className="text-slate-500 mb-6">
                                        {t("report.noPeriodDataSub")}
                                    </p>
                                    <div className="flex gap-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                const today = new Date();
                                                setSelectedYear(
                                                    today.getFullYear(),
                                                );
                                                setSelectedMonth(
                                                    today.getMonth() + 1,
                                                );
                                            }}
                                            className="rounded-xl"
                                        >
                                            {t("report.currentMonth")}
                                        </Button>
                                        <Link to="/users">
                                            <Button
                                                variant="outline"
                                                className="rounded-xl"
                                            >
                                                {t("common.backToList")}
                                            </Button>
                                        </Link>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    <>
                        {/* Header */}
                        <div className="flex items-start justify-between gap-3 flex-shrink-0">
                            <div className="min-w-0">
                                <h1 className="truncate text-lg font-semibold tracking-tight text-slate-900 sm:text-xl md:text-2xl">
                                    {reportData.name}
                                </h1>
                                <p className="mt-0.5 truncate text-[13px] text-slate-500">
                                    {reportData.position_name || "—"}
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                className="shrink-0 rounded-xl border-slate-200 text-slate-700"
                                onClick={() => setSalaryExcelModalOpen(true)}
                            >
                                <Download className="mr-2 h-4 w-4" /> Excel
                            </Button>
                        </div>

                        {/* Modal: Скачать Excel (зарплата) */}
                        <CustomModal
                            showTrigger={false}
                            open={salaryExcelModalOpen}
                            onOpenChange={setSalaryExcelModalOpen}
                            title={t("report.excelTitle")}
                            showFooter={false}
                            size="md"
                        >
                            <div className="space-y-4">
                                {/* Область выгрузки */}
                                <div className="flex flex-col gap-2">
                                    <label className="text-sm font-medium text-slate-700">
                                        {t("report.scope")}
                                    </label>
                                    <div className="grid grid-cols-2 gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
                                        {[
                                            { key: "self" as const, label: t("report.scopeSelf") },
                                            { key: "all" as const, label: t("report.scopeAll") },
                                        ].map((opt) => (
                                            <button
                                                key={opt.key}
                                                type="button"
                                                onClick={() =>
                                                    setSalaryExcelScope(opt.key)
                                                }
                                                disabled={
                                                    opt.key === "self" && !id
                                                }
                                                className={cn(
                                                    "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-40",
                                                    salaryExcelScope === opt.key
                                                        ? "bg-white text-slate-900 shadow-sm ring-1 ring-slate-200"
                                                        : "text-slate-500 hover:text-slate-700",
                                                )}
                                            >
                                                {opt.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            {t("report.yearLabel")}
                                        </label>
                                        <Select
                                            value={String(salaryExcelYear)}
                                            onValueChange={(v) =>
                                                setSalaryExcelYear(
                                                    parseInt(v, 10)
                                                )
                                            }
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder={t("report.yearPlaceholder")} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {[2025, 2026, 2027, 2028, 2029, 2030].map(
                                                    (y) => (
                                                        <SelectItem
                                                            key={y}
                                                            value={String(y)}
                                                        >
                                                            {y}
                                                        </SelectItem>
                                                    )
                                                )}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            {t("report.monthLabel")}
                                        </label>
                                        <Select
                                            value={salaryExcelMonth}
                                            onValueChange={setSalaryExcelMonth}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder={t("report.monthPlaceholder")} />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {MONTHS_PAYROLL.map((m) => (
                                                    <SelectItem
                                                        key={m.value}
                                                        value={m.value}
                                                    >
                                                        {t(m.labelKey)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-end pt-2">
                                    <Button
                                        variant="outline"
                                        onClick={() =>
                                            setSalaryExcelModalOpen(false)
                                        }
                                        disabled={salaryExcelDownloading}
                                        className="rounded-xl"
                                    >
                                        {t("common.cancel")}
                                    </Button>
                                    <Button
                                        onClick={handleDownloadPayrollExcel}
                                        disabled={
                                            salaryExcelDownloading ||
                                            !salaryExcelYear ||
                                            !salaryExcelMonth
                                        }
                                        className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white"
                                    >
                                        {salaryExcelDownloading ? (
                                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                                        ) : (
                                            <Download className="w-4 h-4 mr-2" />
                                        )}
                                        {salaryExcelDownloading
                                            ? t("report.downloading")
                                            : t("report.download")}
                                    </Button>
                                </div>
                            </div>
                        </CustomModal>

                        {/* Statistics */}
                        <div className="flex flex-col gap-3 flex-shrink-0">
                            {/* Посещаемость */}
                            <div className="rounded-2xl border border-slate-200/70 bg-white shadow-sm">
                                {/* Отработано / план */}
                                <div className="flex flex-col gap-2 border-b border-slate-100 px-4 py-3 sm:flex-row sm:items-center sm:justify-between md:px-5">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                            {t("report.worked")}
                                        </span>
                                        <span className="text-xl font-bold tabular-nums text-slate-900">
                                            {fmtHM(reportData.statistics.total_worked_minutes)}
                                        </span>
                                        <span className="text-[13px] tabular-nums text-slate-400">
                                            / {fmtHM(reportData.statistics.total_shift_minutes)}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="h-1.5 w-40 overflow-hidden rounded-full bg-slate-100">
                                            <div
                                                className="h-full rounded-full bg-dark-blue-500 transition-[width] duration-500"
                                                style={{ width: `${workedPct}%` }}
                                            />
                                        </div>
                                        <span className="w-9 text-right text-[12px] font-semibold tabular-nums text-slate-500">
                                            {workedPct}%
                                        </span>
                                    </div>
                                </div>

                                {/* Дни по статусам */}
                                <div className="grid grid-cols-3 gap-y-3 px-4 py-3 sm:grid-cols-4 lg:grid-cols-8 md:px-5">
                                    {[
                                        { label: t("report.stat.total"),      value: reportData.statistics.total_days,       dot: "bg-slate-300" },
                                        { label: t("report.stat.complete"),   value: reportData.statistics.complete_days,    dot: "bg-emerald-500" },
                                        { label: t("report.stat.partial"),    value: reportData.statistics.partial_days,     dot: "bg-amber-400" },
                                        { label: t("report.stat.absent"),     value: reportData.statistics.absent_days,      dot: "bg-rose-400" },
                                        { label: t("report.stat.onTime"),     value: reportData.statistics.on_time_days,     dot: "bg-emerald-500" },
                                        { label: t("report.stat.late"),       value: reportData.statistics.late_days,        dot: "bg-amber-400" },
                                        { label: t("report.stat.earlyLeave"), value: reportData.statistics.early_leave_days, dot: "bg-orange-400" },
                                        { label: t("report.stat.overtime"),   value: reportData.statistics.overtime_days,    dot: "bg-emerald-500" },
                                    ].map((s) => (
                                        <div key={s.label} className="min-w-0">
                                            <p className="mb-1 flex items-center gap-1.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">
                                                <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", s.dot)} />
                                                <span className="truncate">{s.label}</span>
                                            </p>
                                            <p className="text-lg font-bold leading-none tabular-nums text-slate-800">
                                                {s.value ?? 0}
                                            </p>
                                        </div>
                                    ))}
                                </div>

                                {/* Итоги по минутам */}
                                <div className="flex flex-wrap gap-x-4 gap-y-1.5 border-t border-slate-100 px-4 py-2.5 text-[11px] md:px-5">
                                    {[
                                        { label: t("report.totals.late"),         main: fmtHM(reportData.statistics.total_late_minutes),        sub: reportData.statistics.total_late_penalty_minutes > 0 ? t("report.totals.penalty", { count: reportData.statistics.total_late_penalty_minutes }) : null, subTone: "text-rose-500" },
                                        { label: t("report.totals.earlyLeave"),   main: fmtHM(reportData.statistics.total_early_leave_minutes),  sub: null, subTone: "" },
                                        { label: t("report.totals.overtime"),     main: fmtHM(reportData.statistics.total_overtime_minutes),     sub: null, subTone: "" },
                                        { label: t("report.totals.breaks"),       main: fmtHM(reportData.statistics.total_break_minutes),        sub: null, subTone: "" },
                                        { label: t("report.totals.earlyArrival"), main: fmtHM(reportData.statistics.total_early_arrival_minutes ?? 0), sub: reportData.statistics.early_arrival_days ? t("report.totals.days", { count: reportData.statistics.early_arrival_days }) : null, subTone: "text-slate-400" },
                                    ].map((row) => (
                                        <span key={row.label} className="inline-flex items-baseline gap-1.5">
                                            <span className="text-slate-400">{row.label}</span>
                                            <span className="font-semibold tabular-nums text-slate-700">{row.main}</span>
                                            {row.sub && <span className={cn("tabular-nums", row.subTone)}>· {row.sub}</span>}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            {/* Расчётный лист — фокусная тёмная панель */}
                            <div className="overflow-hidden rounded-2xl bg-slate-900 shadow-sm ring-1 ring-slate-900/5">
                                <div className="flex flex-col gap-4 p-4 md:flex-row md:items-stretch md:p-5">
                                    {/* К выплате */}
                                    <div className="flex shrink-0 flex-col justify-center md:w-56 md:border-r md:border-white/10 md:pr-5">
                                        <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                                            {t("report.toPay")}
                                        </p>
                                        <p className="mt-1 text-3xl font-bold leading-none tabular-nums text-white">
                                            {formatSum(salary?.netSalary)}
                                            <span className="ml-1.5 text-base font-medium text-slate-400">{t("common.sum")}</span>
                                        </p>
                                        {salary && salary.advance > 0 && (
                                            <p className="mt-2 text-[11px] tabular-nums text-slate-400">
                                                {t("report.advanceDeducted")}{" "}
                                                <span className="font-semibold text-rose-300">
                                                    −{formatSum(salary.advance)}
                                                </span>
                                            </p>
                                        )}
                                    </div>

                                    {/* Разбор расчёта */}
                                    <div className="flex min-w-0 flex-1 flex-col justify-center">
                                        <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
                                            {[
                                                { label: t("report.earned"),   value: formatSum(salary?.finalSalary),   sign: "", tone: "text-slate-100" },
                                                { label: t("report.overtime"), value: formatSum(salary?.overtimeSalary), sign: "+", tone: "text-emerald-300", hideZero: true, raw: salary?.overtimeSalary },
                                                { label: t("report.penalty"),  value: formatSum(salary?.penalty),        sign: "−", tone: "text-rose-300",    hideZero: true, raw: salary?.penalty },
                                            ].map((c) =>
                                                c.hideZero && !c.raw ? null : (
                                                    <div key={c.label} className="rounded-lg bg-white/5 px-3 py-1.5">
                                                        <p className="text-[10px] uppercase tracking-wide text-slate-400">{c.label}</p>
                                                        <p className={cn("text-sm font-semibold tabular-nums", c.tone)}>
                                                            {c.sign}{c.value}
                                                        </p>
                                                    </div>
                                                ),
                                            )}
                                            <span className="px-0.5 text-slate-500">=</span>
                                            <div className="rounded-lg bg-white/10 px-3 py-1.5">
                                                <p className="text-[10px] uppercase tracking-wide text-slate-300">{t("report.totalAccrued")}</p>
                                                <p className="text-sm font-semibold tabular-nums text-white">
                                                    {formatSum(salary?.totalSalary)}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Оклад / ставки */}
                                        <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 border-t border-white/10 pt-3 text-[11px]">
                                            <span className="inline-flex items-baseline gap-1.5">
                                                <span className="text-slate-500">{t("report.salary")}</span>
                                                <span className="font-semibold tabular-nums text-slate-200">
                                                    {formatSum(reportData.statistics.salary_amount)}
                                                </span>
                                                <span className="text-slate-500">· {reportData.statistics.salary_type_name}</span>
                                            </span>
                                            <span className="inline-flex items-baseline gap-1.5">
                                                <span className="text-slate-500">{t("report.ratePerHour")}</span>
                                                <span className="font-semibold tabular-nums text-slate-200">
                                                    {formatSum(reportData.statistics.hourly_rate)}
                                                </span>
                                            </span>
                                            <span className="inline-flex items-baseline gap-1.5">
                                                <span className="text-slate-500">{t("report.ratePerMin")}</span>
                                                <span className="font-semibold tabular-nums text-slate-200">
                                                    {formatSum(reportData.statistics.minute_rate)}
                                                </span>
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Calendar and Details */}
                        <div className="grid gap-4 md:gap-6 lg:grid-cols-3 items-start">
                            {/* Calendar */}
                            <Card className="bg-white rounded-xl md:rounded-xl border border-slate-200/80 shadow-sm lg:col-span-2 min-w-0">
                                <CardHeader className="px-4 md:px-6 py-3 md:py-6">
                                    <CardTitle className="text-base md:text-lg font-semibold text-slate-900">
                                        {t("report.attendanceCalendar")}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-3 md:px-6 pb-3 md:pb-6">
                                    <Calendar
                                        mode="single"
                                        selected={selectedDay}
                                        onSelect={setSelectedDay}
                                        month={currentDate}
                                        onMonthChange={(date) => {
                                            setSelectedYear(date.getFullYear());
                                            setSelectedMonth(
                                                date.getMonth() + 1,
                                            );
                                        }}
                                        disabled={(date) => {
                                            const today = new Date();
                                            today.setHours(0, 0, 0, 0);
                                            const checkDate = new Date(date);
                                            checkDate.setHours(0, 0, 0, 0);

                                            // Отключаем будущие даты
                                            if (checkDate > today) return true;

                                            // Отключаем дни из других месяцев (предыдущий и следующий месяц)
                                            const dateMonth = date.getMonth();
                                            const dateYear = date.getFullYear();
                                            const currentMonth =
                                                currentDate.getMonth();
                                            const currentYear =
                                                currentDate.getFullYear();

                                            if (
                                                dateMonth !== currentMonth ||
                                                dateYear !== currentYear
                                            ) {
                                                return true;
                                            }

                                            return false;
                                        }}
                                        className="rounded-xl w-full max-w-[280px] md:max-w-none mx-auto"
                                        classNames={{
                                            day: "relative p-0.5 md:p-1",
                                            month: "space-y-2 md:space-y-4",
                                            months: "flex flex-col",
                                            month_caption:
                                                "flex justify-center pt-1 relative items-center text-sm md:text-base",
                                            caption:
                                                "flex justify-center pt-1 relative items-center",
                                            nav: "space-x-0.5 md:space-x-1 flex items-center",
                                            table: "w-full border-collapse space-y-0 md:space-y-1",
                                            head_row: "flex",
                                            row: "flex w-full mt-1 md:mt-2",
                                            cell: "text-center text-xs md:text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                            day_button:
                                                "h-7 w-7 md:h-9 md:w-9 p-0 font-normal aria-selected:opacity-100",
                                        }}
                                        modifiersClassNames={{
                                            hasData: "bg-blue-50",
                                        }}
                                        components={{
                                            DayButton: ({
                                                day,
                                                modifiers,
                                                ...props
                                            }) => {
                                                const date = day.date;
                                                // Форматируем дату в формате YYYY-MM-DD без учета timezone
                                                const year = date.getFullYear();
                                                const month = String(
                                                    date.getMonth() + 1,
                                                ).padStart(2, "0");
                                                const dayNum = String(
                                                    date.getDate(),
                                                ).padStart(2, "0");
                                                const dateStr = `${year}-${month}-${dayNum}`;
                                                const dayData =
                                                    daysMap.get(dateStr);

                                                // Сравниваем даты без времени
                                                const isSelected = selectedDay
                                                    ? selectedDay.getFullYear() ===
                                                          date.getFullYear() &&
                                                      selectedDay.getMonth() ===
                                                          date.getMonth() &&
                                                      selectedDay.getDate() ===
                                                          date.getDate()
                                                    : false;
                                                const tone =
                                                    getDayTone(dayData);
                                                const isToday =
                                                    new Date().toDateString() ===
                                                    date.toDateString();
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);
                                                const checkDate = new Date(
                                                    date,
                                                );
                                                checkDate.setHours(0, 0, 0, 0);
                                                const isFuture =
                                                    checkDate > today;

                                                // Проверяем, является ли день из другого месяца
                                                const dateMonth =
                                                    date.getMonth();
                                                const dateYear =
                                                    date.getFullYear();
                                                const currentMonth =
                                                    currentDate.getMonth();
                                                const currentYear =
                                                    currentDate.getFullYear();
                                                const isOtherMonth =
                                                    dateMonth !==
                                                        currentMonth ||
                                                    dateYear !== currentYear;

                                                const disabled =
                                                    isFuture || isOtherMonth;
                                                const hasStatus =
                                                    !!dayData &&
                                                    tone.key !== "none";

                                                return (
                                                    <button
                                                        {...props}
                                                        disabled={disabled}
                                                        className={cn(
                                                            "group relative flex aspect-square min-h-[2.5rem] w-full flex-col items-center justify-center overflow-hidden rounded-lg transition-colors duration-150 md:min-h-[3.5rem] md:rounded-xl",
                                                            disabled
                                                                ? "cursor-not-allowed text-slate-300"
                                                                : cn(
                                                                      "text-slate-700 hover:bg-slate-50 active:scale-[0.98]",
                                                                      tone.cell,
                                                                  ),
                                                            isSelected &&
                                                                !disabled &&
                                                                "bg-dark-blue-50 ring-2 ring-dark-blue-500 ring-offset-1",
                                                            isToday &&
                                                                !isSelected &&
                                                                !disabled &&
                                                                "ring-1 ring-inset ring-slate-300",
                                                        )}
                                                    >
                                                        <span
                                                            className={cn(
                                                                "text-xs font-semibold leading-none tabular-nums md:text-sm",
                                                                disabled
                                                                    ? "text-slate-300"
                                                                    : isSelected
                                                                      ? "text-dark-blue-700"
                                                                      : "text-slate-700",
                                                            )}
                                                        >
                                                            {date.getDate()}
                                                        </span>
                                                        {/* Тонкая полоска-индикатор статуса дня */}
                                                        {!disabled &&
                                                            hasStatus && (
                                                                <span
                                                                    className={cn(
                                                                        "absolute inset-x-1.5 bottom-0 h-[3px] rounded-t-full",
                                                                        tone.bar,
                                                                    )}
                                                                />
                                                            )}
                                                    </button>
                                                );
                                            },
                                        }}
                                    />
                                </CardContent>
                            </Card>

                            {/* Day Details */}
                            <Card className="bg-white rounded-xl md:rounded-xl border border-slate-200/80 shadow-sm min-w-0">
                                <CardHeader className="px-4 md:px-6 py-3 md:py-6">
                                    <CardTitle className="text-base md:text-lg font-semibold text-slate-900">
                                        {t("report.dayDetails")}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
                                    {selectedDayData ? (
                                        <div className="space-y-3">
                                            {/* Дата + бейдж статуса */}
                                            <div className="flex items-start justify-between gap-2">
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-slate-900">
                                                        {formatDayMonth(new Date(selectedDayData.day_date + "T00:00:00"))}
                                                    </p>
                                                    <p className="text-[11px] capitalize text-slate-400">
                                                        {formatWeekday(new Date(selectedDayData.day_date + "T00:00:00"))}
                                                    </p>
                                                </div>
                                                <span className={cn(
                                                    "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium",
                                                    getDayTone(selectedDayData).badge,
                                                )}>
                                                    <span className={cn("h-1.5 w-1.5 rounded-full", getDayTone(selectedDayData).dot)} />
                                                    {t(getDayTone(selectedDayData).labelKey)}
                                                </span>
                                            </div>

                                            {/* Описание */}
                                            {selectedDayData.status_description && (
                                                <div className="rounded-lg border border-slate-100 bg-slate-50 px-3 py-2">
                                                    <p className="text-[12px] leading-relaxed text-slate-500">
                                                        {selectedDayData.status_description}
                                                    </p>
                                                </div>
                                            )}

                                            {/* График смены */}
                                            {selectedDayData.start_time && selectedDayData.end_time && (
                                                <p className="flex flex-wrap items-baseline gap-x-2 text-[11px] text-slate-400">
                                                    <span>{t("report.schedule")}</span>
                                                    <span className="font-semibold tabular-nums text-slate-600">
                                                        {selectedDayData.start_time.slice(0, 5)}–{selectedDayData.end_time.slice(0, 5)}
                                                    </span>
                                                    {selectedDayData.late_tolerance_minutes != null && (
                                                        <span>· {t("report.tolerance", { count: selectedDayData.late_tolerance_minutes })}</span>
                                                    )}
                                                </p>
                                            )}

                                            {/* Вход / выход */}
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="rounded-lg border border-slate-100 px-3 py-2">
                                                    <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">{t("report.checkIn")}</p>
                                                    <p className="text-sm font-semibold tabular-nums text-slate-800">
                                                        {selectedDayData.first_in
                                                            ? new Date(selectedDayData.first_in).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
                                                            : "—"}
                                                    </p>
                                                </div>
                                                <div className="rounded-lg border border-slate-100 px-3 py-2">
                                                    <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">{t("report.checkOut")}</p>
                                                    <p className="text-sm font-semibold tabular-nums text-slate-800">
                                                        {selectedDayData.last_out
                                                            ? new Date(selectedDayData.last_out).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
                                                            : "—"}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Отработано / план */}
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="rounded-lg border border-slate-100 px-3 py-2">
                                                    <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">{t("report.worked")}</p>
                                                    <p className="text-sm font-bold tabular-nums text-dark-blue-600">
                                                        {selectedDayData.worked_time_formatted}
                                                    </p>
                                                </div>
                                                <div className="rounded-lg border border-slate-100 px-3 py-2">
                                                    <p className="mb-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-400">{t("report.shiftPlan")}</p>
                                                    <p className="text-sm font-bold tabular-nums text-slate-600">
                                                        {selectedDayData.shift_time_formatted}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Отклонения — цвет только в точке-индикаторе */}
                                            {(() => {
                                                const rows = [
                                                    selectedDayData.late_minutes > 0 && { key: "late", dot: "bg-amber-400", label: t("report.detail.late"), value: formatTime(selectedDayData.late_minutes), extra: selectedDayData.late_minutes_penalty > 0 ? t("report.detail.penalty", { value: formatTime(selectedDayData.late_minutes_penalty) }) : null },
                                                    selectedDayData.early_leave_minutes > 0 && { key: "early", dot: "bg-orange-400", label: t("report.detail.earlyLeave"), value: formatTime(selectedDayData.early_leave_minutes), extra: null },
                                                    selectedDayData.overtime_minutes > 0 && { key: "over", dot: "bg-emerald-500", label: t("report.detail.overtime"), value: formatTime(selectedDayData.overtime_minutes), extra: null },
                                                    (selectedDayData.early_arrival_minutes ?? 0) > 0 && { key: "earlyarr", dot: "bg-sky-400", label: t("report.detail.earlyArrival"), value: formatTime(selectedDayData.early_arrival_minutes ?? 0), extra: null },
                                                    (selectedDayData.break_minutes ?? 0) > 0 && { key: "break", dot: "bg-slate-400", label: t("report.detail.breaks"), value: formatTime(selectedDayData.break_minutes ?? 0), extra: (selectedDayData.intervals_count ?? 0) > 0 ? t("report.detail.intervals", { count: selectedDayData.intervals_count }) : null },
                                                ].filter(Boolean) as { key: string; dot: string; label: string; value: string; extra: string | null }[];

                                                if (rows.length === 0) return null;
                                                return (
                                                    <div className="divide-y divide-slate-100 overflow-hidden rounded-lg border border-slate-100">
                                                        {rows.map((r) => (
                                                            <div key={r.key} className="flex items-center justify-between px-3 py-2">
                                                                <span className="flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-slate-400">
                                                                    <span className={cn("h-1.5 w-1.5 rounded-full", r.dot)} />
                                                                    {r.label}
                                                                </span>
                                                                <span className="flex items-baseline gap-1.5">
                                                                    {r.extra && <span className="text-[10px] tabular-nums text-slate-400">{r.extra}</span>}
                                                                    <span className="text-sm font-semibold tabular-nums text-slate-800">{r.value}</span>
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                );
                                            })()}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <p className="text-[13px] text-slate-400">{t("report.selectDay")}</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

export default EmployeeReport;
