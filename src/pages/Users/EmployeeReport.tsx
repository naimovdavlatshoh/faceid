import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import { GetEmployeeReport } from "@/services/data";
import { Loader2 } from "lucide-react";

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

interface EmployeeReportProps {
    userId?: string;
}

const EmployeeReport = ({ userId }: EmployeeReportProps) => {
    const { id: routeId } = useParams<{ id: string }>();
    const effectiveId = userId ?? routeId;
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

    useEffect(() => {
        const fetchData = async () => {
            if (!effectiveId) return;
            try {
                setLoading(true);
                setError(null);
                const data = await GetEmployeeReport(
                    selectedYear,
                    selectedMonth,
                    parseInt(effectiveId)
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
    }, [effectiveId, selectedYear, selectedMonth]);

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

    if (loading) {
        return (
            <div className="h-[80vh] w-full flex justify-center items-center">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="w-8 h-8 animate-spin text-mainbg" />
                    <p className="text-gray-500 text-sm">Загрузка данных...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-[80vh] w-full flex flex-col justify-center items-center">
                <p className="text-red-500 text-lg mb-4">{error}</p>
                <Button onClick={() => navigate("/users")} variant="outline">
                    Вернуться к списку
                </Button>
            </div>
        );
    }

    if (!reportData) {
        return (
            <div className="h-[80vh] w-full flex justify-center items-center">
                <p className="text-gray-500 text-lg">
                    Нет данных для отображения
                </p>
            </div>
        );
    }

    // Проверка на пустые данные или отсутствие массива days
    if (
        !reportData.days ||
        !Array.isArray(reportData.days) ||
        reportData.days.length === 0
    ) {
        return (
            <div className="space-y-6 pb-10">
                {/* Empty State */}
                <Card className="bg-white rounded-2xl shadow-lg mt-10 border border-gray-100">
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
                                За выбранный месяц нет данных о посещаемости
                            </p>
                            <div className="flex gap-4">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        const today = new Date();
                                        setSelectedYear(today.getFullYear());
                                        setSelectedMonth(today.getMonth() + 1);
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
        );
    }

    return (
        <div className="flex flex-col gap-5 justify-center h-full">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl  font-semibold text-gray-900">
                        {reportData.name} - {reportData.position_name}
                    </h1>
                </div>
            </div>

            {/* Statistics Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 gap-2">
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
                        Часов
                    </p>
                    <p className="text-lg font-bold text-blue-600">
                        {reportData.statistics.total_worked_hours}
                    </p>
                </div>
                <div className="bg-gradient-to-br from-purple-50 to-white rounded-xl border border-purple-200 p-3 shadow-sm hover:shadow-md transition-shadow">
                    <p className="text-[10px] text-gray-500 mb-1 font-medium uppercase tracking-wide">
                        Зарплата
                    </p>
                    <p className="text-sm font-bold text-purple-600 leading-tight">
                        {formatCurrency(
                            reportData?.statistics?.final_salary_by_hours || 0
                        )}
                    </p>
                </div>
            </div>

            {/* Calendar and Details */}
            <div className="grid gap-6 lg:grid-cols-3">
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
                                setSelectedMonth(date.getMonth() + 1);
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
                                const currentMonth = currentDate.getMonth();
                                const currentYear = currentDate.getFullYear();

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
                                DayButton: ({ day, modifiers, ...props }) => {
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
                                    const dayData = daysMap.get(dateStr);

                                    // Сравниваем даты без времени
                                    const isSelected = selectedDay
                                        ? selectedDay.getFullYear() ===
                                              date.getFullYear() &&
                                          selectedDay.getMonth() ===
                                              date.getMonth() &&
                                          selectedDay.getDate() ===
                                              date.getDate()
                                        : false;
                                    const colors = getStatusColor(dayData);
                                    const isToday =
                                        new Date().toDateString() ===
                                        date.toDateString();
                                    const today = new Date();
                                    today.setHours(0, 0, 0, 0);
                                    const checkDate = new Date(date);
                                    checkDate.setHours(0, 0, 0, 0);
                                    const isFuture = checkDate > today;

                                    // Проверяем, является ли день из другого месяца
                                    const dateMonth = date.getMonth();
                                    const dateYear = date.getFullYear();
                                    const currentMonth = currentDate.getMonth();
                                    const currentYear =
                                        currentDate.getFullYear();
                                    const isOtherMonth =
                                        dateMonth !== currentMonth ||
                                        dateYear !== currentYear;

                                    return (
                                        <button
                                            {...props}
                                            disabled={isFuture || isOtherMonth}
                                            className={cn(
                                                "relative w-full h-full rounded-xl transition-all duration-200 flex flex-col items-center justify-center gap-0.5 p-1.5 min-h-[4rem] aspect-square",
                                                isFuture || isOtherMonth
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
                                            {dayData &&
                                                dayData.worked_minutes > 0 && (
                                                    <span className="text-[9px] font-semibold opacity-80 leading-tight mt-0.5">
                                                        {
                                                            dayData.worked_time_formatted
                                                        }
                                                    </span>
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
                                    <p className="text-sm text-gray-500 mb-1">
                                        Дата
                                    </p>
                                    <p className="font-semibold text-gray-900">
                                        {new Date(
                                            selectedDayData.day_date
                                        ).toLocaleDateString("ru-RU", {
                                            day: "numeric",
                                            month: "long",
                                            year: "numeric",
                                        })}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">
                                        Статус
                                    </p>
                                    <Badge
                                        className={cn(
                                            "border",
                                            getStatusColor(selectedDayData).bg,
                                            getStatusColor(selectedDayData)
                                                .text,
                                            getStatusColor(selectedDayData)
                                                .border
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
                                        {selectedDayData.status_description}
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
                                              ).toLocaleTimeString("ru-RU", {
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                              })
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
                                              ).toLocaleTimeString("ru-RU", {
                                                  hour: "2-digit",
                                                  minute: "2-digit",
                                              })
                                            : "—"}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500 mb-1">
                                        Отработано
                                    </p>
                                    <p className="text-sm font-semibold text-gray-900">
                                        {selectedDayData.worked_time_formatted}
                                    </p>
                                </div>
                                {selectedDayData.late_minutes > 0 && (
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
                                {selectedDayData.overtime_minutes > 0 && (
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
        </div>
    );
};

export default EmployeeReport;
