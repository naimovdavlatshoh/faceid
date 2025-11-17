import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

// interface ShiftDaysData {
//     shift_id: number;
//     items: DaySchedule[];
// }

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
    // const [hasShiftTimes, setHasShiftTimes] = useState(false);
    // const [shiftType, setShiftType] = useState<0 | 1>(0); // kept for potential logic branching
    const [standardStart, setStandardStart] = useState<string>("00:00");
    const [standardEnd, setStandardEnd] = useState<string>("00:00");
    const navigate = useNavigate();

    const [form, setForm] = useState({
        shiftName: "",
        lateToleranceMinutes: "0",
        overtimeAfterMinutes: "0",
        shiftTypeStr: "0",
    });

    const handleFormChange = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    // Initialize days with default values (all set to 00:00 as day off)
    const initializeDefaultDays = () => {
        const initialDays: DaySchedule[] = DAY_NAMES.map((_, index) => ({
            day_of_week: index + 1,
            start_time: "00:00",
            end_time: "00:00",
            is_day_off: 0,
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
                // setHasShiftTimes(true);
                // Detect standard vs hybrid by presence of day_of_week === 0
                const std = selectedShift.shift_times.find(
                    (st) => st.day_of_week === 0
                );
                if (std) {
                    setStandardStart(std.start_time.substring(0, 5));
                    setStandardEnd(std.end_time.substring(0, 5));
                } else {
                }
                // Prefill meta form
                setForm({
                    shiftName: selectedShift.shift_name || shiftName,
                    lateToleranceMinutes: String(
                        selectedShift.late_tolerance_minutes ?? 0
                    ),
                    overtimeAfterMinutes: String(
                        selectedShift.overtime_after_minutes ?? 0
                    ),
                    shiftTypeStr: std ? "1" : "0",
                });
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
                // setHasShiftTimes(false);
                initializeDefaultDays();
                setForm({
                    shiftName: shiftName,
                    lateToleranceMinutes: "0",
                    overtimeAfterMinutes: "0",
                    shiftTypeStr: "0",
                });
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

    // === Time formatting & validation (like CreateShift) ===
    const validateTime = (value: string) => {
        if (!value) return false;
        return /^([01]?\d|2[0-3]):([0-5]\d)$/.test(value);
    };

    const formatNumbersToTime = (previousValue: string, value: string) => {
        const numbersOnly = value.replace(/[^0-9]/g, "");
        let formattedValue = "";
        if (numbersOnly.length === 0) {
            formattedValue = "";
        } else if (numbersOnly.length === 1) {
            formattedValue = numbersOnly;
        } else if (numbersOnly.length === 2) {
            if (
                previousValue &&
                previousValue.length > value.length &&
                value.endsWith(":")
            ) {
                formattedValue = numbersOnly;
            } else {
                formattedValue = numbersOnly + ":";
            }
        } else if (numbersOnly.length <= 4) {
            formattedValue =
                numbersOnly.slice(0, 2) + ":" + numbersOnly.slice(2);
        } else {
            formattedValue =
                numbersOnly.slice(0, 2) + ":" + numbersOnly.slice(2, 4);
        }
        return formattedValue;
    };

    const handleStandardFormattedChange = (
        field: "start" | "end",
        value: string
    ) => {
        const prev = field === "start" ? standardStart : standardEnd;
        const formatted = formatNumbersToTime(prev, value);
        if (field === "start") setStandardStart(formatted);
        else setStandardEnd(formatted);
    };

    const handleStandardBlur = (field: "start" | "end", value: string) => {
        if (value && !validateTime(value)) {
            toast.error("Неверный формат времени (например 18:45)");
            if (field === "start") setStandardStart("");
            else setStandardEnd("");
        }
    };

    const handleDayFormattedChange = (
        dayIndex: number,
        field: "start_time" | "end_time",
        value: string
    ) => {
        const previousValue = days[dayIndex]?.[field] || "";
        const formatted = formatNumbersToTime(previousValue, value);
        handleTimeChange(dayIndex, field, formatted);
    };

    const handleDayBlur = (
        dayIndex: number,
        field: "start_time" | "end_time",
        value: string
    ) => {
        if (value && !validateTime(value)) {
            toast.error("Неверный формат времени (например 09:30)");
            handleTimeChange(dayIndex, field, "");
        }
    };

    // Removed per request: day update via modal

    const handleSubmit = async () => {
        try {
            setIsSubmitting(true);
            const shift_type = form.shiftTypeStr === "1" ? 1 : 0;

            // Basic validation
            if (shift_type === 1) {
                if (
                    !validateTime(standardStart) ||
                    !validateTime(standardEnd)
                ) {
                    toast.error(
                        "Заполните корректное время для стандартной смены"
                    );
                    return;
                }
            } else {
                const invalid = days.filter(
                    (d) =>
                        !validateTime(d.start_time) || !validateTime(d.end_time)
                );
                if (invalid.length > 0) {
                    const names = invalid
                        .map((d) => DAY_NAMES[d.day_of_week - 1])
                        .join(", ");
                    toast.error(`Пожалуйста, укажите время: ${names}`);
                    return;
                }
            }

            let items: Array<{
                day_of_week: number;
                start_time: string;
                end_time: string;
            }>;
            if (shift_type === 1) {
                items = [
                    {
                        day_of_week: 0,
                        start_time: standardStart,
                        end_time: standardEnd,
                    },
                ];
            } else {
                items = days.map((d) => ({
                    day_of_week: d.day_of_week,
                    start_time: d.start_time || "00:00",
                    end_time: d.end_time || "00:00",
                }));
            }

            const payload = {
                object_id: localStorage.getItem("object"),
                shift_name: form.shiftName || shiftName,
                late_tolerance_minutes:
                    parseInt(form.lateToleranceMinutes) || 0,
                overtime_after_minutes:
                    parseInt(form.overtimeAfterMinutes) || 0,
                shift_type,
                items,
            };

            await PostDataTokenJson(`api/shift/update/${shiftId}`, payload);
            toast.success("Сохранено");
            navigate("/shifts");
        } catch (error: any) {
            console.error(error?.response?.data?.error || error);
            toast.error(error?.response?.data?.error);
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
        <div className="space-y-6 mb-5">
            <div className="space-y-4 mb-10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl font-semibold text-gray-900 ">
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

            <Card className="bg-white  rounded-2xl shadow-lg border border-gray-100 ">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900 ">
                        Данные смены
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Название смены</Label>
                                <Input
                                    placeholder="Например: Стандарт смена"
                                    value={form.shiftName}
                                    onChange={(e) =>
                                        handleFormChange(
                                            "shiftName",
                                            e.target.value
                                        )
                                    }
                                    className="h-12 rounded-xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Сверхурочные после (минуты)</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={form.overtimeAfterMinutes}
                                    onChange={(e) =>
                                        handleFormChange(
                                            "overtimeAfterMinutes",
                                            e.target.value
                                        )
                                    }
                                    className="h-12 rounded-xl"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Тип смены</Label>
                                <div className="flex gap-3">
                                    <Button
                                        type="button"
                                        variant={
                                            form.shiftTypeStr === "1"
                                                ? "default"
                                                : "outline"
                                        }
                                        className="rounded-xl"
                                        onClick={() =>
                                            handleFormChange(
                                                "shiftTypeStr",
                                                "1"
                                            )
                                        }
                                    >
                                        Стандарт
                                    </Button>
                                    <Button
                                        type="button"
                                        variant={
                                            form.shiftTypeStr === "0"
                                                ? "default"
                                                : "outline"
                                        }
                                        className="rounded-xl"
                                        onClick={() =>
                                            handleFormChange(
                                                "shiftTypeStr",
                                                "0"
                                            )
                                        }
                                    >
                                        Гибридный
                                    </Button>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label>Опоздание (минуты)</Label>
                                <Input
                                    type="number"
                                    placeholder="0"
                                    value={form.lateToleranceMinutes}
                                    onChange={(e) =>
                                        handleFormChange(
                                            "lateToleranceMinutes",
                                            e.target.value
                                        )
                                    }
                                    className="h-12 rounded-xl"
                                />
                            </div>

                            {form.shiftTypeStr === "1" && (
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label>Начало</Label>
                                        <Input
                                            type="text"
                                            placeholder="00:00"
                                            value={standardStart}
                                            onChange={(e) =>
                                                handleStandardFormattedChange(
                                                    "start",
                                                    e.target.value
                                                )
                                            }
                                            onBlur={(e) =>
                                                handleStandardBlur(
                                                    "start",
                                                    e.target.value
                                                )
                                            }
                                            maxLength={5}
                                            className="h-12 rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label>Конец</Label>
                                        <Input
                                            type="text"
                                            placeholder="00:00"
                                            value={standardEnd}
                                            onChange={(e) =>
                                                handleStandardFormattedChange(
                                                    "end",
                                                    e.target.value
                                                )
                                            }
                                            onBlur={(e) =>
                                                handleStandardBlur(
                                                    "end",
                                                    e.target.value
                                                )
                                            }
                                            maxLength={5}
                                            className="h-12 rounded-xl"
                                        />
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {form.shiftTypeStr === "0" && (
                        <div className="space-y-4 pt-4 border-t">
                            <h3 className="text-lg font-semibold text-gray-900 ">
                                Расписание по дням недели
                            </h3>
                            <div className="space-y-3">
                                {DAY_NAMES.map((dayName, index) => (
                                    <div
                                        key={index}
                                        className="p-4 rounded-xl border bg-gray-50 0"
                                    >
                                        <Label>{dayName}</Label>
                                        <div className="grid grid-cols-2 gap-4 mt-2">
                                            <Input
                                                type="text"
                                                placeholder="00:00"
                                                value={
                                                    days[index]?.start_time ||
                                                    ""
                                                }
                                                onChange={(e) =>
                                                    handleDayFormattedChange(
                                                        index,
                                                        "start_time",
                                                        e.target.value
                                                    )
                                                }
                                                onBlur={(e) =>
                                                    handleDayBlur(
                                                        index,
                                                        "start_time",
                                                        e.target.value
                                                    )
                                                }
                                                maxLength={5}
                                            />
                                            <Input
                                                type="text"
                                                placeholder="00:00"
                                                value={
                                                    days[index]?.end_time || ""
                                                }
                                                onChange={(e) =>
                                                    handleDayFormattedChange(
                                                        index,
                                                        "end_time",
                                                        e.target.value
                                                    )
                                                }
                                                onBlur={(e) =>
                                                    handleDayBlur(
                                                        index,
                                                        "end_time",
                                                        e.target.value
                                                    )
                                                }
                                                maxLength={5}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            className="rounded-xl"
                            onClick={() => navigate("/shifts")}
                        >
                            Назад
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="bg-maintx hover:bg-maintx/80 rounded-xl text-white px-6"
                        >
                            {isSubmitting ? "Сохранение..." : "Сохранить"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default ShiftDays;
