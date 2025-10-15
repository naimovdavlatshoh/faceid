import CustomModal from "@/components/ui/custom-modal";
import { CustomInput, CustomCombobox } from "@/components/ui/custom-form";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { PostDataTokenJson, GetDataSimple } from "@/services/data";

interface AddPositionModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSuccess: () => void;
}

interface Object {
    object_id: number;
    object_name: string;
}

const AddPositionModal = ({
    open,
    onOpenChange,
    onSuccess,
}: AddPositionModalProps) => {
    const [positionName, setPositionName] = useState("");
    const [selectedObjectId, setSelectedObjectId] = useState<string>("");
    const [objects, setObjects] = useState<Object[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Fetch objects when modal opens
    useEffect(() => {
        if (open) {
            fetchObjects();
        }
    }, [open]);

    const fetchObjects = async () => {
        try {
            const data = await GetDataSimple("api/faceid/info");
            setObjects(data || []);
        } catch (error: any) {
            console.error("Error fetching objects:", error);
            toast.error(error.response.data.error);
        }
    };

    const handleAddPosition = async () => {
        if (!positionName.trim()) {
            toast.error("Пожалуйста, введите название должности");
            return;
        }

        if (!selectedObjectId) {
            toast.error("Пожалуйста, выберите объект");
            return;
        }

        try {
            setIsSubmitting(true);
            await PostDataTokenJson("api/staff/position/create", {
                object_id: parseInt(selectedObjectId),
                roles_name: positionName.trim(),
            });

            toast.success("Должность успешно создана!", {
                description: `${positionName} была добавлена в систему.`,
                duration: 3000,
            });

            onSuccess();
            setPositionName("");
            setSelectedObjectId("");
            onOpenChange(false);
        } catch (error: any) {
            console.error("Error creating position:", error);
            toast.error(error.response.data.error);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        toast.info("Создание должности отменено", {
            description: "Изменения не были сохранены.",
            duration: 2000,
        });

        setPositionName("");
        setSelectedObjectId("");
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
                <CustomCombobox
                    label="Объект"
                    placeholder="Выберите объект"
                    value={selectedObjectId}
                    onChange={(value) => setSelectedObjectId(value)}
                    options={objects
                        .filter(
                            (object) =>
                                object && object.object_id && object.object_name
                        )
                        .map((object) => ({
                            value: object.object_id.toString(),
                            label: object.object_name,
                        }))}
                    required
                />
            </div>
        </CustomModal>
    );
};

export default AddPositionModal;
