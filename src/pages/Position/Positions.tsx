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
import { FaUserCog } from "react-icons/fa";

import CustomPagination from "@/components/ui/custom-pagination";
import SearchInput from "@/components/ui/search-input";
import CustomBreadcrumb from "@/components/ui/custom-breadcrumb";
import { useEffect, useState, useRef } from "react";
import { CiTrash } from "react-icons/ci";
import { HiDotsVertical } from "react-icons/hi";
import { Button } from "@/components/ui/button";
import CustomModal from "@/components/ui/custom-modal";
import { toast } from "sonner";
import { IoMdAdd } from "react-icons/io";
import { GetDataSimple, PostDataTokenJson, PostSimple } from "@/services/data";
import AddPositionModal from "./AddPositionModal";
import UpdatePositionModal from "./UpdatePositionModal";
import { GrEdit } from "react-icons/gr";

// API response types
interface ApiPosition {
    position_id: number;
    object_id: number;
    position_name: string;
    created_at: string;
}

interface ApiResponse {
    page: number;
    limit: number;
    count: number;
    pages: number;
    result: ApiPosition[];
}

const Positions = () => {
    const [currentPage, setCurrentPage] = useState(1);
    const [searchQuery, setSearchQuery] = useState("");
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [selectedPositions, setSelectedPositions] = useState<number[]>([]);

    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [positionToDelete, setPositionToDelete] = useState<{
        id: number;
        name: string;
    } | null>(null);
    const [positions, setPositions] = useState<ApiPosition[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeoutRef = useRef<number | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isUpdateModalOpen, setIsUpdateModalOpen] = useState(false);
    const [selectedPosition, setSelectedPosition] =
        useState<ApiPosition | null>(null);

    const fetchPositions = async (page: number = 1, limit: number = 10) => {
        try {
            const data: ApiResponse = await GetDataSimple(
                `api/staff/position/list?page=${page}&limit=${limit}&object_id=1`
            );

            setPositions(data?.result);
            setTotalPages(data?.pages);
        } catch (error) {
            console.error("Error fetching positions:", error);
            toast.error("Ошибка загрузки должностей");
        }
    };

    const searchPositions = async (keyword: string) => {
        if (keyword?.length < 3) {
            // If keyword is less than 3 characters, fetch all positions
            fetchPositions(currentPage, itemsPerPage);
            return;
        }

        try {
            setIsSearching(true);
            const response = await PostSimple(
                `api/staff/position/search?object_id=1&keyword=${keyword}`,
                {}
            );

            setPositions(response?.data?.result || []);
            setTotalPages(1); // Search results are typically on one page
        } catch (error: any) {
            console.error("Error searching positions:", error);
            toast.error(
                error?.response?.data?.message || "Ошибка поиска должностей"
            );
        } finally {
            setIsSearching(false);
        }
    };

    // Use positions directly since we're doing server-side search
    const currentPositions = positions;

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        fetchPositions(page, itemsPerPage);
    };

    const handleItemsPerPageChange = (value: string) => {
        const newLimit = Number(value);
        setItemsPerPage(newLimit);
        setCurrentPage(1);
        fetchPositions(1, newLimit);
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
            searchPositions(value);
        }, 100); // 100ms delay
    };

    const handleSelectPosition = (positionId: number) => {
        setSelectedPositions((prev) =>
            prev.includes(positionId)
                ? prev.filter((id) => id !== positionId)
                : [...prev, positionId]
        );
    };

    const handleSelectAll = () => {
        if (selectedPositions?.length === currentPositions?.length) {
            setSelectedPositions([]);
        } else {
            setSelectedPositions(
                currentPositions?.map((position) => position?.position_id)
            );
        }
    };

    const openDeleteModal = (position: {
        position_id: number;
        position_name: string;
    }) => {
        setPositionToDelete({
            id: position.position_id,
            name: position.position_name,
        });
        setIsDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (positionToDelete) {
            try {
                await PostDataTokenJson(
                    `api/staff/position/delete/${positionToDelete.id}`,
                    {}
                );
                toast.success("Должность удалена", {
                    description: `${positionToDelete.name} успешно удалена.`,
                    duration: 2500,
                });
                fetchPositions(currentPage, itemsPerPage);
            } catch (error) {
                console.error("Error deleting position:", error);
                toast.error("Ошибка удаления должности");
            }
        }
        setIsDeleteOpen(false);
        setPositionToDelete(null);
    };

    const handleCancelDelete = () => {
        setIsDeleteOpen(false);
        setPositionToDelete(null);
    };

    const handleAddPosition = () => {
        setIsAddModalOpen(true);
    };

    const handleEditPosition = (position: ApiPosition) => {
        setSelectedPosition(position);
        setIsUpdateModalOpen(true);
    };

    const handleAddSuccess = () => {
        fetchPositions(currentPage, itemsPerPage);
    };

    const handleUpdateSuccess = () => {
        fetchPositions(currentPage, itemsPerPage);
    };

    useEffect(() => {
        fetchPositions(currentPage, itemsPerPage);
    }, []);

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
                        <h1 className="text-2xl font-semibold text-gray-900 ">
                            Все должности
                        </h1>
                    </div>
                    <Button
                        onClick={handleAddPosition}
                        className="bg-black text-white duration-300 hover:bg-black/70 rounded-xl"
                    >
                        <IoMdAdd className="w-3 h-3" /> Добавить
                    </Button>
                </div>
                <CustomBreadcrumb
                    items={[
                        { label: "Панель управления", href: "/" },
                        { label: "Должности", isActive: true },
                    ]}
                />
            </div>

            <Card className="bg-white  rounded-2xl shadow-lg border border-gray-100 ">
                <CardHeader className="pb-4">
                    <div className="flex flex-col space-y-4">
                        <div className="flex justify-start w-full">
                            <SearchInput
                                placeholder="Поиск должностей..."
                                value={searchQuery}
                                onChange={handleSearchChange}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-mainbg/10">
                            <TableRow>
                                <TableHead className="text-maintx  w-12">
                                    <Checkbox
                                        checked={
                                            selectedPositions?.length ===
                                                currentPositions?.length &&
                                            currentPositions?.length > 0
                                        }
                                        onCheckedChange={handleSelectAll}
                                    />
                                </TableHead>
                                <TableHead className="text-maintx ">
                                    Должность
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
                            ) : currentPositions?.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="text-center py-8 text-gray-500"
                                    >
                                        {searchQuery
                                            ? "Должности не найдены"
                                            : "Нет должностей"}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                currentPositions?.map((position) => (
                                    <TableRow
                                        key={position.position_id}
                                        className="border-dashed border-gray-200  hover:bg-gray-100 "
                                    >
                                        <TableCell className="w-12">
                                            <Checkbox
                                                checked={selectedPositions?.includes(
                                                    position?.position_id
                                                )}
                                                onCheckedChange={() =>
                                                    handleSelectPosition(
                                                        position?.position_id
                                                    )
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-3">
                                                <div className="w-12 h-12 rounded-full border-2 border-maintx flex items-center justify-center">
                                                    <FaUserCog className="w-5 h-5 text-maintx" />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-900 ">
                                                        {
                                                            position?.position_name
                                                        }
                                                    </p>
                                                </div>
                                            </div>
                                        </TableCell>

                                        <TableCell className="text-gray-600 ">
                                            {new Date(
                                                position?.created_at
                                            ).toLocaleDateString("ru-RU")}
                                        </TableCell>

                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="rounded-full outline-none focus:outline-none focus:ring-0 focus:border-0 focus-visible:outline-none focus-visible:ring-0 focus-visible:border-0 hover:bg-gray-200 p-2 transition-colors duration-200">
                                                        <HiDotsVertical className="w-4 h-4 text-gray-500" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        className="flex items-center gap-2"
                                                        onClick={() =>
                                                            handleEditPosition(
                                                                position
                                                            )
                                                        }
                                                    >
                                                        <GrEdit className="w-4 h-4" />{" "}
                                                        <span>
                                                            Редактировать
                                                        </span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="flex items-center gap-2 text-red-600 hover:text-red-600"
                                                        onClick={() =>
                                                            openDeleteModal({
                                                                position_id:
                                                                    position?.position_id,
                                                                position_name:
                                                                    position?.position_name,
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
                        Вы уверены, что хотите удалить должность{" "}
                        <span className="font-semibold text-gray-900">
                            {positionToDelete?.name}
                        </span>
                        ? Это действие нельзя отменить.
                    </p>
                </div>
            </CustomModal>

            <AddPositionModal
                open={isAddModalOpen}
                onOpenChange={setIsAddModalOpen}
                onSuccess={handleAddSuccess}
            />

            <UpdatePositionModal
                open={isUpdateModalOpen}
                onOpenChange={setIsUpdateModalOpen}
                position={selectedPosition}
                onSuccess={handleUpdateSuccess}
            />
        </div>
    );
};

export default Positions;
