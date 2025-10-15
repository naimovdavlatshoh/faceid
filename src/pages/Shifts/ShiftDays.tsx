import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import CustomBreadcrumb from "@/components/ui/custom-breadcrumb";
import { ProgressAuto } from "@/components/ui/progress";
import { toast } from "sonner";
import { GetDataSimple, PostDataTokenJson } from "@/services/data";
// import { PostDataTokenJson } from "@/services/data";

// Day names in Russian
const DAY_NAMES = [
    "Понедельник",
    "Вторник",
    "Среда",
    "Четверг",
    "Пятница",
    "Суббота",
    "Воскресенье",
];

interface DaySchedule {
    day_of_week: number;
    start_time: string;
    end_time: string;
    is_day_off: number;
}

interface ShiftTime {
    shift_time_id: number;
    day_of_week: number;
    day_of_week_name: string;
    start_time: string;
    end_time: string;
    is_day_off: number;
    is_day_off_name: string;
}

interface Shift {
    shift_id: number;
    shift_name: string;
    overtime_after_minutes: number;
    late_tolerance_minutes: number;
    is_active: number;
    created_at: string;
    updated_at: string;
    shift_times: ShiftTime[];
}

interface ShiftDaysData {
    shift_id: number;
    items: DaySchedule[];
}

interface ShiftsResponse {
    page: number;
    limit: number;
    count: number;
    pages: number;
    result: Shift[];
}

const ShiftDays = () => {
    const { id, name } = useParams<{ id: string; name: string }>();
    const shiftId = id ? parseInt(id) : 1;
    const shiftName = name || "Смена";

    const [days, setDays] = useState<DaySchedule[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [hasShiftTimes, setHasShiftTimes] = useState(false);
    // @ts-ignore
    const [updatingIndex, setUpdatingIndex] = useState<number | null>(null);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editIndex, setEditIndex] = useState<number | null>(null);
    const [editStart, setEditStart] = useState<string>("00:00");
    const [editEnd, setEditEnd] = useState<string>("00:00");

    // Initialize days with default values (all set to 00:00 as day off)
    const initializeDefaultDays = () => {
        const initialDays: DaySchedule[] = DAY_NAMES.map((_, index) => ({
            day_of_week: index + 1,
            start_time: "00:00",
            end_time: "00:00",
            is_day_off: 1,
        }));
        setDays(initialDays);
    };

    const fetchShiftSchedule = async () => {
        try {
            setLoading(true);
            const data: ShiftsResponse = await GetDataSimple(
                `api/shift/list?page=1&limit=100&object_id=1`
            );

            // Find the specific shift by ID
            const selectedShift = data.result.find(
                (shift) => shift.shift_id == shiftId
            );

            if (
                selectedShift &&
                selectedShift.shift_times &&
                selectedShift.shift_times.length > 0
            ) {
                setHasShiftTimes(true);
                const scheduleDays: DaySchedule[] = DAY_NAMES.map(
                    (_, index) => {
                        const dayNumber = index + 1;
                        const shiftTime = selectedShift.shift_times.find(
                            (st) => st.day_of_week == dayNumber
                        );

                        if (shiftTime) {
                            return {
                                day_of_week: dayNumber,
                                start_time: shiftTime.start_time.substring(
                                    0,
                                    5
                                ),
                                end_time: shiftTime.end_time.substring(0, 5),
                                is_day_off: shiftTime.is_day_off,
                            };
                        } else {
                            return {
                                day_of_week: dayNumber,
                                start_time: "00:00",
                                end_time: "00:00",
                                is_day_off: 1,
                            };
                        }
                    }
                );
                setDays(scheduleDays);
            } else {
                setHasShiftTimes(false);
                initializeDefaultDays();
            }
        } catch (error) {
            console.error("Error fetching shift schedule:", error);
            toast.error("Ошибка загрузки расписания смены");
            initializeDefaultDays();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShiftSchedule();
    }, [shiftId]);

    const handleDayOffToggle = (dayIndex: number, isDayOff: boolean) => {
        setDays((prevDays) =>
            prevDays.map((day, index) =>
                index === dayIndex
                    ? {
                          ...day,
                          is_day_off: isDayOff ? 1 : 0,
                          start_time: isDayOff ? "00:00" : "09:00",
                          end_time: isDayOff ? "00:00" : "18:00",
                      }
                    : day
            )
        );
    };

    const isDayOff = (dayIndex: number) => {
        const day = days[dayIndex];
        return day && day.is_day_off === 1;
    };

    const isDayEnabled = (dayIndex: number) => {
        const day = days[dayIndex];
        return day && day.is_day_off === 0;
    };

    const handleTimeChange = (
        dayIndex: number,
        field: "start_time" | "end_time",
        value: string
    ) => {
        setDays((prevDays) =>
            prevDays.map((day, index) =>
                index === dayIndex ? { ...day, [field]: value } : day
            )
        );
    };

    const handleUpdateDay = async (dayIndex: number) => {
        try {
            setUpdatingIndex(dayIndex);
            const day = days[dayIndex];
            if (!day) return;

            if (
                day.is_day_off === 0 &&
                (day.start_time === "00:00" || day.end_time === "00:00")
            ) {
                toast.error("Пожалуйста, укажите время для рабочего дня");
                return;
            }

            const payload = {
                shift_id: shiftId,
                id: day.day_of_week, // day id
                start_time: day.start_time,
                end_time: day.end_time,
                is_day_off: day.is_day_off,
            };

            await PostDataTokenJson(`api/shifttime/update/${shiftId}`, payload);
            toast.success("День успешно обновлен");
        } catch (error: any) {
            console.error(error.response?.data?.error);
            toast.error("Ошибка обновления дня");
        } finally {
            setUpdatingIndex(null);
        }
    };

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);

            const workingDays = days.filter((day) => day.is_day_off === 0);
            const invalidDays = workingDays.filter(
                (day) => day.start_time === "00:00" || day.end_time === "00:00"
            );

            if (invalidDays.length > 0) {
                const invalidDayNames = invalidDays
                    .map((day) => DAY_NAMES[day.day_of_week - 1])
                    .join(", ");

                toast.error(
                    `Пожалуйста, укажите время для всех рабочих дней: ${invalidDayNames}`
                );
                return;
            }
            const data: ShiftDaysData = {
                shift_id: shiftId,
                items: days,
            };

            await PostDataTokenJson(`api/shifttime/create`, data);

            console.log("Submitting data:", data);
            toast.success("Расписание смен успешно сохранено!");
        } catch (error: any) {
            console.error(error.response?.data?.error);
            toast.error("Ошибка сохранения расписания");
        } finally {
            setIsSubmitting(false);
        }
    };

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

    return (
        <div className="space-y-6">
            <div className="space-y-4 mb-10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                            Расписание: {shiftName}
                        </h1>
                    </div>
                </div>
                <CustomBreadcrumb
                    items={[
                        { label: "Панель управления", href: "/" },
                        { label: "Смены", href: "/shifts" },
                        { label: `Расписание: ${shiftName}`, isActive: true },
                    ]}
                />
            </div>

            <Card>
                <CardContent className="space-y-3 p-0 pb-10">
                    {DAY_NAMES.map((dayName, index) => (
                        <div
                            key={index}
                            className={`p-4 rounded-3xl border transition-all duration-200 ${
                                isDayOff(index)
                                    ? "border-red-200 bg-red-50 dark:bg-red-900/10"
                                    : isDayEnabled(index)
                                    ? "border-maintx bg-mainbg/10 dark:bg-green-900/10"
                                    : "border-gray-200 bg-gray-50 dark:bg-gray-700"
                            }`}
                        >
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <Label
                                        className={`font-medium ${
                                            isDayOff(index)
                                                ? "text-gray-400 dark:text-gray-500"
                                                : "text-gray-900 dark:text-white"
                                        }`}
                                    >
                                        {dayName}
                                    </Label>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <Label
                                            htmlFor={`day-off-${index}`}
                                            className="text-sm text-gray-600 dark:text-gray-400"
                                        >
                                            Выходной
                                        </Label>
                                        <Switch
                                            id={`day-off-${index}`}
                                            checked={isDayOff(index)}
                                            onCheckedChange={(checked) =>
                                                handleDayOffToggle(
                                                    index,
                                                    checked
                                                )
                                            }
                                        />
                                    </div>
                                    {hasShiftTimes && !isDayOff(index) && (
                                        <Button
                                            variant="outline"
                                            className="rounded-xl"
                                            onClick={() => {
                                                setEditIndex(index);
                                                setEditStart(
                                                    days[index]?.start_time ||
                                                        "00:00"
                                                );
                                                setEditEnd(
                                                    days[index]?.end_time ||
                                                        "00:00"
                                                );
                                                setEditModalOpen(true);
                                            }}
                                        >
                                            Изменить
                                        </Button>
                                    )}
                                </div>
                            </div>

                            {!hasShiftTimes && !isDayOff(index) && (
                                <div className="mt-3 flex items-center space-x-4">
                                    <div className="flex items-center space-x-2">
                                        <Label
                                            htmlFor={`start-${index}`}
                                            className="text-sm text-gray-600 dark:text-gray-400"
                                        >
                                            Начало:
                                        </Label>

                                        <Input
                                            type="time"
                                            id={`start-${index}`}
                                            value={
                                                days[index]?.start_time ||
                                                "00:00"
                                            }
                                            onChange={(e) =>
                                                handleTimeChange(
                                                    index,
                                                    "start_time",
                                                    e.target.value
                                                )
                                            }
                                            disabled={!isDayEnabled(index)}
                                            className="w-32 h-10 px-3 py-2 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                                        />
                                    </div>

                                    <div className="flex items-center space-x-2">
                                        <Label
                                            htmlFor={`end-${index}`}
                                            className="text-sm text-gray-600 dark:text-gray-400"
                                        >
                                            Конец:
                                        </Label>

                                        <Input
                                            type="time"
                                            id={`end-${index}`}
                                            value={
                                                days[index]?.end_time || "00:00"
                                            }
                                            onChange={(e) =>
                                                handleTimeChange(
                                                    index,
                                                    "end_time",
                                                    e.target.value
                                                )
                                            }
                                            disabled={!isDayEnabled(index)}
                                            className="w-32 h-10 px-3 py-2 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                                        />
                                    </div>
                                </div>
                            )}

                            {hasShiftTimes && !isDayOff(index) && (
                                <div className="mt-3 inline-flex items-center gap-3 rounded-2xl  px-3 py-2  bg-maintx/60">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-white">
                                            Начало
                                        </span>
                                        <span className="rounded-xl bg-white dark:bg-gray-900 px-3 py-1 font-mono text-sm text-gray-900 dark:text-gray-100 ">
                                            {days[index]?.start_time || "--:--"}
                                        </span>
                                    </div>
                                    <span className="h-5 w-px text-white" />
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-white">
                                            Конец
                                        </span>
                                        <span className="rounded-xl bg-white dark:bg-gray-900 px-3 py-1 font-mono text-sm text-gray-900 dark:text-gray-100 ">
                                            {days[index]?.end_time || "--:--"}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {isDayOff(index) && (
                                <div className="mt-3 text-sm text-red-600 dark:text-red-400">
                                    Выходной день
                                </div>
                            )}
                        </div>
                    ))}

                    {!hasShiftTimes && (
                        <div className="flex justify-end ">
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="bg-maintx hover:bg-maintx/80 rounded-xl  text-white px-6 py-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Сохранение...
                                    </>
                                ) : (
                                    "Создать"
                                )}
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>
            <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editIndex !== null
                                ? DAY_NAMES[editIndex]
                                : "Изменить"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2">
                                <Label className="text-sm text-gray-600 dark:text-gray-400">
                                    Начало:
                                </Label>
                                <Input
                                    type="time"
                                    value={editStart}
                                    onChange={(e) =>
                                        setEditStart(e.target.value)
                                    }
                                    className="w-40 h-10 px-3 py-2 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <Label className="text-sm text-gray-600 dark:text-gray-400">
                                    Конец:
                                </Label>
                                <Input
                                    type="time"
                                    value={editEnd}
                                    onChange={(e) => setEditEnd(e.target.value)}
                                    className="w-40 h-10 px-3 py-2 border border-gray-300 rounded-xl bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            className="bg-maintx hover:bg-maintx/80 rounded-xl text-white px-6"
                            onClick={async () => {
                                if (editIndex === null) return;
                                const updated = [...days];
                                updated[editIndex] = {
                                    ...updated[editIndex],
                                    start_time: editStart,
                                    end_time: editEnd,
                                };
                                setDays(updated);
                                await handleUpdateDay(editIndex);
                                setEditModalOpen(false);
                            }}
                        >
                            Сохранить
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default ShiftDays;
