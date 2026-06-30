import { cn } from "@/lib/utils";
import { Plus, ChevronLeft, ChevronRight } from "lucide-react";

// ─── Page Header ────────────────────────────────────────────────────────────

interface AdminPageHeaderProps {
    title: string;
    subtitle?: string;
    count?: number;
    onAdd?: () => void;
    addLabel?: string;
    extra?: React.ReactNode;
}

export const AdminPageHeader = ({
    title,
    subtitle,
    count,
    onAdd,
    addLabel = "Добавить",
    extra,
}: AdminPageHeaderProps) => (
    <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
            <div className="flex items-center gap-2.5">
                <h1 className="text-[17px] font-semibold text-slate-900 leading-none">{title}</h1>
                {count !== undefined && (
                    <span className="text-[11px] font-semibold text-slate-400 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full leading-none">
                        {count}
                    </span>
                )}
            </div>
            {subtitle && (
                <p className="text-[12px] text-slate-400 mt-1.5">{subtitle}</p>
            )}
        </div>

        <div className="flex items-center gap-2">
            {extra}
            {onAdd && (
                <button
                    onClick={onAdd}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-[13px] font-medium shadow-sm shadow-blue-600/20 transition-colors"
                >
                    <Plus className="w-3.5 h-3.5" />
                    {addLabel}
                </button>
            )}
        </div>
    </div>
);

// ─── Table ───────────────────────────────────────────────────────────────────

interface AdminTableProps {
    headers: string[];
    children: React.ReactNode;
    loading?: boolean;
}

export const AdminTable = ({ headers, children, loading }: AdminTableProps) => {
    if (loading) {
        return (
            <div className="flex items-center justify-center h-52 bg-white rounded-xl border border-slate-200/80">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-7 h-7 rounded-full border-2 border-slate-200 border-t-blue-500 animate-spin" />
                    <p className="text-[12px] text-slate-400 font-medium">Загрузка...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-100">
                            {headers.map((h, i) => (
                                <th
                                    key={i}
                                    className={cn(
                                        "px-4 py-3 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-400 bg-slate-50/80",
                                        i === headers.length - 1 ? "text-right" : "text-left"
                                    )}
                                >
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {children}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ─── Empty row ───────────────────────────────────────────────────────────────

export const EmptyRow = ({ colSpan, text }: { colSpan: number; text?: string }) => (
    <tr>
        <td colSpan={colSpan} className="px-4 py-16 text-center">
            <p className="text-[13px] text-slate-400 font-medium">{text ?? "Данные не найдены"}</p>
        </td>
    </tr>
);

// ─── Pagination ──────────────────────────────────────────────────────────────

interface PaginationProps {
    page: number;
    pages: number;
    onPrev: () => void;
    onNext: () => void;
}

export const TablePagination = ({ page, pages, onPrev, onNext }: PaginationProps) => {
    if (pages <= 1) return null;
    return (
        <div className="flex items-center justify-between px-4 py-2.5 bg-white border border-slate-200/80 rounded-xl mt-2 shadow-sm">
            <span className="text-[12px] text-slate-400">
                Страница <span className="font-semibold text-slate-600">{page}</span> из{" "}
                <span className="font-semibold text-slate-600">{pages}</span>
            </span>
            <div className="flex gap-1">
                <button
                    onClick={onPrev}
                    disabled={page === 1}
                    className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <button
                    onClick={onNext}
                    disabled={page === pages}
                    className="w-7 h-7 rounded-lg border border-slate-200 flex items-center justify-center text-slate-500 hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>
            </div>
        </div>
    );
};

// ─── Action buttons ───────────────────────────────────────────────────────────

export const ActionButtons = ({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) => (
    <div className="flex items-center justify-end gap-1">
        <button
            onClick={onEdit}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
        >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
        </button>
        <button
            onClick={onDelete}
            className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
        >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
        </button>
    </div>
);

// ─── Badges ──────────────────────────────────────────────────────────────────

export const RoleBadge = ({ value }: { value: string }) => (
    <span className="inline-flex px-2 py-0.5 rounded text-[11px] font-semibold bg-violet-50 text-violet-700 border border-violet-100">
        {value}
    </span>
);

export const FlagBadge = ({ value }: { value: string | number }) => {
    const on = String(value) === "1";
    return (
        <span className={cn(
            "inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold border",
            on
                ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                : "bg-slate-50 text-slate-400 border-slate-100"
        )}>
            <span className={cn("w-1.5 h-1.5 rounded-full", on ? "bg-emerald-500" : "bg-slate-300")} />
            {on ? "Вкл" : "Выкл"}
        </span>
    );
};
