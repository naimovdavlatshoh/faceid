import { useState } from "react";
import CustomModal from "@/components/ui/custom-modal";
import { PostDataTokenJson } from "@/services/data";
import { toast } from "sonner";
import { useTranslation, Trans } from "react-i18next";

interface Shift {
    shift_id: number;
    shift_name: string;
    overtime_after_minutes: number;
    late_tolerance_minutes: number;
    is_active: string;
    created_at: string;
    updated_at: string;
}

interface DeleteShiftModalProps {
    isOpen: boolean;
    onClose: () => void;
    onShiftDeleted: () => void;
    shift: Shift | null;
}

const DeleteShiftModal = ({
    isOpen,
    onClose,
    onShiftDeleted,
    shift,
}: DeleteShiftModalProps) => {
    const { t } = useTranslation();
    const [isDeleting, setIsDeleting] = useState(false);

    const handleClose = () => {
        setIsDeleting(false);
        onClose();
    };

    const deleteShift = async () => {
        if (!shift) {
            toast.error(t("shifts.notSelected"));
            return;
        }

        try {
            setIsDeleting(true);

            console.log("Deleting shift:", shift.shift_id);

            await PostDataTokenJson(`api/shift/delete/${shift.shift_id}`, {});

            toast.success(t("shifts.shiftDeleted"));
            handleClose();
            onShiftDeleted();
        } catch (error: any) {
            console.error("Error deleting shift:", error);
            handleClose();
            toast.error(error.response?.data?.error || t("shifts.deleteError"));
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <CustomModal
            showTrigger={false}
            open={isOpen}
            onOpenChange={(open) => !open && handleClose()}
            title={t("common.confirmDeleteTitle")}
            confirmText={isDeleting ? t("common.deleting") : t("common.delete")}
            cancelText={t("common.cancel")}
            confirmBg="bg-red-500"
            confirmBgHover="bg-red-500/70"
            onConfirm={deleteShift}
            onCancel={handleClose}
            size="md"
            showCloseButton={false}
        >
            <div className="space-y-2">
                <p className="text-sm text-slate-600 ">
                    <Trans
                        i18nKey="shifts.deleteConfirm"
                        values={{ name: shift?.shift_name }}
                        components={{ 1: <span className="font-semibold text-slate-900 " /> }}
                    />
                </p>
            </div>
        </CustomModal>
    );
};

export default DeleteShiftModal;
