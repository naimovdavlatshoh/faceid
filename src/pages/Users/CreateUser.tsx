import { useEffect, useRef, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomCombobox, CustomDatePicker } from "@/components/ui/custom-form";
// import { Switch } from "@/components/ui/switch";

import { MdCameraAlt } from "react-icons/md";
import { FaUser } from "react-icons/fa";
import { Link } from "react-router-dom";
import CustomBreadcrumb from "@/components/ui/custom-breadcrumb";
import { ProgressAuto } from "@/components/ui/progress";

const CreateUser = () => {
    const [formData, setFormData] = useState({
        fullName: "",
        lastName: "",
        middleName: "",
        phone: "",
        country: "",
        city: "",
        address: "",
        company: "",
        role: "",
        birthDate: undefined as Date | undefined,
    });

    const [avatarSrc, setAvatarSrc] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Options for comboboxes
    const countryOptions = [
        { value: "uz", label: "Узбекистан" },
        { value: "us", label: "США" },
        { value: "ru", label: "Россия" },
        { value: "kz", label: "Казахстан" },
        { value: "kg", label: "Кыргызстан" },
        { value: "tj", label: "Таджикистан" },
        { value: "tm", label: "Туркменистан" },
    ];

    const roleOptions = [
        { value: "admin", label: "Администратор" },
        { value: "user", label: "Пользователь" },
        { value: "moderator", label: "Модератор" },
        { value: "manager", label: "Менеджер" },
        { value: "editor", label: "Редактор" },
    ];

    const cityOptions = [
        { value: "tashkent", label: "Ташкент" },
        { value: "samarkand", label: "Самарканд" },
        { value: "bukhara", label: "Бухара" },
        { value: "namangan", label: "Наманган" },
        { value: "andijan", label: "Андижан" },
        { value: "fergana", label: "Фергана" },
        { value: "karshi", label: "Карши" },
        { value: "kokand", label: "Коканд" },
        { value: "margilan", label: "Маргилан" },
    ];
    // const [emailVerified, setEmailVerified] = useState(true);

    const handleAvatarClick = () => {
        fileInputRef.current?.click();
    };

    const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const url = URL.createObjectURL(file);
        setAvatarSrc(url);
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log("Creating user:", formData);
        // Handle user creation logic here
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

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
                        Создать нового пользователя
                    </h1>
                </div>
            </div>

            {/* Breadcrumb */}
            <CustomBreadcrumb
                items={[
                    { label: "Панель управления", href: "/" },
                    { label: "Пользователи", href: "/users" },
                    { label: "Создать", isActive: true },
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="space-y-6 lg:col-span-1">
                    <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                        <CardContent className="space-y-4">
                            {/* Photo Upload Area */}
                            <div className="flex flex-col items-center space-y-10 py-10">
                                <div
                                    className="group relative w-32 h-32 rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 overflow-hidden cursor-pointer p-1.5 bg-gray-50 dark:bg-gray-700"
                                    onClick={handleAvatarClick}
                                    role="button"
                                    aria-label="Загрузить фото"
                                >
                                    {/* Default user icon or uploaded image */}
                                    {avatarSrc ? (
                                        <img
                                            src={avatarSrc}
                                            alt="avatar"
                                            className="w-full h-full object-cover rounded-full transition-transform duration-300 group-hover:scale-105"
                                        />
                                    ) : (
                                        <div className="w-full h-full rounded-full bg-gray-100 dark:bg-gray-600 flex items-center justify-center">
                                            <FaUser className="w-12 h-12 text-mainbg " />
                                        </div>
                                    )}
                                    {/* Hover overlay */}
                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-white">
                                        <MdCameraAlt className="w-6 h-6 mb-1" />
                                        <span className="text-xs">
                                            Загрузить фото
                                        </span>
                                    </div>
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        onChange={handleAvatarChange}
                                    />
                                </div>

                                {/* File Info */}
                                <div className="text-center text-sm text-gray-500 dark:text-gray-400">
                                    <p>*.jpeg, *.jpg, *.png, *.gif</p>
                                    <p>макс 3 Мб</p>
                                </div>


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
                            {/* Form Fields */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Left Column */}
                                <div className="space-y-4">
                                    {/* First Name */}
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
                                            className="h-12 rounded-xl border-gray-200 dark:border-gray-600 "
                                            required
                                        />
                                    </div>

                                    {/* Last Name */}
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="lastName"
                                            className="text-sm font-medium text-gray-700 dark:text-gray-300"
                                        >
                                            Фамилия
                                        </Label>
                                        <Input
                                            id="lastName"
                                            type="text"
                                            placeholder="Введите фамилию"
                                            value={formData.lastName}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "lastName",
                                                    e.target.value
                                                )
                                            }
                                            className="h-12 rounded-xl border-gray-200 dark:border-gray-600 focus:ring-0 focus:border-mainbg hover:border-mainbg transition-colors"
                                            required
                                        />
                                    </div>

                                    {/* Middle Name */}
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="middleName"
                                            className="text-sm font-medium text-gray-700 dark:text-gray-300"
                                        >
                                            Отчество
                                        </Label>
                                        <Input
                                            id="middleName"
                                            type="text"
                                            placeholder="Введите отчество"
                                            value={formData.middleName}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "middleName",
                                                    e.target.value
                                                )
                                            }
                                            className="h-12 rounded-xl border-gray-200 dark:border-gray-600"
                                        />
                                    </div>

                                    {/* Phone Number */}
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="phone"
                                            className="text-sm font-medium text-gray-700 dark:text-gray-300"
                                        >
                                            Номер телефона
                                        </Label>

                                        <Input
                                            id="phone"
                                            type="tel"
                                            placeholder="Введите номер телефона"
                                            value={formData.phone}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "phone",
                                                    e.target.value
                                                )
                                            }
                                            className="h-12 rounded-xl border-gray-200 dark:border-gray-600"
                                            required
                                        />
                                    </div>

                                    {/* Birth Date */}
                                    <div className="space-y-2">
                                        <CustomDatePicker
                                            label="Дата рождения"
                                            placeholder="Выберите дату рождения"
                                            value={formData.birthDate}
                                            onChange={(date) =>
                                                setFormData((prev) => ({
                                                    ...prev,
                                                    birthDate: date,
                                                }))
                                            }
                                        />
                                    </div>
                                </div>

                                {/* Right Column */}
                                <div className="space-y-4">
                                    {/* Country */}
                                    <div className="space-y-2">
                                        <CustomCombobox
                                            label="Страна"
                                            placeholder="Выберите страну"
                                            value={formData.country}
                                            onChange={(value) =>
                                                handleInputChange(
                                                    "country",
                                                    value
                                                )
                                            }
                                            options={countryOptions}
                                        />
                                    </div>

                                    {/* City */}
                                    <div className="space-y-2">
                                        <CustomCombobox
                                            label="Город"
                                            placeholder="Выберите город"
                                            value={formData.city}
                                            onChange={(value) =>
                                                handleInputChange("city", value)
                                            }
                                            options={cityOptions}
                                        />
                                    </div>

                                    {/* Address */}
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="address"
                                            className="text-sm font-medium text-gray-700 dark:text-gray-300"
                                        >
                                            Адрес
                                        </Label>
                                        <Input
                                            id="address"
                                            type="text"
                                            placeholder="Введите адрес"
                                            value={formData.address}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "address",
                                                    e.target.value
                                                )
                                            }
                                            className="h-12 rounded-xl border-gray-200 dark:border-gray-600"
                                        />
                                    </div>

                                    {/* Company */}
                                    <div className="space-y-2">
                                        <Label
                                            htmlFor="company"
                                            className="text-sm font-medium text-gray-700 dark:text-gray-300"
                                        >
                                            Компания
                                        </Label>
                                        <Input
                                            id="company"
                                            type="text"
                                            placeholder="Введите компанию"
                                            value={formData.company}
                                            onChange={(e) =>
                                                handleInputChange(
                                                    "company",
                                                    e.target.value
                                                )
                                            }
                                            className="h-12 rounded-xl border-gray-200 dark:border-gray-600"
                                        />
                                    </div>

                                    {/* Role */}
                                    <div className="space-y-2">
                                        <CustomCombobox
                                            label="Роль"
                                            placeholder="Выберите роль"
                                            value={formData.role}
                                            onChange={(value) =>
                                                handleInputChange("role", value)
                                            }
                                            options={roleOptions}
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
                                    className="px-6 py-2 h-12 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-medium transition-all duration-200"
                                >
                                    Создать пользователя
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};

export default CreateUser;
