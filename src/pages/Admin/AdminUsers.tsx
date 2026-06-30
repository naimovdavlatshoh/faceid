import { useEffect, useState } from "react";
import {
    SuperAdminGetUsers,
    SuperAdminCreateUser,
    SuperAdminUpdateUser,
    SuperAdminDeleteUser,
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
import { AdminPageHeader, AdminTable, EmptyRow, ActionButtons, RoleBadge, TablePagination } from "@/components/admin/AdminTable";

interface SystemUser {
    user_id: string;
    firstname: string;
    lastname: string;
    fathername: string;
    login: string;
    role_id: string;
    is_active: string;
    created_at: string;
}

const ROLES: Record<string, string> = {
    "2": "Менеджер",
};

const emptyForm = {
    firstname: "",
    lastname: "",
    fathername: "",
    login: "",
    password: "",
    role_id: "2",
    is_active: "1",
};

type FormData = typeof emptyForm;

const AdminUsers = () => {
    const [users, setUsers] = useState<SystemUser[]>([]);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [pages, setPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [open, setOpen] = useState(false);
    const [editId, setEditId] = useState<string | null>(null);
    const [form, setForm] = useState<FormData>(emptyForm);
    const [saving, setSaving] = useState(false);

    const load = (p = page) => {
        setLoading(true);
        SuperAdminGetUsers(p, 20)
            .then((res) => {
                setUsers(res.result ?? []);
                setPages(res.pages ?? 1);
                setTotal(res.total ?? 0);
            })
            .catch(() => toast.error("Не удалось загрузить пользователей"))
            .finally(() => setLoading(false));
    };

    useEffect(() => { load(page); }, [page]);

    const openCreate = () => {
        setEditId(null);
        setForm(emptyForm);
        setOpen(true);
    };

    const openEdit = (u: SystemUser) => {
        setEditId(u.user_id);
        setForm({
            firstname: u.firstname,
            lastname: u.lastname,
            fathername: u.fathername,
            login: u.login,
            password: "",
            role_id: u.role_id,
            is_active: u.is_active,
        });
        setOpen(true);
    };

    const handleSave = async () => {
        const required = ["firstname", "lastname", "fathername", "login"] as const;
        for (const key of required) {
            if (!form[key].trim()) {
                toast.error(`Поле "${key}" обязательно`);
                return;
            }
        }
        if (!editId && !form.password) {
            toast.error("Пароль обязателен при создании");
            return;
        }
        setSaving(true);
        try {
            const payload: Record<string, unknown> = {
                firstname: form.firstname,
                lastname: form.lastname,
                fathername: form.fathername,
                login: form.login,
                role_id: Number(form.role_id),
                is_active: Number(form.is_active),
            };
            if (form.password) payload.password = form.password;

            if (editId) {
                await SuperAdminUpdateUser(Number(editId), payload);
                toast.success("Пользователь обновлён");
            } else {
                await SuperAdminCreateUser(payload);
                toast.success("Пользователь создан");
            }
            setOpen(false);
            load(page);
        } catch (e: any) {
            toast.error(e?.response?.data?.error ?? "Ошибка сохранения");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Деактивировать пользователя?")) return;
        try {
            await SuperAdminDeleteUser(Number(id));
            toast.success("Пользователь деактивирован");
            load(page);
        } catch {
            toast.error("Не удалось деактивировать");
        }
    };

    const setField = (key: keyof FormData, value: string) =>
        setForm((prev) => ({ ...prev, [key]: value }));

    return (
        <div className="space-y-5 pb-8">
            <AdminPageHeader
                title="Пользователи"
                subtitle="Системные пользователи"
                count={total}
                onAdd={openCreate}
            />

            <AdminTable
                loading={loading}
                headers={["ФИО", "Логин", "Роль", "Создан", "Действия"]}
            >
                {users.map((u) => (
                    <tr key={u.user_id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="px-4 py-3">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-violet-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                                    {u.lastname.charAt(0).toUpperCase()}
                                </div>
                                <span className="text-sm font-medium text-slate-900">
                                    {u.lastname} {u.firstname} {u.fathername}
                                </span>
                            </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{u.login}</td>
                        <td className="px-4 py-3">
                            <RoleBadge value={ROLES[u.role_id] ?? `Роль ${u.role_id}`} />
                        </td>
                        <td className="px-4 py-3 text-slate-400 text-xs whitespace-nowrap">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString("ru-RU") : "—"}
                        </td>
                        <td className="px-4 py-3">
                            <ActionButtons onEdit={() => openEdit(u)} onDelete={() => handleDelete(u.user_id)} />
                        </td>
                    </tr>
                ))}
                {users.length === 0 && <EmptyRow colSpan={5} text="Пользователи не найдены" />}
            </AdminTable>
            <TablePagination
                page={page}
                pages={pages}
                onPrev={() => setPage((p) => Math.max(1, p - 1))}
                onNext={() => setPage((p) => Math.min(pages, p + 1))}
            />

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="text-base font-semibold">
                            {editId ? "Редактировать пользователя" : "Новый пользователь"}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 mt-2">
                        <div>
                            <Label>Фамилия *</Label>
                            <Input
                                value={form.lastname}
                                onChange={(e) => setField("lastname", e.target.value)}
                                className="mt-1"
                                maxLength={32}
                            />
                        </div>
                        <div>
                            <Label>Имя *</Label>
                            <Input
                                value={form.firstname}
                                onChange={(e) => setField("firstname", e.target.value)}
                                className="mt-1"
                                maxLength={32}
                            />
                        </div>
                        <div>
                            <Label>Отчество *</Label>
                            <Input
                                value={form.fathername}
                                onChange={(e) => setField("fathername", e.target.value)}
                                className="mt-1"
                                maxLength={32}
                            />
                        </div>
                        <div>
                            <Label>Логин *</Label>
                            <Input
                                value={form.login}
                                onChange={(e) => setField("login", e.target.value)}
                                className="mt-1"
                                maxLength={32}
                            />
                        </div>
                        <div>
                            <Label>{editId ? "Новый пароль (оставьте пустым чтобы не менять)" : "Пароль *"}</Label>
                            <Input
                                type="password"
                                value={form.password}
                                onChange={(e) => setField("password", e.target.value)}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <Label>Роль *</Label>
                            <Select value={form.role_id} onValueChange={(v) => setField("role_id", v)}>
                                <SelectTrigger className="mt-1">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {Object.entries(ROLES).map(([id, name]) => (
                                        <SelectItem key={id} value={id}>{name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        {editId && (
                            <div>
                                <Label>Статус</Label>
                                <Select value={form.is_active} onValueChange={(v) => setField("is_active", v)}>
                                    <SelectTrigger className="mt-1">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">Активен</SelectItem>
                                        <SelectItem value="0">Неактивен</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        )}
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

export default AdminUsers;
