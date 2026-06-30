import { cn } from "@/lib/utils";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
    MdDashboard,
    MdBusiness,
    MdPeople,
    MdDevices,
    MdLink,
} from "react-icons/md";
import { FaUserTie, FaTelegram } from "react-icons/fa";
import { LogOut, ScanFace } from "lucide-react";

interface AdminSidebarProps {
    className?: string;
    onClose?: () => void;
}

const navigation = [
    { name: "Дашборд",      href: "/admin",                icon: MdDashboard },
    { name: "Объекты",      href: "/admin/objects",        icon: MdBusiness  },
    { name: "Пользователи", href: "/admin/users",          icon: MdPeople    },
    { name: "Сотрудники",   href: "/admin/employees",      icon: FaUserTie   },
    { name: "Терминалы",    href: "/admin/terminals",      icon: MdDevices   },
    { name: "Привязки",     href: "/admin/object-users",   icon: MdLink      },
    { name: "Telegram",     href: "/admin/object-telegram",icon: FaTelegram  },
];

const AdminSidebar = ({ className, onClose }: AdminSidebarProps) => {
    const location = useLocation();
    const navigate  = useNavigate();

    const handleLogout = () => {
        localStorage.clear();
        navigate("/login");
    };

    return (
        <aside
            className={cn(
                "h-full flex flex-col w-64 shrink-0",
                "bg-[#0D1117] border-r border-white/[0.06]",
                className
            )}
        >
            {/* Brand */}
            <div className="px-5 h-[60px] flex items-center gap-3 border-b border-white/[0.06]">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30 shrink-0">
                    <ScanFace className="w-4 h-4 text-white" />
                </div>
                <div className="min-w-0">
                    <p className="text-white font-semibold text-sm leading-none truncate">
                        {localStorage.getItem("company") || "FaceID"}
                    </p>
                    <span className="text-[11px] text-blue-400/80 font-medium mt-0.5 block">
                        Администратор
                    </span>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.12em] px-2 mb-3">
                    Управление
                </p>

                {navigation.map((item) => {
                    const isActive =
                        item.href === "/admin"
                            ? location.pathname === "/admin"
                            : location.pathname.startsWith(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            onClick={onClose}
                            className={cn(
                                "relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-100 group",
                                isActive
                                    ? "text-white bg-white/[0.07]"
                                    : "text-white/40 hover:text-white/75 hover:bg-white/[0.04]"
                            )}
                        >
                            {/* Active cursor accent */}
                            {isActive && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-blue-500" />
                            )}

                            <span
                                className={cn(
                                    "flex items-center justify-center w-7 h-7 rounded-md transition-colors shrink-0",
                                    isActive
                                        ? "text-blue-400"
                                        : "text-white/30 group-hover:text-white/60"
                                )}
                            >
                                <Icon className="w-[15px] h-[15px]" />
                            </span>

                            <span className="truncate">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="px-3 pb-4 border-t border-white/[0.06] pt-3">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all duration-100 group"
                >
                    <span className="flex items-center justify-center w-7 h-7 rounded-md text-white/20 group-hover:text-red-400 transition-colors shrink-0">
                        <LogOut className="w-[15px] h-[15px]" />
                    </span>
                    Выйти из системы
                </button>
            </div>
        </aside>
    );
};

export default AdminSidebar;
