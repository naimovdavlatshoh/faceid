import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useMemo, useState, useEffect } from "react";
import { FiClock, FiUserCheck, FiUsers, FiUserX } from "react-icons/fi";
import { MdOutlineEventAvailable } from "react-icons/md";
import { GetDailyAttendance } from "@/services/data";
import { ProgressAuto } from "@/components/ui/progress";
import { DatePicker } from "@/components/ui/date-picker";

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
};

type AttendanceItem = AttendanceData["attendance"][number];

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

    const selectedDateValue = useMemo(() => {
        if (!selectedDate) return undefined;
        const parsed = new Date(selectedDate);
        return Number.isNaN(parsed.getTime()) ? undefined : parsed;
    }, [selectedDate]);

    const handleDateChange = (date: Date | undefined) => {
        if (!date) return;
        setSelectedDate(formatDateForApi(date));
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);
                const data = await GetDailyAttendance(selectedDate);
                setAttendanceData(data);
            } catch (err: any) {
                setError(
                    err?.response?.data?.message ||
                        "Не удалось загрузить данные посещаемости"
                );
                console.error("Error fetching attendance data:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedDate]);

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
                <div className="w-[400px]">
                    <ProgressAuto
                        durationMs={500}
                        startDelayMs={10}
                        className="h-1 rounded-full"
                    />
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
                        {attendanceListSafe.map((item) => (
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
                                                target.src = "/avatar-1.webp";
                                            }}
                                        />
                                    </div>
                                    <div>
                                        <p className="text-base font-semibold text-gray-900">
                                            {item?.name ?? "—"}
                                        </p>
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
                                                        item?.late_minutes ?? 0
                                                    } мин`}
                                            </span>
                                        )}
                                    </div>
                                    <Badge
                                        className={cn(
                                            "border text-xs font-medium w-32 flex justify-center",
                                            // fallback to 'absent' style if status missing
                                            statusStyles[
                                                (item?.status as AttendanceItem["status"]) ??
                                                    "absent"
                                            ].badge
                                        )}
                                    >
                                        {
                                            statusStyles[
                                                (item?.status as AttendanceItem["status"]) ??
                                                    "absent"
                                            ].text
                                        }
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
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
