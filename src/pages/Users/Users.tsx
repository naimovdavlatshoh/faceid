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
// import EditUser from "./EditUser";
import { CiTrash } from "react-icons/ci";
import { HiDotsVertical } from "react-icons/hi";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CustomModal from "@/components/ui/custom-modal";
import { toast } from "sonner";
import { IoMdAdd } from "react-icons/io";
import { GetDataSimple, PostSimple } from "@/services/data";

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

const Users = () => {
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
    const searchTimeoutRef = useRef<number | null>(null);

    const fetchUsers = async (page: number = 1, limit: number = 10) => {
        try {
            const data: ApiResponse = await GetDataSimple(
                `api/faceid/users/list?page=${page}&limit=${limit}&object_id=1`
            );

            setUsers(data.result);
            setTotalPages(data.pages);
        } catch (error) {
            console.error("Error fetching users:", error);
            toast.error("Ошибка загрузки сотрудников");
        }
    };

    const searchUsers = async (keyword: string) => {
        if (keyword.length < 3) {
            // If keyword is less than 3 characters, fetch all users
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
            setTotalPages(1); // Search results are typically on one page
        } catch (error) {
            console.error("Error searching users:", error);
            toast.error("Ошибка поиска сотрудников");
        } finally {
            setIsSearching(false);
        }
    };

    // Use users directly since we're doing server-side search
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

    // Debounced search handler
    const handleSearchChange = (value: string) => {
        setSearchQuery(value);

        // Clear any existing timeout
        if (searchTimeoutRef.current) {
            clearTimeout(searchTimeoutRef.current);
        }

        // Set a new timeout for search
        searchTimeoutRef.current = setTimeout(() => {
            searchUsers(value);
        }, 100); // 500ms delay
    };

    const handleSelectUser = (userId: number) => {
        setSelectedUsers((prev) =>
            prev.includes(userId)
                ? prev.filter((id) => id !== userId)
                : [...prev, userId]
        );
    };

    const handleSelectAll = () => {
        if (selectedUsers.length === currentUsers.length) {
            setSelectedUsers([]);
        } else {
            setSelectedUsers(currentUsers.map((user) => user.faceid_user_id));
        }
    };

    const openDeleteModal = (user: { id: number; name: string }) => {
        setUserToDelete({ id: user.id, name: user.name });
        setIsDeleteOpen(true);
    };

    const handleConfirmDelete = () => {
        if (userToDelete) {
            toast.success("Сотрудник удалён", {
                description: `${userToDelete.name} успешно удалён.`,
                duration: 2500,
            });
        }
        setIsDeleteOpen(false);
        setUserToDelete(null);
    };

    const handleCancelDelete = () => {
        setIsDeleteOpen(false);
        setUserToDelete(null);
    };

    useEffect(() => {
        fetchUsers(currentPage, itemsPerPage);
    }, []);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (searchTimeoutRef.current) {
                clearTimeout(searchTimeoutRef.current);
            }
        };
    }, []);

    return (
        <div className="space-y-6">
            <div className="space-y-4 mb-10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl  font-semibold text-gray-900 ">
                            Все сотрудники
                        </h1>
                    </div>
                    <Link to="/users/create">
                        <Button className="bg-black text-white duration-300 hover:bg-black/70 rounded-xl ">
                            <IoMdAdd className="w-3 h-3" /> Добавить
                        </Button>
                    </Link>
                </div>
                <CustomBreadcrumb
                    items={[
                        { label: "Панель управления", href: "/" },
                        { label: "Сотрудники", isActive: true },
                    ]}
                />
            </div>

            <Card className="bg-white  rounded-2xl shadow-lg border border-gray-100 ">
                <CardHeader className="pb-4">
                    <div className="flex flex-col space-y-4">
                        <div className="flex justify-start w-full">
                            <SearchInput
                                placeholder="Поиск сотрудников..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                            />
                        </div>

                        {/* Tabs */}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-mainbg/10 ">
                            <TableRow>
                                <TableHead className="text-maintx ">
                                    <Checkbox
                                        checked={
                                            selectedUsers.length ===
                                                currentUsers.length &&
                                            currentUsers.length > 0
                                        }
                                        onCheckedChange={handleSelectAll}
                                    />
                                </TableHead>
                                <TableHead className="text-maintx ">
                                    Сотрудник
                                </TableHead>
                                <TableHead className="text-maintx ">
                                    Зарплата
                                </TableHead>
                                <TableHead className="text-maintx ">
                                    Смена
                                </TableHead>
                                <TableHead className="text-maintx ">
                                    Тип зарплаты
                                </TableHead>
                                <TableHead className="text-maintx ">
                                    Дата создания
                                </TableHead>
                                <TableHead className="text-right text-maintx ">
                                    Действия
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isSearching ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="text-center py-8"
                                    >
                                        <div className="flex items-center justify-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                                            <span className="text-gray-500">
                                                Поиск...
                                            </span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : currentUsers?.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="text-center py-8 text-gray-500"
                                    >
                                        {searchQuery
                                            ? "Сотрудники не найдены"
                                            : "Нет сотрудников"}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                currentUsers?.map((user) => (
                                    <TableRow
                                        key={user.faceid_user_id}
                                        className="border-dashed border-gray-200  hover:bg-gray-100 "
                                    >
                                        <TableCell className="w-12">
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
                                        <TableCell>
                                            <div className="flex items-center space-x-3">
                                                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-maintx">
                                                    <img
                                                        src={
                                                            user?.image_path
                                                                ? user?.image_path
                                                                : "/avatar-1.webp"
                                                        }
                                                        alt={""}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <Link
                                                        to={`/details/${user.faceid_user_id}`}
                                                        className="text-sm font-medium text-gray-900  hover:underline cursor-pointer transition-all duration-200"
                                                    >
                                                        {user.name}
                                                    </Link>
                                                    <p className="text-xs text-gray-400">
                                                        {user.position_name}
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-600 ">
                                            {user.salary.toLocaleString()} сум
                                        </TableCell>
                                        <TableCell className="text-gray-600">
                                            {user.shift_name || "—"}
                                        </TableCell>
                                        <TableCell className="text-gray-600 ">
                                            {user.salary_type_text || "—"}
                                        </TableCell>
                                        <TableCell className="text-gray-600 ">
                                            {new Date(
                                                user.created_at
                                            ).toLocaleDateString("ru-RU")}
                                        </TableCell>

                                        <TableCell className="text-right">
                                            {/* <EditUser /> */}
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="rounded-full outline-none focus:outline-none focus:ring-0 focus:border-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:border-0 hover:bg-gray-200 p-2 transition-colors duration-200">
                                                        <HiDotsVertical className="w-4 h-4 text-gray-500" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        disabled={true}
                                                        className="flex items-center gap-2 text-red-600 hover:text-red-600"
                                                        onClick={() =>
                                                            openDeleteModal({
                                                                id: user.faceid_user_id,
                                                                name: user.name,
                                                            })
                                                        }
                                                    >
                                                        <CiTrash className="w-4 h-4" />
                                                        <span>Удалить</span>
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
                <CardFooter className="flex justify-between items-center border-t border-gray-200  pt-4">
                    <div className="flex items-center gap-2">
                        <label htmlFor="" className="text-gray-500 text-sm">
                            Строк на странице:
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
                title="Подтверждение удаления"
                confirmText="Удалить"
                cancelText="Отмена"
                confirmBg="bg-red-500"
                confirmBgHover="bg-red-500/70"
                onConfirm={handleConfirmDelete}
                onCancel={handleCancelDelete}
                size="md"
                showCloseButton={false}
            >
                <div className="space-y-2">
                    <p className="text-sm text-gray-600 ">
                        Вы уверены, что хотите удалить сотрудника{" "}
                        <span className="font-semibold text-gray-900 ">
                            {userToDelete?.name}
                        </span>
                        ? Это действие нельзя отменить.
                    </p>
                </div>
            </CustomModal>
        </div>
    );
};

export default Users;
