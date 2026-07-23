import { useEffect, useState } from "react";
import { CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ProgressAuto } from "@/components/ui/progress";
import { toast } from "sonner";
import { GetDataSimple, PostDataTokenJson } from "@/services/data";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";

// 7 элементов недели (1..7) — подписи берутся из словаря days.full
const DAY_NAMES = ["1", "2", "3", "4", "5", "6", "7"];

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
    shift_type_name?: string;
}

interface Shift {
    shift_id: number;
    shift_name: string;
    overtime_after_minutes: number;
    late_tolerance_minutes: number;
    is_active: number;
    created_at: string;
    updated_at: string;
    shift_type_name?: string;
    shift_times: ShiftTime[];
}

interface ShiftsResponse {
    page: number;
    limit: number;
    count: number;
    pages: number;
    result: Shift[];
}

interface Props {
    isOpen: boolean;
    onClose: () => void;
    shiftId: number | null;
    shiftName?: string;
}

const ShiftDaysModal = ({
    isOpen,
    onClose,
    shiftId,
    shiftName,
}: Props) => {
    const { t } = useTranslation();
    const resolvedShiftName = shiftName || t("nav.shifts");
    const [days, setDays] = useState<DaySchedule[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(false);
    const [hasShiftTimes, setHasShiftTimes] = useState(false);
    const [shiftType, setShiftType] = useState<0 | 1>(0);
    const [shiftTypeName, setShiftTypeName] = useState<string>(t("shifts.standardShift"));
    const [standardStart, setStandardStart] = useState<string>("00:00");
    const [standardEnd, setStandardEnd] = useState<string>("00:00");
    const navigate = useNavigate();

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
        if (!shiftId) return;
        try {
            setLoading(true);
            const data: ShiftsResponse = await GetDataSimple(
                `api/shift/list?page=1&limit=100&object_id=1`
            );

            const selectedShift = data.result.find(
                (shift) => shift.shift_id == shiftId
            );

            if (
                selectedShift &&
                selectedShift.shift_times &&
                selectedShift.shift_times.length > 0
            ) {
                setHasShiftTimes(true);
                const std = selectedShift.shift_times.find(
                    (st) => st.day_of_week === 0
                );
                if (std) {
                    setShiftType(1);
                    setShiftTypeName(std.shift_type_name || t("shifts.standardShift"));
                    setStandardStart(std.start_time.substring(0, 5));
                    setStandardEnd(std.end_time.substring(0, 5));
                } else {
                    setShiftType(0);
                }

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
                        }
                        return {
                            day_of_week: dayNumber,
                            start_time: "00:00",
                            end_time: "00:00",
                            is_day_off: 0,
                        };
                    }
                );
                setDays(scheduleDays);
            } else {
                setHasShiftTimes(false);
                initializeDefaultDays();
            }
        } catch (error) {
            console.error("Error fetching shift schedule:", error);
            toast.error(t("shifts.loadScheduleError"));
            initializeDefaultDays();
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) fetchShiftSchedule();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isOpen, shiftId]);

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

    const handleSubmit = async () => {
        if (!shiftId) return;
        try {
            setIsSubmitting(true);
            const workingDays = days.filter((day) => day.is_day_off === 0);
            const invalidDays = workingDays.filter(
                (day) => day.start_time === "00:00" || day.end_time === "00:00"
            );
            if (invalidDays.length > 0) {
                const invalidDayNames = invalidDays
                    .map((day) => t(`days.full.${day.day_of_week}`))
                    .join(", ");
                toast.error(
                    t("shifts.specifyWorkingTime", { names: invalidDayNames })
                );
                return;
            }
            await PostDataTokenJson(`api/shifttime/create`, {
                shift_id: shiftId,
                items: days,
            });
            toast.success(t("shifts.scheduleSaved"));
            onClose();
        } catch (error: any) {
            console.error(error.response?.data?.error);
            toast.error(t("shifts.scheduleSaveError"));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>{t("shifts.scheduleTitle", { name: resolvedShiftName })}</DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="h-[200px] w-full flex justify-center items-center">
                        <div className="w-[300px]">
                            <ProgressAuto
                                durationMs={500}
                                startDelayMs={10}
                                className="h-1 rounded-full"
                            />
                        </div>
                    </div>
                ) : (
                    <div className="space-y-4 mt-5">
                        {hasShiftTimes && shiftType === 1 ? (
                            <div className="p-4 rounded-2xl border border-maintx bg-mainbg/10 ">
                                <h3 className="text-base font-semibold">
                                    {shiftTypeName}
                                </h3>
                                <p className="text-sm mt-1">
                                    {t("shifts.everyDay")}{" "}
                                    <span className="inline-flex items-center gap-2">
                                        <span className="rounded-xl bg-white  px-3 py-1 font-mono text-sm">
                                            {standardStart}
                                        </span>
                                        —
                                        <span className="rounded-xl bg-white  px-3 py-1 font-mono text-sm">
                                            {standardEnd}
                                        </span>
                                    </span>
                                </p>
                            </div>
                        ) : (
                            <CardContent className="space-y-3 px-0">
                                {DAY_NAMES.map((_, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between py-3 px-2 p-4 rounded-2xl border border-maintx bg-mainbg/10 "
                                    >
                                        <Label className="text-sm font-medium">
                                            {t(`days.full.${index + 1}`)}
                                        </Label>

                                        {hasShiftTimes ? (
                                            <span className="text-md text-gray-700  whitespace-nowrap">
                                                {t("shifts.from")}
                                                <span className="mx-1 rounded-md bg-white px-2 py-1 font-mono text-md">
                                                    {days[index]?.start_time ||
                                                        "--:--"}
                                                </span>
                                                {t("shifts.to")}
                                                <span className="ml-1 rounded-md bg-white  px-2 py-1 font-mono text-md">
                                                    {days[index]?.end_time ||
                                                        "--:--"}
                                                </span>
                                            </span>
                                        ) : (
                                            <div className="flex items-center gap-2">
                                                <Input
                                                    type="time"
                                                    value={
                                                        days[index]
                                                            ?.start_time ||
                                                        "00:00"
                                                    }
                                                    onChange={(e) =>
                                                        handleTimeChange(
                                                            index,
                                                            "start_time",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="h-8 w-[110px] rounded-lg"
                                                />
                                                <span className="text-xs text-gray-500">
                                                    —
                                                </span>
                                                <Input
                                                    type="time"
                                                    value={
                                                        days[index]?.end_time ||
                                                        "00:00"
                                                    }
                                                    onChange={(e) =>
                                                        handleTimeChange(
                                                            index,
                                                            "end_time",
                                                            e.target.value
                                                        )
                                                    }
                                                    className="h-8 w-[110px] rounded-lg"
                                                />
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </CardContent>
                        )}

                        {!hasShiftTimes && (
                            <div className="flex justify-end">
                                <Button
                                    onClick={handleSubmit}
                                    disabled={isSubmitting}
                                    className="bg-maintx hover:bg-maintx/80 rounded-xl text-white px-6"
                                >
                                    {isSubmitting ? t("common.saving") : t("common.create")}
                                </Button>
                            </div>
                        )}
                    </div>
                )}

                <div className="mt-4 flex justify-end gap-2">
                    <Button
                        type="button"
                        variant="outline"
                        className="rounded-xl"
                        onClick={onClose}
                    >
                        {t("common.cancel")}
                    </Button>
                    <Button
                        type="button"
                        className="bg-maintx hover:bg-maintx/80 rounded-xl text-white"
                        disabled={!shiftId}
                        onClick={() => {
                            if (!shiftId) return;
                            onClose();
                            navigate(
                                `/shifts/days/${shiftId}/${encodeURIComponent(
                                    resolvedShiftName || ""
                                )}`
                            );
                        }}
                    >
                        {t("common.edit")}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ShiftDaysModal;
