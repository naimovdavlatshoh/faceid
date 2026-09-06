import { useEffect, useState } from "react";
import {
    SuperAdminGetObjects,
    SuperAdminGetTerminals,
    SuperAdminGetEmployees,
    SuperAdminUploadUserToTerminal,
} from "@/services/data";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { MdSync } from "react-icons/md";
import { FiCheck, FiX, FiAlertTriangle } from "react-icons/fi";
import { AdminPageHeader, AdminTable, EmptyRow } from "@/components/admin/AdminTable";

interface ObjectItem {
    id: string;
    object_name: string;
}

interface Terminal {
    terminal_id: string;
    terminal_name: string;
    static_ip_address: string;
}

interface Employee {
    faceid_user_id: string;
    name: string;
    image_path?: string;
}

type RowState = "pending" | "running" | "ok" | "skipped" | "error";

const AdminTerminalUpload = () => {
    const [objects, setObjects] = useState<ObjectItem[]>([]);
    const [selectedObject, setSelectedObject] = useState("");
    const [terminals, setTerminals] = useState<Terminal[]>([]);
    const [selectedTerminal, setSelectedTerminal] = useState("");
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loadingLists, setLoadingLists] = useState(false);
    const [isRunning, setIsRunning] = useState(false);
    const [statuses, setStatuses] = useState<
        Record<string, { state: RowState; message?: string }>
    >({});

    useEffect(() => {
        SuperAdminGetObjects()
            .then((res) => setObjects(res.result ?? []))
            .catch(() => toast.error("Не удалось загрузить объекты"));
    }, []);

    // Загрузка всех активных сотрудников объекта (постранично, лимит 100)
    const fetchAllEmployees = async (objectId: number): Promise<Employee[]> => {
        const all: Employee[] = [];
        let page = 1;
        for (let guard = 0; guard < 100; guard++) {
            const data = await SuperAdminGetEmployees(page, 100, objectId);
            const chunk: Employee[] = data?.result ?? [];
            all.push(...chunk);
            const pages = data?.pages ?? 1;
            if (chunk.length === 0 || page >= pages) break;
            page++;
        }
        return all;
    };

    const handleObjectChange = async (objId: string) => {
        setSelectedObject(objId);
        setSelectedTerminal("");
        setTerminals([]);
        setEmployees([]);
        setStatuses({});
        if (!objId) return;
        setLoadingLists(true);
        try {
            const [termRes, emps] = await Promise.all([
                SuperAdminGetTerminals(Number(objId)),
                fetchAllEmployees(Number(objId)),
            ]);
            setTerminals(termRes?.result ?? []);
            setEmployees(emps);
            const init: Record<string, { state: RowState }> = {};
            emps.forEach((u) => (init[u.faceid_user_id] = { state: "pending" }));
            setStatuses(init);
        } catch {
            toast.error("Не удалось загрузить терминалы или сотрудников");
        } finally {
            setLoadingLists(false);
        }
    };

    const setRow = (userId: string, state: RowState, message?: string) => {
        setStatuses((prev) => ({ ...prev, [userId]: { state, message } }));
    };

    // Последовательная заливка (не параллельно)
    const run = async (targets: Employee[]) => {
        if (!selectedObject || !selectedTerminal) return;
        const objectId = Number(selectedObject);
        const terminalId = Number(selectedTerminal);
        setIsRunning(true);
        for (const u of targets) {
            setRow(u.faceid_user_id, "running");
            try {
                const res = await SuperAdminUploadUserToTerminal(
                    objectId,
                    terminalId,
                    Number(u.faceid_user_id)
                );
                const st: RowState =
                    res?.status === "ok"
                        ? "ok"
                        : res?.status === "skipped"
                          ? "skipped"
                          : "error";
                setRow(u.faceid_user_id, st, res?.message);
            } catch (error: any) {
                setRow(
                    u.faceid_user_id,
                    "error",
                    error?.response?.data?.message ||
                        error?.response?.data?.error ||
                        "Ошибка заливки"
                );
            }
        }
        setIsRunning(false);
        toast.success("Заливка завершена");
    };

    const handleStart = () => {
        const init: Record<string, { state: RowState }> = {};
        employees.forEach((u) => (init[u.faceid_user_id] = { state: "pending" }));
        setStatuses(init);
        run(employees);
    };

    const handleRetryFailed = () => {
        const failed = employees.filter(
            (u) => statuses[u.faceid_user_id]?.state === "error"
        );
        if (failed.length === 0) return;
        run(failed);
    };

    const okCount = employees.filter(
        (u) => statuses[u.faceid_user_id]?.state === "ok"
    ).length;
    const skippedCount = employees.filter(
        (u) => statuses[u.faceid_user_id]?.state === "skipped"
    ).length;
    const errorCount = employees.filter(
        (u) => statuses[u.faceid_user_id]?.state === "error"
    ).length;
    const doneCount = okCount + skippedCount + errorCount;
    const total = employees.length;
    const anyProcessed = doneCount > 0;

    const StatusCell = ({ userId }: { userId: string }) => {
        const s = statuses[userId]?.state ?? "pending";
        const msg = statuses[userId]?.message;
        if (s === "running")
            return (
                <span className="inline-flex items-center gap-1.5 text-[13px] text-blue-600">
                    <span className="w-3.5 h-3.5 border-2 border-blue-200 border-t-blue-600 rounded-full animate-spin" />
                    Заливка...
                </span>
            );
        if (s === "ok")
            return (
                <span className="inline-flex items-center gap-1.5 text-[13px] text-emerald-600">
                    <FiCheck className="w-4 h-4" /> Залито
                </span>
            );
        if (s === "skipped")
            return (
                <span
                    className="inline-flex items-center gap-1.5 text-[13px] text-amber-600"
                    title={msg}
                >
                    <FiAlertTriangle className="w-4 h-4" /> Нет фото
                </span>
            );
        if (s === "error")
            return (
                <span
                    className="inline-flex items-center gap-1.5 text-[13px] text-red-600"
                    title={msg}
                >
                    <FiX className="w-4 h-4" /> Ошибка
                    {msg && (
                        <span className="text-[11px] text-red-400 max-w-[240px] truncate">
                            {msg}
                        </span>
                    )}
                </span>
            );
        return <span className="text-[13px] text-slate-400">Ожидает</span>;
    };

    return (
        <div className="space-y-5 pb-8">
            <AdminPageHeader
                title="Заливка на терминал"
                subtitle="Перезаливка текущих сотрудников объекта на новый терминал (по одному)"
            />

            <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm p-4 space-y-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
                    <div className="flex flex-col gap-3 sm:flex-row">
                        <div>
                            <label className="text-[12px] text-slate-500 mb-1 block">
                                Объект
                            </label>
                            <Select
                                value={selectedObject}
                                onValueChange={handleObjectChange}
                                disabled={isRunning}
                            >
                                <SelectTrigger className="w-56 h-9 text-[13px] rounded-xl">
                                    <SelectValue placeholder="Выберите объект" />
                                </SelectTrigger>
                                <SelectContent>
                                    {objects.map((o) => (
                                        <SelectItem key={o.id} value={o.id}>
                                            {o.object_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-[12px] text-slate-500 mb-1 block">
                                Новый терминал
                            </label>
                            <Select
                                value={selectedTerminal}
                                onValueChange={setSelectedTerminal}
                                disabled={
                                    isRunning ||
                                    !selectedObject ||
                                    terminals.length === 0
                                }
                            >
                                <SelectTrigger className="w-64 h-9 text-[13px] rounded-xl">
                                    <SelectValue placeholder="Выберите терминал" />
                                </SelectTrigger>
                                <SelectContent>
                                    {terminals.map((term) => (
                                        <SelectItem
                                            key={term.terminal_id}
                                            value={term.terminal_id}
                                        >
                                            {term.terminal_name}
                                            {term.static_ip_address
                                                ? ` · ${term.static_ip_address}`
                                                : ""}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            {selectedObject &&
                                !loadingLists &&
                                terminals.length === 0 && (
                                    <p className="text-[11px] text-red-500 mt-1">
                                        Активные терминалы не найдены
                                    </p>
                                )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {errorCount > 0 && !isRunning && (
                            <Button
                                variant="outline"
                                onClick={handleRetryFailed}
                                className="text-[13px] text-red-600 border-red-200 hover:bg-red-50 hover:text-red-600 rounded-xl"
                            >
                                Повторить упавших ({errorCount})
                            </Button>
                        )}
                        <Button
                            onClick={handleStart}
                            disabled={
                                isRunning ||
                                !selectedTerminal ||
                                employees.length === 0
                            }
                            className="bg-blue-600 hover:bg-blue-700 text-white text-[13px] rounded-xl"
                        >
                            <MdSync
                                className={`w-4 h-4 mr-1 ${
                                    isRunning ? "animate-spin" : ""
                                }`}
                            />
                            {isRunning ? "Заливка..." : "Начать заливку"}
                        </Button>
                    </div>
                </div>

                {/* Счётчики и прогресс */}
                {selectedObject && (
                    <div className="flex flex-wrap items-center gap-3 text-[13px]">
                        <span className="text-slate-500">
                            Сотрудников: {total}
                        </span>
                        {(isRunning || anyProcessed) && (
                            <>
                                <span className="text-slate-400">
                                    {doneCount} из {total}
                                </span>
                                <span className="text-emerald-600">
                                    Залито: {okCount}
                                </span>
                                <span className="text-amber-600">
                                    Без фото: {skippedCount}
                                </span>
                                <span className="text-red-600">
                                    Ошибок: {errorCount}
                                </span>
                            </>
                        )}
                    </div>
                )}

                {(isRunning || anyProcessed) && total > 0 && (
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-blue-500 transition-all duration-200"
                            style={{ width: `${(doneCount / total) * 100}%` }}
                        />
                    </div>
                )}

                {skippedCount > 0 && (
                    <p className="text-[12px] text-amber-600 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">
                        Сотрудникам без фото сначала загрузите фото обычным способом.
                    </p>
                )}
            </div>

            <AdminTable
                loading={loadingLists}
                headers={["Сотрудник", "Статус"]}
            >
                {employees.map((u) => (
                    <tr
                        key={u.faceid_user_id}
                        className="hover:bg-slate-50/60 transition-colors"
                    >
                        <td className="px-4 py-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <div className="w-9 h-9 min-w-9 rounded-full overflow-hidden border border-slate-200 flex-shrink-0">
                                    <img
                                        src={u.image_path || "/avatar-1.webp"}
                                        alt=""
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[13px] font-medium text-slate-900">
                                        {u.name}
                                    </p>
                                    <p className="text-[11px] text-slate-400 font-mono">
                                        #{u.faceid_user_id}
                                    </p>
                                </div>
                            </div>
                        </td>
                        <td className="px-4 py-3">
                            <StatusCell userId={u.faceid_user_id} />
                        </td>
                    </tr>
                ))}
                {!loadingLists && employees.length === 0 && (
                    <EmptyRow
                        colSpan={2}
                        text={
                            selectedObject
                                ? "Активные сотрудники не найдены"
                                : "Выберите объект"
                        }
                    />
                )}
            </AdminTable>
        </div>
    );
};

export default AdminTerminalUpload;
