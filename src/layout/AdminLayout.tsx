import { cn } from "@/lib/utils";
import { useState } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/components/hooks/use-mobile";
import AdminSidebar from "./AdminSidebar";
import { Menu, LogOut } from "lucide-react";

interface AdminLayoutProps {
    className?: string;
}

const PAGE_META: Record<string, { title: string; sub: string }> = {
    "/admin":                { title: "Дашборд",                   sub: "Общая статистика системы"               },
    "/admin/objects":        { title: "Объекты",                   sub: "Управление офисами и филиалами"         },
    "/admin/users":          { title: "Пользователи",              sub: "Системные учётные записи"               },
    "/admin/employees":      { title: "Сотрудники",                sub: "База FaceID-сотрудников"                },
    "/admin/terminals":      { title: "Терминалы",                 sub: "Управление FaceID-устройствами"         },
    "/admin/object-users":   { title: "Привязки сотрудник → объект", sub: "Назначение персонала по объектам"    },
    "/admin/object-telegram":{ title: "Telegram уведомления",      sub: "Чаты привязанные к объектам"           },
};

const AdminLayout = ({ className }: AdminLayoutProps) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const isMobile = useIsMobile();
    const location  = useLocation();
    const navigate  = useNavigate();

    const meta = PAGE_META[location.pathname] ?? { title: "Панель управления", sub: "" };

    return (
        <div className={cn("flex h-screen bg-slate-100 overflow-hidden", className)}>
            {!isMobile && <AdminSidebar />}

            {isMobile && (
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                    <SheetContent side="left" className="w-64 p-0 border-0">
                        <AdminSidebar onClose={() => setSidebarOpen(false)} />
                    </SheetContent>
                </Sheet>
            )}

            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                {/* Topbar */}
                <header className="h-[60px] bg-white border-b border-slate-200/80 flex items-center justify-between px-6 shrink-0 z-30">
                    <div className="flex items-center gap-3">
                        {isMobile && (
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 mr-1"
                            >
                                <Menu className="w-5 h-5" />
                            </button>
                        )}
                        <div>
                            <h1 className="text-[15px] font-semibold text-slate-900 leading-none">
                                {meta.title}
                            </h1>
                            {meta.sub && (
                                <p className="text-[11px] text-slate-400 mt-0.5 hidden sm:block">
                                    {meta.sub}
                                </p>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-2.5 pl-3 border-l border-slate-200">
                            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                                {(localStorage.getItem("company") ?? "A").charAt(0).toUpperCase()}
                            </div>
                            <span className="text-[13px] font-medium text-slate-700 hidden sm:block leading-none">
                                {localStorage.getItem("company") ?? "Admin"}
                            </span>
                        </div>
                        <button
                            onClick={() => { localStorage.clear(); navigate("/login"); }}
                            className="ml-1 p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
                            title="Выйти"
                        >
                            <LogOut className="w-4 h-4" />
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-auto">
                    <div className="max-w-[1400px] mx-auto w-full px-5 sm:px-7 py-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default AdminLayout;
