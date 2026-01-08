import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
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
import { Loader2 } from "lucide-react";
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

const months = [
    { name: "Январь", value: "01" },
    { name: "Февраль", value: "02" },
    { name: "Март", value: "03" },
    { name: "Апрель", value: "04" },
    { name: "Май", value: "05" },
    { name: "Июнь", value: "06" },
    { name: "Июль", value: "07" },
    { name: "Август", value: "08" },
    { name: "Сентябрь", value: "09" },
    { name: "Октябрь", value: "10" },
    { name: "Ноябрь", value: "11" },
    { name: "Декабрь", value: "12" },
];

const statusStyles: Record<
    AttendanceItem["status"],
    { text: string; badge: string; chip: string }
> = {
    present: {
        text: "На месте",
        badge: "bg-green-100 text-green-700 border-green-200 hover:bg-green-100 hover:text-green-700 hover:border-green-200",
        chip: "bg-green-50 text-green-600",
    },
    late: {
        text: "Опоздал",
        badge: "bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100 hover:text-amber-700 hover:border-amber-200",
        chip: "bg-amber-50 text-amber-600",
    },
    absent: {
        text: "Отсутствует",
        badge: "bg-red-100 text-red-600 border-red-200 hover:bg-red-100 hover:text-red-600 hover:border-red-200",
        chip: "bg-red-50 text-red-600",
    },
};

const statLabels: Record<keyof AttendanceData["statistics"], string> = {
    on_time: "Вовремя",
    late: "Опоздали",
    absent: "Отсутствуют",
    day_off: "Выходной",
    present: "На месте",
};

const formatDateForApi = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const getCurrentDate = (): string => {
    const today = new Date();
    return formatDateForApi(today);
};

const Dashboard = () => {
    const [loading, setLoading] = useState(true);
    const [attendanceData, setAttendanceData] = useState<AttendanceData | null>(
        null
    );
    const [error, setError] = useState<string | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>(getCurrentDate());
    const [modalImage, setModalImage] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState<number>(
        new Date().getFullYear()
    );
    const [selectedMonth, setSelectedMonth] = useState<string>(
        String(new Date().getMonth() + 1).padStart(2, "0")
    );
    const [downloading, setDownloading] = useState(false);
    const [excelModalOpen, setExcelModalOpen] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);

    const selectedDateValue = useMemo(() => {
        if (!selectedDate) return undefined;
        const parsed = new Date(selectedDate);
        return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    }, [selectedDate]);

    const handleDateChange = (date: Date | undefined) => {
        if (!date) return;
        setSelectedDate(formatDateForApi(date));
    };

    const handleDownloadExcel = async () => {
        if (!selectedMonth || !selectedYear) return;
        const monthYear = `${selectedYear}-${selectedMonth}`;
        try {
            setDownloading(true);
            const blob = await DownloadAttendanceExcel(monthYear);
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `attendance_${monthYear}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            setExcelModalOpen(false);
        } catch (err: any) {
            setExcelModalOpen(false);
            console.error(err.response.data.message);
            setError(
                err?.response?.data?.message ||
                    "Не удалось загрузить Excel файл"
            );
        } finally {
            setDownloading(false);
        }
    };

    // Reset to page 1 when date changes, but before fetching
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedDate]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await GetDailyAttendance(
                    selectedDate,
                    currentPage
                );
                setAttendanceData(data);
                setLoading(false);
            } catch (err: any) {
                setError(
                    err?.response?.data?.message ||
                        "Не удалось загрузить данные посещаемости"
                );
                setLoading(false);
                console.error("Error fetching attendance data:", err);
            }
        };

        // Small delay to avoid double requests when date changes
        const timeoutId = setTimeout(() => {
            fetchData();
        }, 100);

        return () => clearTimeout(timeoutId);
    }, [selectedDate, currentPage]);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === "Escape" && modalImage) {
                setModalImage(null);
            }
        };

        if (modalImage) {
            document.addEventListener("keydown", handleEscape);
            document.body.style.overflow = "hidden";
        }

        return () => {
            document.removeEventListener("keydown", handleEscape);
            document.body.style.overflow = "unset";
        };
    }, [modalImage]);

    const summary = useMemo(() => {
        if (!attendanceData) return [];
        const total = attendanceData.total_employees ?? 0;
        const stats = attendanceData.statistics ?? {
            on_time: 0,
            late: 0,
            absent: 0,
            day_off: 0,
            present: 0,
        };

        const pct = (n: number) =>
            total > 0 ? `${Math.round((n / total) * 100)}%` : "0%";

        return [
            {
                label: "Все сотрудники",
                value: total,
                icon: FiUsers,
                helper: `Всего ${total}`,
                accent: "from-mainbg/20 via-mainbg/10 to-white text-maintx",
            },
            {
                label: "Пришли вовремя",
                value: stats.on_time ?? 0,
                icon: FiUserCheck,
                helper: pct(stats.on_time ?? 0),
                accent: "from-green-100 via-white to-white text-green-600",
            },
            {
                label: "Опоздавшие",
                value: stats.late ?? 0,
                icon: FiClock,
                helper: pct(stats.late ?? 0),
                accent: "from-amber-100 via-white to-white text-amber-600",
            },
            {
                label: "Не пришли",
                value: stats.absent ?? 0,
                icon: FiUserX,
                helper: pct(stats.absent ?? 0),
                accent: "from-rose-100 via-white to-white text-rose-600",
            },
            {
                label: "На выходном",
                value: stats.day_off ?? 0,
                icon: MdOutlineEventAvailable,
                helper: pct(stats.day_off ?? 0),
                accent: "from-slate-100 via-white to-white text-slate-600",
            },
        ];
    }, [attendanceData]);

    const formattedDate = useMemo(() => {
        if (!attendanceData || !attendanceData.date) return "";
        const parsed = new Date(attendanceData.date);
        if (Number.isNaN(parsed.getTime())) return "";
        try {
            return new Intl.DateTimeFormat("ru-RU", {
                day: "2-digit",
                month: "long",
                year: "numeric",
            }).format(parsed);
        } catch {
            return "";
        }
    }, [attendanceData]);

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
                <button
                    onClick={() => {
                        setSelectedDate(getCurrentDate());
                    }}
                    className="px-4 py-2 bg-maintx text-white rounded-lg hover:bg-maintx/80"
                >
                    Попробовать снова
                </button>
            </div>
        );
    }

    if (!attendanceData) {
        return (
            <div className="h-[80vh] w-full flex justify-center items-center">
                <p className="text-gray-500 text-lg">
                    Нет данных для отображения
                </p>
            </div>
        );
    }

    // Safe local vars
    const statsSafe = attendanceData.statistics ?? {
        on_time: 0,
        late: 0,
        absent: 0,
        day_off: 0,
        present: 0,
    };
    const totalEmployeesSafe = attendanceData.total_employees ?? 0;
    const attendanceListSafe = attendanceData.attendance ?? [];

    return (
        <div className="space-y-6 pb-10">
            <div className="rounded-3xl border border-mainbg/30 bg-gradient-to-br from-white via-blue-50 to-white p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div>
                        <p className="text-sm uppercase tracking-widest text-gray-400">
                            Посещаемость за день
                        </p>
                        <h1 className="text-3xl font-semibold text-gray-900">
                            {formattedDate}
                        </h1>
                        <p className="text-gray-500">
                            Всего сотрудников:{" "}
                            <span className="font-semibold text-maintx">
                                {attendanceData.total_employees ?? 0}
                            </span>
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <div className="flex flex-col gap-1">
                            <span className="text-xs uppercase tracking-wide text-gray-400">
                                Выберите дату
                            </span>
                            <DatePicker
                                date={selectedDateValue}
                                onSelect={handleDateChange}
                                placeholder="Выберите дату"
                                className="min-w-[220px]"
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="w-full flex justify-end">
                <CustomModal
                    trigger={
                        <Button
                            onClick={() => setExcelModalOpen(true)}
                            className="bg-mainbg rounded-xl hover:bg-mainbg/90 text-white"
                        >
                            <FiDownload className="h-4 w-4 mr-2" />
                            Скачать Excel
                        </Button>
                    }
                    open={excelModalOpen}
                    onOpenChange={setExcelModalOpen}
                    title="Скачать Excel отчет"
                    showFooter={false}
                    size="md"
                >
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Выберите год
                                </label>
                                <Select
                                    value={selectedYear.toString()}
                                    onValueChange={(value) =>
                                        setSelectedYear(parseInt(value))
                                    }
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Выберите год" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Array.from({ length: 5 }, (_, i) => {
                                            const year =
                                                new Date().getFullYear() -
                                                1 +
                                                i;
                                            return (
                                                <SelectItem
                                                    key={year}
                                                    value={year.toString()}
                                                >
                                                    {year}
                                                </SelectItem>
                                            );
                                        })}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium text-gray-700">
                                    Выберите месяц
                                </label>
                                <Select
                                    value={selectedMonth}
                                    onValueChange={setSelectedMonth}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue placeholder="Выберите месяц" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {months.map((month) => (
                                            <SelectItem
                                                key={month.value}
                                                value={month.value}
                                            >
                                                {month.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="flex gap-2 justify-end pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setExcelModalOpen(false)}
                                disabled={downloading}
                            >
                                Отмена
                            </Button>
                            <Button
                                onClick={handleDownloadExcel}
                                disabled={
                                    downloading ||
                                    !selectedMonth ||
                                    !selectedYear
                                }
                                className="bg-mainbg hover:bg-mainbg/90 text-white"
                            >
                                <FiDownload className="h-4 w-4 mr-2" />
                                {downloading ? "Загрузка..." : "Скачать"}
                            </Button>
                        </div>
                    </div>
                </CustomModal>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5">
                {summary?.map((stat) => (
                    <div
                        key={stat.label}
                        className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm"
                    >
                        <div
                            className={cn(
                                "rounded-2xl bg-gradient-to-br p-4",
                                stat.accent
                            )}
                        >
                            <stat.icon className="h-6 w-6" />
                        </div>
                        <p className="mt-4 text-sm uppercase tracking-wide text-gray-400">
                            {stat?.label}
                        </p>
                        <div className="mt-2 flex items-end gap-2">
                            <span className="text-3xl font-semibold text-gray-900">
                                {stat?.value}
                            </span>
                            <span className="text-sm text-gray-500">
                                {stat?.helper}
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
                <div className="rounded-3xl border border-mainbg/20 bg-white p-6 shadow-sm lg:col-span-2">
                    <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                Список сотрудников
                            </h2>
                            <p className="text-gray-500">
                                Смена и статус каждого сотрудника
                            </p>
                        </div>
                        <Badge className="bg-mainbg/10 text-maintx hover:bg-mainbg/20 hover:text-maintx">
                            {attendanceListSafe.length} записей
                        </Badge>
                    </div>

                    <div className="mt-6 divide-y divide-gray-100">
                        {attendanceListSafe.length === 0 ? (
                            <div className="py-8 text-center text-gray-500">
                                Нет данных для отображения
                            </div>
                        ) : (
                            attendanceListSafe.map((item) => (
                                <div
                                    key={item?.faceid_user_id ?? Math.random()}
                                    className="flex flex-col gap-3 py-4 sm:flex-row sm:items-center sm:justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="w-14 h-14 rounded-full overflow-hidden border-2 border-mainbg flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
                                            onClick={() => {
                                                const imageSrc =
                                                    item?.image_path ||
                                                    "/avatar-1.webp";
                                                setModalImage(imageSrc);
                                            }}
                                        >
                                            <img
                                                src={
                                                    item?.image_path
                                                        ? item.image_path
                                                        : "/avatar-1.webp"
                                                }
                                                alt={item?.name ?? "Сотрудник"}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    const target =
                                                        e.target as HTMLImageElement;
                                                    target.src =
                                                        "/avatar-1.webp";
                                                }}
                                            />
                                        </div>
                                        <div>
                                            <Link
                                                to={`/users/report/${item?.faceid_user_id}`}
                                                className="text-base font-semibold text-gray-900 hover:underline cursor-pointer transition-all duration-200"
                                            >
                                                {item?.name ?? "—"}
                                            </Link>
                                            <div className="relative group w-[200px]">
                                                <p className="text-sm text-gray-500 line-clamp-1">
                                                    {item?.position ?? "—"}
                                                </p>
                                                <span className="hidden group-hover:block absolute left-0 top-full z-10 mt-1 w-max max-w-xs rounded-md bg-gray-900 px-3 py-1 text-xs text-white shadow-lg">
                                                    {item?.position ?? "—"}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-700 font-semibold">
                                                {item?.shift_name ?? "—"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex flex-wrap items-center gap-10">
                                        <div className="flex flex-col text-sm text-gray-500 w-48">
                                            <span className="text-green-500">
                                                Вход:{" "}
                                                <span className="font-medium">
                                                    {item?.check_in_time ??
                                                        "Вход отсутствует"}
                                                </span>
                                            </span>
                                            <span className="text-blue-500">
                                                Выход:{" "}
                                                <span className="font-medium">
                                                    {item?.check_out_time ??
                                                        "Выход отсутствует"}
                                                </span>
                                            </span>
                                            {(item?.late_minutes ?? 0) > 0 && (
                                                <span className="text-sm font-semibold text-red-500">
                                                    Опоздание:{" "}
                                                    {item?.late_minutes_text ??
                                                        `${
                                                            item?.late_minutes ??
                                                            0
                                                        } мин`}
                                                </span>
                                            )}
                                        </div>
                                        {(() => {
                                            const status =
                                                (item?.status as AttendanceItem["status"]) ??
                                                "absent";
                                            const statusStyle =
                                                statusStyles[status] ??
                                                statusStyles["absent"];
                                            return (
                                                <Badge
                                                    className={cn(
                                                        "border text-xs font-medium w-32 flex justify-center",
                                                        statusStyle.badge
                                                    )}
                                                >
                                                    {statusStyle.text}
                                                </Badge>
                                            );
                                        })()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                    {attendanceData?.pagination &&
                        attendanceData.pagination.total_pages > 1 && (
                            <div className="mt-6 pt-4 border-t border-gray-200">
                                <CustomPagination
                                    currentPage={
                                        attendanceData.pagination.current_page
                                    }
                                    totalPages={
                                        attendanceData.pagination.total_pages
                                    }
                                    onPageChange={(page) =>
                                        setCurrentPage(page)
                                    }
                                />
                            </div>
                        )}
                </div>

                <div className="space-y-4">
                    <div className="rounded-3xl border border-mainbg/20 bg-white p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900">
                            По статусам
                        </h3>
                        <div className="mt-4 space-y-4">
                            {Object.entries(statsSafe).map(([key, value]) => {
                                const typedKey = key as keyof typeof statsSafe;
                                const percentage =
                                    totalEmployeesSafe > 0
                                        ? Math.round(
                                              (Number(value) /
                                                  totalEmployeesSafe) *
                                                  100
                                          )
                                        : 0;
                                return (
                                    <div key={key}>
                                        <div className="flex items-center justify-between text-sm text-gray-500">
                                            <span>{statLabels[typedKey]}</span>
                                            <span>{percentage}%</span>
                                        </div>
                                        <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full transition-all",
                                                    key === "late"
                                                        ? "bg-amber-400"
                                                        : key === "absent"
                                                        ? "bg-red-400"
                                                        : "bg-maintx"
                                                )}
                                                style={{
                                                    width: `${percentage}%`,
                                                }}
                                            />
                                        </div>
                                        <p className="mt-1 text-sm text-gray-500">
                                            {value} сотрудников
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    <div className="rounded-3xl border border-mainbg/20 bg-gradient-to-br from-mainbg/10 via-white to-white p-6 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900">
                            Группа риска
                        </h3>
                        <p className="text-sm text-gray-500">
                            Самые частые опоздания или отсутствие
                        </p>
                        {/* Placeholder content preserved */}
                        <div className="h-20 w-full flex justify-center items-center">
                            <h1>Скоро...</h1>
                        </div>
                    </div>
                </div>
            </div>

            {modalImage && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center top-0 bg-black/80 backdrop-blur-sm"
                    onClick={() => setModalImage(null)}
                    onKeyDown={(e) => {
                        if (e.key === "Escape") {
                            setModalImage(null);
                        }
                    }}
                    tabIndex={0}
                >
                    <div className="relative max-w-[500px] max-h-[500px] p-4">
                        <img
                            src={modalImage}
                            alt="Увеличенное изображение"
                            className="w-[500px] h-[500px] object-cover rounded-full shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
