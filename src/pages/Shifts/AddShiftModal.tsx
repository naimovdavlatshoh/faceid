import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomCombobox } from "@/components/ui/custom-form";
import CustomModal from "@/components/ui/custom-modal";
import { GetDataSimple, PostDataTokenJson } from "@/services/data";
import { toast } from "sonner";

interface Object {
    object_id: number;
    object_name: string;
}

interface AddShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    onShiftCreated: () => void;
}

const AddShiftModal = ({
    isOpen,
    onClose,
    onShiftCreated,
}: AddShiftModalProps) => {
    const [formData, setFormData] = useState({
        shiftName: "",
        lateToleranceMinutes: "",
        overtimeAfterMinutes: "",
        objectId: "",
    });

    const [objects, setObjects] = useState<Object[]>([]);
    const [isCreating, setIsCreating] = useState(false);

    const handleClose = () => {
        setFormData({
            shiftName: "",
            lateToleranceMinutes: "",
            overtimeAfterMinutes: "",
            objectId: "",
        });
        onClose();
    };

    const handleInputChange = (field: string, value: string) => {
        setFormData((prev) => ({
            ...prev,
            [field]: value,
        }));
    };

    const createShift = async () => {
        if (!formData.shiftName.trim() || !formData.objectId) {
            toast.error("Пожалуйста, заполните все обязательные поля");
            return;
        }

        try {
            setIsCreating(true);

            const submitData = {
                object_id: parseInt(formData.objectId),
                shift_name: formData.shiftName.trim(),
                late_tolerance_minutes:
                    parseInt(formData.lateToleranceMinutes) || 0,
                overtime_after_minutes:
                    parseInt(formData.overtimeAfterMinutes) || 0,
            };

            console.log("Creating shift:", submitData);

            await PostDataTokenJson("api/shift/create", submitData);

            toast.success("Смена успешно создана");
            handleClose();
            onShiftCreated();
        } catch (error: any) {
            console.error("Error creating shift:", error);
            toast.error(error.response?.data?.error || "Ошибка создания смены");
        } finally {
            setIsCreating(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            GetDataSimple("api/faceid/info")
                .then((res) => {
                    const objectsData = res;
                    setObjects(objectsData);
                })
                .catch((error) => {
                    console.error("Error fetching objects:", error);
                    setObjects([]);
                });
        }
    }, [isOpen]);

    const objectOptions = objects
        .filter((object) => object && object.object_id && object.object_name)
        .map((object) => ({
            value: object.object_id.toString(),
            label: object.object_name,
        }));

    return (
        <CustomModal
            open={isOpen}
            showTrigger={false}
            onOpenChange={(open) => !open && handleClose()}
            title="Добавить смену"
            onConfirm={createShift}
            onCancel={handleClose}
            confirmText={isCreating ? "Создание..." : "Создать смену"}
            cancelText="Отмена"
            size="md"
        >
            <div className="space-y-4">
                {/* Shift Name */}
                <div className="space-y-2">
                    <Label
                        htmlFor="shiftName"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        Название смены *
                    </Label>
                    <Input
                        id="shiftName"
                        type="text"
                        placeholder="Введите название смены"
                        value={formData.shiftName}
                        onChange={(e) =>
                            handleInputChange("shiftName", e.target.value)
                        }
                        className="h-12 rounded-xl border-gray-200 dark:border-gray-600"
                        required
                    />
                </div>

                {/* Object Selection */}
                <div className="space-y-2">
                    <CustomCombobox
                        label="Объект"
                        placeholder="Выберите объект"
                        value={formData.objectId}
                        onChange={(value) =>
                            handleInputChange("objectId", value)
                        }
                        options={
                            objectOptions.length > 0
                                ? objectOptions
                                : [
                                      {
                                          value: "no-objects",
                                          label: "Нет доступных объектов",
                                      },
                                  ]
                        }
                        required
                    />
                </div>

                {/* Late Tolerance Minutes */}
                <div className="space-y-2">
                    <Label
                        htmlFor="lateToleranceMinutes"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        Допустимое опоздание (минуты)
                    </Label>
                    <Input
                        id="lateToleranceMinutes"
                        type="number"
                        placeholder="0"
                        value={formData.lateToleranceMinutes}
                        onChange={(e) =>
                            handleInputChange(
                                "lateToleranceMinutes",
                                e.target.value
                            )
                        }
                        className="h-12 rounded-xl border-gray-200 dark:border-gray-600"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        0 - если не нужно считать опоздания
                    </p>
                </div>

                {/* Overtime After Minutes */}
                <div className="space-y-2">
                    <Label
                        htmlFor="overtimeAfterMinutes"
                        className="text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                        Переработка (минуты)
                    </Label>
                    <Input
                        id="overtimeAfterMinutes"
                        type="number"
                        placeholder="0"
                        value={formData.overtimeAfterMinutes}
                        onChange={(e) =>
                            handleInputChange(
                                "overtimeAfterMinutes",
                                e.target.value
                            )
                        }
                        className="h-12 rounded-xl border-gray-200 dark:border-gray-600"
                    />
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        0 - если не нужно считать переработку
                    </p>
                </div>
            </div>
        </CustomModal>
    );
};

export default AddShiftModal;
