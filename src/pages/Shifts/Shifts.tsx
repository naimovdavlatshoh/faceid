import { useEffect, useState } from "react";
import {
    Card,
    CardContent,
    CardHeader,
    CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import CustomPagination from "@/components/ui/custom-pagination";
import SearchInput from "@/components/ui/search-input";
import CustomBreadcrumb from "@/components/ui/custom-breadcrumb";
import { ProgressAuto } from "@/components/ui/progress";
import { GetDataSimple } from "@/services/data";
import { toast } from "sonner";
import { IoMdAdd } from "react-icons/io";

import { MdTimelapse } from "react-icons/md";
import { HiDotsVertical } from "react-icons/hi";
import EditShiftModal from "./EditShiftModal";
import DeleteShiftModal from "./DeleteShiftModal";
import { GrEdit } from "react-icons/gr";
import { CiTrash } from "react-icons/ci";
import { Link, useNavigate } from "react-router-dom";
import ShiftDaysModal from "./ShiftDaysModal";

interface Shift {
    shift_id: number;
    shift_name: string;
    overtime_after_minutes: number;
    late_tolerance_minutes: number;
    is_active: number;
    created_at: string;
    updated_at: string;
    shift_type_name: string;
}

interface ApiResponse {
    page: number;
    limit: number;
    count: number;
    pages: number;
    result: Shift[];
}

const Shifts = () => {
    const [shifts, setShifts] = useState<Shift[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedShifts, setSelectedShifts] = useState<number[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedShift, setSelectedShift] = useState<Shift | null>(null);
    const [isDaysModalOpen, setIsDaysModalOpen] = useState(false);
    const navigate = useNavigate();

    const fetchShifts = async (page: number = 1, limit: number = 10) => {
        try {
            setLoading(true);
            const data: ApiResponse = await GetDataSimple(
                `api/shift/list?page=${page}&limit=${limit}&object_id=1`
            );

            setShifts(data.result);
            setTotalPages(data.pages);
        } catch (error) {
            console.error("Error fetching shifts:", error);
            toast.error("Ошибка загрузки смен");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchShifts(currentPage, itemsPerPage);
    }, [currentPage, itemsPerPage]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleItemsPerPageChange = (value: string) => {
        const newLimit = Number(value);
        setItemsPerPage(newLimit);
        setCurrentPage(1); // Reset to first page when changing items per page
    };

    const searchFilteredShifts = shifts.filter((shift) =>
        shift.shift_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedShifts(
                searchFilteredShifts.map((shift) => shift.shift_id)
            );
        } else {
            setSelectedShifts([]);
        }
    };

    const handleSelectShift = (shiftId: number, checked: boolean) => {
        if (checked) {
            setSelectedShifts((prev) => [...prev, shiftId]);
        } else {
            setSelectedShifts((prev) => prev.filter((id) => id !== shiftId));
        }
    };

    const isAllSelected =
        searchFilteredShifts.length > 0 &&
        selectedShifts.length === searchFilteredShifts.length;

    const handleShiftUpdated = () => {
        fetchShifts(currentPage, itemsPerPage);
    };

    const handleShiftDeleted = () => {
        fetchShifts(currentPage, itemsPerPage);
    };

    // const handleEditShift = (shift: Shift) => {
    //     setSelectedShift(shift);
    //     setIsEditModalOpen(true);
    // };

    const handleDeleteShift = (shift: Shift) => {
        setSelectedShift(shift);
        setIsDeleteModalOpen(true);
    };

    if (loading) {
        return (
            <div className="h-[80vh] w-full flex justify-center items-center">
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
                            Смены
                        </h1>
                    </div>
                    <div className="flex space-x-3">
                        <Link to="/shifts/create">
                            <Button className="px-4 py-2 h-10 bg-gray-900 hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-medium transition-all duration-200">
                                <IoMdAdd className="w-4 h-4" />
                                Добавить
                            </Button>
                        </Link>
                    </div>
                </div>
                <CustomBreadcrumb
                    items={[
                        { label: "Панель управления", href: "/" },
                        { label: "Смены", isActive: true },
                    ]}
                />
            </div>

            {/* Main Content */}
            <Card className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700">
                <CardHeader>
                    <div className="flex flex-col space-y-4">
                        <div className="flex justify-start w-full">
                            <SearchInput
                                placeholder="Поиск по названию смены..."
                                value={searchTerm}
                                onChange={setSearchTerm}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader className="bg-mainbg/10">
                            <TableRow>
                                <TableHead className="text-maintx dark:text-white w-12">
                                    <Checkbox
                                        checked={isAllSelected}
                                        onCheckedChange={handleSelectAll}
                                    />
                                </TableHead>
                                <TableHead className="text-maintx dark:text-white">
                                    Смена
                                </TableHead>
                                <TableHead className="text-maintx dark:text-white">
                                    Тип смены
                                </TableHead>
                                <TableHead className="text-maintx dark:text-white">
                                    Переработка (мин)
                                </TableHead>
                                <TableHead className="text-maintx dark:text-white">
                                    Допуск опоздания (мин)
                                </TableHead>
                                <TableHead className="text-maintx dark:text-white">
                                    Статус
                                </TableHead>
                                <TableHead className="text-maintx dark:text-white">
                                    Дата создания
                                </TableHead>
                                <TableHead className=" text-maintx dark:text-white">
                                    Действия
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {searchFilteredShifts?.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="text-center py-8 text-gray-500 dark:text-gray-400"
                                    >
                                        {searchTerm
                                            ? "Смены не найдены"
                                            : "Нет смен"}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                searchFilteredShifts?.map((shift) => (
                                    <TableRow
                                        key={shift.shift_id}
                                        className="border-dashed border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                                    >
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedShifts.includes(
                                                    shift.shift_id
                                                )}
                                                onCheckedChange={(checked) =>
                                                    handleSelectShift(
                                                        shift.shift_id,
                                                        checked as boolean
                                                    )
                                                }
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center space-x-3">
                                                <MdTimelapse className="w-6 h-6 text-maintx" />

                                                <button
                                                    type="button"
                                                    className="text-left text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 hover:underline cursor-pointer transition-colors duration-200"
                                                    onClick={() => {
                                                        setSelectedShift(shift);
                                                        setIsDaysModalOpen(
                                                            true
                                                        );
                                                    }}
                                                >
                                                    {shift.shift_name}
                                                </button>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-gray-600 dark:text-gray-300">
                                            {shift.shift_type_name}
                                        </TableCell>
                                        <TableCell className="text-gray-600 dark:text-gray-300">
                                            {shift.overtime_after_minutes} мин
                                        </TableCell>
                                        <TableCell className="text-gray-600 dark:text-gray-300">
                                            {shift.late_tolerance_minutes} мин
                                        </TableCell>
                                        <TableCell>
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    shift.is_active === 1
                                                        ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                                                        : "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200"
                                                }`}
                                            >
                                                {shift.is_active === 1
                                                    ? "Активна"
                                                    : "Неактивна"}
                                            </span>
                                        </TableCell>
                                        <TableCell className="text-gray-600 dark:text-gray-300">
                                            {new Date(
                                                shift.created_at
                                            ).toLocaleDateString("ru-RU")}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button
                                                        variant="ghost"
                                                        className="h-8 w-8 p-0"
                                                    >
                                                        <HiDotsVertical className="w-4 h-4 text-gray-500" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        onClick={() =>
                                                            navigate(
                                                                `/shifts/days/${
                                                                    shift.shift_id
                                                                }/${encodeURIComponent(
                                                                    shift?.shift_name ||
                                                                        ""
                                                                )}`
                                                            )
                                                        }
                                                    >
                                                        <GrEdit className="w-4 h-4" />{" "}
                                                        Редактировать
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-red-600"
                                                        onClick={() =>
                                                            handleDeleteShift(
                                                                shift
                                                            )
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

            {/* Modals */}
            <EditShiftModal
                isOpen={isEditModalOpen}
                onClose={() => setIsEditModalOpen(false)}
                onShiftUpdated={handleShiftUpdated}
                shift={selectedShift}
            />
            <DeleteShiftModal
                isOpen={isDeleteModalOpen}
                onClose={() => setIsDeleteModalOpen(false)}
                onShiftDeleted={handleShiftDeleted}
                shift={selectedShift}
            />
            <ShiftDaysModal
                isOpen={isDaysModalOpen}
                onClose={() => setIsDaysModalOpen(false)}
                shiftId={selectedShift?.shift_id ?? null}
                shiftName={selectedShift?.shift_name}
            />
        </div>
    );
};

export default Shifts;
