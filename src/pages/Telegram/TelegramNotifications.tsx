import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import CustomModal from "@/components/ui/custom-modal";
import CustomBreadcrumb from "@/components/ui/custom-breadcrumb";
import { toast } from "sonner";
import { useTranslation, Trans } from "react-i18next";
import { FaTelegramPlane } from "react-icons/fa";
import { FiCopy, FiCheck, FiRefreshCw } from "react-icons/fi";
import { CiUnlock } from "react-icons/ci";
import {
    CreateTelegramBindCode,
    GetTelegramAccounts,
    UnbindTelegramAccount,
} from "@/services/data";

interface TgAccount {
    id: number;
    telegram_id: number;
    first_name: string | null;
    last_name: string | null;
    username: string | null;
    bot_status: number | null;
    checked_at: string | null;
    created_at: string;
}

interface BindData {
    code: string;
    deep_link: string | null;
    bot_username: string | null;
    expires_at: string;
    limit: number;
    used: number;
}

// "2026-09-05 11:05:12" -> "05.09.2026 11:05" (языконезависимо, как договорено)
const fmtDateTime = (s: string | null): string => {
    if (!s) return "—";
    const [d, tm] = s.split(" ");
    if (!d) return s;
    const [y, mo, da] = d.split("-");
    if (!y || !mo || !da) return s;
    const hm = tm ? tm.slice(0, 5) : "";
    return `${da}.${mo}.${y}${hm ? " " + hm : ""}`;
};

const TelegramNotifications = () => {
    const { t } = useTranslation();

    const [accounts, setAccounts] = useState<TgAccount[]>([]);
    const [limit, setLimit] = useState(0);
    const [used, setUsed] = useState(0);
    const [loading, setLoading] = useState(true);

    // Модалка кода привязки
    const [isBindOpen, setIsBindOpen] = useState(false);
    const [isBinding, setIsBinding] = useState(false);
    const [bindData, setBindData] = useState<BindData | null>(null);
    const [copied, setCopied] = useState(false);

    // Модалка отвязки
    const [isUnbindOpen, setIsUnbindOpen] = useState(false);
    const [isUnbinding, setIsUnbinding] = useState(false);
    const [unbindId, setUnbindId] = useState<number | null>(null);

    const fetchAccounts = async () => {
        try {
            setLoading(true);
            const data = await GetTelegramAccounts();
            setAccounts(data?.result || []);
            setLimit(data?.limit ?? 0);
            setUsed(data?.used ?? 0);
        } catch (error: any) {
            console.error("Error fetching telegram accounts:", error);
            toast.error(
                error?.response?.data?.error || t("telegram.loadError")
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAccounts();
    }, []);

    const handleBind = async () => {
        try {
            setIsBinding(true);
            const data: BindData = await CreateTelegramBindCode();
            setBindData(data);
            setCopied(false);
            setIsBindOpen(true);
            if (typeof data.limit === "number") setLimit(data.limit);
            if (typeof data.used === "number") setUsed(data.used);
            toast.success(t("telegram.bindCreated"));
        } catch (error: any) {
            console.error("Error creating bind code:", error);
            // 409 (лимит) и прочие — показываем текст бэкенда
            toast.error(
                error?.response?.data?.error || t("telegram.bindError")
            );
        } finally {
            setIsBinding(false);
        }
    };

    const handleCopyCode = async () => {
        if (!bindData?.code) return;
        try {
            await navigator.clipboard.writeText(bindData.code);
            setCopied(true);
            toast.success(t("telegram.codeCopied"));
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast.error(t("telegram.copyFail"));
        }
    };

    const openUnbind = (id: number) => {
        setUnbindId(id);
        setIsUnbindOpen(true);
    };

    const handleConfirmUnbind = async () => {
        if (unbindId === null) return;
        try {
            setIsUnbinding(true);
            await UnbindTelegramAccount(unbindId);
            toast.success(t("telegram.unbound"));
            await fetchAccounts();
        } catch (error: any) {
            console.error("Error unbinding account:", error);
            toast.error(
                error?.response?.data?.error || t("telegram.unbindError")
            );
        } finally {
            setIsUnbinding(false);
            setIsUnbindOpen(false);
            setUnbindId(null);
        }
    };

    const limitReached = limit > 0 && used >= limit;

    const accountName = (a: TgAccount): string => {
        const full = [a.first_name, a.last_name].filter(Boolean).join(" ").trim();
        if (full) return full;
        if (a.username) return `@${a.username}`;
        return `ID ${a.telegram_id}`;
    };

    const StatusBadge = ({ status }: { status: number | null }) => {
        const map: Record<string, { dot: string; label: string }> = {
            "1": { dot: "bg-green-500", label: t("telegram.statusActive") },
            "0": { dot: "bg-red-500", label: t("telegram.statusInactive") },
            null: { dot: "bg-slate-300", label: t("telegram.statusUnknown") },
        };
        const key = status === 1 ? "1" : status === 0 ? "0" : "null";
        const { dot, label } = map[key];
        return (
            <span className="inline-flex items-center gap-1.5 text-sm text-slate-600">
                <span className={`w-2 h-2 rounded-full ${dot}`} />
                {label}
            </span>
        );
    };

    return (
        <div className="space-y-4 md:space-y-6">
            <div className="space-y-4 mb-6 md:mb-10">
                <div className="min-w-0">
                    <h1 className="text-xl md:text-2xl font-semibold text-slate-900 truncate">
                        {t("telegram.title")}
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        {t("telegram.subtitle")}
                    </p>
                </div>
                <CustomBreadcrumb
                    items={[
                        { label: t("common.controlPanel"), href: "/" },
                        { label: t("telegram.title"), isActive: true },
                    ]}
                />
            </div>

            <Card className="bg-white rounded-xl border border-slate-200/80 shadow-sm">
                <CardHeader className="px-4 md:px-6 py-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-700">
                                {t("telegram.accountsTitle")}
                            </span>
                            <span className="text-xs text-slate-500 bg-slate-100 rounded-full px-2.5 py-1">
                                {t("telegram.limitLabel", { used, limit })}
                            </span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                onClick={fetchAccounts}
                                disabled={loading}
                                className="text-[13px]"
                            >
                                <FiRefreshCw
                                    className={`w-3.5 h-3.5 mr-1 ${
                                        loading ? "animate-spin" : ""
                                    }`}
                                />
                                {t("telegram.refresh")}
                            </Button>
                            <Button
                                onClick={handleBind}
                                disabled={isBinding || limitReached}
                                className="bg-blue-600 hover:bg-blue-700 text-white text-[13px]"
                            >
                                <FaTelegramPlane className="w-3.5 h-3.5 mr-1" />
                                {isBinding
                                    ? t("telegram.binding")
                                    : t("telegram.bindButton")}
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto scrollbar-hide">
                    <Table className="min-w-[640px]">
                        <TableHeader className="bg-slate-50/80">
                            <TableRow>
                                <TableHead className="text-slate-500">
                                    {t("telegram.colAccount")}
                                </TableHead>
                                <TableHead className="text-slate-500">
                                    {t("telegram.colStatus")}
                                </TableHead>
                                <TableHead className="text-slate-500">
                                    {t("telegram.colBound")}
                                </TableHead>
                                <TableHead className="text-slate-500">
                                    {t("telegram.colChecked")}
                                </TableHead>
                                <TableHead className="text-right text-slate-500">
                                    {t("common.actions")}
                                </TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center py-8">
                                        <div className="flex items-center justify-center space-x-2">
                                            <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-600 rounded-full animate-spin" />
                                            <span className="text-slate-500">
                                                {t("common.loading")}
                                            </span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ) : accounts.length === 0 ? (
                                <TableRow>
                                    <TableCell
                                        colSpan={5}
                                        className="text-center py-8 text-slate-500"
                                    >
                                        {t("telegram.empty")}
                                    </TableCell>
                                </TableRow>
                            ) : (
                                accounts.map((a) => (
                                    <TableRow
                                        key={a.id}
                                        className="border-dashed border-slate-200 hover:bg-slate-50/60"
                                    >
                                        <TableCell className="whitespace-nowrap">
                                            <div className="min-w-0">
                                                <p className="text-[13px] font-medium text-slate-900">
                                                    {accountName(a)}
                                                </p>
                                                {a.username &&
                                                    accountName(a) !==
                                                        `@${a.username}` && (
                                                        <p className="text-[11px] text-slate-400">
                                                            @{a.username}
                                                        </p>
                                                    )}
                                                {a.bot_status === 0 && (
                                                    <p className="text-[11px] text-red-500 mt-0.5 max-w-xs whitespace-normal">
                                                        {t("telegram.inactiveHint")}
                                                    </p>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <StatusBadge status={a.bot_status} />
                                        </TableCell>
                                        <TableCell className="text-slate-600 text-sm">
                                            {fmtDateTime(a.created_at)}
                                        </TableCell>
                                        <TableCell className="text-slate-600 text-sm">
                                            {fmtDateTime(a.checked_at)}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Button
                                                variant="outline"
                                                onClick={() => openUnbind(a.id)}
                                                className="text-[13px] text-red-600 border-red-200 hover:bg-red-50 hover:text-red-600"
                                            >
                                                <CiUnlock className="w-4 h-4 mr-1" />
                                                {t("telegram.unbind")}
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            {/* Bind Code Modal */}
            <CustomModal
                showTrigger={false}
                open={isBindOpen}
                onOpenChange={setIsBindOpen}
                title={t("telegram.modalTitle")}
                size="md"
                showCloseButton={true}
                footerContent={
                    <div className="flex gap-2 justify-end w-full">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsBindOpen(false);
                                fetchAccounts();
                            }}
                        >
                            {t("common.close")}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-4">
                    <p className="text-sm text-slate-600">
                        {bindData?.bot_username ? (
                            <Trans
                                i18nKey="telegram.modalHowto"
                                values={{ bot: bindData.bot_username }}
                                components={{
                                    1: (
                                        <span className="font-semibold text-slate-900" />
                                    ),
                                }}
                            />
                        ) : (
                            t("telegram.modalHowtoNoBot")
                        )}
                    </p>

                    {bindData?.deep_link && (
                        <a
                            href={bindData.deep_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 w-full rounded-lg bg-blue-600 hover:bg-blue-700 text-white py-2.5 text-sm font-medium transition-colors"
                        >
                            <FaTelegramPlane className="w-4 h-4" />
                            {t("telegram.openTelegram")}
                        </a>
                    )}

                    <div>
                        <p className="text-xs text-slate-500 mb-1.5">
                            {t("telegram.codeLabel")}
                        </p>
                        <div className="flex items-center gap-2">
                            <span className="flex-1 text-center text-xl font-bold tracking-[0.3em] text-slate-900 bg-slate-100 rounded-xl px-4 py-3 select-all">
                                {bindData?.code}
                            </span>
                            <Button
                                onClick={handleCopyCode}
                                variant="outline"
                                className="h-[52px] px-4"
                            >
                                {copied ? (
                                    <FiCheck className="w-4 h-4" />
                                ) : (
                                    <FiCopy className="w-4 h-4" />
                                )}
                            </Button>
                        </div>
                    </div>

                    {bindData?.expires_at && (
                        <p className="text-[12px] text-slate-500">
                            {t("telegram.expiresAt", {
                                time: fmtDateTime(bindData.expires_at),
                            })}
                        </p>
                    )}
                    <p className="text-[11px] text-slate-400">
                        {t("telegram.codeExpiryNote")}
                    </p>
                </div>
            </CustomModal>

            {/* Unbind Confirmation Modal */}
            <CustomModal
                showTrigger={false}
                open={isUnbindOpen}
                onOpenChange={setIsUnbindOpen}
                title={t("telegram.unbindTitle")}
                size="md"
                showCloseButton={false}
                footerContent={
                    <div className="flex gap-2 justify-end w-full">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsUnbindOpen(false);
                                setUnbindId(null);
                            }}
                            disabled={isUnbinding}
                        >
                            {t("common.cancel")}
                        </Button>
                        <Button
                            onClick={handleConfirmUnbind}
                            disabled={isUnbinding}
                            className="bg-red-500 hover:bg-red-500/70 text-white"
                        >
                            {isUnbinding
                                ? t("telegram.unbinding")
                                : t("telegram.unbind")}
                        </Button>
                    </div>
                }
            >
                <div className="space-y-2">
                    <p className="text-sm text-slate-600">
                        {t("telegram.unbindConfirm")}
                    </p>
                </div>
            </CustomModal>
        </div>
    );
};

export default TelegramNotifications;
