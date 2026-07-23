import CustomModal from "@/components/ui/custom-modal";
import { CustomInput } from "@/components/ui/custom-form";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PostDataTokenJson } from "@/services/data";
import { useTranslation } from "react-i18next";

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
    const { t } = useTranslation();
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
            toast.error(t("positions.nameRequired"));
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

            toast.success(t("positions.updated"), {
                description: t("positions.updatedDesc", { name: positionName }),
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
            title={t("positions.editTitle")}
            onConfirm={handleUpdatePosition}
            onCancel={handleCancel}
            confirmText={isSubmitting ? t("positions.saving") : t("common.saveChanges")}
            cancelText={t("common.cancel")}
            size="md"
            confirmBg="bg-maintx"
            confirmBgHover="bg-maintx/80"
            // disabled={isSubmitting || !positionName.trim() || !selectedObjectId}
        >
            <div className="space-y-4">
                <CustomInput
                    label={t("positions.nameLabel")}
                    placeholder={t("positions.namePlaceholder")}
                    value={positionName}
                    onChange={(value) => setPositionName(value)}
                    required
                />
            </div>
        </CustomModal>
    );
};

export default UpdatePositionModal;
