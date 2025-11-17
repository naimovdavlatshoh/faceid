import { useState } from "react";
import CustomModal from "@/components/ui/custom-modal";
import { PostDataTokenJson } from "@/services/data";
import { toast } from "sonner";

interface Shift {
    shift_id: number;
    shift_name: string;
    overtime_after_minutes: number;
    late_tolerance_minutes: number;
    is_active: number;
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
    const [isDeleting, setIsDeleting] = useState(false);

    const handleClose = () => {
        setIsDeleting(false);
        onClose();
    };

    const deleteShift = async () => {
        if (!shift) {
            toast.error("Смена не выбрана");
            return;
        }

        try {
            setIsDeleting(true);

            console.log("Deleting shift:", shift.shift_id);

            await PostDataTokenJson(`api/shift/delete/${shift.shift_id}`, {});

            toast.success("Смена успешно удалена");
            handleClose();
            onShiftDeleted();
        } catch (error: any) {
            console.error("Error deleting shift:", error);
            handleClose();
            toast.error(error.response?.data?.error || "Ошибка удаления смены");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <CustomModal
            showTrigger={false}
            open={isOpen}
            onOpenChange={(open) => !open && handleClose()}
            title="Подтверждение удаления"
            confirmText={isDeleting ? "Удаление..." : "Удалить"}
            cancelText="Отмена"
            confirmBg="bg-red-500"
            confirmBgHover="bg-red-500/70"
            onConfirm={deleteShift}
            onCancel={handleClose}
            size="md"
            showCloseButton={false}
        >
            <div className="space-y-2">
                <p className="text-sm text-gray-600 ">
                    Вы уверены, что хотите удалить смену{" "}
                    <span className="font-semibold text-gray-900 ">
                        {shift?.shift_name}
                    </span>
                    ? Это действие нельзя отменить.
                </p>
            </div>
        </CustomModal>
    );
};

export default DeleteShiftModal;
