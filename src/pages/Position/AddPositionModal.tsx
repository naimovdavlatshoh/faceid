import CustomModal from "@/components/ui/custom-modal";
import { CustomInput } from "@/components/ui/custom-form";
import { useState } from "react";
import { toast } from "sonner";
import { PostDataTokenJson } from "@/services/data";

interface AddPositionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

const AddPositionModal = ({
    open,
    onOpenChange,
    onSuccess,
}: AddPositionModalProps) => {
    const [positionName, setPositionName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleAddPosition = async () => {
        if (!positionName.trim()) {
            toast.error("Пожалуйста, введите название должности");
            return;
        }

        try {
            setIsSubmitting(true);
            await PostDataTokenJson("api/staff/position/create", {
                object_id: localStorage.getItem("object"),
                position_name: positionName.trim(),
            });

            toast.success("Должность успешно создана!", {
                description: `${positionName} была добавлена в систему.`,
                duration: 3000,
            });

            onSuccess();
            setPositionName("");

            onOpenChange(false);
        } catch (error: any) {
            console.error("Error creating position:", error);
            toast.error(error.response.data.error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setPositionName("");

        onOpenChange(false);
    };

    return (
        <CustomModal
            showTrigger={false}
            open={open}
            onOpenChange={onOpenChange}
            title="Добавить новую должность"
            onConfirm={handleAddPosition}
            onCancel={handleCancel}
            confirmText={isSubmitting ? "Создание..." : "Добавить должность"}
            cancelText="Отмена"
            size="md"
            confirmBg="bg-maintx"
            confirmBgHover="bg-maintx/80"
            // disabled={isSubmitting || !positionName.trim() || !selectedObjectId}
        >
            <div className="space-y-4">
                <CustomInput
                    label="Название должности"
                    placeholder="Введите название должности"
                    value={positionName}
                    onChange={(value) => setPositionName(value)}
                    required
                />
            </div>
        </CustomModal>
    );
};

export default AddPositionModal;
