import { Fragment, useEffect, useState } from "react";
import {
    SuperAdminGetObjects,
    SuperAdminCreateObject,
    SuperAdminUpdateObject,
    SuperAdminDeleteObject,
    SuperAdminGetDashboard,
} from "@/services/data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";
import { MdWifi, MdWifiOff } from "react-icons/md";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
    AdminPageHeader,
    AdminTable,
    EmptyRow,
    ActionButtons,
    FlagBadge,
} from "@/components/admin/AdminTable";

interface ObjectItem {
    id: string;
    object_name: string;
    object_address: string;
    is_static_ip: string;
    simcard_number: string;
    router_ip: string;
    router_login: string;
    router_password: string;
    is_isup: string;
    is_time_control: string;
    is_overtime_control: string;
    is_telegram_notification: string;
    is_parent_notification: string;
    is_early_arrival_count_enabled: string;
    is_active: string;
    created_at: string;
}

interface ObjectTerminalItem {
    terminal_id: string;
    terminal_name: string;
    EhomeID: string;
    status: string; // "online" | иное => оффлайн
}

interface ObjectTerminalCount {
    object_id: string;
    object_name: string;
    terminals_count: number;
    terminals: ObjectTerminalItem[];
}

const emptyForm = {
    object_name: "",
    object_address: "",
    is_static_ip: 0,
    simcard_number: "",
    router_ip: "",
    router_login: "",
    router_password: "",
    is_isup: 0,
    is_time_control: 0,
    is_overtime_control: 0,
    is_telegram_notification: 0,
    is_parent_notification: 0,
    is_early_arrival_count_enabled: 0,
};

type FormData = typeof emptyForm;

const Toggle = ({
    label,
    value,
    onChange,
}: {
    label: string;
    value: number;
    onChange: (v: number) => void;
}) => (
    <div className="flex items-center justify-between py-2">
        <span className="text-sm text-slate-700">{label}</span>
        <button
            type="button"
            onClick={() => onChange(value === 1 ? 0 : 1)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                value === 1 ? "bg-blue-500" : "bg-gray-200"
            }`}
        >
            <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    value === 1 ? "translate-x-6" : "translate-x-1"
                }`}
            />
        </button>
    </div>
);

const AdminObjects = () => {
    const [objects, setObjects] = useState<ObjectItem[]>([]);
    const [terminalsByObject, setTerminalsByObject] = useState<
        Record<string, ObjectTerminalCount>
    >({});
    const [expandedId, setExpandedId] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState<FormData>(emptyForm);
    const [saving, setSaving] = useState(false);

    const load = () => {
        setLoading(true);
        Promise.all([
            SuperAdminGetObjects(),
            // статусы терминалов приходят из общего дашборда; не роняем страницу, если недоступны
            SuperAdminGetDashboard().catch(() => null),
        ])
            .then(([objRes, dashRes]) => {
                setObjects(objRes.result ?? []);
                const map: Record<string, ObjectTerminalCount> = {};
                (
                    (dashRes?.objects_terminals_count ??
                        []) as ObjectTerminalCount[]
                ).forEach((o) => {
                    map[String(o.object_id)] = o;
                });
                setTerminalsByObject(map);
            })
            .catch(() => toast.error("Не удалось загрузить объекты"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(); }, []);

    const openCreate = () => {
        setEditId(null);
        setForm(emptyForm);
        setOpen(true);
    };

    const openEdit = (obj: ObjectItem) => {
        setEditId(obj.id);
        setForm({
            object_name: obj.object_name,
            object_address: obj.object_address ?? "",
            is_static_ip: Number(obj.is_static_ip),
            simcard_number: obj.simcard_number ?? "",
            router_ip: obj.router_ip ?? "",
            router_login: obj.router_login ?? "",
            router_password: obj.router_password ?? "",
            is_isup: Number(obj.is_isup),
            is_time_control: Number(obj.is_time_control),
            is_overtime_control: Number(obj.is_overtime_control),
            is_telegram_notification: Number(obj.is_telegram_notification),
            is_parent_notification: Number(obj.is_parent_notification),
            is_early_arrival_count_enabled: Number(
                obj.is_early_arrival_count_enabled,
            ),
        });
        setOpen(true);
    };

    const handleSave = async () => {
        if (!form.object_name.trim()) {
            toast.error("Название объекта обязательно");
            return;
        }
        setSaving(true);
        try {
            if (editId) {
                await SuperAdminUpdateObject(Number(editId), form);
                toast.success("Объект обновлён");
            } else {
                await SuperAdminCreateObject(form);
                toast.success("Объект создан");
            }
            setOpen(false);
            load();
        } catch (e: any) {
            toast.error(e?.response?.data?.error ?? "Ошибка сохранения");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Деактивировать объект?")) return;
        try {
            await SuperAdminDeleteObject(Number(id));
            toast.success("Объект деактивирован");
            load();
        } catch {
            toast.error("Не удалось деактивировать объект");
        }
    };

    const setField = (key: keyof FormData, value: string | number) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    // Общая сводка по терминалам (для шапки)
    const allTerminals = Object.values(terminalsByObject).flatMap(
        (o) => o.terminals,
    );
    const totalOnline = allTerminals.filter(
        (t) => t.status === "online",
    ).length;
    const totalOffline = allTerminals.length - totalOnline;

    return (
        <div className="space-y-5 pb-8">
            <AdminPageHeader
                title="Объекты"
                subtitle="Управление объектами системы"
                count={objects.length}
                onAdd={openCreate}
                extra={
                    allTerminals.length > 0 && (
                        <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-100">
                                <MdWifi className="w-3.5 h-3.5" />
                                {totalOnline} онлайн
                            </span>
                            {totalOffline > 0 && (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-red-50 text-red-600 border border-red-100">
                                    <MdWifiOff className="w-3.5 h-3.5" />
                                    {totalOffline} оффлайн
                                </span>
                            )}
                        </div>
                    )
                }
            />

            <AdminTable
                loading={loading}
                headers={["Название", "Адрес", "iSUP", "Контроль времени", "Переработки", "Ранний приход", "Telegram", "Уведомл. родит.", "Терминалы", "Создан", "Действия"]}
            >
                {objects.map((obj) => {
                    const term = terminalsByObject[String(obj.id)];
                    const total = term?.terminals_count ?? 0;
                    const online = term
                        ? term.terminals.filter((t) => t.status === "online")
                              .length
                        : 0;
                    const offline = total - online;
                    const isExpanded = expandedId === obj.id;

                    return (
                        <Fragment key={obj.id}>
                            <tr className="hover:bg-slate-50/60 transition-colors">
                                <td className="px-4 py-3 font-medium text-slate-900">{obj.object_name}</td>
                                <td className="px-4 py-3 text-slate-500 text-[13px]">{obj.object_address || "—"}</td>
                                <td className="px-4 py-3"><FlagBadge value={obj.is_isup} /></td>
                                <td className="px-4 py-3"><FlagBadge value={obj.is_time_control} /></td>
                                <td className="px-4 py-3"><FlagBadge value={obj.is_overtime_control} /></td>
                                <td className="px-4 py-3"><FlagBadge value={obj.is_early_arrival_count_enabled} /></td>
                                <td className="px-4 py-3"><FlagBadge value={obj.is_telegram_notification} /></td>
                                <td className="px-4 py-3"><FlagBadge value={obj.is_parent_notification} /></td>
                                <td className="px-4 py-3">
                                    {total === 0 ? (
                                        <span className="inline-flex items-center gap-1.5 text-[11px] text-slate-300">
                                            <MdWifiOff className="w-3.5 h-3.5" /> Нет
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() =>
                                                setExpandedId(
                                                    isExpanded ? null : obj.id,
                                                )
                                            }
                                            className={cn(
                                                "group inline-flex items-center gap-1.5 pl-2 pr-1.5 py-1 rounded-lg border text-[11px] font-semibold transition-colors",
                                                offline > 0
                                                    ? "bg-red-50 text-red-600 border-red-100 hover:bg-red-100/70"
                                                    : "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100/70",
                                            )}
                                        >
                                            <span
                                                className={cn(
                                                    "w-1.5 h-1.5 rounded-full",
                                                    offline > 0
                                                        ? "bg-red-500"
                                                        : "bg-emerald-500",
                                                )}
                                            />
                                            {online}/{total}
                                            <ChevronDown
                                                className={cn(
                                                    "w-3.5 h-3.5 transition-transform",
                                                    isExpanded && "rotate-180",
                                                )}
                                            />
                                        </button>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                                    {obj.created_at ? new Date(obj.created_at).toLocaleDateString("ru-RU") : "—"}
                                </td>
                                <td className="px-4 py-3">
                                    <ActionButtons onEdit={() => openEdit(obj)} onDelete={() => handleDelete(obj.id)} />
                                </td>
                            </tr>

                            {isExpanded && total > 0 && term && (
                                <tr className="bg-slate-50/50">
                                    <td colSpan={11} className="px-4 py-3">
                                        <div className="grid gap-1.5 sm:grid-cols-2 xl:grid-cols-3">
                                            {term.terminals.map((t) => {
                                                const on =
                                                    t.status === "online";
                                                return (
                                                    <div
                                                        key={t.terminal_id}
                                                        className="flex items-center justify-between gap-2 px-3 py-2 rounded-lg bg-white border border-slate-100"
                                                    >
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <span
                                                                className={cn(
                                                                    "w-5 h-5 rounded flex items-center justify-center shrink-0",
                                                                    on
                                                                        ? "bg-emerald-100 text-emerald-600"
                                                                        : "bg-slate-200 text-slate-400",
                                                                )}
                                                            >
                                                                {on ? (
                                                                    <MdWifi className="w-3 h-3" />
                                                                ) : (
                                                                    <MdWifiOff className="w-3 h-3" />
                                                                )}
                                                            </span>
                                                            <div className="min-w-0">
                                                                <p className="text-[12px] text-slate-700 truncate">
                                                                    {
                                                                        t.terminal_name
                                                                    }
                                                                </p>
                                                                <p className="text-[10px] text-slate-400 truncate font-mono">
                                                                    {t.EhomeID}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <span
                                                            className={cn(
                                                                "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold border shrink-0",
                                                                on
                                                                    ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                                                                    : "bg-red-50 text-red-600 border-red-100",
                                                            )}
                                                        >
                                                            <span
                                                                className={cn(
                                                                    "w-1.5 h-1.5 rounded-full",
                                                                    on
                                                                        ? "bg-emerald-500"
                                                                        : "bg-red-500",
                                                                )}
                                                            />
                                                            {on
                                                                ? "Онлайн"
                                                                : "Оффлайн"}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </Fragment>
                    );
                })}
                {objects.length === 0 && <EmptyRow colSpan={11} text="Объекты не найдены" />}
            </AdminTable>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">
                            {editId ? "Редактировать объект" : "Новый объект"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                        <div>
                            <Label>Название *</Label>
                            <Input
                                value={form.object_name}
                                onChange={(e) => setField("object_name", e.target.value)}
                                placeholder="Офис Центр"
                                maxLength={32}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label>Адрес</Label>
                            <Input
                                value={form.object_address}
                                onChange={(e) => setField("object_address", e.target.value)}
                                placeholder="ул. Навои 5"
                                maxLength={32}
                                className="mt-1"
                            />
                        </div>
                        {/* <div>
                            <Label>Номер SIM</Label>
                            <Input
                                value={form.simcard_number}
                                onChange={(e) => setField("simcard_number", e.target.value)}
                                placeholder="+998901234567"
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label>IP роутера</Label>
                            <Input
                                value={form.router_ip}
                                onChange={(e) => setField("router_ip", e.target.value)}
                                placeholder="192.168.1.1"
                                className="mt-1"
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Логин роутера</Label>
                                <Input
                                    value={form.router_login}
                                    onChange={(e) => setField("router_login", e.target.value)}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label>Пароль роутера</Label>
                                <Input
                                    value={form.router_password}
                                    onChange={(e) => setField("router_password", e.target.value)}
                                    type="password"
                                    className="mt-1"
                                />
                            </div>
                        </div> */}
                        <div className="border-t border-gray-100 pt-3">
                            <Toggle
                                label="Статический IP"
                                value={form.is_static_ip}
                                onChange={(v) => setField("is_static_ip", v)}
                            />
                            <Toggle
                                label="is_ISUP"
                                value={form.is_isup}
                                onChange={(v) => setField("is_isup", v)}
                            />
                            <Toggle
                                label="Контроль времени"
                                value={form.is_time_control}
                                onChange={(v) => setField("is_time_control", v)}
                            />
                            <Toggle
                                label="Контроль переработок"
                                value={form.is_overtime_control}
                                onChange={(v) => setField("is_overtime_control", v)}
                            />
                            <Toggle
                                label="Суммировать ранний приход"
                                value={form.is_early_arrival_count_enabled}
                                onChange={(v) =>
                                    setField("is_early_arrival_count_enabled", v)
                                }
                            />
                            <Toggle
                                label="Telegram уведомления"
                                value={form.is_telegram_notification}
                                onChange={(v) => setField("is_telegram_notification", v)}
                            />
                            <Toggle
                                label="Уведомления для родителей"
                                value={form.is_parent_notification}
                                onChange={(v) => setField("is_parent_notification", v)}
                            />
                        </div>
                        <div className="flex gap-3 pt-2">
                            <Button variant="outline" className="flex-1 rounded-lg" onClick={() => setOpen(false)}>
                                Отмена
                            </Button>
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

export default AdminObjects;
