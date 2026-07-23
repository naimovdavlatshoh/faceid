import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CustomCombobox } from "@/components/ui/custom-form";
import CustomModal from "@/components/ui/custom-modal";
import { GetDataSimple, PostDataTokenJson } from "@/services/data";
import { toast } from "sonner";
import { useTranslation } from "react-i18next";

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
    const { t } = useTranslation();
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
            toast.error(t("shifts.addFillRequired"));
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

            toast.success(t("shifts.created"));
            handleClose();
            onShiftCreated();
        } catch (error: any) {
            console.error("Error creating shift:", error);
            toast.error(error.response?.data?.error || t("shifts.createError"));
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
            title={t("shifts.addTitle")}
            onConfirm={createShift}
            onCancel={handleClose}
            confirmText={isCreating ? t("shifts.creating") : t("shifts.createShiftSubmit")}
            cancelText={t("common.cancel")}
            size="md"
        >
            <div className="space-y-4">
                {/* Shift Name */}
                <div className="space-y-2">
                    <Label
                        htmlFor="shiftName"
                        className="text-sm font-medium text-slate-700 "
                    >
                        {t("shifts.nameRequired")}
                    </Label>
                    <Input
                        id="shiftName"
                        type="text"
                        placeholder={t("shifts.addNamePlaceholder")}
                        value={formData.shiftName}
                        onChange={(e) =>
                            handleInputChange("shiftName", e.target.value)
                        }
                        className="h-12 rounded-xl border-slate-200 "
                        required
                    />
                </div>

                {/* Object Selection */}
                <div className="space-y-2">
                    <CustomCombobox
                        label={t("shifts.objectLabel")}
                        placeholder={t("shifts.objectPlaceholder")}
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
                                          label: t("shifts.noObjects"),
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
                        className="text-sm font-medium text-slate-700 "
                    >
                        {t("shifts.allowedLate")}
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
                        className="h-12 rounded-xl border-slate-200"
                    />
                    <p className="text-xs text-slate-500 ">
                        {t("shifts.hintLate")}
                    </p>
                </div>

                {/* Overtime After Minutes */}
                <div className="space-y-2">
                    <Label
                        htmlFor="overtimeAfterMinutes"
                        className="text-sm font-medium text-slate-700 "
                    >
                        {t("shifts.overtimeMinutes")}
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
                        className="h-12 rounded-xl border-slate-200 "
                    />
                    <p className="text-xs text-slate-500 ">
                        {t("shifts.hintOvertime")}
                    </p>
                </div>
            </div>
        </CustomModal>
    );
};

export default AddShiftModal;
