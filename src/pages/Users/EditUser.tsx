import CustomModal from "@/components/ui/custom-modal";
import {
    CustomInput,
    CustomCombobox,
    CustomDatePicker,
    CustomTextarea,
} from "@/components/ui/custom-form";
import { useState } from "react";
import { GrEdit } from "react-icons/gr";

import { toast } from "sonner";

const EditUser = () => {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        name: "",
        email: "",
        phone: "",
        role: "User",
        status: "Active",
        department: "",
        joinDate: undefined as Date | undefined,
        bio: "",
    });
    console.log(isModalOpen);

    const handleAddUser = () => {
        // Here you would typically add the user to your data source
        console.log("Adding new user:", newUser);

        // Show success toast
        toast.success("Пользователь успешно добавлен!", {
            description: `${newUser.name} был добавлен в систему.`,
            duration: 3000,
        });

        setIsModalOpen(false);
        setNewUser({
            name: "",
            email: "",
            phone: "",
            role: "User",
            status: "Active",
            department: "",
            joinDate: undefined,
            bio: "",
        });
    };

    const handleCancel = () => {
        // Show info toast
        toast.info("Создание пользователя отменено", {
            description: "Изменения не были сохранены.",
            duration: 2000,
        });

        setIsModalOpen(false);
        setNewUser({
            name: "",
            email: "",
            phone: "",
            role: "User",
            status: "Active",
            department: "",
            joinDate: undefined,
            bio: "",
        });
    };

    

    return (
        <CustomModal
            trigger={
                <button className="rounded-full p-2  hover:bg-gray-200 ">
                    <GrEdit className="w-4 h-4" />
                </button>
            }
            showTrigger={true}
            title="Добавить нового пользователя"
            onConfirm={handleAddUser}
            onCancel={handleCancel}
            confirmText="Добавить пользователя"
            cancelText="Отмена"
            size="xl"
        >
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CustomInput
                        label="Полное имя"
                        placeholder="Введите полное имя"
                        value={newUser.name}
                        onChange={(value) =>
                            setNewUser({ ...newUser, name: value })
                        }
                        required
                    />
                    <CustomCombobox
                        label="Отделение"
                        placeholder="Выберите отдел"
                        value={newUser.department}
                        onChange={(value) =>
                            setNewUser({ ...newUser, department: value })
                        }
                        options={[
                            { value: "IT", label: "Information Technology" },
                            { value: "HR", label: "Human Resources" },
                            { value: "Finance", label: "Finance" },
                            { value: "Marketing", label: "Marketing" },
                            { value: "Sales", label: "Sales" },
                            { value: "Operations", label: "Operations" },
                        ]}
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CustomCombobox
                        label="Роль"
                        placeholder="Выберите роль"
                        value={newUser.role}
                        onChange={(value) =>
                            setNewUser({ ...newUser, role: value })
                        }
                        options={[
                            { value: "User", label: "User" },
                            { value: "Admin", label: "Administrator" },
                            { value: "Moderator", label: "Moderator" },
                            { value: "Manager", label: "Manager" },
                        ]}
                        required
                    />

                    <CustomCombobox
                        label="Статус"
                        placeholder="Выберите статус"
                        value={newUser.status}
                        onChange={(value) =>
                            setNewUser({ ...newUser, status: value })
                        }
                        options={[
                            { value: "Active", label: "Active" },
                            { value: "Inactive", label: "Inactive" },
                            { value: "Pending", label: "Pending" },
                        ]}
                        required
                    />
                </div>

                <CustomDatePicker
                    label="Дата присоединения"
                    placeholder="Выберите дату присоединения"
                    value={newUser.joinDate}
                    onChange={(date) =>
                        setNewUser({ ...newUser, joinDate: date })
                    }
                />

                <CustomTextarea
                    label="Био"
                    placeholder="Введите биографию или описание пользователя"
                    value={newUser.bio}
                    onChange={(value) => setNewUser({ ...newUser, bio: value })}
                    rows={3}
                />
            </div>
        </CustomModal>
    );
};

export default EditUser;
