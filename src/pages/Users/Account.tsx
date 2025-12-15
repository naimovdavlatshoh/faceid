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
import { Link, useParams, useNavigate } from "react-router-dom";
import CustomBreadcrumb from "@/components/ui/custom-breadcrumb";
import { ProgressAuto } from "@/components/ui/progress";
import {
    GetDataSimple,
    PostDataToken,
    PostDataTokenJson,
    DeleteFaceIdUser,
} from "@/services/data";
import CustomModal from "@/components/ui/custom-modal";
import { toast } from "sonner";
import { formatNumber, parseNumber } from "@/utils/formatters";

const Account = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        fullName: "",
        salary: "",
        salaryType: "1", // 1-Ойлик, 2-Хафталик, 3-Кунлик, 4-Соатлик
        shiftId: "",
        positionId: "",
        objectId: "",
        objects: [],
        shifts: [],
        positions: [],
        displayShiftName: "",
        displaySalaryTypeText: "",
        displayDayOffTypeText: "",
        dayOffType: "0",
        dayOffItems: [] as string[],
        dayOffWeekdays: [] as string[],
    });

    const [avatarSrc, setAvatarSrc] = useState<string>("/avatar-1.webp");
    const [hasExistingImage, setHasExistingImage] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const objectId = localStorage.getItem("object");
    const [dayOffItemsList, setDayOffItemsList] = useState<number[]>([]);
    const [dayOffItemsRaw, setDayOffItemsRaw] = useState<any[]>([]);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const objectsRes = await GetDataSimple("api/faceid/info");
                const shiftsRes = await GetDataSimple(
                    `api/shift/list?page=1&limit=10&object_id=${objectId}`
                );

                const positionsRes = await GetDataSimple(
                    `api/staff/position/list?page=1&limit=100&object_id=${objectId}`
                );

                const userRes = await GetDataSimple(
                    `api/faceid/user/read?faceid_user_id=${id}&object_id=${objectId}`
                );

                if (userRes) {
                    const dayOffType = userRes.day_off_type?.toString() || "0";
                    const dayOffItems = Array.isArray(userRes.day_off_items)
                        ? userRes.day_off_items
                        : [];

                    // Day off items ni ajratish - type 0 bo'lsa month days, 1 bo'lsa weekdays
                    const dayOffItemsList =
                        dayOffType === "1"
                            ? dayOffItems
                                  .map((d: any) =>
                                      typeof d === "number" ? d : d?.days_off
                                  )
                                  .filter((v: any) => typeof v === "number")
                                  .map((v: any) => v.toString())
                            : dayOffItems
                                  .map((d: any) =>
                                      typeof d === "number" ? d : d?.days_off
                                  )
                                  .filter((v: any) => typeof v === "number")
                                  .map((v: any) => v.toString());

                    setFormData((prev) => ({
                        ...prev,
                        fullName: userRes.name || "",
                        salary: userRes.salary
                            ? formatNumber(String(userRes.salary))
                            : "",
                        salaryType: userRes.salary_type?.toString() || "1",
                        shiftId: userRes.shift_id?.toString() || "",
                        positionId: userRes.position_id?.toString() || "",
                        objectId: userRes.object_id?.toString() || "",
                        objects: objectsRes || [],
                        shifts: shiftsRes?.result || [],
                        positions: positionsRes?.result || [],
                        displayShiftName: userRes.shift_name || "",
                        displaySalaryTypeText: userRes.salary_type_text || "",
                        displayDayOffTypeText: userRes.day_off_type_text || "",
                        dayOffType: dayOffType,
                        dayOffItems: dayOffType === "1" ? [] : dayOffItemsList,
                        dayOffWeekdays:
                            dayOffType === "1" ? dayOffItemsList : [],
                    }));

                    if (userRes.image_path) {
                        setAvatarSrc(userRes.image_path);
                        setHasExistingImage(true);
                    } else {
                        setHasExistingImage(false);
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
        if (!file) {
            // Reset input value
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            return;
        }

        if (file.size > 3 * 1024 * 1024) {
            toast.error("Размер файла не должен превышать 3 МБ");
            // Reset input value
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            return;
        }

        if (!file.type.startsWith("image/")) {
            toast.error("Пожалуйста, выберите изображение");
            // Reset input value
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
            return;
        }

        try {
            setIsUploading(true);

            const formData = new FormData();
            formData.append("image", file);

            // Agar user rasmi bo'lsa updateimage, aks holda uploadimage ishlatiladi
            const apiEndpoint = hasExistingImage
                ? `api/faceid/user/updateimage/${id}`
                : `api/faceid/user/uploadimage/${id}`;

            await PostDataToken(apiEndpoint, formData);

            const url = URL.createObjectURL(file);
            setAvatarSrc(url);
            setHasExistingImage(true);

            toast.success("Изображение успешно загружено");
        } catch (error: any) {
            console.error("Error uploading image:", error);
            toast.error(
                error.response?.data?.error ||
                    error.response?.data?.message ||
                    "Ошибка загрузки изображения"
            );
        } finally {
            setIsUploading(false);
            // Reset input value after processing (success or error)
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
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

        // Validate required fields
        if (
            !formData.fullName.trim() ||
            !formData.salary.trim() ||
            !formData.positionId
        ) {
            toast.error("Пожалуйста, заполните все обязательные поля");
            return;
        }

        // Parse the formatted salary back to a clean number
        const cleanSalary = parseNumber(formData.salary);

        try {
            setIsSubmitting(true);

            const submitData = {
                name: formData.fullName.trim(),
                position_id: parseInt(formData.positionId),
                salary: parseInt(cleanSalary),
                salary_type: parseInt(formData.salaryType),
                shift_id: parseInt(formData.shiftId),
                day_off_type: parseInt(formData.dayOffType),
                day_off_items:
                    formData.dayOffType === "1"
                        ? // standard: multiple weekdays
                          (formData.dayOffWeekdays || [])
                              .map((v) => v.trim())
                              .filter(
                                  (v) => v !== "" && !Number.isNaN(Number(v))
                              )
                              .map((v) => ({ days_off: parseInt(v) }))
                        : // hybrid: multiple month days
                          (formData.dayOffItems || [])
                              .map((v) => v.trim())
                              .filter(
                                  (v) => v !== "" && !Number.isNaN(Number(v))
                              )
                              .map((v) => ({ days_off: parseInt(v) })),
            };

            await PostDataTokenJson(`api/faceid/user/update/${id}`, submitData);

            toast.success("Данные успешно обновлены");
        } catch (error: any) {
            console.error("Error updating user:", error);
            toast.error(
                error.response?.data?.error ||
                    error.response?.data?.message ||
                    "Ошибка обновления данных"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleConfirmDelete = async () => {
        if (!id) return;

        try {
            setIsDeleting(true);
            await DeleteFaceIdUser(parseInt(id));
            toast.success("Сотрудник удалён", {
                description: `${formData.fullName} успешно удалён.`,
                duration: 2500,
            });
            navigate("/users");
        } catch (error: any) {
            console.error("Error deleting user:", error);
            toast.error(
                error?.response?.data?.message ||
                    "Не удалось удалить сотрудника"
            );
        } finally {
            setIsDeleting(false);
            setIsDeleteOpen(false);
        }
    };

    const handleCancelDelete = () => {
        setIsDeleteOpen(false);
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 ">
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
                    <Card className="bg-white  rounded-2xl shadow-lg border border-gray-100 ">
                        <CardContent className="space-y-4 py-14">
                            {/* Photo Upload Area */}
                            <div className="flex flex-col items-center space-y-8">
                                <div
                                    className={`group relative w-32 h-32 rounded-full border-2 border-dashed border-gray-300 overflow-hidden p-1.5 bg-gray-50 ${
                                        isUploading
                                            ? "cursor-not-allowed opacity-75"
                                            : "cursor-pointer"
                                    }`}
                                    onClick={handleAvatarClick}
                                    role="button"
                                    aria-label="Загрузить фото"
                                >
                                    {isUploading ? (
                                        <div className="w-full h-full rounded-full bg-gray-100  flex items-center justify-center">
                                            <div className="relative">
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
                                <div className="text-center text-sm text-gray-500 ">
                                    <p>*.jpeg, *.jpg макс 200 Кб</p>
                                </div>
                                {/* <div className="flex items-center space-x-2">
                                    <Switch id="airplane-mode" />
                                    <Label htmlFor="airplane-mode">
                                        Активный пользователь
                                    </Label>
                                </div> */}
                                <button
                                    onClick={() => setIsDeleteOpen(true)}
                                    disabled={isDeleting}
                                    className="mt-4 w-3/4 rounded-xl bg-red-100 text-red-600 py-3 font-medium hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Удалить пользователя
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                    {/* Quick Info */}
                    <Card className="bg-white  rounded-2xl shadow-lg border border-gray-100 ">
                        <CardHeader>
                            <CardTitle className="text-base font-semibold text-gray-900 ">
                                Информация
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Смена</span>
                                <span className="text-gray-900  font-medium">
                                    {formData.displayShiftName || "—"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">
                                    Тип зарплаты
                                </span>
                                <span className="text-gray-900  font-medium">
                                    {formData.displaySalaryTypeText || "—"}
                                </span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">
                                    Тип выходного
                                </span>
                                <span className="text-gray-900  font-medium">
                                    {formData.displayDayOffTypeText || "—"}
                                </span>
                            </div>
                            {dayOffItemsList.length > 0 && (
                                <div className="pt-1">
                                    <span className="text-xs text-gray-500">
                                        Выходные
                                    </span>
                                    <div className="mt-2 text-sm text-gray-900 ">
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
                <Card className="bg-white  rounded-2xl shadow-lg border lg:col-span-2 border-gray-100  flex flex-col">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-900 ">
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
                                            className="text-sm font-medium text-gray-700 "
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
                                            className="h-12 rounded-xl border-gray-200 "
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
                                                // {
                                                //     value: "2",
                                                //     label: "Хафталик",
                                                // },
                                                // { value: "3", label: "Кунлик" },
                                                {
                                                    value: "4",
                                                    label: "Соатлик",
                                                },
                                            ]}
                                        />
                                    </div>

                                    {/* day off type */}
                                    <div className="space-y-2">
                                        <Label className="text-sm font-medium text-gray-700 ">
                                            Тип выходного
                                        </Label>
                                        <div className="flex gap-2">
                                            <Button
                                                type="button"
                                                variant={
                                                    formData.dayOffType === "0"
                                                        ? "default"
                                                        : "outline"
                                                }
                                                className="rounded-xl"
                                                onClick={() => {
                                                    handleInputChange(
                                                        "dayOffType",
                                                        "0"
                                                    );
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        dayOffWeekdays: [],
                                                    }));
                                                }}
                                            >
                                                Гибридный (по датам)
                                            </Button>
                                            <Button
                                                type="button"
                                                variant={
                                                    formData.dayOffType === "1"
                                                        ? "default"
                                                        : "outline"
                                                }
                                                className="rounded-xl"
                                                onClick={() => {
                                                    handleInputChange(
                                                        "dayOffType",
                                                        "1"
                                                    );
                                                    setFormData((prev) => ({
                                                        ...prev,
                                                        dayOffItems: [],
                                                    }));
                                                }}
                                            >
                                                Стандарт
                                            </Button>
                                        </div>
                                    </div>

                                    {formData.dayOffType === "1" ? (
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700 ">
                                                Дни недели выходных (можно
                                                несколько)
                                            </Label>
                                            <div className="flex flex-wrap gap-2">
                                                {[
                                                    { v: "1", l: "Пн" },
                                                    { v: "2", l: "Вт" },
                                                    { v: "3", l: "Ср" },
                                                    { v: "4", l: "Чт" },
                                                    { v: "5", l: "Пт" },
                                                    { v: "6", l: "Сб" },
                                                    { v: "7", l: "Вс" },
                                                ].map((d) => {
                                                    const active =
                                                        formData.dayOffWeekdays.includes(
                                                            d.v
                                                        );
                                                    return (
                                                        <Button
                                                            key={d.v}
                                                            type="button"
                                                            variant={
                                                                active
                                                                    ? "default"
                                                                    : "outline"
                                                            }
                                                            className="rounded-xl"
                                                            onClick={() =>
                                                                setFormData(
                                                                    (prev) => ({
                                                                        ...prev,
                                                                        dayOffWeekdays:
                                                                            active
                                                                                ? prev.dayOffWeekdays.filter(
                                                                                      (
                                                                                          x
                                                                                      ) =>
                                                                                          x !==
                                                                                          d.v
                                                                                  )
                                                                                : [
                                                                                      ...prev.dayOffWeekdays,
                                                                                      d.v,
                                                                                  ],
                                                                    })
                                                                )
                                                            }
                                                        >
                                                            {d.l}
                                                        </Button>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            <Label className="text-sm font-medium text-gray-700 ">
                                                Даты выходных (1-27)
                                            </Label>
                                            <div className="flex gap-2 items-center">
                                                <Input
                                                    id="dayoff-input"
                                                    type="number"
                                                    placeholder="напр. 6"
                                                    className="h-10 rounded-xl w-32"
                                                />
                                                <Button
                                                    type="button"
                                                    className="rounded-xl"
                                                    onClick={() => {
                                                        const input =
                                                            document.getElementById(
                                                                "dayoff-input"
                                                            ) as HTMLInputElement | null;
                                                        if (!input) return;
                                                        const val =
                                                            input.value.trim();
                                                        if (!val) return;
                                                        const num =
                                                            parseInt(val);
                                                        const max = 27;
                                                        if (
                                                            Number.isNaN(num) ||
                                                            num < 1 ||
                                                            num > max
                                                        ) {
                                                            toast.error(
                                                                `Недопустимое значение (1-${max})`
                                                            );
                                                            return;
                                                        }
                                                        if (
                                                            !formData.dayOffItems.includes(
                                                                val
                                                            )
                                                        ) {
                                                            setFormData(
                                                                (prev) => ({
                                                                    ...prev,
                                                                    dayOffItems:
                                                                        [
                                                                            ...prev.dayOffItems,
                                                                            val,
                                                                        ],
                                                                })
                                                            );
                                                        }
                                                        input.value = "";
                                                    }}
                                                >
                                                    Добавить
                                                </Button>
                                                {formData.dayOffItems.length >
                                                    0 && (
                                                    <div className="flex flex-wrap gap-2 ">
                                                        {formData.dayOffItems.map(
                                                            (v, idx) => (
                                                                <div
                                                                    key={idx}
                                                                    className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-gray-100  text-sm"
                                                                >
                                                                    <span>
                                                                        {v}
                                                                    </span>
                                                                    <button
                                                                        type="button"
                                                                        className="text-red-500 hover:text-red-600 text-lg"
                                                                        onClick={() =>
                                                                            setFormData(
                                                                                (
                                                                                    prev
                                                                                ) => ({
                                                                                    ...prev,
                                                                                    dayOffItems:
                                                                                        prev.dayOffItems.filter(
                                                                                            (
                                                                                                x
                                                                                            ) =>
                                                                                                x !==
                                                                                                v
                                                                                        ),
                                                                                })
                                                                            )
                                                                        }
                                                                    >
                                                                        ×
                                                                    </button>
                                                                </div>
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Right Column */}
                                <div className="space-y-4">
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
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <CustomCombobox
                                            label="Должность"
                                            placeholder="Выберите должность"
                                            value={formData.positionId}
                                            onChange={(value) =>
                                                handleInputChange(
                                                    "positionId",
                                                    value
                                                )
                                            }
                                            options={formData.positions
                                                .filter(
                                                    (position: any) =>
                                                        position &&
                                                        position.position_id &&
                                                        position.position_name
                                                )
                                                .map((position: any) => ({
                                                    value: position.position_id.toString(),
                                                    label: position.position_name,
                                                }))}
                                            required
                                        />
                                    </div>

                                    {/* Salary */}
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="salary"
                                            className="text-sm font-medium text-gray-700 "
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
                                            className="h-12 rounded-xl border-gray-200 "
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
                                className="px-6 py-2 h-12 rounded-xl border-gray-300  text-gray-700  hover:bg-gray-50 "
                            >
                                Назад
                            </Button>
                        </Link>
                        <Button
                            type="submit"
                            form="accountForm"
                            disabled={isSubmitting}
                            className="px-6 py-2 h-12 bg-gray-900 hover:bg-gray-800  text-white rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
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

            {/* Delete Confirmation Modal */}
            <CustomModal
                showTrigger={false}
                open={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
                title="Подтверждение удаления"
                confirmText={isDeleting ? "Удаление..." : "Удалить"}
                cancelText="Отмена"
                confirmBg="bg-red-500"
                confirmBgHover="bg-red-500/70"
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                size="md"
                showCloseButton={false}
                footerContent={
                    <div className="flex gap-2 justify-end w-full">
                        <Button
                            variant="outline"
                            onClick={handleCancelDelete}
                            disabled={isDeleting}
                        >
                            Отмена
                        </Button>
                        <Button
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            className="bg-red-500 hover:bg-red-500/70 text-white"
                        >
                            {isDeleting ? "Удаление..." : "Удалить"}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-2">
                    <p className="text-sm text-gray-600 ">
                        Вы уверены, что хотите удалить сотрудника{" "}
                        <span className="font-semibold text-gray-900 ">
                            {formData.fullName}
                        </span>
                        ? Это действие нельзя отменить.
                    </p>
                </div>
            </CustomModal>
        </div>
    );
};

export default Account;
