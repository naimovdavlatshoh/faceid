import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
    });

    const [avatarSrc, setAvatarSrc] = useState<string>("/avatar-1.webp");
    const [isUploading, setIsUploading] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Fetch data and populate form
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch objects
                const objectsRes = await GetDataSimple("api/faceid/info");

                // Fetch shifts
                const shiftsRes = await GetDataSimple(
                    "api/shift/list?page=1&limit=10&object_id=1"
                );

                // Fetch all employees
                const employeesRes = await GetDataSimple(
                    "api/faceid/users/list?page=1&limit=100&object_id=1"
                );

                // Find the specific employee by faceid_user_id
                const employee = employeesRes?.result?.find(
                    (emp: any) => emp.faceid_user_id.toString() === id
                );

                if (employee) {
                    setFormData((prev) => ({
                        ...prev,
                        fullName: employee.name || "",
                        salary: employee.salary
                            ? formatNumber(employee.salary.toString())
                            : "",
                        salaryType: employee.salary_type?.toString() || "1",
                        shiftId: employee.shift_id?.toString() || "",
                        objectId: employee.object_id?.toString() || "",
                        objects: objectsRes || [],
                        shifts: shiftsRes?.result || [],
                    }));

                    if (employee.image_path) {
                        setAvatarSrc(employee.image_path);
                    }
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

        // Validate file size (max 3MB)
        if (file.size > 3 * 1024 * 1024) {
            toast.error("Размер файла не должен превышать 3 МБ");
            return;
        }

        // Validate file type
        if (!file.type.startsWith("image/")) {
            toast.error("Пожалуйста, выберите изображение");
            return;
        }

        try {
            setIsUploading(true);

            // Create FormData
            const formData = new FormData();
            formData.append("image", file);

            // Upload image to API
            await PostDataToken(`api/faceid/user/uploadimage/${id}`, formData);

            // Update avatar display
            const url = URL.createObjectURL(file);
            setAvatarSrc(url);

            toast.success("Изображение успешно загружено");
        } catch (error: any) {
            console.error("Error uploading image:", error);
            toast.error(
                error.response?.data?.error || "Ошибка загрузки изображения"
            );
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

    // const [emailVerified, setEmailVerified] = useState(true);

    const handleInputChange = async (field: string, value: string) => {
        let processedValue = value;

        // Special handling for salary field
        if (field === "salary") {
            processedValue = formatNumber(value);
        }

        setFormData((prev) => ({
            ...prev,
            [field]: processedValue,
        }));

        // If object changes, fetch shifts for that object
        if (field === "objectId" && value) {
            try {
                const shiftsRes = await GetDataSimple(
                    `api/shift/list?page=1&limit=10&object_id=${value}`
                );
                setFormData((prev) => ({
                    ...prev,
                    shifts: shiftsRes?.result || [],
                    shiftId: "", // Reset shift selection when object changes
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
                                <button disabled={true} className="mt-4 w-3/4 rounded-xl bg-red-100 text-red-600 py-3 font-medium">
                                    Удалить пользователя
                                </button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Right Section - User Details Form */}
                <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border lg:col-span-2 border-gray-100 dark:border-gray-700">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-900 dark:text-white">
                            Данные пользователя
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
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
                                </div>

                                {/* Right Column */}
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <CustomCombobox
                                            label="Объект"
                                            placeholder="Выберите объект"
                                            value={formData.objectId}
                                            onChange={(value) =>
                                                handleInputChange(
                                                    "objectId",
                                                    value
                                                )
                                            }
                                            options={formData.objects.map(
                                                (obj: any) => ({
                                                    value: obj.object_id.toString(),
                                                    label: obj.object_name,
                                                })
                                            )}
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

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-4 pt-6">
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
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default Account;
