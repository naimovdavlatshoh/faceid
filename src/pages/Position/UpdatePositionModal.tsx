import CustomModal from "@/components/ui/custom-modal";
import { CustomInput } from "@/components/ui/custom-form";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PostDataTokenJson } from "@/services/data";

interface ApiPosition {
    position_id: number;
    object_id: number;
    position_name: string;
    created_at: string;
}

interface UpdatePositionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    position: ApiPosition | null;
    onSuccess: () => void;
}

const UpdatePositionModal = ({
    open,
    onOpenChange,
    position,
    onSuccess,
}: UpdatePositionModalProps) => {
    const [positionName, setPositionName] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch objects when modal opens

    useEffect(() => {
        if (position) {
            setPositionName(position.position_name);
        }
    }, [position]);

    const handleUpdatePosition = async () => {
        if (!positionName.trim()) {
            toast.error("Пожалуйста, введите название должности");
            return;
        }

        if (!position) return;

        try {
            setIsSubmitting(true);
            await PostDataTokenJson(
                `api/staff/position/update/${position.position_id}`,
                {
                    object_id: localStorage.getItem("object"),
                    position_name: positionName.trim(),
                }
            );

            toast.success("Должность успешно обновлена!", {
                description: `${positionName} была обновлена в системе.`,
                duration: 3000,
            });

            onSuccess();
            setPositionName("");
            onOpenChange(false);
        } catch (error: any) {
            console.error("Error updating position:", error);
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
            title="Редактировать должность"
            onConfirm={handleUpdatePosition}
            onCancel={handleCancel}
            confirmText={isSubmitting ? "Сохранение..." : "Сохранить изменения"}
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

export default UpdatePositionModal;
