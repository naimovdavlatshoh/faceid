import { useEffect, useState, useCallback } from "react";
import { SuperAdminGetDetections, SuperAdminGetObjects } from "@/services/data";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AdminPageHeader, AdminTable, EmptyRow, TablePagination } from "@/components/admin/AdminTable";
import { Search, X } from "lucide-react";

interface Detection {
    id: number;
    faceid_user_id: number;
    object_id: number;
    object_name: string;
    employee_name: string;
    attendanceType: number;
    dateTime: string;
    image_path: string | null;
}

interface ObjectItem {
    id: string;
    object_name: string;
}

const todayStr = () => new Date().toISOString().slice(0, 10);

const AdminDetections = () => {
    const [rows, setRows]         = useState<Detection[]>([]);
    const [objects, setObjects]   = useState<ObjectItem[]>([]);
    const [loading, setLoading]   = useState(true);
    const [page, setPage]         = useState(1);
    const [pages, setPages]       = useState(1);
    const [total, setTotal]       = useState(0);
    const [lightbox, setLightbox] = useState<{ src: string; name: string } | null>(null);

    // filters
    const [objectId,       setObjectId]       = useState("");
    const [employeeId,     setEmployeeId]      = useState("");
    const [employeeInput,  setEmployeeInput]   = useState("");
    const [attendanceType, setAttendanceType]  = useState("");
    const [dateFrom,       setDateFrom]        = useState(todayStr());
    const [dateTo,         setDateTo]          = useState(todayStr());

    useEffect(() => {
        SuperAdminGetObjects()
            .then((res) => setObjects(res.result ?? []))
            .catch(() => {});
    }, []);

    const load = useCallback((p = page) => {
        setLoading(true);
        SuperAdminGetDetections({
            page:            p,
            limit:           30,
            object_id:       objectId       ? Number(objectId)       : undefined,
            faceid_user_id:  employeeId     ? Number(employeeId)     : undefined,
            attendance_type: attendanceType ? Number(attendanceType) : undefined,
            date_from:       dateFrom || undefined,
            date_to:         dateTo   || undefined,
        })
            .then((res) => {
                setRows(res.result ?? []);
                setPages(res.pages ?? 1);
                setTotal(res.total ?? 0);
            })
            .catch(() => toast.error("Не удалось загрузить детекции"))
            .finally(() => setLoading(false));
    }, [page, objectId, employeeId, attendanceType, dateFrom, dateTo]);

    useEffect(() => { load(page); }, [page, objectId, employeeId, attendanceType, dateFrom, dateTo]);

    const handleEmployeeSearch = () => {
        setEmployeeId(employeeInput.trim());
        setPage(1);
    };

    const clearFilters = () => {
        setObjectId("");
        setEmployeeId("");
        setEmployeeInput("");
        setAttendanceType("");
        setDateFrom(todayStr());
        setDateTo(todayStr());
        setPage(1);
    };

    const hasFilter = objectId || employeeId || attendanceType || dateFrom !== todayStr() || dateTo !== todayStr();

    return (
        <div className="space-y-5 pb-8">
            {/* Lightbox */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
                    onClick={() => setLightbox(null)}
                >
                    <div
                        className="relative max-w-xs w-full mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={lightbox.src}
                            alt={lightbox.name}
                            className="w-full rounded-2xl shadow-2xl object-cover"
                        />
                        <div className="absolute bottom-0 left-0 right-0 px-4 py-3 bg-gradient-to-t from-black/60 to-transparent rounded-b-2xl">
                            <p className="text-white text-[13px] font-medium">{lightbox.name}</p>
                        </div>
                        <button
                            onClick={() => setLightbox(null)}
                            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            <AdminPageHeader
                title="Детекции"
                subtitle="История распознаваний FaceID"
                count={total}
            />

            {/* Filters */}
            <div className="bg-white border border-slate-200 rounded-2xl p-4">
                <div className="flex flex-wrap gap-3 items-end">
                    {/* Date from */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] text-slate-400 font-medium px-0.5">С даты</span>
                        <Input
                            type="date"
                            value={dateFrom}
                            onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                            className="h-9 text-[13px] rounded-xl w-40"
                        />
                    </div>

                    {/* Date to */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] text-slate-400 font-medium px-0.5">По дату</span>
                        <Input
                            type="date"
                            value={dateTo}
                            onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
                            className="h-9 text-[13px] rounded-xl w-40"
                        />
                    </div>

                    {/* Object */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] text-slate-400 font-medium px-0.5">Объект</span>
                        <Select value={objectId || "all"} onValueChange={(v) => { setObjectId(v === "all" ? "" : v); setPage(1); }}>
                            <SelectTrigger className="w-44 h-9 text-[13px] rounded-xl">
                                <SelectValue placeholder="Все объекты" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Все объекты</SelectItem>
                                {objects.map((o) => (
                                    <SelectItem key={o.id} value={o.id}>{o.object_name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Attendance type */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] text-slate-400 font-medium px-0.5">Тип</span>
                        <Select value={attendanceType || "all"} onValueChange={(v) => { setAttendanceType(v === "all" ? "" : v); setPage(1); }}>
                            <SelectTrigger className="w-36 h-9 text-[13px] rounded-xl">
                                <SelectValue placeholder="Все" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Все</SelectItem>
                                <SelectItem value="1">Вход</SelectItem>
                                <SelectItem value="2">Выход</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Employee ID search */}
                    <div className="flex flex-col gap-1">
                        <span className="text-[11px] text-slate-400 font-medium px-0.5">ID сотрудника</span>
                        <div className="flex gap-1.5">
                            <Input
                                type="number"
                                value={employeeInput}
                                onChange={(e) => setEmployeeInput(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleEmployeeSearch()}
                                placeholder="Введите ID"
                                className="h-9 text-[13px] rounded-xl w-36"
                            />
                            <button
                                onClick={handleEmployeeSearch}
                                className="h-9 w-9 rounded-xl bg-blue-600 hover:bg-blue-700 flex items-center justify-center text-white shrink-0 transition-colors"
                            >
                                <Search className="w-3.5 h-3.5" />
                            </button>
                        </div>
                    </div>

                    {/* Clear */}
                    {hasFilter && (
                        <button
                            onClick={clearFilters}
                            className="h-9 px-3 rounded-xl border border-slate-200 hover:border-red-300 hover:text-red-500 text-slate-400 text-[13px] flex items-center gap-1.5 transition-colors"
                        >
                            <X className="w-3.5 h-3.5" />
                            Сбросить
                        </button>
                    )}
                </div>
            </div>

            <AdminTable
                loading={loading}
                headers={["ID", "Сотрудник", "Объект", "Тип", "Дата и время", "Фото"]}
            >
                {rows.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{row.id}</td>

                        {/* Employee */}
                        <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {row.employee_name ? row.employee_name.charAt(0).toUpperCase() : "?"}
                                </div>
                                <div>
                                    <p className="text-slate-900 text-[13px] font-medium leading-none">{row.employee_name || "—"}</p>
                                    <p className="text-slate-400 text-[11px] mt-0.5">ID: {row.faceid_user_id}</p>
                                </div>
                            </div>
                        </td>

                        {/* Object */}
                        <td className="px-4 py-3 text-slate-500 text-[13px]">{row.object_name || "—"}</td>

                        {/* Type badge */}
                        <td className="px-4 py-3">
                            {row.attendanceType === 1 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Вход
                                </span>
                            ) : row.attendanceType === 2 ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                    Выход
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-yellow-50 text-yellow-600 border border-yellow-100">
                                    <span className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                                    Без статуса
                                </span>
                            )}
                        </td>

                        {/* DateTime */}
                        <td className="px-4 py-3 text-slate-700 text-[13px] font-mono">{row.dateTime || "—"}</td>

                        {/* Photo */}
                        <td className="px-4 py-3">
                            {row.image_path ? (
                                <div
                                    className="w-10 h-10 rounded-lg overflow-hidden border border-slate-200 cursor-zoom-in hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 transition-all"
                                    onClick={() => setLightbox({ src: row.image_path!, name: row.employee_name })}
                                >
                                    <img
                                        src={row.image_path}
                                        alt={row.employee_name}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                            ) : (
                                <span className="text-slate-300 text-[12px]">—</span>
                            )}
                        </td>
                    </tr>
                ))}
                {rows.length === 0 && <EmptyRow colSpan={6} text="Детекции не найдены" />}
            </AdminTable>

            <TablePagination
                page={page}
                pages={pages}
                onPrev={() => setPage((p) => Math.max(1, p - 1))}
                onNext={() => setPage((p) => Math.min(pages, p + 1))}
            />
        </div>
    );
};

export default AdminDetections;
