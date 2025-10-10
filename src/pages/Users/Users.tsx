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
import { Badge } from "@/components/ui/badge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CustomPagination from "@/components/ui/custom-pagination";
import SearchInput from "@/components/ui/search-input";
import CustomBreadcrumb from "@/components/ui/custom-breadcrumb";
import { useEffect, useState } from "react";
import EditUser from "./EditUser";
import { CiTrash } from "react-icons/ci";
import { HiDotsVertical } from "react-icons/hi";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import CustomModal from "@/components/ui/custom-modal";
import { toast } from "sonner";
import { IoMdAdd } from "react-icons/io";
import { ProgressAuto } from "@/components/ui/progress";

const Users = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState(5);
    const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
    const [activeTab, setActiveTab] = useState("all");
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [userToDelete, setUserToDelete] = useState<{
        id: number;
        name: string;
    } | null>(null);

    // Random badge colors
    const badgeColors = [
        "bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300",
        "bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-300",
        "bg-purple-100 dark:bg-purple-900/20 text-purple-800 dark:text-purple-300",
        "bg-pink-100 dark:bg-pink-900/20 text-pink-800 dark:text-pink-300",
        "bg-orange-100 dark:bg-orange-900/20 text-orange-800 dark:text-orange-300",
        "bg-indigo-100 dark:bg-indigo-900/20 text-indigo-800 dark:text-indigo-300",
        "bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300",
        "bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300",
    ];

    const getRandomBadgeColor = (index: number) => {
        return badgeColors[index % badgeColors.length];
    };
    const users = [
        {
            id: 1,
            name: "Olivia Martin",
            email: "olivia.martin@email.com",
            phone: "+998 90 123-45-67",
            role: "Admin",
            status: "Active",
            avatar: "/avatar-1.webp",
        },
        {
            id: 2,
            name: "Jackson Lee",
            email: "jackson.lee@email.com",
            phone: "+998 91 234-56-78",
            role: "User",
            status: "Active",
            avatar: "/avatar-2.webp",
        },
        {
            id: 3,
            name: "Isabella Nguyen",
            email: "isabella.nguyen@email.com",
            phone: "+998 93 345-67-89",
            role: "User",
            status: "Inactive",
            avatar: "/avatar-3.webp",
        },
        {
            id: 4,
            name: "William Kim",
            email: "william.kim@email.com",
            phone: "+998 94 456-78-90",
            role: "Moderator",
            status: "Active",
            avatar: "/avatar-4.webp",
        },
        {
            id: 5,
            name: "Sofia Davis",
            email: "sofia.davis@email.com",
            phone: "+998 95 567-89-01",
            role: "User",
            status: "Active",
            avatar: "/avatar-5.webp",
        },
        {
            id: 6,
            name: "Alexander Johnson",
            email: "alexander.johnson@email.com",
            phone: "+998 97 678-90-12",
            role: "Admin",
            status: "Active",
            avatar: "/avatar-1.webp",
        },
        {
            id: 7,
            name: "Emma Wilson",
            email: "emma.wilson@email.com",
            phone: "+998 88 789-01-23",
            role: "User",
            status: "Inactive",
            avatar: "/avatar-2.webp",
        },
        {
            id: 8,
            name: "Michael Brown",
            email: "michael.brown@email.com",
            phone: "+998 99 890-12-34",
            role: "Moderator",
            status: "Active",
            avatar: "/avatar-3.webp",
        },
        {
            id: 9,
            name: "Sarah Garcia",
            email: "sarah.garcia@email.com",
            phone: "+998 90 901-23-45",
            role: "User",
            status: "Active",
            avatar: "/avatar-4.webp",
        },
        {
            id: 10,
            name: "David Martinez",
            email: "david.martinez@email.com",
            phone: "+998 91 012-34-56",
            role: "User",
            status: "Inactive",
            avatar: "/avatar-5.webp",
        },
        {
            id: 11,
            name: "Lisa Anderson",
            email: "lisa.anderson@email.com",
            phone: "+998 93 123-45-67",
            role: "Admin",
            status: "Active",
            avatar: "/avatar-1.webp",
        },
        {
            id: 12,
            name: "James Taylor",
            email: "james.taylor@email.com",
            phone: "+998 94 234-56-78",
            role: "User",
            status: "Active",
            avatar: "/avatar-2.webp",
        },
    ];

    // Filter users by tab
    const getFilteredUsersByTab = (users: any[]) => {
        switch (activeTab) {
            case "active":
                return users.filter((user) => user.status === "Active");
            case "inactive":
                return users.filter((user) => user.status === "Inactive");
            case "admin":
                return users.filter((user) => user.role === "Admin");
            case "moderator":
                return users.filter((user) => user.role === "Moderator");
            default:
                return users;
        }
    };

    // Search and pagination logic
    const searchFilteredUsers = users.filter(
        (user) =>
            user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
            user.role.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const filteredUsers = getFilteredUsersByTab(searchFilteredUsers);

    const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentUsers = filteredUsers.slice(startIndex, endIndex);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleSearch = (query: string) => {
        setSearchQuery(query);
        setCurrentPage(1); // Reset to first page when searching
    };

    const handleItemsPerPageChange = (value: string) => {
        setItemsPerPage(Number(value));
        setCurrentPage(1); // Reset to first page when changing items per page
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
            setSelectedUsers(currentUsers.map((user) => user.id));
        }
    };

    const handleTabChange = (value: string) => {
        setActiveTab(value);
        setCurrentPage(1); // Reset to first page when changing tabs
    };

    const openDeleteModal = (user: { id: number; name: string }) => {
        setUserToDelete({ id: user.id, name: user.name });
        setIsDeleteOpen(true);
    };

    const handleConfirmDelete = () => {
        if (userToDelete) {
            toast.success("Пользователь удалён", {
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
    const [loading, setLoading] = useState(true);
    useEffect(() => {
        setTimeout(() => {
            setLoading(false);
        }, 500);
    }, []);

    if (loading) {
        return (
            <div className="h-[80vh] w-full flex justify-center items-center ">
                <div className="w-[400px]">
                    <ProgressAuto
                        durationMs={500}
                        startDelayMs={10}
                        className="h-1 rounded-full"
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-4 mb-10">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                    <div>
                        <h1 className="text-2xl  font-semibold text-gray-900 dark:text-white">
                            Все пользователи
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
                        { label: "Пользователи", isActive: true },
                    ]}
                />
            </div>

            {/* Users Table */}
            <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                <Tabs
                    value={activeTab}
                    onValueChange={handleTabChange}
                    className="border-b"
                >
                    <TabsList className="flex justify-start w-full bg-transparent  p-0 h-auto ">
                        <TabsTrigger
                            value="all"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-black dark:data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-black dark:data-[state=active]:text-white text-gray-400 dark:text-gray-500 flex items-center justify-center gap-2 py-3"
                        >
                            <span>Все</span>
                            <Badge
                                variant="secondary"
                                className={`${getRandomBadgeColor(
                                    0
                                )} text-xs px-2 py-0.5 rounded-lg`}
                            >
                                {users.length}
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger
                            value="active"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-black dark:data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-black dark:data-[state=active]:text-white text-gray-400 dark:text-gray-500 flex items-center justify-center gap-2 py-3"
                        >
                            <span>Активные</span>
                            <Badge
                                variant="secondary"
                                className={`${getRandomBadgeColor(
                                    1
                                )} text-xs px-2 py-0.5 rounded-lg`}
                            >
                                {
                                    users.filter(
                                        (u: any) => u.status === "Active"
                                    ).length
                                }
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger
                            value="inactive"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-black dark:data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-black dark:data-[state=active]:text-white text-gray-400 dark:text-gray-500 flex items-center justify-center gap-2 py-3"
                        >
                            <span>Неактивные</span>
                            <Badge
                                variant="secondary"
                                className={`${getRandomBadgeColor(
                                    2
                                )} text-xs px-2 py-0.5 rounded-lg`}
                            >
                                {
                                    users.filter(
                                        (u: any) => u.status === "Inactive"
                                    ).length
                                }
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger
                            value="admin"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-black dark:data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-black dark:data-[state=active]:text-white text-gray-400 dark:text-gray-500 flex items-center justify-center gap-2 py-3"
                        >
                            <span>Админы</span>
                            <Badge
                                variant="secondary"
                                className={`${getRandomBadgeColor(
                                    3
                                )} text-xs px-2 py-0.5 rounded-lg`}
                            >
                                {
                                    users.filter((u: any) => u.role === "Admin")
                                        .length
                                }
                            </Badge>
                        </TabsTrigger>
                        <TabsTrigger
                            value="moderator"
                            className="rounded-none border-b-2 border-transparent data-[state=active]:border-black dark:data-[state=active]:border-white data-[state=active]:bg-transparent data-[state=active]:text-black dark:data-[state=active]:text-white text-gray-400 dark:text-gray-500 flex items-center justify-center gap-2 py-3"
                        >
                            <span>Модераторы</span>
                            <Badge
                                variant="secondary"
                                className={`${getRandomBadgeColor(
                                    4
                                )} text-xs px-2 py-0.5 rounded-lg`}
                            >
                                {
                                    users.filter(
                                        (u: any) => u.role === "Moderator"
                                    ).length
                                }
                            </Badge>
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
                <CardHeader className="pb-4">
                    <div className="flex flex-col space-y-4">
                        <div className="flex justify-start w-full">
                            <SearchInput
                                placeholder="Поиск пользователей..."
                                value={searchQuery}
                                onChange={handleSearch}
                                onSearch={handleSearch}
                            />
                        </div>

                        {/* Tabs */}
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-mainbg/10 ">
                            <TableRow>
                                <TableHead className="text-maintx dark:text-white w-12">
                                    <Checkbox
                                        checked={
                                            selectedUsers.length ===
                                                currentUsers.length &&
                                            currentUsers.length > 0
                                        }
                                        onCheckedChange={handleSelectAll}
                                    />
                                </TableHead>
                                <TableHead className="text-maintx dark:text-white">
                                    Пользователь
                                </TableHead>
                                <TableHead className="text-maintx dark:text-white">
                                    Телефон
                                </TableHead>
                                <TableHead className="text-maintx dark:text-white">
                                    Роль
                                </TableHead>
                                <TableHead className="text-maintx dark:text-white">
                                    Статус
                                </TableHead>
                                <TableHead className="text-right text-maintx dark:text-white">
                                    Действия
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {currentUsers.map((user) => (
                                <TableRow
                                    key={user.id}
                                    className="border-dashed border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    <TableCell className="w-12">
                                        <Checkbox
                                            checked={selectedUsers.includes(
                                                user.id
                                            )}
                                            onCheckedChange={() =>
                                                handleSelectUser(user.id)
                                            }
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-full overflow-hidden">
                                                <img
                                                    src={user.avatar}
                                                    alt={user.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div>
                                                <Link
                                                    to={`/details/${user.id}`}
                                                    className="text-sm font-medium text-gray-900 dark:text-white hover:underline cursor-pointer transition-all duration-200"
                                                >
                                                    {user.name}
                                                </Link>
                                                <p className="text-xs text-gray-400">
                                                    {user.email}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-gray-600 dark:text-gray-300">
                                        {user.phone}
                                    </TableCell>
                                    <TableCell className="text-gray-600 dark:text-gray-300">
                                        {user.role}
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant={
                                                user.status === "Active"
                                                    ? "success"
                                                    : "warning"
                                            }
                                        >
                                            {user.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <EditUser />
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button className="rounded-full outline-none focus:outline-none focus:ring-0 focus:border-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:border-0 hover:bg-gray-200 p-2 transition-colors duration-200">
                                                    <HiDotsVertical className="w-4 h-4 text-gray-500" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem
                                                    className="flex items-center gap-2 text-red-600 hover:text-red-600"
                                                    onClick={() =>
                                                        openDeleteModal(user)
                                                    }
                                                >
                                                    <CiTrash className="w-4 h-4" />
                                                    <span>Удалить</span>
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
                <CardFooter className="flex justify-between items-center border-t border-gray-200 dark:border-gray-700 pt-4">
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
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        Вы уверены, что хотите удалить пользователя{" "}
                        <span className="font-semibold text-gray-900 dark:text-white">
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
