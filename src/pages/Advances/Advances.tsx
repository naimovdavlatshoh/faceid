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
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import CustomPagination from "@/components/ui/custom-pagination";
import CustomBreadcrumb from "@/components/ui/custom-breadcrumb";
import CustomModal from "@/components/ui/custom-modal";
import { SearchableCombobox } from "@/components/ui/searchable-combobox";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { IoMdAdd } from "react-icons/io";
import { HiDotsVertical } from "react-icons/hi";
import { GrEdit } from "react-icons/gr";
import { CiTrash } from "react-icons/ci";
import { RiBankCardLine, RiMoneyDollarCircleLine } from "react-icons/ri";
import {
    GetAdvances,
    DeleteAdvance,
    GetDataSimple,
    PostSimple,
} from "@/services/data";
import AdvanceFormModal from "./AdvanceFormModal";
import {
    ADVANCE_MONTHS,
    ADVANCE_YEARS,
    PAYMENT_METHODS,
    formatSum,
    monthName,
    paymentMethodName,
    type Advance,
} from "./advancesConstants";

interface EmployeeOption {
    faceid_user_id: number;
    name: string;
    position_name?: string;
}

const ALL = "all";

const Advances = () => {
    const [advances, setAdvances] = useState<Advance[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(20);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);

    // Фильтры
    const [filterEmployee, setFilterEmployee] = useState("");
    const [filterMonth, setFilterMonth] = useState<string>(ALL);
    const [filterYear, setFilterYear] = useState<string>(ALL);
    const [filterMethod, setFilterMethod] = useState<string>(ALL);

    // Сотрудники для фильтра
    const [employees, setEmployees] = useState<EmployeeOption[]>([]);
    const [loadingEmployees, setLoadingEmployees] = useState(false);

    // Модалки
    const [formOpen, setFormOpen] = useState(false);
    const [editing, setEditing] = useState<Advance | null>(null);
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [toDelete, setToDelete] = useState<Advance | null>(null);

    const fetchAdvances = async (page = currentPage, limit = itemsPerPage) => {
        try {
            setLoading(true);
            const data = await GetAdvances({
                page,
                limit,
                faceid_user_id: filterEmployee
                    ? Number(filterEmployee)
                    : undefined,
                month: filterMonth !== ALL ? Number(filterMonth) : undefined,
                year: filterYear !== ALL ? Number(filterYear) : undefined,
                payment_method:
                    filterMethod !== ALL ? Number(filterMethod) : undefined,
            });
            setAdvances(data?.result || []);
            setTotalPages(data?.pages || 1);
            setTotal(data?.total || 0);
        } catch (error) {
            console.error("Error fetching advances:", error);
            toast.error("Ошибка загрузки авансов");
            setAdvances([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        try {
            setLoadingEmployees(true);
            const data = await GetDataSimple(
                `api/faceid/users/list?page=1&limit=100&object_id=1`
            );
            setEmployees(data?.result || []);
        } catch (error) {
            console.error("Error fetching employees:", error);
            setEmployees([]);
        } finally {
            setLoadingEmployees(false);
        }
    };

    const searchEmployees = async (keyword: string) => {
        if (keyword.length < 3) {
            fetchEmployees();
            return;
        }
        try {
            setLoadingEmployees(true);
            const response = await PostSimple(
                `api/faceid/user/search?keyword=${encodeURIComponent(keyword)}`,
                {}
            );
            setEmployees(response.data?.result || []);
        } catch (error) {
            console.error("Error searching employees:", error);
            setEmployees([]);
        } finally {
            setLoadingEmployees(false);
        }
    };

    useEffect(() => {
        fetchEmployees();
    }, []);

    // Первичная загрузка + перезагрузка при смене фильтров
    useEffect(() => {
        setCurrentPage(1);
        fetchAdvances(1, itemsPerPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filterEmployee, filterMonth, filterYear, filterMethod]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
        fetchAdvances(page, itemsPerPage);
    };

    const handleItemsPerPageChange = (value: string) => {
        const newLimit = Number(value);
        setItemsPerPage(newLimit);
        setCurrentPage(1);
        fetchAdvances(1, newLimit);
    };

    const handleEmployeeSearch = (term: string) => {
        if (term.length < 3) fetchEmployees();
        else searchEmployees(term);
    };

    const resetFilters = () => {
        setFilterEmployee("");
        setFilterMonth(ALL);
        setFilterYear(ALL);
        setFilterMethod(ALL);
    };

    const openCreate = () => {
        setEditing(null);
        setFormOpen(true);
    };

    const openEdit = (advance: Advance) => {
        setEditing(advance);
        setFormOpen(true);
    };

    const openDelete = (advance: Advance) => {
        setToDelete(advance);
        setDeleteOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!toDelete) return;
        try {
            await DeleteAdvance(toDelete.id);
            toast.success("Аванс удалён");
            // если удалили последний элемент на странице — вернёмся назад
            const nextPage =
                advances.length === 1 && currentPage > 1
                    ? currentPage - 1
                    : currentPage;
            setCurrentPage(nextPage);
            fetchAdvances(nextPage, itemsPerPage);
        } catch (error: any) {
            console.error("Error deleting advance:", error);
            toast.error(
                error?.response?.data?.error || "Ошибка удаления аванса"
            );
        } finally {
            setDeleteOpen(false);
            setToDelete(null);
        }
    };

    const hasActiveFilters =
        !!filterEmployee ||
        filterMonth !== ALL ||
        filterYear !== ALL ||
        filterMethod !== ALL;

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="space-y-4 mb-6 md:mb-10">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                        <h1 className="text-xl md:text-2xl font-semibold text-slate-900 truncate">
                            Авансы
                        </h1>
                    </div>
                    <Button
                        onClick={openCreate}
                        className="w-full sm:w-auto bg-black text-white duration-300 hover:bg-black/70 rounded-xl"
                    >
                        <IoMdAdd className="w-3 h-3" /> Добавить
                    </Button>
                </div>
                <CustomBreadcrumb
                    items={[
                        { label: "Панель управления", href: "/" },
                        { label: "Авансы", isActive: true },
                    ]}
                />
            </div>

            <Card className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
                <CardHeader className="pb-4 px-4 md:px-6">
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:flex lg:flex-wrap lg:items-end">
                            <div className="col-span-2 sm:col-span-2 lg:w-56">
                                <SearchableCombobox
                                    label="Сотрудник"
                                    placeholder="Все сотрудники"
                                    searchPlaceholder="Поиск сотрудников..."
                                    emptyMessage="Сотрудники не найдены"
                                    value={filterEmployee}
                                    onChange={setFilterEmployee}
                                    onSearch={handleEmployeeSearch}
                                    options={employees.map((e) => ({
                                        value: String(e.faceid_user_id),
                                        label: e.name,
                                    }))}
                                    isLoading={loadingEmployees}
                                />
                            </div>
                            <div className="space-y-2 lg:w-36">
                                <label className="text-sm font-medium text-gray-900">
                                    Месяц
                                </label>
                                <Select
                                    value={filterMonth}
                                    onValueChange={setFilterMonth}
                                >
                                    <SelectTrigger className="w-full h-12 rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ALL}>Все</SelectItem>
                                        {ADVANCE_MONTHS.map((m) => (
                                            <SelectItem
                                                key={m.value}
                                                value={m.value}
                                            >
                                                {m.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 lg:w-28">
                                <label className="text-sm font-medium text-gray-900">
                                    Год
                                </label>
                                <Select
                                    value={filterYear}
                                    onValueChange={setFilterYear}
                                >
                                    <SelectTrigger className="w-full h-12 rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ALL}>Все</SelectItem>
                                        {ADVANCE_YEARS.map((y) => (
                                            <SelectItem
                                                key={y}
                                                value={String(y)}
                                            >
                                                {y}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2 lg:w-40">
                                <label className="text-sm font-medium text-gray-900">
                                    Способ
                                </label>
                                <Select
                                    value={filterMethod}
                                    onValueChange={setFilterMethod}
                                >
                                    <SelectTrigger className="w-full h-12 rounded-xl">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value={ALL}>Все</SelectItem>
                                        {PAYMENT_METHODS.map((m) => (
                                            <SelectItem
                                                key={m.value}
                                                value={m.value}
                                            >
                                                {m.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        {hasActiveFilters && (
                            <Button
                                variant="outline"
                                onClick={resetFilters}
                                className="rounded-xl h-12 lg:h-10 shrink-0"
                            >
                                Сбросить фильтры
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto scrollbar-hide">
                    <Table className="min-w-[720px]">
                        <TableHeader className="bg-slate-50/80">
                            <TableRow>
                                <TableHead className="text-slate-500">
                                    Сотрудник
                                </TableHead>
                                <TableHead className="text-slate-500">
                                    Период
                                </TableHead>
                                <TableHead className="text-slate-500 text-right">
                                    Сумма
                                </TableHead>
                                <TableHead className="text-slate-500">
                                    Способ
                                </TableHead>
                                <TableHead className="text-slate-500">
                                    Комментарий
                                </TableHead>
                                <TableHead className="text-slate-500">
                                    Создан
                                </TableHead>
                                <TableHead className="text-right text-slate-500">
                                    Действия
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="text-center py-8"
                                    >
                                        <div className="flex items-center justify-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin"></div>
                                            <span className="text-slate-500">
                                                Загрузка...
                                            </span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : advances.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={7}
                                        className="text-center py-8 text-slate-500"
                                    >
                                        {hasActiveFilters
                                            ? "Авансы по выбранным фильтрам не найдены"
                                            : "Нет авансов"}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                advances.map((advance) => (
                                    <TableRow
                                        key={advance.id}
                                        className="border-slate-100 hover:bg-slate-50/60"
                                    >
                                        <TableCell className="whitespace-nowrap">
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-slate-900 truncate">
                                                    {advance.employee_name}
                                                </p>
                                                <p className="text-xs text-slate-400 truncate">
                                                    {advance.object_name}
                                                </p>
                                            </div>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap text-slate-600">
                                            {monthName(advance.month)}{" "}
                                            {advance.year}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap text-right font-semibold tabular-nums text-slate-900">
                                            {formatSum(advance.amount)}
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap">
                                            <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                                                {advance.payment_method === 2 ? (
                                                    <RiBankCardLine className="w-4 h-4 text-slate-400" />
                                                ) : (
                                                    <RiMoneyDollarCircleLine className="w-4 h-4 text-slate-400" />
                                                )}
                                                {paymentMethodName(
                                                    advance.payment_method
                                                )}
                                            </span>
                                        </TableCell>
                                        <TableCell className="max-w-[220px]">
                                            <p className="truncate text-sm text-slate-500">
                                                {advance.comment || "—"}
                                            </p>
                                        </TableCell>
                                        <TableCell className="whitespace-nowrap text-slate-500 text-sm">
                                            {advance.created_at
                                                ? new Date(
                                                      advance.created_at.replace(
                                                          " ",
                                                          "T"
                                                      )
                                                  ).toLocaleDateString("ru-RU")
                                                : "—"}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <button className="rounded-full outline-none focus:outline-none focus:ring-0 hover:bg-slate-200 p-2 transition-colors duration-200">
                                                        <HiDotsVertical className="w-4 h-4 text-slate-500" />
                                                    </button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                        className="flex items-center gap-2"
                                                        onClick={() =>
                                                            openEdit(advance)
                                                        }
                                                    >
                                                        <GrEdit className="w-4 h-4" />
                                                        <span>
                                                            Редактировать
                                                        </span>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="flex items-center gap-2 text-red-600 hover:text-red-600"
                                                        onClick={() =>
                                                            openDelete(advance)
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
                        <label className="text-slate-500 text-sm whitespace-nowrap">
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
                                <SelectItem value="10">10</SelectItem>
                                <SelectItem value="20">20</SelectItem>
                                <SelectItem value="50">50</SelectItem>
                                <SelectItem value="100">100</SelectItem>
                            </SelectContent>
                        </Select>
                        <span className="text-slate-400 text-sm whitespace-nowrap ml-2">
                            Всего: {total}
                        </span>
                    </div>
                    <CustomPagination
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </CardFooter>
            </Card>

            {/* Создание / редактирование */}
            <AdvanceFormModal
                open={formOpen}
                onOpenChange={setFormOpen}
                advance={editing}
                onSuccess={() => fetchAdvances(currentPage, itemsPerPage)}
            />

            {/* Подтверждение удаления */}
            <CustomModal
                showTrigger={false}
                open={deleteOpen}
                onOpenChange={setDeleteOpen}
                title="Подтверждение удаления"
                confirmText="Удалить"
                cancelText="Отмена"
                confirmBg="bg-red-500"
                confirmBgHover="bg-red-500/70"
                onConfirm={handleConfirmDelete}
                onCancel={() => {
                    setDeleteOpen(false);
                    setToDelete(null);
                }}
                size="md"
                showCloseButton={false}
            >
                <div className="space-y-2">
                    <p className="text-sm text-slate-600">
                        Удалить аванс{" "}
                        <span className="font-semibold text-slate-900">
                            {toDelete ? formatSum(toDelete.amount) : ""} сум
                        </span>{" "}
                        для{" "}
                        <span className="font-semibold text-slate-900">
                            {toDelete?.employee_name}
                        </span>
                        ? Это действие нельзя отменить.
                    </p>
                </div>
            </CustomModal>
        </div>
    );
};

export default Advances;
