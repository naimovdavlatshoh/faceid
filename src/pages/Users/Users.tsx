import {
    Card,
    CardContent,
    CardHeader,
    CardFooter,
} from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CustomPagination from "@/components/ui/custom-pagination";
import SearchInput from "@/components/ui/search-input";
import CustomBreadcrumb from "@/components/ui/custom-breadcrumb";
import { useEffect, useState, useRef } from "react";
import { CiTrash } from "react-icons/ci";
import { HiDotsVertical } from "react-icons/hi";
import { FiKey, FiCopy, FiCheck } from "react-icons/fi";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CustomModal from "@/components/ui/custom-modal";
import { toast } from "sonner";
import { IoMdAdd } from "react-icons/io";
import { useTranslation, Trans } from "react-i18next";
import { GetDataSimple, PostSimple, DeleteFaceIdUser } from "@/services/data";

// API response types
interface ApiUser {
    faceid_user_id: number;
    name: string;
    salary: number;
    image_id: number;
    image_path: string;
    created_at: string;
    position_name: string;
    shift_name?: string;
    salary_type_text?: string;
}

interface ApiResponse {
    page: number;
    limit: number;
    count: number;
    pages: number;
    result: ApiUser[];
}

// Объект из localStorage.objects (all_objects при логине)
interface StoredObject {
    object_id: number;
    object_name: string;
    is_telegram_notification: number;
    is_parent_notification: number;
}

// Определяем, есть ли у текущего объекта доступ к Telegram-уведомлениям.
// Флаги берём из all_objects по текущему object_id — так переключение
// между объектами автоматически меняет видимость кнопки.
const getCurrentObjectNotificationAccess = (): boolean => {
    try {
        const currentObjectId = Number(localStorage.getItem("object"));
        const raw = localStorage.getItem("objects");
        if (!raw) return false;

        const objects: StoredObject[] = JSON.parse(raw);
        const current = objects.find((o) => o.object_id === currentObjectId);
        if (!current) return false;

        return (
            current.is_telegram_notification === 1 ||
            current.is_parent_notification === 1
        );
    } catch {
        return false;
    }
};

const Users = () => {
    const { t } = useTranslation();
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<{
        id: number;
        name: string;
    } | null>(null);
    const [users, setUsers] = useState<ApiUser[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [isSearching, setIsSearching] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const searchTimeoutRef = useRef<number | null>(null);

    // Доступ к выдаче кода — вычисляем один раз при монтировании.
    const [hasNotificationAccess] = useState<boolean>(
        getCurrentObjectNotificationAccess
    );

    // Состояние модалки кода доступа
    const [isCodeOpen, setIsCodeOpen] = useState(false);
    const [codeLoadingId, setCodeLoadingId] = useState<number | null>(null);
    const [accessCode, setAccessCode] = useState<string>("");
    const [codeUserName, setCodeUserName] = useState<string>("");
    const [copied, setCopied] = useState(false);

    const fetchUsers = async (page: number = 1, limit: number = 10) => {
        try {
            const data: ApiResponse = await GetDataSimple(
                `api/faceid/users/list?page=${page}&limit=${limit}&object_id=1`
            );

            setUsers(data.result);
            setTotalPages(data.pages);
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error(t("users.loadError"));
        }
    };

    const searchUsers = async (keyword: string) => {
        if (keyword.length < 3) {
            fetchUsers(currentPage, itemsPerPage);
            return;
        }

        try {
            setIsSearching(true);
            const response = await PostSimple(
                `api/faceid/user/search?object_id=1&keyword=${keyword}`,
                {}
            );

            setUsers(response.data.result || []);
            setTotalPages(1);
        } catch (error) {
            console.error("Error searching users:", error);
            toast.error(t("users.searchError"));
        } finally {
            setIsSearching(false);
        }
    };

    const currentUsers = users;

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        fetchUsers(page, itemsPerPage);
    };

    const handleItemsPerPageChange = (value: string) => {
        const newLimit = Number(value);
        setItemsPerPage(newLimit);
        setCurrentPage(1);
        fetchUsers(1, newLimit);
    };

    const handleSearchChange = (value: string) => {
        setSearchQuery(value);

        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        searchTimeoutRef.current = setTimeout(() => {
            searchUsers(value);
        }, 100);
    };

    const handleSelectUser = (userId: number) => {
        setSelectedUsers((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSelectAll = () => {
        if (selectedUsers?.length === currentUsers?.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(currentUsers?.map((user) => user.faceid_user_id));
        }
    };

    const openDeleteModal = (user: { id: number; name: string }) => {
        setUserToDelete({ id: user.id, name: user.name });
        setIsDeleteOpen(true);
    };

    // Получение кода доступа сотрудника
    const handleGetAccessCode = async (user: ApiUser) => {
        try {
            setCodeLoadingId(user.faceid_user_id);
            const response = await GetDataSimple(
                `api/faceid/access-code/${user.faceid_user_id}`
            );

            const code = response?.access_code ?? response?.data?.access_code;
            if (!code) {
                toast.error(t("users.accessCodeFail"));
                return;
            }

            setAccessCode(String(code));
            setCodeUserName(user.name);
            setCopied(false);
            setIsCodeOpen(true);
        } catch (error: any) {
            console.error("Error getting access code:", error);
            toast.error(t("users.accessCodeError"), {
                description:
                    error?.response?.data?.message ||
                    t("users.accessCodeGenFail"),
                duration: 3000,
            });
        } finally {
            setCodeLoadingId(null);
        }
    };

    const handleCopyCode = async () => {
        try {
            await navigator.clipboard.writeText(accessCode);
            setCopied(true);
            toast.success(t("users.codeCopied"));
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error(t("users.copyFail"));
        }
    };

    const handleConfirmDelete = async () => {
        if (!userToDelete) return;

        try {
            setIsDeleting(true);
            await DeleteFaceIdUser(userToDelete.id);
            toast.success(t("users.deleted"), {
                description: t("users.deletedDesc", { name: userToDelete.name }),
                duration: 2500,
            });
            if (searchQuery.length >= 3) {
                await searchUsers(searchQuery);
            } else {
                await fetchUsers(currentPage, itemsPerPage);
            }
            setSelectedUsers((prev) =>
                prev.filter((id) => id !== userToDelete.id)
            );
        } catch (error: any) {
            console.error("Error deleting user:", error);
            toast.error(t("users.deleteError"), {
                description:
                    error?.response?.data?.message ||
                    t("users.deleteFail"),
                duration: 3000,
            });
        } finally {
            setIsDeleting(false);
            setIsDeleteOpen(false);
            setUserToDelete(null);
        }
    };

    const handleCancelDelete = () => {
        setIsDeleteOpen(false);
        setUserToDelete(null);
    };

    useEffect(() => {
        fetchUsers(currentPage, itemsPerPage);
    }, []);

    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="space-y-4 mb-6 md:mb-10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <h1 className="text-xl md:text-2xl font-semibold text-slate-900 truncate">
                            {t("users.title")}
                        </h1>
                    </div>
                    <Link to="/users/create" className="flex-shrink-0">
                        <Button className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700 text-white text-[13px] rounded-lg">
                            <IoMdAdd className="w-3 h-3" /> {t("common.add")}
                        </Button>
                    </Link>
                </div>
                <CustomBreadcrumb
                    items={[
                        { label: t("common.controlPanel"), href: "/" },
                        { label: t("nav.employees"), isActive: true },
                    ]}
                />
            </div>

            <Card className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                <CardHeader className="pb-4 px-4 md:px-6">
                    <div className="flex flex-col space-y-4">
                        <div className="flex justify-start w-full min-w-0">
                            <SearchInput
                                placeholder={t("users.searchPlaceholder")}
                                value={searchQuery}
                                onChange={handleSearchChange}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto overflow-y-visible scrollbar-hide">
                    <Table className="min-w-[640px]">
                        <TableHeader className="bg-slate-50/80 ">
                            <TableRow>
                                <TableHead className="text-slate-500 hidden md:table-cell w-12">
                                    <Checkbox
                                        checked={
                                            selectedUsers?.length ===
                                                currentUsers?.length &&
                                            currentUsers?.length > 0
                                        }
                                        onCheckedChange={handleSelectAll}
                                    />
                                </TableHead>
                                <TableHead className="text-slate-500 ">
                                    {t("users.colEmployee")}
                                </TableHead>
                                <TableHead className="text-slate-500 ">
                                    {t("users.colSalary")}
                                </TableHead>
                                <TableHead className="text-slate-500 ">
                                    {t("users.colShift")}
                                </TableHead>
                                <TableHead className="text-slate-500 ">
                                    {t("users.colSalaryType")}
                                </TableHead>
                                <TableHead className="text-slate-500 ">
                                    {t("common.createdAt")}
                                </TableHead>
                                <TableHead className="text-right text-slate-500 ">
                                    {t("common.actions")}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isSearching ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="text-center py-8"
                                    >
                                        <div className="flex items-center justify-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                                            <span className="text-slate-500">
                                                {t("common.search")}
                                            </span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : currentUsers?.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="text-center py-8 text-slate-500"
                                    >
                                        {searchQuery
                                            ? t("users.notFound")
                                            : t("users.empty")}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                currentUsers?.map((user) => (
                                    <TableRow
                                        key={user.faceid_user_id}
                                        className="border-dashed border-slate-200  hover:bg-slate-50/60 "
                                    >
                                        <TableCell className="w-12 hidden md:table-cell">
                                            <Checkbox
                                                checked={selectedUsers.includes(
                                                    user.faceid_user_id
                                                )}
                                                onCheckedChange={() =>
                                                    handleSelectUser(
                                                        user.faceid_user_id
                                                    )
                                                }
                                            />
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            <div className="flex items-center space-x-3 min-w-0">
                                                <div className="w-12 h-12 min-w-12 min-h-12 flex-shrink-0 rounded-full overflow-hidden border-2 border-blue-200">
                                                    <img
                                                        src={
                                                            user?.image_path
                                                                ? user?.image_path
                                                                : "/avatar-1.webp"
                                                        }
                                                        alt={""}
                                                        className="w-full h-full object-cover aspect-square"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <Link
                                                        to={`/details/${user.faceid_user_id}`}
                                                        className="text-[13px] font-medium text-slate-900  hover:underline cursor-pointer transition-all duration-200"
                                                    >
                                                        {user.name}
                                                    </Link>
                                                    <p className="text-[11px] text-slate-400">
                                                        {user.position_name}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-slate-600 ">
                                            {user.salary.toLocaleString()} {t("common.sum")}
                                        </TableCell>
                                        <TableCell className="text-gray-600">
                                            {user.shift_name || "—"}
                                        </TableCell>
                                        <TableCell className="text-slate-600 ">
                                            {user.salary_type_text || "—"}
                                        </TableCell>
                                        <TableCell className="text-slate-600 ">
                                            {new Date(
                                                user.created_at
                                            ).toLocaleDateString("ru-RU")}
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="rounded-full outline-none focus:outline-none focus:ring-0 focus:border-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:border-0 hover:bg-gray-200 p-2 transition-colors duration-200">
                                                        <HiDotsVertical className="w-4 h-4 text-slate-500" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    {hasNotificationAccess && (
                                                        <DropdownMenuItem
                                                            className="flex items-center gap-2"
                                                            disabled={
                                                                codeLoadingId ===
                                                                user.faceid_user_id
                                                            }
                                                            onClick={() =>
                                                                handleGetAccessCode(
                                                                    user
                                                                )
                                                            }
                                                        >
                                                            <FiKey className="w-4 h-4" />
                                                            <span>
                                                                {codeLoadingId ===
                                                                user.faceid_user_id
                                                                    ? t("users.generating")
                                                                    : t("users.accessCode")}
                                                            </span>
                                                        </DropdownMenuItem>
                                                    )}
                                                    <DropdownMenuItem
                                                        className="flex items-center gap-2 text-red-600 hover:text-red-600"
                                                        onClick={() =>
                                                            openDeleteModal({
                                                                id: user.faceid_user_id,
                                                                name: user.name,
                                                            })
                                                        }
                                                    >
                                                        <CiTrash className="w-4 h-4" />
                                                        <span>{t("common.delete")}</span>
                                                    </DropdownMenuItem>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter className="flex flex-col gap-3 sm:flex-row justify-between items-stretch sm:items-center border-t border-slate-200 pt-4 px-4 md:px-6 pb-4">
                    <div className="flex items-center gap-2">
                        <label htmlFor="" className="text-slate-500 text-sm">
                            {t("common.rowsPerPage")}
                        </label>
                        <Select
                            value={itemsPerPage.toString()}
                            onValueChange={handleItemsPerPageChange}
                        >
                            <SelectTrigger className="w-16 h-8 border-none">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="5">5</SelectItem>
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="30">30</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <CustomPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </CardFooter>
            </Card>

            {/* Delete Confirmation Modal */}
            <CustomModal
                showTrigger={false}
                open={isDeleteOpen}
                onOpenChange={setIsDeleteOpen}
                title={t("common.confirmDeleteTitle")}
                confirmText={isDeleting ? t("common.deleting") : t("common.delete")}
                cancelText={t("common.cancel")}
                confirmBg="bg-red-500"
                confirmBgHover="bg-red-500/70"
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                size="md"
                showCloseButton={false}
                footerContent={
                    <div className="flex gap-2 justify-end w-full">
                        <Button
                            variant="outline"
                            onClick={handleCancelDelete}
                            disabled={isDeleting}
                        >
                            {t("common.cancel")}
                        </Button>
                        <Button
                            onClick={handleConfirmDelete}
                            disabled={isDeleting}
                            className="bg-red-500 hover:bg-red-500/70 text-white"
                        >
                            {isDeleting ? t("common.deleting") : t("common.delete")}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-2">
                    <p className="text-sm text-slate-600 ">
                        <Trans
                            i18nKey="users.deleteConfirm"
                            values={{ name: userToDelete?.name }}
                            components={{ 1: <span className="font-semibold text-gray-900 " /> }}
                        />
                    </p>
                </div>
            </CustomModal>

            {/* Access Code Modal */}
            <CustomModal
                showTrigger={false}
                open={isCodeOpen}
                onOpenChange={setIsCodeOpen}
                title={t("users.accessCodeTitle")}
                size="md"
                showCloseButton={true}
                footerContent={
                    <div className="flex gap-2 justify-end w-full">
                        <Button
                            variant="outline"
                            onClick={() => setIsCodeOpen(false)}
                        >
                            {t("common.close")}
                        </Button>
                        <Button
                            onClick={handleCopyCode}
                            className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
                        >
                            {copied ? (
                                <FiCheck className="w-4 h-4" />
                            ) : (
                                <FiCopy className="w-4 h-4" />
                            )}
                            {copied ? t("common.copied") : t("common.copy")}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <p className="text-sm text-gray-600">
                        <Trans
                            i18nKey="users.accessCodeDesc"
                            values={{ name: codeUserName }}
                            components={{ 1: <span className="font-semibold text-gray-900" /> }}
                        />
                    </p>
                    <div className="flex items-center justify-center">
                        <span className="text-2xl font-bold tracking-[0.3em] text-gray-900 bg-slate-100 rounded-xl px-6 py-4 select-all">
                            {accessCode}
                        </span>
                    </div>
                    <p className="text-[11px] text-slate-400 text-center">
                        {t("users.accessCodeHint")}
                    </p>
                </div>
            </CustomModal>
        </div>
    );
};

export default Users;