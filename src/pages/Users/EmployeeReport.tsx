import { useEffect, useState, useMemo, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { GetEmployeeReport, GetDataSimple, PostSimple } from "@/services/data";
import { Loader2, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { toast } from "sonner";

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
    salary_type: number;
    salary_amount: number;
    final_salary_by_hours: number;
    final_salary_by_minutes: number;
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
    if (!day)
        return {
            bg: "bg-gray-50",
            text: "text-gray-400",
            border: "border-gray-200",
            dot: "",
        };

    // Дни, когда вообще не пришли - красный
    if (day.day_status === "absent") {
        return {
            bg: "bg-red-50",
            text: "text-red-700",
            border: "border-red-300",
            dot: "bg-red-500",
        };
    }

    // Проверяем наличие входа и выхода
    const hasEntry = day.first_in !== null && day.first_in !== undefined;
    const hasExit = day.last_out !== null && day.last_out !== undefined;
    const hasBoth = hasEntry && hasExit;
    const hasOnlyOne = (hasEntry && !hasExit) || (!hasEntry && hasExit);

    // Если есть только вход или только выход (частичный день) - желтый
    if (hasOnlyOne) {
        return {
            bg: "bg-amber-50",
            text: "text-amber-700",
            border: "border-amber-300",
            dot: "bg-amber-500",
        };
    }

    // Если есть и вход и выход
    if (hasBoth) {
        // Если опоздал (late) - желтый
        if (day.arrival_status === "late") {
            return {
                bg: "bg-amber-50",
                text: "text-amber-700",
                border: "border-amber-300",
                dot: "bg-amber-500",
            };
        }
        // Если не опоздал - зеленый
        return {
            bg: "bg-green-50",
            text: "text-green-700",
            border: "border-green-300",
            dot: "bg-green-500",
        };
    }

    return {
        bg: "bg-gray-50",
        text: "text-gray-400",
        border: "border-gray-200",
        dot: "",
    };
};

const EmployeeReport = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [reportData, setReportData] = useState<EmployeeReportData | null>(
        null
    );
    const [error, setError] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
    const [selectedMonth, setSelectedMonth] = useState(
        new Date().getMonth() + 1
    );
    const [selectedDay, setSelectedDay] = useState<Date | undefined>(undefined);
    const [employees, setEmployees] = useState<ApiUser[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeoutRef = useRef<number | null>(null);
    const hasSearchedRef = useRef(false);

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
                `api/faceid/users/list?page=1&limit=100&object_id=1`
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
                {}
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
                    parseInt(id)
                );
                setReportData(data);
            } catch (err: any) {
                setError(
                    err?.response?.data?.message ||
                        "Не удалось загрузить отчет сотрудника"
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
        <div className="flex gap-6 h-[calc(100vh-100px)] overflow-hidden">
            {/* Employees Sidebar */}
            <div className="w-72 bg-white border-r border-gray-200 flex-shrink-0 flex flex-col h-full">
                <div className="p-4 border-b border-gray-200 flex-shrink-0 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">
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
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                <X className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto scrollbar-hide p-3 space-y-2 min-h-0">
                    {loadingEmployees || isSearching ? (
                        <div className="flex justify-center items-center py-8">
                            <Loader2 className="w-5 h-5 animate-spin text-mainbg" />
                        </div>
                    ) : employees.length === 0 ? (
                        <div className="text-center py-4 text-gray-400 text-sm">
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
                                            `/users/report/${employee.faceid_user_id}`
                                        );
                                    }}
                                    className={cn(
                                        "w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group text-left",
                                        isActive
                                            ? "bg-mainbg/10 text-maintx"
                                            : "hover:bg-gray-100 text-gray-700"
                                    )}
                                >
                                    <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border-2 border-gray-200 group-hover:border-mainbg/50 transition-colors">
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
                                                    ? "text-maintx"
                                                    : "text-gray-900"
                                            )}
                                        >
                                            {employee.name}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
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
            <div className="flex-1 flex flex-col gap-5 h-full overflow-hidden">
                {loading ? (
                    <div className="flex-1 flex justify-center items-center">
                        <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-8 h-8 animate-spin text-mainbg" />
                            <p className="text-gray-500 text-sm">
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
                        <p className="text-gray-500 text-lg">
                            Нет данных для отображения
                        </p>
                    </div>
                ) : reportData &&
                  (!reportData.days ||
                      !Array.isArray(reportData.days) ||
                      reportData.days.length === 0) ? (
                    <div className="flex-1 flex justify-center items-center">
                        <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
                            <CardContent className="pt-12 pb-12">
                                <div className="flex flex-col items-center justify-center text-center">
                                    <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                                        <svg
                                            className="w-8 h-8 text-gray-400"
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
                                    <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                        Нет данных за выбранный период
                                    </h3>
                                    <p className="text-gray-500 mb-6">
                                        За выбранный месяц нет данных о
                                        посещаемости
                                    </p>
                                    <div className="flex gap-4">
                                        <Button
                                            variant="outline"
                                            onClick={() => {
                                                const today = new Date();
                                                setSelectedYear(
                                                    today.getFullYear()
                                                );
                                                setSelectedMonth(
                                                    today.getMonth() + 1
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
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 flex-shrink-0">
                            <div>
                                <h1 className="text-2xl  font-semibold text-gray-900">
                                    {reportData.name} -{" "}
                                    {reportData.position_name}
                                </h1>
                            </div>
                        </div>

                        {/* Statistics Cards */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 gap-2 flex-shrink-0">
                            <div className="bg-gradient-to-br from-gray-50 to-white rounded-xl border border-gray-200 p-3 shadow-sm hover:shadow-md transition-shadow">
                                <p className="text-[10px] text-gray-500 mb-1 font-medium uppercase tracking-wide">
                                    Всего дней
                                </p>
                                <p className="text-lg font-bold text-gray-900">
                                    {reportData.statistics.total_days}
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-green-50 to-white rounded-xl border border-green-200 p-3 shadow-sm hover:shadow-md transition-shadow">
                                <p className="text-[10px] text-gray-500 mb-1 font-medium uppercase tracking-wide">
                                    Полных дней
                                </p>
                                <p className="text-lg font-bold text-green-600">
                                    {reportData.statistics.complete_days}
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-yellow-50 to-white rounded-xl border border-yellow-200 p-3 shadow-sm hover:shadow-md transition-shadow">
                                <p className="text-[10px] text-gray-500 mb-1 font-medium uppercase tracking-wide">
                                    Частичных
                                </p>
                                <p className="text-lg font-bold text-yellow-600">
                                    {reportData.statistics.partial_days}
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-red-50 to-white rounded-xl border border-red-200 p-3 shadow-sm hover:shadow-md transition-shadow">
                                <p className="text-[10px] text-gray-500 mb-1 font-medium uppercase tracking-wide">
                                    Отсутствий
                                </p>
                                <p className="text-lg font-bold text-red-600">
                                    {reportData.statistics.absent_days}
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-amber-50 to-white rounded-xl border border-amber-200 p-3 shadow-sm hover:shadow-md transition-shadow">
                                <p className="text-[10px] text-gray-500 mb-1 font-medium uppercase tracking-wide">
                                    Опозданий
                                </p>
                                <p className="text-lg font-bold text-amber-600">
                                    {reportData.statistics.late_days}
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-emerald-50 to-white rounded-xl border border-emerald-200 p-3 shadow-sm hover:shadow-md transition-shadow">
                                <p className="text-[10px] text-gray-500 mb-1 font-medium uppercase tracking-wide">
                                    Переработок
                                </p>
                                <p className="text-lg font-bold text-emerald-600">
                                    {reportData.statistics.overtime_days}
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl border border-blue-200 p-3 shadow-sm hover:shadow-md transition-shadow">
                                <p className="text-[10px] text-gray-500 mb-1 font-medium uppercase tracking-wide">
                                    Отработано
                                </p>
                                <p className="text-lg font-bold text-blue-600">
                                    {(() => {
                                        const totalMinutes =
                                            reportData.statistics
                                                .total_worked_minutes || 0;
                                        const hours = Math.floor(
                                            totalMinutes / 60
                                        );
                                        const minutes =
                                            totalMinutes % 60;
                                        return `${hours} ч ${minutes} м`;
                                    })()}
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-200 p-3 shadow-sm hover:shadow-md transition-shadow">
                                <p className="text-[10px] text-gray-500 mb-1 font-medium uppercase tracking-wide">
                                    Зарплата
                                </p>
                                <p className="text-lg font-bold text-purple-600 leading-tight">
                                    {formatCurrency(
                                        reportData?.statistics?.salary_amount ||
                                            0
                                    )}
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-indigo-50 to-white rounded-xl border border-indigo-200 p-3 shadow-sm hover:shadow-md transition-shadow">
                                <p className="text-[10px] text-gray-500 mb-1 font-medium uppercase tracking-wide">
                                    Ставка за час
                                </p>
                                <p className="text-lg font-bold text-indigo-600 leading-tight">
                                    {formatCurrency(
                                        reportData.statistics
                                            .final_salary_by_hours || 0
                                    )}
                                </p>
                            </div>
                            <div className="bg-gradient-to-br from-pink-50 to-white rounded-xl border border-pink-200 p-3 shadow-sm hover:shadow-md transition-shadow">
                                <p className="text-[10px] text-gray-500 mb-1 font-medium uppercase tracking-wide">
                                    Заработано
                                </p>
                                <p className="text-lg font-bold text-pink-600 leading-tight">
                                    {(() => {
                                        const minutes =
                                            reportData.statistics
                                                .total_worked_minutes || 0;
                                        const ratePerMinute =
                                            reportData.statistics
                                                .final_salary_by_minutes || 0;
                                        const total =
                                            minutes * ratePerMinute;
                                        return formatCurrency(total);
                                    })()}
                                </p>
                            </div>
                        </div>

                        {/* Calendar and Details */}
                        <div className="grid gap-6 lg:grid-cols-3 flex-1 min-h-0 overflow-y-auto">
                            {/* Calendar */}
                            <Card className="bg-white rounded-2xl shadow-lg border border-gray-100 lg:col-span-2">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold text-gray-900">
                                        Календарь посещаемости
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Calendar
                                        mode="single"
                                        selected={selectedDay}
                                        onSelect={setSelectedDay}
                                        month={currentDate}
                                        onMonthChange={(date) => {
                                            setSelectedYear(date.getFullYear());
                                            setSelectedMonth(
                                                date.getMonth() + 1
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
                                        className="rounded-xl w-full"
                                        classNames={{
                                            day: "relative p-1",
                                            month: "space-y-4",
                                            months: "flex flex-col",
                                            month_caption:
                                                "flex justify-center pt-1 relative items-center",
                                            caption:
                                                "flex justify-center pt-1 relative items-center",
                                            nav: "space-x-1 flex items-center",
                                            table: "w-full border-collapse space-y-1",
                                            head_row: "flex",
                                            row: "flex w-full mt-2",
                                            cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                                            day_button:
                                                "h-9 w-9 p-0 font-normal aria-selected:opacity-100",
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
                                                    date.getMonth() + 1
                                                ).padStart(2, "0");
                                                const dayNum = String(
                                                    date.getDate()
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
                                                    date
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
                                                            "relative w-full h-full rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-0.5 p-1.5 min-h-[3rem] aspect-square",
                                                            isFuture ||
                                                                isOtherMonth
                                                                ? "bg-gray-50 text-gray-300 border-gray-200 cursor-not-allowed opacity-50"
                                                                : cn(
                                                                      colors.bg,
                                                                      colors.text,
                                                                      colors.border,
                                                                      "border-2",
                                                                      "hover:shadow-lg hover:scale-105 hover:z-10"
                                                                  ),
                                                            isSelected &&
                                                                !isFuture &&
                                                                !isOtherMonth &&
                                                                "ring-2 ring-mainbg ring-offset-2 shadow-xl scale-110 z-20",
                                                            isToday &&
                                                                !isSelected &&
                                                                !isFuture &&
                                                                !isOtherMonth &&
                                                                "ring-2 ring-gray-400 ring-offset-1"
                                                        )}
                                                    >
                                                        <span
                                                            className={cn(
                                                                "text-sm font-bold leading-none",
                                                                isSelected &&
                                                                    "text-mainbg text-base"
                                                            )}
                                                        >
                                                            {date.getDate()}
                                                        </span>
                                                        {colors.dot && (
                                                            <div
                                                                className={cn(
                                                                    "w-1.5 h-1.5 rounded-full mt-0.5",
                                                                    colors.dot
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
                            <Card className="bg-white rounded-2xl shadow-lg border border-gray-100">
                                <CardHeader>
                                    <CardTitle className="text-lg font-semibold text-gray-900">
                                        Детали дня
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {selectedDayData ? (
                                        <div className="space-y-4">
                                            <div>
                                                <p className="font-semibold text-gray-900">
                                                    {new Date(
                                                        selectedDayData.day_date
                                                    ).toLocaleDateString(
                                                        "ru-RU",
                                                        {
                                                            day: "numeric",
                                                            month: "long",
                                                            year: "numeric",
                                                        }
                                                    )}
                                                </p>
                                            </div>
                                            <div>
                                                <Badge
                                                    className={cn(
                                                        "border",
                                                        getStatusColor(
                                                            selectedDayData
                                                        ).bg,
                                                        getStatusColor(
                                                            selectedDayData
                                                        ).text,
                                                        getStatusColor(
                                                            selectedDayData
                                                        ).border
                                                    )}
                                                >
                                                    {selectedDayData.day_status ===
                                                    "complete"
                                                        ? "Полный день"
                                                        : selectedDayData.day_status ===
                                                          "partial_in"
                                                        ? "Частичный (вход)"
                                                        : selectedDayData.day_status ===
                                                          "partial_out"
                                                        ? "Частичный (выход)"
                                                        : "Отсутствие"}
                                                </Badge>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 mb-1">
                                                    Описание
                                                </p>
                                                <p className="text-sm text-gray-900">
                                                    {
                                                        selectedDayData.status_description
                                                    }
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 mb-1">
                                                    Вход
                                                </p>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {selectedDayData.first_in
                                                        ? new Date(
                                                              selectedDayData.first_in
                                                          ).toLocaleTimeString(
                                                              "ru-RU",
                                                              {
                                                                  hour: "2-digit",
                                                                  minute: "2-digit",
                                                              }
                                                          )
                                                        : "—"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 mb-1">
                                                    Выход
                                                </p>
                                                <p className="text-sm font-medium text-gray-900">
                                                    {selectedDayData.last_out
                                                        ? new Date(
                                                              selectedDayData.last_out
                                                          ).toLocaleTimeString(
                                                              "ru-RU",
                                                              {
                                                                  hour: "2-digit",
                                                                  minute: "2-digit",
                                                              }
                                                          )
                                                        : "—"}
                                                </p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-500 mb-1">
                                                    Отработано
                                                </p>
                                                <p className="text-sm font-semibold text-gray-900">
                                                    {
                                                        selectedDayData.worked_time_formatted
                                                    }
                                                </p>
                                            </div>
                                            {selectedDayData.late_minutes >
                                                0 && (
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">
                                                        Опоздание
                                                    </p>
                                                    <p className="text-sm font-semibold text-red-600">
                                                        {formatTime(
                                                            selectedDayData.late_minutes
                                                        )}
                                                    </p>
                                                </div>
                                            )}
                                            {selectedDayData.overtime_minutes >
                                                0 && (
                                                <div>
                                                    <p className="text-sm text-gray-500 mb-1">
                                                        Переработка
                                                    </p>
                                                    <p className="text-sm font-semibold text-green-600">
                                                        {formatTime(
                                                            selectedDayData.overtime_minutes
                                                        )}
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            Выберите день в календаре
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
