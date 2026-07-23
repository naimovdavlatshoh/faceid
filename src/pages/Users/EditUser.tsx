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
import { useTranslation } from "react-i18next";

const EditUser = () => {
    const { t } = useTranslation();
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
        toast.success(t("editUser.added"), {
            description: t("editUser.addedDesc", { name: newUser.name }),
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
        toast.info(t("editUser.cancelled"), {
            description: t("editUser.cancelledDesc"),
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
                <button className="rounded-full p-2  hover:bg-slate-200 ">
                    <GrEdit className="w-4 h-4" />
                </button>
            }
            showTrigger={true}
            title={t("editUser.title")}
            onConfirm={handleAddUser}
            onCancel={handleCancel}
            confirmText={t("editUser.addUser")}
            cancelText={t("common.cancel")}
            size="xl"
        >
            <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <CustomInput
                        label={t("editUser.fullName")}
                        placeholder={t("editUser.fullNamePlaceholder")}
                        value={newUser.name}
                        onChange={(value) =>
                            setNewUser({ ...newUser, name: value })
                        }
                        required
                    />
                    <CustomCombobox
                        label={t("editUser.department")}
                        placeholder={t("editUser.departmentPlaceholder")}
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
                        label={t("editUser.role")}
                        placeholder={t("editUser.rolePlaceholder")}
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
                        label={t("editUser.status")}
                        placeholder={t("editUser.statusPlaceholder")}
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
                    label={t("editUser.joinDate")}
                    placeholder={t("editUser.joinDatePlaceholder")}
                    value={newUser.joinDate}
                    onChange={(date) =>
                        setNewUser({ ...newUser, joinDate: date })
                    }
                />

                <CustomTextarea
                    label={t("editUser.bio")}
                    placeholder={t("editUser.bioPlaceholder")}
                    value={newUser.bio}
                    onChange={(value) => setNewUser({ ...newUser, bio: value })}
                    rows={3}
                />
            </div>
        </CustomModal>
    );
};

export default EditUser;
