import { useState, useEffect } from "react";
import CustomModal from "@/components/ui/custom-modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { GetDataSimple, PostDataTokenJson } from "@/services/data";
import { toast } from "sonner";

interface Object {
    id: number;
    name: string;
}

interface AddUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onUserCreated: () => void;
}

const AddUserModal = ({
    isOpen,
    onClose,
    onUserCreated,
}: AddUserModalProps) => {
    const [objects, setObjects] = useState<Object[]>([]);
    const [selectedObjectId, setSelectedObjectId] = useState<number | null>(
        null
    );
    const [userName, setUserName] = useState("");
    const [isCreating, setIsCreating] = useState(false);

    // Fetch objects for dropdown
    const fetchObjects = async () => {
        try {
            // Assuming there's an objects API endpoint
            const data = await GetDataSimple("api/objects/list");
            setObjects(data.result || data);
        } catch (error) {
            console.error("Error fetching objects:", error);
            // For now, use mock data
            setObjects([
                { id: 1, name: "Объект 1" },
                { id: 2, name: "Объект 2" },
                { id: 3, name: "Объект 3" },
            ]);
        }
    };

    // Create new user
    const createUser = async () => {
        if (!selectedObjectId || !userName.trim()) {
            toast.error("Пожалуйста, заполните все поля");
            return;
        }

        try {
            setIsCreating(true);
            // Assuming there's a create user API endpoint
            await PostDataTokenJson("api/faceid/users/create", {
                name: userName,
                object_id: selectedObjectId,
            });

            toast.success("Пользователь успешно создан");
            handleClose();
            onUserCreated();
        } catch (error) {
            console.error("Error creating user:", error);
            toast.error("Ошибка создания пользователя");
        } finally {
            setIsCreating(false);
        }
    };

    const handleClose = () => {
        setUserName("");
        setSelectedObjectId(null);
        onClose();
    };

    // Fetch objects when modal opens
    useEffect(() => {
        if (isOpen) {
            fetchObjects();
        }
    }, [isOpen]);

    return (
        <CustomModal
            showTrigger={false}
            open={isOpen}
            onOpenChange={handleClose}
            title="Добавить пользователя"
            confirmText={isCreating ? "Создание..." : "Создать"}
            cancelText="Отмена"
            confirmBg="bg-black"
            confirmBgHover="bg-black/70"
            onConfirm={createUser}
            onCancel={handleClose}
            size="md"
            showCloseButton={true}
        >
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="userName">Имя пользователя</Label>
                    <Input
                        id="userName"
                        placeholder="Введите имя пользователя"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        disabled={isCreating}
                    />
                </div>

                <div className="space-y-2">
                    <Label htmlFor="objectSelect">Объект</Label>
                    <Select
                        value={selectedObjectId?.toString() || ""}
                        onValueChange={(value) =>
                            setSelectedObjectId(Number(value))
                        }
                        disabled={isCreating}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Выберите объект" />
                        </SelectTrigger>
                        <SelectContent>
                            {objects.map((object) => (
                                <SelectItem
                                    key={object.id}
                                    value={object.id.toString()}
                                >
                                    {object.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>
        </CustomModal>
    );
};

export default AddUserModal;
