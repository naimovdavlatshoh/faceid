import { useEffect, useState } from "react";
import {
    SuperAdminGetEmployees,
    SuperAdminGetObjects,
    SuperAdminCreateEmployee,
    SuperAdminUpdateEmployee,
    SuperAdminDeleteEmployee,
} from "@/services/data";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { AdminPageHeader, AdminTable, EmptyRow, ActionButtons, TablePagination } from "@/components/admin/AdminTable";

interface Employee {
    faceid_user_id: string;
    name: string;
    object_id: string;
    object_name: string;
    position_name: string;
    salary: string;
    salary_type: string;
    is_active: string;
    face_is_uploaded: string | number;
    image_path: string | null;
}

interface ObjectItem {
    id: string;
    object_name: string;
}

const SALARY_TYPES: Record<string, string> = {
    "1": "Фиксированная",
    "2": "Недельная",
    "3": "Ежедневная",
    "4": "Часовая",
};

const emptyForm = {
    faceid_user_id: "",
    name: "",
    object_id: "",
    position_id: "",
    salary: "",
    salary_type: "1",
    shift_id: "",
    day_off_type: "1",
    is_active: "1",
};

type FormData = typeof emptyForm;

const AdminEmployees = () => {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [objects, setObjects] = useState<ObjectItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [filterObjectId, setFilterObjectId] = useState<string>("");
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState<FormData>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [lightbox, setLightbox] = useState<{ src: string; name: string } | null>(null);

    useEffect(() => {
        SuperAdminGetObjects()
            .then((res) => setObjects(res.result ?? []))
            .catch(() => {});
    }, []);

    const load = (p = page, objId = filterObjectId) => {
        setLoading(true);
        SuperAdminGetEmployees(p, 20, objId ? Number(objId) : undefined)
            .then((res) => {
                setEmployees(res.result ?? []);
                setPages(res.pages ?? 1);
                setTotal(res.total ?? 0);
            })
            .catch(() => toast.error("Не удалось загрузить сотрудников"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(page, filterObjectId); }, [page, filterObjectId]);

    const openCreate = () => {
        setEditId(null);
        setForm(emptyForm);
        setOpen(true);
    };

    const openEdit = (e: Employee) => {
        setEditId(e.faceid_user_id);
        setForm({
            faceid_user_id: e.faceid_user_id,
            name: e.name,
            object_id: e.object_id ?? "",
            position_id: "",
            salary: e.salary ?? "",
            salary_type: e.salary_type ?? "1",
            shift_id: "",
            day_off_type: "1",
            is_active: e.is_active,
        });
        setOpen(true);
    };

    const handleSave = async () => {
        if (!form.name.trim()) { toast.error("Имя обязательно"); return; }
        if (!editId && !form.faceid_user_id) { toast.error("ID сотрудника обязателен"); return; }

        setSaving(true);
        try {
            const payload: Record<string, unknown> = {
                name: form.name,
                is_active: Number(form.is_active),
            };
            if (form.object_id) payload.object_id = Number(form.object_id);
            if (form.position_id) payload.position_id = Number(form.position_id);
            if (form.salary) payload.salary = Number(form.salary);
            if (form.salary_type) payload.salary_type = Number(form.salary_type);
            if (form.shift_id) payload.shift_id = Number(form.shift_id);
            payload.day_off_type = Number(form.day_off_type);

            if (editId) {
                await SuperAdminUpdateEmployee(Number(editId), payload);
                toast.success("Сотрудник обновлён");
            } else {
                payload.faceid_user_id = Number(form.faceid_user_id);
                await SuperAdminCreateEmployee(payload);
                toast.success("Сотрудник создан");
            }
            setOpen(false);
            load(page, filterObjectId);
        } catch (e: any) {
            toast.error(e?.response?.data?.error ?? "Ошибка сохранения");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Деактивировать сотрудника?")) return;
        try {
            await SuperAdminDeleteEmployee(Number(id));
            toast.success("Сотрудник деактивирован");
            load(page, filterObjectId);
        } catch {
            toast.error("Не удалось деактивировать");
        }
    };

    const setField = (key: keyof FormData, value: string) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    return (
        <div className="space-y-5 pb-8">
            {/* Lightbox */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
                    onClick={() => setLightbox(null)}
                >
                    <div
                        className="relative max-w-sm w-full mx-4"
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
                title="Сотрудники"
                subtitle="FaceID сотрудники"
                count={total}
                onAdd={openCreate}
                extra={
                    <Select
                        value={filterObjectId || "all"}
                        onValueChange={(v) => { setPage(1); setFilterObjectId(v === "all" ? "" : v); }}
                    >
                        <SelectTrigger className="w-48 h-9 text-[13px] rounded-xl"><SelectValue placeholder="Все объекты" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Все объекты</SelectItem>
                            {objects.map((o) => <SelectItem key={o.id} value={o.id}>{o.object_name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                }
            />

            <AdminTable
                loading={loading}
                headers={["ID", "Имя", "Объект", "Должность", "Зарплата", "Фото", "Действия"]}
            >
                {employees.map((emp) => (
                    <tr key={emp.faceid_user_id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{emp.faceid_user_id}</td>
                        <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-9 h-9 rounded-full overflow-hidden shrink-0 border border-gray-100 ${emp.image_path ? "cursor-zoom-in hover:ring-2 hover:ring-blue-400 hover:ring-offset-1 transition-all" : ""}`}
                                    onClick={() => emp.image_path && setLightbox({ src: emp.image_path, name: emp.name })}
                                >
                                    {emp.image_path ? (
                                        <img
                                            src={emp.image_path}
                                            alt={emp.name}
                                            className="w-full h-full object-cover"
                                            onError={(e) => {
                                                const target = e.currentTarget;
                                                target.style.display = "none";
                                                (target.nextElementSibling as HTMLElement | null)?.classList.remove("hidden");
                                            }}
                                        />
                                    ) : null}
                                    <div className={`w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-xs font-bold ${emp.image_path ? "hidden" : ""}`}>
                                        {emp.name.charAt(0).toUpperCase()}
                                    </div>
                                </div>
                                <span className="font-medium text-slate-900 text-[13px]">{emp.name}</span>
                            </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-[13px]">{emp.object_name || "—"}</td>
                        <td className="px-4 py-3 text-slate-500 text-[13px]">{emp.position_name || "—"}</td>
                        <td className="px-4 py-3 text-slate-700 text-[13px]">
                            {emp.salary
                                ? `${Number(emp.salary).toLocaleString()} · ${SALARY_TYPES[emp.salary_type] ?? ""}`
                                : "—"}
                        </td>
                        <td className="px-4 py-3">
                            {(() => {
                                const hasPhoto = String(emp.face_is_uploaded) === "1";
                                return (
                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${
                                        hasPhoto
                                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                            : "bg-yellow-50 text-yellow-700 border-yellow-100"
                                    }`}>
                                        <span className={`w-1.5 h-1.5 rounded-full ${hasPhoto ? "bg-emerald-500" : "bg-yellow-400"}`} />
                                        {hasPhoto ? "Загружено" : "Нет фото"}
                                    </span>
                                );
                            })()}
                        </td>
                        <td className="px-4 py-3">
                            <ActionButtons onEdit={() => openEdit(emp)} onDelete={() => handleDelete(emp.faceid_user_id)} />
                        </td>
                    </tr>
                ))}
                {employees.length === 0 && <EmptyRow colSpan={7} text="Сотрудники не найдены" />}
            </AdminTable>
            <TablePagination
                page={page}
                pages={pages}
                onPrev={() => setPage((p) => Math.max(1, p - 1))}
                onNext={() => setPage((p) => Math.min(pages, p + 1))}
            />

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">
                            {editId ? "Редактировать сотрудника" : "Новый сотрудник"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 mt-2">
                        {!editId && (
                            <div>
                                <Label>FaceID ID *</Label>
                                <Input
                                    type="number"
                                    value={form.faceid_user_id}
                                    onChange={(e) => setField("faceid_user_id", e.target.value)}
                                    className="mt-1"
                                    placeholder="Уникальный ID с терминала"
                                />
                            </div>
                        )}
                        <div>
                            <Label>Имя *</Label>
                            <Input
                                value={form.name}
                                onChange={(e) => setField("name", e.target.value)}
                                maxLength={32}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label>Объект</Label>
                            <Select value={form.object_id || "none"} onValueChange={(v) => setField("object_id", v === "none" ? "" : v)}>
                                <SelectTrigger className="mt-1"><SelectValue placeholder="Не выбран" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Не выбран</SelectItem>
                                    {objects.map((o) => (
                                        <SelectItem key={o.id} value={o.id}>{o.object_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Зарплата</Label>
                            <Input
                                type="number"
                                value={form.salary}
                                onChange={(e) => setField("salary", e.target.value)}
                                className="mt-1"
                                placeholder="В сумах"
                            />
                        </div>
                        <div>
                            <Label>Тип зарплаты</Label>
                            <Select value={form.salary_type} onValueChange={(v) => setField("salary_type", v)}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {Object.entries(SALARY_TYPES).map(([k, v]) => (
                                        <SelectItem key={k} value={k}>{v}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Тип выходных</Label>
                            <Select value={form.day_off_type} onValueChange={(v) => setField("day_off_type", v)}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="0">Скользящий график</SelectItem>
                                    <SelectItem value="1">Стандарт (фикс. дни)</SelectItem>
                                    <SelectItem value="2">Без выходных</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {editId && (
                            <div>
                                <Label>Статус</Label>
                                <Select value={form.is_active} onValueChange={(v) => setField("is_active", v)}>
                                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Активен</SelectItem>
                                        <SelectItem value="0">Неактивен</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" className="flex-1 rounded-lg" onClick={() => setOpen(false)}>Отмена</Button>
                            <Button className="flex-1 rounded-xl bg-blue-600 hover:bg-blue-700" onClick={handleSave} disabled={saving}>
                                {saving ? "Сохранение..." : "Сохранить"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default AdminEmployees;
