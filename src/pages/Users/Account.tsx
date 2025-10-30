import { useEffect, useRef, useState } from "react";
import {
    Card,
    CardContent,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomCombobox } from "@/components/ui/custom-form";

import { MdCameraAlt } from "react-icons/md";
import { Link, useParams } from "react-router-dom";
import CustomBreadcrumb from "@/components/ui/custom-breadcrumb";
import { ProgressAuto } from "@/components/ui/progress";
import { GetDataSimple, PostDataToken } from "@/services/data";
import { toast } from "sonner";
import { formatNumber, parseNumber } from "@/utils/formatters";

const Account = () => {
    const { id } = useParams();
    const [formData, setFormData] = useState({
        fullName: "",
        salary: "",
        salaryType: "1", // 1-Ойлик, 2-Хафталик, 3-Кунлик, 4-Соатлик
        shiftId: "",
        objectId: "",
        objects: [],
        shifts: [],
        displayShiftName: "",
        displaySalaryTypeText: "",
        displayDayOffTypeText: "",
        dayOffType: "",
    });

    const [avatarSrc, setAvatarSrc] = useState<string>("/avatar-1.webp");
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const objectId = localStorage.getItem("object");
    const [dayOffItemsList, setDayOffItemsList] = useState<number[]>([]);
    const [dayOffItemsRaw, setDayOffItemsRaw] = useState<any[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const objectsRes = await GetDataSimple("api/faceid/info");
                const shiftsRes = await GetDataSimple(
                    `api/shift/list?page=1&limit=10&object_id=${objectId}`
                );

                const userRes = await GetDataSimple(
                    `api/faceid/user/read?faceid_user_id=${id}&object_id=${objectId}`
                );

                if (userRes) {
                    setFormData((prev) => ({
                        ...prev,
                        fullName: userRes.name || "",
                        salary: userRes.salary
                            ? formatNumber(String(userRes.salary))
                            : "",
                        salaryType: userRes.salary_type?.toString() || "1",
                        shiftId: userRes.shift_id?.toString() || "",
                        objectId: userRes.object_id?.toString() || "",
                        objects: objectsRes || [],
                        shifts: shiftsRes?.result || [],
                        displayShiftName: userRes.shift_name || "",
                        displaySalaryTypeText: userRes.salary_type_text || "",
                        displayDayOffTypeText: userRes.day_off_type_text || "",
                        dayOffType: userRes.day_off_type?.toString() || "",
                    }));

                    if (userRes.image_path) {
                        setAvatarSrc(userRes.image_path);
                    }

                    const mappedDays = Array.isArray(userRes.day_off_items)
                        ? userRes.day_off_items
                              .map((d: any) =>
                                  typeof d === "number" ? d : d?.days_off
                              )
                              .filter((v: any) => typeof v === "number")
                        : [];
                    setDayOffItemsList(mappedDays);
                    setDayOffItemsRaw(
                        Array.isArray(userRes.day_off_items)
                            ? userRes.day_off_items
                            : []
                    );
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        if (id) {
            fetchData();
        }
    }, [id]);

    const handleAvatarClick = () => {
        if (!isUploading) {
            fileInputRef.current?.click();
        }
    };

    const handleAvatarChange = async (
        e: React.ChangeEvent<HTMLInputElement>
    ) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (file.size > 3 * 1024 * 1024) {
            toast.error("Размер файла не должен превышать 3 МБ");
            return;
        }

        if (!file.type.startsWith("image/")) {
            toast.error("Пожалуйста, выберите изображение");
            return;
        }

        try {
            setIsUploading(true);

            const formData = new FormData();
            formData.append("image", file);

            await PostDataToken(`api/faceid/user/uploadimage/${id}`, formData);

            const url = URL.createObjectURL(file);
            setAvatarSrc(url);

            toast.success("Изображение успешно загружено");
        } catch (error: any) {
            console.error("Error uploading image:", error);
            toast.error(error.response?.data?.error);
        } finally {
            setIsUploading(false);
        }
    };
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        setTimeout(() => {
            setLoading(false);
        }, 500);
    }, []);

    if (loading) {
        return (
            <div className="h-[80vh] w-full flex justify-center items-center ">
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

    const handleInputChange = async (field: string, value: string) => {
        let processedValue = value;

        if (field === "salary") {
            processedValue = formatNumber(value);
        }

        setFormData((prev) => ({
            ...prev,
            [field]: processedValue,
        }));

        if (field === "objectId" && value) {
            try {
                const shiftsRes = await GetDataSimple(
                    `api/shift/list?page=1&limit=10&object_id=${value}`
                );
                setFormData((prev) => ({
                    ...prev,
                    shifts: shiftsRes?.result || [],
                    shiftId: "",
                }));
            } catch (error) {
                console.error("Error fetching shifts:", error);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Parse the formatted salary back to a clean number
        const cleanSalary = parseNumber(formData.salary);

        try {
            setIsSubmitting(true);

            // Here you would add your API call to update user data
            // await PostDataTokenJson(`api/faceid/user/update/${id}`, {
            //     name: formData.fullName.trim(),
            //     salary: parseInt(cleanSalary),
            //     salary_type: parseInt(formData.salaryType),
            //     shift_id: parseInt(formData.shiftId),
            //     object_id: parseInt(formData.objectId),
            // });

            // Here you would add your API call to update user data
            // await PostDataTokenJson(`api/faceid/user/update/${id}`, {
            //     name: formData.fullName.trim(),
            //     salary: parseInt(cleanSalary),
            //     salary_type: parseInt(formData.salaryType),
            //     shift_id: parseInt(formData.shiftId),
            //     object_id: parseInt(formData.objectId),
            // });

            console.log("Updating user data:", {
                name: formData.fullName.trim(),
                salary: parseInt(cleanSalary),
                salary_type: parseInt(formData.salaryType),
                shift_id: parseInt(formData.shiftId),
                object_id: parseInt(formData.objectId),
            });

            // Simulate API call for now
            await new Promise((resolve) => setTimeout(resolve, 2000));

            toast.success("Данные успешно обновлены");
        } catch (error: any) {
            console.error("Error updating user:", error);
            toast.error(
                error.response?.data?.error || "Ошибка обновления данных"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Аккаунт
                    </h1>
                </div>
            </div>

            {/* Breadcrumb */}
            <CustomBreadcrumb
                items={[
                    { label: "Панель управления", href: "/" },
                    { label: "Пользователи", href: "/users" },
                    { label: formData.fullName, isActive: true },
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="space-y-6 lg:col-span-1">
                    <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                        <CardContent className="space-y-4 py-14">
                            {/* Photo Upload Area */}
                            <div className="flex flex-col items-center space-y-8">
                                <div
                                    className={`group relative w-32 h-32 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-hidden p-1.5 bg-gray-50 dark:bg-gray-700 ${
                                        isUploading
                                            ? "cursor-not-allowed opacity-75"
                                            : "cursor-pointer"
                                    }`}
                                    onClick={handleAvatarClick}
                                    role="button"
                                    aria-label="Загрузить фото"
                                >
                                    {isUploading ? (
                                        <div className="w-full h-full rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center">
                                            <div className="relative">
                                                {/* Spinning Circle */}
                                                <div className="w-12 h-12 border-4 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                                                {/* Upload Icon */}
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <MdCameraAlt className="w-6 h-6 text-blue-600" />
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <>
                                            <img
                                                src={avatarSrc}
                                                alt="avatar"
                                                className="w-full h-full object-cover rounded-full transition-transform duration-300 group-hover:scale-105"
                                            />
                                            {/* Hover overlay */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white">
                                                <MdCameraAlt className="w-6 h-6 mb-1" />
                                                <span className="text-xs">
                                                    Загрузить фото
                                                </span>
                                            </div>
                                        </>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleAvatarChange}
                                        disabled={isUploading}
                                    />
                                </div>

                                {/* File Info */}
                                <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                                    <p>*.jpeg, *.jpg, *.png, *.gif</p>
                                    <p>макс 3 Мб</p>
                                </div>
                                {/* <div className="flex items-center space-x-2">
                                    <Switch id="airplane-mode" />
                                    <Label htmlFor="airplane-mode">
                                        Активный пользователь
                                    </Label>
                                </div> */}
                                <button
                                    disabled={true}
                                    className="mt-4 w-3/4 rounded-xl bg-red-100 text-red-600 py-3 font-medium"
                                >
                                    Удалить пользователя
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                    {/* Quick Info */}
                    <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold text-gray-900 dark:text-white">
                                Информация
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Смена</span>
                                <span className="text-gray-900 dark:text-gray-100 font-medium">
                                    {formData.displayShiftName || "—"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">
                                    Тип зарплаты
                                </span>
                                <span className="text-gray-900 dark:text-gray-100 font-medium">
                                    {formData.displaySalaryTypeText || "—"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">
                                    Тип выходного
                                </span>
                                <span className="text-gray-900 dark:text-gray-100 font-medium">
                                    {formData.displayDayOffTypeText || "—"}
                                </span>
                            </div>
                            {dayOffItemsList.length > 0 && (
                                <div className="pt-1">
                                    <span className="text-xs text-gray-500">
                                        Выходные
                                    </span>
                                    <div className="mt-2 text-sm text-gray-900 dark:text-gray-100">
                                        {(() => {
                                            const t = formData.dayOffType;
                                            const hasMonthly =
                                                Array.isArray(dayOffItemsRaw) &&
                                                dayOffItemsRaw.some(
                                                    (d: any) =>
                                                        d?.days_off_id === 3
                                                );
                                            const hasWeekly =
                                                Array.isArray(dayOffItemsRaw) &&
                                                dayOffItemsRaw.some(
                                                    (d: any) =>
                                                        d?.days_off_id === 2
                                                );

                                            const isWeekly =
                                                String(t) === "1" || hasWeekly;

                                            // Explicit monthly text with ordinals when type is 0
                                            if (
                                                String(t) === "0" &&
                                                dayOffItemsList.length > 0
                                            ) {
                                                const parts =
                                                    dayOffItemsList.map(
                                                        (n) => `${n}-го`
                                                    );
                                                const humanList =
                                                    parts.length === 1
                                                        ? parts[0]
                                                        : parts.length === 2
                                                        ? `${parts[0]} и ${parts[1]}`
                                                        : `${parts
                                                              .slice(0, -1)
                                                              .join(", ")} и ${
                                                              parts[
                                                                  parts.length -
                                                                      1
                                                              ]
                                                          }`;
                                                return (
                                                    <span>
                                                        {humanList} числа
                                                        каждого месяца
                                                    </span>
                                                );
                                            }

                                            if (hasMonthly) {
                                                return (
                                                    <span>
                                                        Каждого месяца:{" "}
                                                        {dayOffItemsList.join(
                                                            ", "
                                                        )}
                                                    </span>
                                                );
                                            }

                                            if (isWeekly) {
                                                const map: Record<
                                                    number,
                                                    string
                                                > = {
                                                    1: "Пн",
                                                    2: "Вт",
                                                    3: "Ср",
                                                    4: "Чт",
                                                    5: "Пт",
                                                    6: "Сб",
                                                    7: "Вс",
                                                };
                                                const names =
                                                    dayOffItemsList.map(
                                                        (n) =>
                                                            map[n] || String(n)
                                                    );
                                                return (
                                                    <span>
                                                        Выходные дни:{" "}
                                                        {names.join(", ")}
                                                    </span>
                                                );
                                            }

                                            return (
                                                <span>
                                                    {dayOffItemsList.join(", ")}
                                                </span>
                                            );
                                        })()}
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Section - User Details Form */}
                <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border lg:col-span-2 border-gray-100 dark:border-gray-700 flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                            Данные пользователя
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="flex-1">
                        <form
                            id="accountForm"
                            onSubmit={handleSubmit}
                            className="space-y-6"
                        >
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="fullName"
                                            className="text-sm font-medium text-gray-700 dark:text-gray-300"
                                        >
                                            Имя
                                        </Label>
                                        <Input
                                            id="fullName"
                                            type="text"
                                            placeholder="Введите имя"
                                            value={formData.fullName}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "fullName",
                                                    e.target.value
                                                )
                                            }
                                            className="h-12 rounded-xl border-gray-200 dark:border-gray-600"
                                        />
                                    </div>
                                    {/* Salary Type */}
                                    <div className="space-y-2">
                                        <CustomCombobox
                                            label="Тип зарплаты"
                                            placeholder="Выберите тип зарплаты"
                                            value={formData.salaryType}
                                            onChange={(value) =>
                                                handleInputChange(
                                                    "salaryType",
                                                    value
                                                )
                                            }
                                            options={[
                                                { value: "1", label: "Ойлик" },
                                                {
                                                    value: "2",
                                                    label: "Хафталик",
                                                },
                                                { value: "3", label: "Кунлик" },
                                                {
                                                    value: "4",
                                                    label: "Соатлик",
                                                },
                                            ]}
                                        />
                                    </div>

                                    {/* Salary */}
                                </div>

                                {/* Right Column */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="salary"
                                            className="text-sm font-medium text-gray-700 dark:text-gray-300"
                                        >
                                            Зарплата
                                        </Label>
                                        <Input
                                            id="salary"
                                            type="text"
                                            placeholder="0"
                                            value={formData.salary}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "salary",
                                                    e.target.value
                                                )
                                            }
                                            className="h-12 rounded-xl border-gray-200 dark:border-gray-600"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <CustomCombobox
                                            label="Смена"
                                            placeholder="Выберите смену"
                                            value={formData.shiftId}
                                            onChange={(value) =>
                                                handleInputChange(
                                                    "shiftId",
                                                    value
                                                )
                                            }
                                            options={formData.shifts
                                                .filter(
                                                    (shift: any) =>
                                                        shift &&
                                                        shift.shift_id &&
                                                        shift.shift_name
                                                )
                                                .map((shift: any) => ({
                                                    value: shift.shift_id.toString(),
                                                    label: shift.shift_name,
                                                }))}
                                        />
                                    </div>
                                </div>
                            </div>
                        </form>
                    </CardContent>
                    <CardFooter className="justify-end space-x-4">
                        <Link to="/users">
                            <Button
                                type="button"
                                variant="outline"
                                className="px-6 py-2 h-12 rounded-xl border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                                Отмена
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            form="accountForm"
                            // disabled={isSubmitting}
                            disabled={true}
                            className="px-6 py-2 h-12 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? (
                                <div className="flex items-center space-x-2">
                                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span>Обновление...</span>
                                </div>
                            ) : (
                                "Обновить данные"
                            )}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        </div>
    );
};

export default Account;
