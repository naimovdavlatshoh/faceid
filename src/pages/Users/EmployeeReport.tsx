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
import { SearchableCombobox } from "@/components/ui/searchable-combobox";

const MONTHS_PAYROLL = [
    { name: "Январь", value: "1" },
    { name: "Февраль", value: "2" },
    { name: "Март", value: "3" },
    { name: "Апрель", value: "4" },
    { name: "Май", value: "5" },
    { name: "Июнь", value: "6" },
    { name: "Июль", value: "7" },
    { name: "Август", value: "8" },
    { name: "Сентябрь", value: "9" },
    { name: "Октябрь", value: "10" },
    { name: "Ноябрь", value: "11" },
    { name: "Декабрь", value: "12" },
];

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

const getStatusColor = (day: DayData | undefined) => {
    const none = { bg: "bg-slate-50", text: "text-slate-300", border: "border-slate-100", dot: "", indicator: "" as const };

    if (!day) return none;

    // Отсутствие
    if (day.day_status === "absent") {
        return { bg: "bg-red-50", text: "text-red-600", border: "border-red-200", dot: "bg-red-500", indicator: "" as const };
    }

    const hasEntry = day.first_in != null;
    const hasExit  = day.last_out != null;

    // Частичный день
    if ((hasEntry && !hasExit) || (!hasEntry && hasExit)) {
        return { bg: "bg-orange-50", text: "text-orange-600", border: "border-orange-200", dot: "bg-orange-400", indicator: "" as const };
    }

    if (hasEntry && hasExit) {
        const late  = day.arrival_status === "late";
        const early = day.departure_status === "early";
        const over  = day.departure_status === "overtime";

        // Опоздал И рано ушел — самый плохой вариант
        if (late && early) {
            return { bg: "bg-red-50", text: "text-red-500", border: "border-red-200", dot: "bg-red-400", indicator: "" as const };
        }
        // Опоздал, но ушел вовремя/с переработкой
        if (late) {
            return { bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-400", indicator: "" as const };
        }
        // Пришел вовремя, но рано ушел
        if (early) {
            return { bg: "bg-yellow-50", text: "text-yellow-700", border: "border-yellow-200", dot: "bg-yellow-400", indicator: "" as const };
        }
        // Пришел вовремя + переработка — отлично
        if (over) {
            return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", indicator: "star" as const };
        }
        // Пришел вовремя, ушел вовремя — хорошо
        return { bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", indicator: "" as const };
    }

    return none;
};

const EmployeeReport = () => {
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
            toast.error("Ошибка поиска сотрудников");
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
        try {
            setSalaryExcelDownloading(true);
            const blob = await DownloadEmployeePayrollExcel(year, month);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `payroll_${year}_${String(month).padStart(2, "0")}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            toast.success("Файл успешно скачан");
            setSalaryExcelModalOpen(false);
        } catch (err: any) {
            console.error(err);
            toast.error(
                err?.response?.data?.message || "Ошибка скачивания файла"
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
                        "Не удалось загрузить отчет сотрудника",
                );
                console.error("Error fetching employee report:", err);
                toast.error("Ошибка загрузки данных");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, selectedYear, selectedMonth]);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("ru-RU", {
            style: "currency",
            currency: "UZS",
            minimumFractionDigits: 0,
        }).format(amount);
    };

    const formatTime = (minutes: number) => {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return `${hours}ч ${mins}м`;
    };

    // Не показываем полный экран загрузки, список сотрудников должен оставаться видимым

    return (
        <div className="flex flex-col md:flex-row gap-4 md:gap-6 min-h-0 md:h-[calc(100vh-100px)] overflow-hidden">
            {/* Employees Sidebar - hidden on mobile, use dropdown in main instead */}
            <div className="hidden md:flex w-72 bg-white border-r border-slate-200 flex-shrink-0 flex-col h-full">
                <div className="p-4 border-b border-slate-200 flex-shrink-0 space-y-3">
                    <h3 className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                        Сотрудники
                    </h3>
                    <div className="relative">
                        <Input
                            type="text"
                            placeholder="Поиск сотрудников..."
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
                                ? "Сотрудники не найдены"
                                : "Нет сотрудников"}
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
            <div className="flex-1 flex flex-col gap-4 md:gap-5 min-h-0 h-full overflow-hidden">
                {/* Mobile: employee selector — combobox with search */}
                <div className="md:hidden flex-shrink-0">
                    <SearchableCombobox
                        label="Сотрудник"
                        placeholder="Выберите сотрудника"
                        searchPlaceholder="Поиск сотрудников..."
                        emptyMessage="Сотрудники не найдены"
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
                                Загрузка данных...
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
                            Вернуться к списку
                        </Button>
                    </div>
                ) : !reportData ? (
                    <div className="flex-1 flex justify-center items-center">
                        <p className="text-slate-500 text-lg">
                            Нет данных для отображения
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
                                        Нет данных за выбранный период
                                    </h3>
                                    <p className="text-slate-500 mb-6">
                                        За выбранный месяц нет данных о
                                        посещаемости
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
                                            Текущий месяц
                                        </Button>
                                        <Link to="/users">
                                            <Button
                                                variant="outline"
                                                className="rounded-xl"
                                            >
                                                Назад к списку
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
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 md:gap-4 flex-shrink-0">
                            <div className="min-w-0 flex items-center justify-between w-full">
                                <h1 className="text-lg sm:text-xl md:text-2xl font-semibold text-slate-900 truncate">
                                    {reportData.name} -{" "}
                                    {reportData.position_name}
                                </h1>
                                <Button
                                    className="rounded-xl"
                                    onClick={() =>
                                        setSalaryExcelModalOpen(true)
                                    }
                                >
                                    <Download className="w-4 h-4" /> Зарплата
                                </Button>
                            </div>
                        </div>

                        {/* Modal: Скачать Excel (зарплата) */}
                        <CustomModal
                            showTrigger={false}
                            open={salaryExcelModalOpen}
                            onOpenChange={setSalaryExcelModalOpen}
                            title="Скачать Excel (зарплата)"
                            showFooter={false}
                            size="md"
                        >
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="flex flex-col gap-2">
                                        <label className="text-sm font-medium text-slate-700">
                                            Год
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
                                                <SelectValue placeholder="Выберите год" />
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
                                            Месяц
                                        </label>
                                        <Select
                                            value={salaryExcelMonth}
                                            onValueChange={setSalaryExcelMonth}
                                        >
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Выберите месяц" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {MONTHS_PAYROLL.map((m) => (
                                                    <SelectItem
                                                        key={m.value}
                                                        value={m.value}
                                                    >
                                                        {m.name}
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
                                        Отмена
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
                                            ? "Загрузка..."
                                            : "Скачать"}
                                    </Button>
                                </div>
                            </div>
                        </CustomModal>

                        {/* Statistics */}
                        <div className="flex flex-col gap-3 flex-shrink-0">
                            {/* Row 1: Attendance */}
                            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-2">
                                {[
                                    { label: "Всего дней",   value: reportData.statistics.total_days,        color: "text-slate-700",   bg: "bg-white",          border: "border-slate-200" },
                                    { label: "Полных",       value: reportData.statistics.complete_days,     color: "text-emerald-600", bg: "bg-emerald-50",     border: "border-emerald-100" },
                                    { label: "Частичных",    value: reportData.statistics.partial_days,      color: "text-orange-600",  bg: "bg-orange-50",      border: "border-orange-100" },
                                    { label: "Отсутствий",   value: reportData.statistics.absent_days,       color: "text-red-600",     bg: "bg-red-50",         border: "border-red-100" },
                                    { label: "Опозданий",    value: reportData.statistics.late_days,         color: "text-amber-600",   bg: "bg-amber-50",       border: "border-amber-100" },
                                    { label: "Ранних уходов",value: reportData.statistics.early_leave_days,  color: "text-yellow-700",  bg: "bg-yellow-50",      border: "border-yellow-100" },
                                    { label: "Переработок",  value: reportData.statistics.overtime_days,     color: "text-blue-600",    bg: "bg-blue-50",        border: "border-blue-100" },
                                ].map((s) => (
                                    <div key={s.label} className={cn("rounded-xl border p-3 shadow-sm", s.bg, s.border)}>
                                        <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-1 truncate">{s.label}</p>
                                        <p className={cn("text-xl font-bold leading-none", s.color)}>{s.value}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Row 2: Time + Salary */}
                            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
                                {/* Время */}
                                <div className="rounded-xl border border-blue-100 bg-blue-50 p-3 shadow-sm">
                                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-1">Отработано</p>
                                    <p className="text-base font-bold text-blue-700 leading-tight">
                                        {Math.floor(reportData.statistics.total_worked_minutes / 60)}ч {reportData.statistics.total_worked_minutes % 60}м
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                        из {Math.floor(reportData.statistics.total_shift_minutes / 60)}ч {reportData.statistics.total_shift_minutes % 60}м
                                    </p>
                                </div>
                                <div className="rounded-xl border border-amber-100 bg-amber-50 p-3 shadow-sm">
                                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-1">Опозданий</p>
                                    <p className="text-base font-bold text-amber-700 leading-tight">
                                        {Math.floor(reportData.statistics.total_late_minutes / 60)}ч {reportData.statistics.total_late_minutes % 60}м
                                    </p>
                                    <p className="text-[10px] text-red-400 mt-0.5">
                                        штраф: {reportData.statistics.total_late_penalty_minutes} мин
                                    </p>
                                </div>
                                <div className="rounded-xl border border-yellow-100 bg-yellow-50 p-3 shadow-sm">
                                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-1">Ранних уходов</p>
                                    <p className="text-base font-bold text-yellow-700 leading-tight">
                                        {Math.floor(reportData.statistics.total_early_leave_minutes / 60)}ч {reportData.statistics.total_early_leave_minutes % 60}м
                                    </p>
                                </div>
                                {/* Зарплата */}
                                <div className="rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
                                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-1">Оклад</p>
                                    <p className="text-base font-bold text-slate-700 leading-tight truncate">
                                        {formatCurrency(reportData.statistics.salary_amount)}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5 truncate">{reportData.statistics.salary_type_name}</p>
                                </div>
                                <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-3 shadow-sm">
                                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-1">Ставка/час</p>
                                    <p className="text-base font-bold text-indigo-700 leading-tight truncate">
                                        {formatCurrency(reportData.statistics.hourly_rate)}
                                    </p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">{reportData.statistics.minute_rate} сум/мин</p>
                                </div>
                                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 shadow-sm">
                                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-1">Заработано</p>
                                    <p className="text-base font-bold text-emerald-700 leading-tight truncate">
                                        {formatCurrency(reportData.statistics.final_salary)}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Calendar and Details */}
                        <div className="grid gap-4 md:gap-6 lg:grid-cols-3 flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
                            {/* Calendar */}
                            <Card className="bg-white rounded-xl md:rounded-xl border border-slate-200/80 shadow-sm lg:col-span-2 min-w-0">
                                <CardHeader className="px-4 md:px-6 py-3 md:py-6">
                                    <CardTitle className="text-base md:text-lg font-semibold text-slate-900">
                                        Календарь посещаемости
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
                                                const colors =
                                                    getStatusColor(dayData);
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

                                                return (
                                                    <button
                                                        {...props}
                                                        disabled={
                                                            isFuture ||
                                                            isOtherMonth
                                                        }
                                                        className={cn(
                                                            "relative w-full h-full rounded-lg md:rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-0.5 p-1 min-h-[2.25rem] md:min-h-[3rem] aspect-square",
                                                            isFuture ||
                                                                isOtherMonth
                                                                ? "bg-slate-50 text-slate-300 border-slate-200 cursor-not-allowed opacity-50"
                                                                : cn(
                                                                      colors.bg,
                                                                      colors.text,
                                                                      colors.border,
                                                                      "border md:border-2",
                                                                      "hover:shadow-lg hover:scale-105 hover:z-10",
                                                                  ),
                                                            isSelected &&
                                                                !isFuture &&
                                                                !isOtherMonth &&
                                                                "ring-2 ring-blue-500 ring-offset-1 md:ring-offset-2 shadow-lg md:shadow-xl scale-105 md:scale-110 z-20",
                                                            isToday &&
                                                                !isSelected &&
                                                                !isFuture &&
                                                                !isOtherMonth &&
                                                                "ring-2 ring-slate-400 ring-offset-1",
                                                        )}
                                                    >
                                                        <span
                                                            className={cn(
                                                                "text-xs md:text-sm font-bold leading-none",
                                                                isSelected &&
                                                                    "text-blue-600 text-sm md:text-base",
                                                            )}
                                                        >
                                                            {date.getDate()}
                                                        </span>
                                                        {colors.indicator === "star" ? (
                                                            <span className="text-[8px] md:text-[10px] leading-none mt-0.5">⭐</span>
                                                        ) : colors.dot ? (
                                                            <div className={cn("w-1 h-1 md:w-1.5 md:h-1.5 rounded-full mt-0.5", colors.dot)} />
                                                        ) : null}
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
                                        Детали дня
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="px-4 md:px-6 pb-4 md:pb-6">
                                    {selectedDayData ? (
                                        <div className="space-y-3">
                                            {/* Date + status badge */}
                                            <div className="flex items-start justify-between gap-2">
                                                <p className="font-semibold text-slate-900 text-sm">
                                                    {new Date(selectedDayData.day_date + "T00:00:00").toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                                                </p>
                                                <span className={cn(
                                                    "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium border shrink-0",
                                                    getStatusColor(selectedDayData).bg,
                                                    getStatusColor(selectedDayData).text,
                                                    getStatusColor(selectedDayData).border,
                                                )}>
                                                    {selectedDayData.day_status === "complete"
                                                        ? "Полный день"
                                                        : selectedDayData.day_status === "partial_in"
                                                        ? "Частичный (вход)"
                                                        : selectedDayData.day_status === "partial_out"
                                                        ? "Частичный (выход)"
                                                        : "Отсутствие"}
                                                </span>
                                            </div>

                                            {/* Description */}
                                            {selectedDayData.status_description && (
                                                <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                                                    <p className="text-[12px] text-slate-500 leading-relaxed">
                                                        {selectedDayData.status_description}
                                                    </p>
                                                </div>
                                            )}

                                            {/* Time row */}
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="bg-emerald-50 rounded-lg px-3 py-2 border border-emerald-100">
                                                    <p className="text-[10px] text-emerald-600 font-medium uppercase tracking-wide mb-0.5">Вход</p>
                                                    <p className="text-sm font-semibold text-emerald-700">
                                                        {selectedDayData.first_in
                                                            ? new Date(selectedDayData.first_in).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
                                                            : "—"}
                                                    </p>
                                                </div>
                                                <div className="bg-slate-50 rounded-lg px-3 py-2 border border-slate-100">
                                                    <p className="text-[10px] text-slate-500 font-medium uppercase tracking-wide mb-0.5">Выход</p>
                                                    <p className="text-sm font-semibold text-slate-700">
                                                        {selectedDayData.last_out
                                                            ? new Date(selectedDayData.last_out).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })
                                                            : "—"}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Work hours */}
                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="rounded-lg px-3 py-2 border border-slate-100">
                                                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">Отработано</p>
                                                    <p className="text-sm font-bold text-blue-600">
                                                        {selectedDayData.worked_time_formatted}
                                                    </p>
                                                </div>
                                                <div className="rounded-lg px-3 py-2 border border-slate-100">
                                                    <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wide mb-0.5">План смены</p>
                                                    <p className="text-sm font-bold text-slate-600">
                                                        {selectedDayData.shift_time_formatted}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Penalties */}
                                            {selectedDayData.late_minutes > 0 && (
                                                <div className="rounded-lg px-3 py-2 border border-amber-100 bg-amber-50">
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-[10px] text-amber-600 font-medium uppercase tracking-wide">Опоздание</p>
                                                        <p className="text-sm font-semibold text-amber-700">{formatTime(selectedDayData.late_minutes)}</p>
                                                    </div>
                                                    {selectedDayData.late_minutes_penalty > 0 && (
                                                        <div className="flex justify-between items-center mt-1">
                                                            <p className="text-[10px] text-red-500 font-medium">Штраф</p>
                                                            <p className="text-xs font-semibold text-red-600">{formatTime(selectedDayData.late_minutes_penalty)}</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            {selectedDayData.early_leave_minutes > 0 && (
                                                <div className="rounded-lg px-3 py-2 border border-orange-100 bg-orange-50">
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-[10px] text-orange-600 font-medium uppercase tracking-wide">Ранний уход</p>
                                                        <p className="text-sm font-semibold text-orange-700">{formatTime(selectedDayData.early_leave_minutes)}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {selectedDayData.overtime_minutes > 0 && (
                                                <div className="rounded-lg px-3 py-2 border border-emerald-100 bg-emerald-50">
                                                    <div className="flex justify-between items-center">
                                                        <p className="text-[10px] text-emerald-600 font-medium uppercase tracking-wide">Переработка</p>
                                                        <p className="text-sm font-semibold text-emerald-700">{formatTime(selectedDayData.overtime_minutes)}</p>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center py-12 text-center">
                                            <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center mb-3">
                                                <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                </svg>
                                            </div>
                                            <p className="text-[13px] text-slate-400">Выберите день в календаре</p>
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
