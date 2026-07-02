import { useEffect, useState } from "react";
import {
    SuperAdminGetTerminals,
    SuperAdminGetObjects,
    SuperAdminCreateTerminal,
    SuperAdminUpdateTerminal,
    SuperAdminDeleteTerminal,
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

interface Terminal {
    terminal_id: string;
    object_id: string;
    object_name: string;
    terminal_name: string;
    direction_type: string;
    static_ip_address: string;
    terminal_port: string;
    brand: string;
    terminal_model: string;
    serial_number: string;
    devIndex: string;
    EhomeID: string;
    macAddress: string;
    login: string;
    is_active: string;
}

interface ObjectItem {
    id: string;
    object_name: string;
}

const DIRECTION_TYPES: Record<string, string> = {
    "1": "Только вход",
    "2": "Только выход",
    "3": "Вход + выход",
};

const emptyForm = {
    object_id: "",
    terminal_name: "",
    direction_type: "3",
    static_ip_address: "",
    terminal_port: "",
    brand: "",
    terminal_model: "",
    serial_number: "",
    firmware_version: "",
    devIndex: "",
    EhomeID: "",
    macAddress: "",
    login: "",
    password: "",
    is_active: "1",
};

type FormData = typeof emptyForm;

const AdminTerminals = () => {
    const [terminals, setTerminals] = useState<Terminal[]>([]);
    const [objects, setObjects] = useState<ObjectItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [filterObjectId, setFilterObjectId] = useState("");
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState<FormData>(emptyForm);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        SuperAdminGetObjects()
            .then((res) => setObjects(res.result ?? []))
            .catch(() => {});
    }, []);

    const load = (objId = filterObjectId) => {
        setLoading(true);
        SuperAdminGetTerminals(objId ? Number(objId) : undefined)
            .then((res) => setTerminals(res.result ?? []))
            .catch(() => toast.error("Не удалось загрузить терминалы"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(filterObjectId); }, [filterObjectId]);

    const openCreate = () => {
        setEditId(null);
        setForm(emptyForm);
        setOpen(true);
    };

    const openEdit = (t: Terminal) => {
        setEditId(t.terminal_id);
        setForm({
            object_id: t.object_id,
            terminal_name: t.terminal_name,
            direction_type: t.direction_type ?? "3",
            static_ip_address: t.static_ip_address ?? "",
            terminal_port: t.terminal_port ?? "",
            brand: t.brand ?? "",
            terminal_model: t.terminal_model ?? "",
            serial_number: t.serial_number ?? "",
            firmware_version: "",
            devIndex: t.devIndex ?? "",
            EhomeID: t.EhomeID ?? "",
            macAddress: t.macAddress ?? "",
            login: t.login ?? "",
            password: "",
            is_active: t.is_active,
        });
        setOpen(true);
    };

    const handleSave = async () => {
        if (!form.object_id) { toast.error("Объект обязателен"); return; }
        if (!form.terminal_name.trim()) { toast.error("Название терминала обязательно"); return; }
        if (!form.devIndex.trim()) { toast.error("devIndex обязателен"); return; }
        if (!form.EhomeID.trim()) { toast.error("EhomeID обязателен"); return; }
        if (!form.macAddress.trim()) { toast.error("MAC адрес обязателен"); return; }

        setSaving(true);
        try {
            const payload: Record<string, unknown> = {
                object_id: Number(form.object_id),
                terminal_name: form.terminal_name,
                direction_type: Number(form.direction_type),
                devIndex: form.devIndex,
                EhomeID: form.EhomeID,
                macAddress: form.macAddress,
                is_active: Number(form.is_active),
            };
            if (form.static_ip_address) payload.static_ip_address = form.static_ip_address;
            if (form.terminal_port) payload.terminal_port = Number(form.terminal_port);
            if (form.brand) payload.brand = form.brand;
            if (form.terminal_model) payload.terminal_model = form.terminal_model;
            if (form.serial_number) payload.serial_number = form.serial_number;
            if (form.firmware_version) payload.firmware_version = form.firmware_version;
            if (form.login) payload.login = form.login;
            if (form.password) payload.password = form.password;

            if (editId) {
                await SuperAdminUpdateTerminal(Number(editId), payload);
                toast.success("Терминал обновлён");
            } else {
                await SuperAdminCreateTerminal(payload);
                toast.success("Терминал создан");
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
        if (!confirm("Деактивировать терминал?")) return;
        try {
            await SuperAdminDeleteTerminal(Number(id));
            toast.success("Терминал деактивирован");
            load(filterObjectId);
        } catch {
            toast.error("Не удалось деактивировать");
        }
    };

    const setField = (key: keyof FormData, value: string) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    return (
        <div className="space-y-5 pb-8">
            <AdminPageHeader
                title="Терминалы"
                subtitle="Управление FaceID терминалами"
                count={terminals.length}
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

            <AdminTable
                loading={loading}
                headers={["Название", "Объект", "Направление", "IP", "Бренд / Модель", "Действия"]}
            >
                {terminals.map((t) => (
                    <tr key={t.terminal_id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3 font-medium text-slate-900">{t.terminal_name}</td>
                        <td className="px-4 py-3 text-slate-500 text-[13px]">{t.object_name}</td>
                        <td className="px-4 py-3">
                            {t.direction_type === "1" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                    Только вход
                                </span>
                            ) : t.direction_type === "2" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                                    Только выход
                                </span>
                            ) : t.direction_type === "3" ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                                    Вход + выход
                                </span>
                            ) : (
                                <span className="text-slate-400 text-[12px]">—</span>
                            )}
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{t.static_ip_address || "—"}</td>
                        <td className="px-4 py-3 text-slate-500 text-[13px]">
                            {[t.brand, t.terminal_model].filter(Boolean).join(" / ") || "—"}
                        </td>
                        <td className="px-4 py-3">
                            <ActionButtons onEdit={() => openEdit(t)} onDelete={() => handleDelete(t.terminal_id)} />
                        </td>
                    </tr>
                ))}
                {terminals.length === 0 && <EmptyRow colSpan={6} text="Терминалы не найдены" />}
            </AdminTable>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">
                            {editId ? "Редактировать терминал" : "Новый терминал"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 mt-2">
                        <div>
                            <Label>Объект *</Label>
                            <Select value={form.object_id || "none"} onValueChange={(v) => setField("object_id", v === "none" ? "" : v)}>
                                <SelectTrigger className="mt-1"><SelectValue placeholder="Выберите объект" /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Выберите объект</SelectItem>
                                    {objects.map((o) => (
                                        <SelectItem key={o.id} value={o.id}>{o.object_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Название *</Label>
                            <Input value={form.terminal_name} onChange={(e) => setField("terminal_name", e.target.value)} className="mt-1" placeholder="Вход главный" />
                        </div>
                        <div>
                            <Label>Направление</Label>
                            <Select value={form.direction_type} onValueChange={(v) => setField("direction_type", v)}>
                                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {Object.entries(DIRECTION_TYPES).map(([k, v]) => (
                                        <SelectItem key={k} value={k}>{v}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>IP адрес</Label>
                                <Input value={form.static_ip_address} onChange={(e) => setField("static_ip_address", e.target.value)} className="mt-1" placeholder="192.168.1.50" />
                            </div>
                            <div>
                                <Label>Порт</Label>
                                <Input type="number" value={form.terminal_port} onChange={(e) => setField("terminal_port", e.target.value)} className="mt-1" placeholder="8000" />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Бренд</Label>
                                <Input value={form.brand} onChange={(e) => setField("brand", e.target.value)} className="mt-1" placeholder="Hikvision" />
                            </div>
                            <div>
                                <Label>Модель</Label>
                                <Input value={form.terminal_model} onChange={(e) => setField("terminal_model", e.target.value)} className="mt-1" />
                            </div>
                        </div>
                        <div>
                            <Label>devIndex *</Label>
                            <Input
                                value={form.devIndex}
                                onChange={(e) => setField("devIndex", e.target.value)}
                                className="mt-1 font-mono text-[11px]"
                                placeholder="05BD25EB-8E5F-134D-A25F-045E094D66DE"
                            />
                        </div>
                        <div>
                            <Label>EhomeID *</Label>
                            <Input
                                value={form.EhomeID}
                                onChange={(e) => setField("EhomeID", e.target.value)}
                                className="mt-1"
                                placeholder="EhomeID терминала"
                            />
                        </div>
                        <div>
                            <Label>MAC адрес *</Label>
                            <Input
                                value={form.macAddress}
                                onChange={(e) => setField("macAddress", e.target.value)}
                                className="mt-1 font-mono"
                                placeholder="AA:BB:CC:DD:EE:FF"
                            />
                        </div>
                        <div>
                            <Label>Серийный номер</Label>
                            <Input value={form.serial_number} onChange={(e) => setField("serial_number", e.target.value)} className="mt-1" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Логин</Label>
                                <Input value={form.login} onChange={(e) => setField("login", e.target.value)} className="mt-1" />
                            </div>
                            <div>
                                <Label>Пароль</Label>
                                <Input type="password" value={form.password} onChange={(e) => setField("password", e.target.value)} className="mt-1" />
                            </div>
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

export default AdminTerminals;
