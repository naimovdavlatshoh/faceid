import { useEffect, useState } from "react";
import {
    SuperAdminGetObjectUsers,
    SuperAdminGetObjects,
    SuperAdminCreateObjectUser,
    SuperAdminUpdateObjectUser,
    SuperAdminDeleteObjectUser,
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
import { AdminPageHeader, AdminTable, EmptyRow, ActionButtons } from "@/components/admin/AdminTable";

interface ObjectUser {
    id: string;
    faceid_user_id: string;
    employee_name: string;
    object_id: string;
    object_name: string;
    is_active: string;
    created_at: string;
}

interface ObjectItem {
    id: string;
    object_name: string;
}

const AdminObjectUsers = () => {
    const [bindings, setBindings] = useState<ObjectUser[]>([]);
    const [objects, setObjects] = useState<ObjectItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterObjectId, setFilterObjectId] = useState("");
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState({ faceid_user_id: "", object_id: "", is_active: "1" });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        SuperAdminGetObjects().then((res) => setObjects(res.result ?? [])).catch(() => {});
    }, []);

    const load = (objId = filterObjectId) => {
        setLoading(true);
        SuperAdminGetObjectUsers(objId ? Number(objId) : undefined)
            .then((res) => setBindings(res.result ?? []))
            .catch(() => toast.error("Не удалось загрузить привязки"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(filterObjectId); }, [filterObjectId]);

    const openCreate = () => {
        setEditId(null);
        setForm({ faceid_user_id: "", object_id: "", is_active: "1" });
        setOpen(true);
    };

    const openEdit = (b: ObjectUser) => {
        setEditId(b.id);
        setForm({ faceid_user_id: b.faceid_user_id, object_id: b.object_id, is_active: b.is_active });
        setOpen(true);
    };

    const handleSave = async () => {
        if (!form.faceid_user_id || !form.object_id) {
            toast.error("Заполните все обязательные поля");
            return;
        }
        setSaving(true);
        try {
            const payload = {
                faceid_user_id: Number(form.faceid_user_id),
                object_id: Number(form.object_id),
                is_active: Number(form.is_active),
            };
            if (editId) {
                await SuperAdminUpdateObjectUser(Number(editId), payload);
                toast.success("Привязка обновлена");
            } else {
                await SuperAdminCreateObjectUser(payload);
                toast.success("Привязка создана");
            }
            setOpen(false);
            load(filterObjectId);
        } catch (e: any) {
            toast.error(e?.response?.data?.error ?? "Ошибка сохранения");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Деактивировать привязку?")) return;
        try {
            await SuperAdminDeleteObjectUser(Number(id));
            toast.success("Привязка деактивирована");
            load(filterObjectId);
        } catch {
            toast.error("Не удалось деактивировать");
        }
    };

    return (
        <div className="space-y-5 pb-8">
            <AdminPageHeader
                title="Привязки сотрудник ↔ объект"
                subtitle="Управление привязками FaceID сотрудников к объектам"
                count={bindings.length}
                onAdd={openCreate}
                extra={
                    <Select value={filterObjectId || "all"} onValueChange={(v) => setFilterObjectId(v === "all" ? "" : v)}>
                        <SelectTrigger className="w-48 h-9 text-[13px] rounded-xl"><SelectValue placeholder="Все объекты" /></SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Все объекты</SelectItem>
                            {objects.map((o) => <SelectItem key={o.id} value={o.id}>{o.object_name}</SelectItem>)}
                        </SelectContent>
                    </Select>
                }
            />

            <AdminTable loading={loading} headers={["Сотрудник", "FaceID ID", "Объект", "Действия"]}>
                {bindings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{b.employee_name || "—"}</td>
                        <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">{b.faceid_user_id}</td>
                        <td className="px-4 py-3 text-slate-500 text-[13px]">{b.object_name}</td>
                        <td className="px-4 py-3">
                            <ActionButtons onEdit={() => openEdit(b)} onDelete={() => handleDelete(b.id)} />
                        </td>
                    </tr>
                ))}
                {bindings.length === 0 && <EmptyRow colSpan={4} text="Привязки не найдены" />}
            </AdminTable>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-sm rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">
                            {editId ? "Редактировать привязку" : "Новая привязка"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 mt-2">
                        <div>
                            <Label>FaceID ID сотрудника *</Label>
                            <Input
                                type="number"
                                value={form.faceid_user_id}
                                onChange={(e) => setForm((p) => ({ ...p, faceid_user_id: e.target.value }))}
                                className="mt-1"
                                disabled={!!editId}
                            />
                        </div>
                        <div>
                            <Label>Объект *</Label>
                            <Select value={form.object_id || "none"} onValueChange={(v) => setForm((p) => ({ ...p, object_id: v === "none" ? "" : v }))}>
                                <SelectTrigger className="mt-1"><SelectValue placeholder="Выберите объект" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Выберите объект</SelectItem>
                                    {objects.map((o) => <SelectItem key={o.id} value={o.id}>{o.object_name}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        {editId && (
                            <div>
                                <Label>Статус</Label>
                                <Select value={form.is_active} onValueChange={(v) => setForm((p) => ({ ...p, is_active: v }))}>
                                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Активна</SelectItem>
                                        <SelectItem value="0">Неактивна</SelectItem>
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

export default AdminObjectUsers;
