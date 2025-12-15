import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomCombobox } from "@/components/ui/custom-form";

import { Link } from "react-router-dom";
import CustomBreadcrumb from "@/components/ui/custom-breadcrumb";
import { ProgressAuto } from "@/components/ui/progress";
import { GetDataSimple, PostDataTokenJson } from "@/services/data";
import { toast } from "sonner";
import { formatNumber, parseNumber } from "@/utils/formatters";
import { useNavigate } from "react-router-dom";

const CreateUser = () => {
    const [formData, setFormData] = useState({
        fullName: "",
        salary: "",
        salaryType: "1",
        shiftId: "",
        objectId: "",
        positionId: "",
        objects: [],
        shifts: [],
        positions: [],
        dayOffType: "0",
        dayOffItems: [] as string[],
        dayOffWeekdays: [] as string[], // 1-7, for standard (multiple)
    });

    const [isCreating, setIsCreating] = useState(false);
    const objectId = localStorage.getItem("object");
    const navigate = useNavigate();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch shifts
                const shiftsRes = await GetDataSimple(
                    `api/shift/list?page=1&limit=10&object_id=${objectId}`
                );

                // Fetch positions
                const positionsRes = await GetDataSimple(
                    `api/staff/position/list?page=1&limit=100&object_id=${objectId}`
                );

                setFormData((prev) => ({
                    ...prev,

                    shifts: shiftsRes?.result || [],
                    positions: positionsRes?.result || [],
                }));
            } catch (error) {
                console.error("Error fetching data:", error);
                toast.error("Ошибка загрузки данных");
            }
        };

        fetchData();
    }, []);

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
                toast.error("Ошибка загрузки смен");
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

        try {
            setIsCreating(true);

            const submitData = {
                object_id: objectId,
                name: formData.fullName.trim(),
                salary: parseInt(parseNumber(formData.salary)),
                salary_type: parseInt(formData.salaryType),
                shift_id: parseInt(formData.shiftId),
                position_id: parseInt(formData.positionId),
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

            console.log("Creating employee:", submitData);

            await PostDataTokenJson("api/faceid/user/create", submitData);

            toast.success("Сотрудник успешно создан");

            navigate("/users");

            setFormData({
                fullName: "",
                salary: "",
                salaryType: "1",
                shiftId: "",
                objectId: "",
                positionId: "",
                objects: formData.objects,
                shifts: formData.shifts,
                positions: formData.positions,
                dayOffType: "0",
                dayOffItems: [],
                dayOffWeekdays: [],
            });
        } catch (error: any) {
            toast.error(error.response.data.error);
        } finally {
            setIsCreating(false);
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

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900 ">
                        Создать нового сотрудника
                    </h1>
                </div>
            </div>

            {/* Breadcrumb */}
            <CustomBreadcrumb
                items={[
                    { label: "Панель управления", href: "/" },
                    { label: "Сотрудники", href: "/users" },
                    { label: "Создать", isActive: true },
                ]}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card className="bg-white  rounded-2xl shadow-lg border lg:col-span-2 border-gray-100 ">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-gray-900 ">
                            Данные сотрудника
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSubmit} className="space-y-6">
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
                                            required
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
                                                        dayOffWeekday: "",
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
                                                Стандарт (по дням недели)
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
                                            className="h-12 rounded-xl  border-gray-600"
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
                                        className="px-6 py-2 h-12 rounded-xl border-gray-300  text-gray-700  hover:bg-gray-50 "
                                    >
                                        Назад
                                    </Button>
                                </Link>
                                <Button
                                    type="submit"
                                    disabled={isCreating}
                                    className="px-6 py-2 h-12 bg-maintx hover:bg-maintx/80 rounded-xl font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isCreating ? (
                                        <div className="flex items-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                            <span>Создание...</span>
                                        </div>
                                    ) : (
                                        "Создать сотрудника"
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

export default CreateUser;
