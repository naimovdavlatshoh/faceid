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

    is_active: string;
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

    const searchFilteredShifts = shifts?.filter((shift) =>
        shift.shift_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectAll = (checked: boolean) => {
        if (checked) {
            setSelectedShifts(
                searchFilteredShifts?.map((shift) => shift.shift_id)
            );
        } else {
            setSelectedShifts([]);
        }
    };

    const handleSelectShift = (shiftId: number, checked: boolean) => {
        if (checked) {
            setSelectedShifts((prev) => [...prev, shiftId]);
        } else {
            setSelectedShifts((prev) => prev?.filter((id) => id !== shiftId));
        }
    };

    const isAllSelected =
        searchFilteredShifts?.length > 0 &&
        selectedShifts.length === searchFilteredShifts?.length;

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
        <div className="space-y-4 md:space-y-6">
            {/* Header */}

            <div className="space-y-4 mb-6 md:mb-10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <h1 className="text-xl md:text-2xl font-semibold text-slate-900 truncate">
                            Смены
                        </h1>
                    </div>
                    <div className="flex space-x-3 flex-shrink-0">
                        <Link to="/shifts/create" className="block w-full sm:w-auto">
                            <Button className="w-full sm:w-auto px-4 py-2 h-10 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium transition-all duration-200">
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
            <Card className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                <CardHeader className="px-4 md:px-6">
                    <div className="flex flex-col space-y-4">
                        <div className="flex justify-start w-full min-w-0">
                            <SearchInput
                                placeholder="Поиск по названию смены..."
                                value={searchTerm}
                                onChange={setSearchTerm}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto scrollbar-hide">
                    <Table className="min-w-[720px]">
                        <TableHeader className="bg-slate-50/80">
                            <TableRow>
                                <TableHead className="text-slate-500 hidden md:table-cell w-12">
                                    <Checkbox
                                        checked={isAllSelected}
                                        onCheckedChange={handleSelectAll}
                                    />
                                </TableHead>
                                <TableHead className="text-slate-500 ">
                                    Смена
                                </TableHead>
                                <TableHead className="text-slate-500 ">
                                    Тип смены
                                </TableHead>
                                <TableHead className="text-slate-500">
                                    Переработка (мин)
                                </TableHead>
                                <TableHead className="text-slate-500 ">
                                    Допуск опоздания (мин)
                                </TableHead>
                                {/* <TableHead className="text-slate-500 ">
                                    Статус
                                </TableHead> */}
                                <TableHead className="text-slate-500 ">
                                    Дата создания
                                </TableHead>
                                <TableHead className=" text-slate-500 ">
                                    Действия
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {searchFilteredShifts?.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="text-center py-8 text-slate-500 "
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
                                        className="border-slate-100  hover:bg-slate-50/60 "
                                    >
                                        <TableCell className="hidden md:table-cell w-12">
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
                                                <MdTimelapse className="w-6 h-6 text-slate-500" />

                                                <button
                                                    type="button"
                                                    className="text-left text-sm font-medium text-blue-600 hover:text-blue-800  hover:underline cursor-pointer transition-colors duration-200"
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
                                        <TableCell className="text-slate-600 ">
                                            {shift.shift_type_name}
                                        </TableCell>
                                        <TableCell className="text-slate-600 ">
                                            {shift.overtime_after_minutes} мин
                                        </TableCell>
                                        <TableCell className="text-slate-600 ">
                                            {shift.late_tolerance_minutes} мин
                                        </TableCell>
                                        {/* <TableCell>
                                            <span
                                                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    shift.is_active === "1"
                                                        ? "bg-green-100 text-green-800 "
                                                        : "bg-red-100 text-red-800 "
                                                }`}
                                            >
                                                {shift.is_active === "1"
                                                    ? "Активна"
                                                    : "Неактивна"}
                                            </span>
                                        </TableCell> */}
                                        <TableCell className="text-slate-600 ">
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
                                                        <HiDotsVertical className="w-4 h-4 text-slate-500" />
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
                <CardFooter className="flex flex-col gap-3 sm:flex-row justify-between items-stretch sm:items-center border-t border-slate-200 pt-4 px-4 md:px-6 pb-4">
                    <div className="flex items-center gap-2">
                        <label htmlFor="" className="text-slate-500 text-sm whitespace-nowrap">
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
