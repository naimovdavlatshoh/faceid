import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CustomBreadcrumb from "@/components/ui/custom-breadcrumb";
import { PostDataTokenJson } from "@/services/data";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";

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
}

const CreateShift = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({
        objectId: "",
        shiftName: "",
        lateToleranceMinutes: "0",
        overtimeAfterMinutes: "0",
        shiftType: "1", // 0 - гибридный, 1 - стандарт
        startTime: "",
        endTime: "",
    });
    const navigate = useNavigate();

    const [daySchedules, setDaySchedules] = useState<DaySchedule[]>(
        Array.from({ length: 7 }, (_, i) => ({
            day_of_week: i + 1,
            start_time: "",
            end_time: "",
        }))
    );

    const handleChange = (field: string, value: string) => {
        setForm((prev) => ({ ...prev, [field]: value }));
    };

    // ✅ avtomatik formatlash: 2ta raqam yozilganda darhol ":" qo'shish
    const handleTimeChange = (field: string, value: string) => {
        // Oldingi qiymatni olish
        const previousValue = form[field as keyof typeof form] as string;

        // Faqat raqamlarni qabul qilish
        const numbersOnly = value.replace(/[^0-9]/g, "");

        let formattedValue = "";

        if (numbersOnly.length === 0) {
            formattedValue = "";
        } else if (numbersOnly.length === 1) {
            // 1ta raqam: faqat raqam
            formattedValue = numbersOnly;
        } else if (numbersOnly.length === 2) {
            // Agar foydalanuvchi o'chirgan bo'lsa (value uzunligi kamaygan) va value oxirida ":" bo'lsa
            if (
                previousValue &&
                previousValue.length > value.length &&
                value.endsWith(":")
            ) {
                // Foydalanuvchi ":" dan keyin backspace bosgan, faqat raqamlarni qoldiramiz
                formattedValue = numbersOnly;
            } else {
                // Yozilayotgan vaqt, ":" qo'shamiz
                formattedValue = numbersOnly + ":";
            }
        } else if (numbersOnly.length <= 4) {
            // 3-4ta raqam: 2ta raqam, keyin ":", keyin qolgan raqamlar
            formattedValue =
                numbersOnly.slice(0, 2) + ":" + numbersOnly.slice(2);
        } else {
            // 5+ raqam: 2ta raqam, ":", keyin 2ta raqam (maxLength=5 uchun)
            formattedValue =
                numbersOnly.slice(0, 2) + ":" + numbersOnly.slice(2, 4);
        }

        setForm((prev) => ({ ...prev, [field]: formattedValue }));
    };

    const handleDayScheduleChange = (
        dayIndex: number,
        field: "start_time" | "end_time",
        value: string
    ) => {
        // Oldingi qiymatni olish
        const previousValue = daySchedules[dayIndex]?.[field] || "";

        // Faqat raqamlarni qabul qilish
        const numbersOnly = value.replace(/[^0-9]/g, "");

        let formattedValue = "";

        if (numbersOnly.length === 0) {
            formattedValue = "";
        } else if (numbersOnly.length === 1) {
            // 1ta raqam: faqat raqam
            formattedValue = numbersOnly;
        } else if (numbersOnly.length === 2) {
            // Agar foydalanuvchi o'chirgan bo'lsa (value uzunligi kamaygan) va value oxirida ":" bo'lsa
            if (
                previousValue &&
                previousValue.length > value.length &&
                value.endsWith(":")
            ) {
                // Foydalanuvchi ":" dan keyin backspace bosgan, faqat raqamlarni qoldiramiz
                formattedValue = numbersOnly;
            } else {
                // Yozilayotgan vaqt, ":" qo'shamiz
                formattedValue = numbersOnly + ":";
            }
        } else if (numbersOnly.length <= 4) {
            // 3-4ta raqam: 2ta raqam, keyin ":", keyin qolgan raqamlar
            formattedValue =
                numbersOnly.slice(0, 2) + ":" + numbersOnly.slice(2);
        } else {
            // 5+ raqam: 2ta raqam, ":", keyin 2ta raqam (maxLength=5 uchun)
            formattedValue =
                numbersOnly.slice(0, 2) + ":" + numbersOnly.slice(2, 4);
        }

        setDaySchedules((prev) =>
            prev.map((day, index) =>
                index === dayIndex ? { ...day, [field]: formattedValue } : day
            )
        );
    };

    // ✅ blurda (inputdan chiqganda) validatsiya qilish
    const validateTime = (value: string) => {
        if (!value) return false;
        return /^([01]?\d|2[0-3]):([0-5]\d)$/.test(value);
    };

    const handleBlurTime = (field: string, value: string) => {
        if (value && !validateTime(value)) {
            toast.error(
                "Неверный формат времени (используйте 24 часа, например 18:45)"
            );
            setForm((prev) => ({ ...prev, [field]: "" }));
        }
    };

    const handleBlurDayTime = (
        dayIndex: number,
        field: "start_time" | "end_time",
        value: string
    ) => {
        if (value && !validateTime(value)) {
            toast.error("Неверный формат времени (например 09:30)");
            setDaySchedules((prev) =>
                prev.map((day, index) =>
                    index === dayIndex ? { ...day, [field]: "" } : day
                )
            );
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.shiftName.trim()) {
            toast.error("Пожалуйста, заполните обязательные поля");
            return;
        }

        try {
            setIsSubmitting(true);

            let items: Array<{
                day_of_week: number;
                start_time: string;
                end_time: string;
            }>;
            const shiftTypeNum = parseInt(form.shiftType);

            if (shiftTypeNum === 0) {
                items = daySchedules;
            } else {
                items = [
                    {
                        day_of_week: 0,
                        start_time: form.startTime,
                        end_time: form.endTime,
                    },
                ];
            }

            const payload = {
                object_id: parseInt(localStorage.getItem("object") || "1"),
                shift_name: form.shiftName.trim(),
                late_tolerance_minutes:
                    parseInt(form.lateToleranceMinutes) || 0,
                overtime_after_minutes:
                    parseInt(form.overtimeAfterMinutes) || 0,
                shift_type: shiftTypeNum,
                items,
            };

            await PostDataTokenJson("api/shift/create", payload);
            toast.success("Смена успешно создана");
            navigate("/shifts");

            setForm({
                objectId: "",
                shiftName: "",
                lateToleranceMinutes: "0",
                overtimeAfterMinutes: "0",
                shiftType: "1",
                startTime: "",
                endTime: "",
            });

            setDaySchedules(
                Array.from({ length: 7 }, (_, i) => ({
                    day_of_week: i + 1,
                    start_time: "",
                    end_time: "",
                }))
            );
        } catch (error: any) {
            toast.error(error?.response?.data?.error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="space-y-4 mb-2">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Создать смену
                    </h1>
                </div>
                <CustomBreadcrumb
                    items={[
                        { label: "Панель управления", href: "/" },
                        { label: "Смены", href: "/shifts" },
                        { label: "Создать", isActive: true },
                    ]}
                />
            </div>

            <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                <CardHeader>
                    <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                        Данные смены
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Asosiy forma */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <Label>Название смены *</Label>
                                    <Input
                                        placeholder="Например: Стандарт смена"
                                        value={form.shiftName}
                                        onChange={(e) =>
                                            handleChange(
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
                                            handleChange(
                                                "overtimeAfterMinutes",
                                                e.target.value
                                            )
                                        }
                                        onFocus={(e) => {
                                            // Focus bo'lganda agar value "0" bo'lsa, bo'sh qilish
                                            if (e.target.value === "0") {
                                                handleChange(
                                                    "overtimeAfterMinutes",
                                                    ""
                                                );
                                            }
                                        }}
                                        onBlur={(e) => {
                                            // Blur bo'lganda agar bo'sh bo'lsa, "0" ga qaytarish
                                            if (
                                                !e.target.value ||
                                                e.target.value === ""
                                            ) {
                                                handleChange(
                                                    "overtimeAfterMinutes",
                                                    "0"
                                                );
                                            }
                                        }}
                                        className="h-12 rounded-xl"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label>Тип смены</Label>
                                    <div className="flex gap-3">
                                        <Button
                                            type="button"
                                            variant={
                                                form.shiftType === "1"
                                                    ? "default"
                                                    : "outline"
                                            }
                                            className="rounded-xl"
                                            onClick={() =>
                                                handleChange("shiftType", "1")
                                            }
                                        >
                                            Стандарт
                                        </Button>
                                        <Button
                                            type="button"
                                            variant={
                                                form.shiftType === "0"
                                                    ? "default"
                                                    : "outline"
                                            }
                                            className="rounded-xl"
                                            onClick={() =>
                                                handleChange("shiftType", "0")
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
                                            handleChange(
                                                "lateToleranceMinutes",
                                                e.target.value
                                            )
                                        }
                                        onFocus={(e) => {
                                            // Focus bo'lganda agar value "0" bo'lsa, bo'sh qilish
                                            if (e.target.value === "0") {
                                                handleChange(
                                                    "lateToleranceMinutes",
                                                    ""
                                                );
                                            }
                                        }}
                                        onBlur={(e) => {
                                            // Blur bo'lganda agar bo'sh bo'lsa, "0" ga qaytarish
                                            if (
                                                !e.target.value ||
                                                e.target.value === ""
                                            ) {
                                                handleChange(
                                                    "lateToleranceMinutes",
                                                    "0"
                                                );
                                            }
                                        }}
                                        className="h-12 rounded-xl"
                                    />
                                </div>

                                {form.shiftType === "1" && (
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Начало</Label>
                                            <Input
                                                type="text"
                                                placeholder="00:00"
                                                value={form.startTime}
                                                onChange={(e) =>
                                                    handleTimeChange(
                                                        "startTime",
                                                        e.target.value
                                                    )
                                                }
                                                onBlur={(e) =>
                                                    handleBlurTime(
                                                        "startTime",
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
                                                value={form.endTime}
                                                onChange={(e) =>
                                                    handleTimeChange(
                                                        "endTime",
                                                        e.target.value
                                                    )
                                                }
                                                onBlur={(e) =>
                                                    handleBlurTime(
                                                        "endTime",
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

                        {/* Гибридный смена uchun kunlik */}
                        {form.shiftType === "0" && (
                            <div className="space-y-4 pt-4 border-t">
                                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                    Расписание по дням недели
                                </h3>
                                <div className="space-y-3">
                                    {daySchedules.map((day, index) => (
                                        <div
                                            key={index}
                                            className="p-4 rounded-xl border bg-gray-50 dark:bg-gray-800/50"
                                        >
                                            <Label>{DAY_NAMES[index]}</Label>
                                            <div className="grid grid-cols-2 gap-4 mt-2">
                                                <Input
                                                    type="text"
                                                    placeholder="00:00"
                                                    value={day.start_time}
                                                    onChange={(e) =>
                                                        handleDayScheduleChange(
                                                            index,
                                                            "start_time",
                                                            e.target.value
                                                        )
                                                    }
                                                    onBlur={(e) =>
                                                        handleBlurDayTime(
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
                                                    value={day.end_time}
                                                    onChange={(e) =>
                                                        handleDayScheduleChange(
                                                            index,
                                                            "end_time",
                                                            e.target.value
                                                        )
                                                    }
                                                    onBlur={(e) =>
                                                        handleBlurDayTime(
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

                        <div className="flex justify-end items-center gap-3">
                            <Link to="/users">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="px-6 py-2 h-12 rounded-xl border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                >
                                    Назад
                                </Button>
                            </Link>
                            <Button
                                type="submit"
                                disabled={isSubmitting}
                                className="bg-maintx hover:bg-maintx/80 rounded-xl text-white px-6 py-2 h-12"
                            >
                                {isSubmitting ? "Создание..." : "Создать смену"}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default CreateShift;
