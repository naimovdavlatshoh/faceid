import { useEffect, useState } from "react";
import {
    SuperAdminGetObjectTelegram,
    SuperAdminGetObjects,
    SuperAdminCreateObjectTelegram,
    SuperAdminUpdateObjectTelegram,
    SuperAdminDeleteObjectTelegram,
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

interface TelegramRecord {
    id: string;
    object_id: string;
    object_name: string;
    telegram_id: string;
    is_active: string;
    created_at: string;
}

interface ObjectItem {
    id: string;
    object_name: string;
}

const AdminObjectTelegram = () => {
    const [records, setRecords] = useState<TelegramRecord[]>([]);
    const [objects, setObjects] = useState<ObjectItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterObjectId, setFilterObjectId] = useState("");
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState({ object_id: "", telegram_id: "", is_active: "1" });
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        SuperAdminGetObjects().then((res) => setObjects(res.result ?? [])).catch(() => {});
    }, []);

    const load = (objId = filterObjectId) => {
        setLoading(true);
        SuperAdminGetObjectTelegram(objId ? Number(objId) : undefined)
            .then((res) => setRecords(res.result ?? []))
            .catch(() => toast.error("Не удалось загрузить Telegram-записи"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(filterObjectId); }, [filterObjectId]);

    const openCreate = () => {
        setEditId(null);
        setForm({ object_id: "", telegram_id: "", is_active: "1" });
        setOpen(true);
    };

    const openEdit = (r: TelegramRecord) => {
        setEditId(r.id);
        setForm({ object_id: r.object_id, telegram_id: r.telegram_id, is_active: r.is_active });
        setOpen(true);
    };

    const handleSave = async () => {
        if (!form.object_id || !form.telegram_id) {
            toast.error("Заполните все обязательные поля");
            return;
        }
        setSaving(true);
        try {
            const payload = {
                object_id: Number(form.object_id),
                telegram_id: Number(form.telegram_id),
                is_active: Number(form.is_active),
            };
            if (editId) {
                await SuperAdminUpdateObjectTelegram(Number(editId), payload);
                toast.success("Telegram-запись обновлена");
            } else {
                await SuperAdminCreateObjectTelegram(payload);
                toast.success("Telegram-запись создана");
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
        if (!confirm("Деактивировать Telegram-запись?")) return;
        try {
            await SuperAdminDeleteObjectTelegram(Number(id));
            toast.success("Telegram-запись деактивирована");
            load(filterObjectId);
        } catch {
            toast.error("Не удалось деактивировать");
        }
    };

    return (
        <div className="space-y-5 pb-8">
            <AdminPageHeader
                title="Telegram уведомления"
                subtitle="Telegram чаты привязанные к объектам"
                count={records.length}
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

            <AdminTable loading={loading} headers={["Объект", "Telegram ID", "Создан", "Действия"]}>
                {records.map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{r.object_name}</td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{r.telegram_id}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">
                            {new Date(r.created_at).toLocaleDateString("ru-RU")}
                        </td>
                        <td className="px-4 py-3">
                            <ActionButtons onEdit={() => openEdit(r)} onDelete={() => handleDelete(r.id)} />
                        </td>
                    </tr>
                ))}
                {records.length === 0 && <EmptyRow colSpan={4} text="Записи не найдены" />}
            </AdminTable>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-sm rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">
                            {editId ? "Редактировать запись" : "Новая Telegram-запись"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 mt-2">
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
                        <div>
                            <Label>Telegram ID *</Label>
                            <Input
                                type="number"
                                value={form.telegram_id}
                                onChange={(e) => setForm((p) => ({ ...p, telegram_id: e.target.value }))}
                                className="mt-1"
                                placeholder="123456789"
                            />
                        </div>
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

export default AdminObjectTelegram;
