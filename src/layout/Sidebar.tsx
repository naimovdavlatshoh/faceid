import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import { SiAnalogue } from "react-icons/si";
import { FaUserFriends, FaUserCog } from "react-icons/fa";
import { IoTimer } from "react-icons/io5";
import { MdBarChart } from "react-icons/md";

interface SidebarProps {
    className?: string;
    onClose?: () => void;
}

const navigation = [
    { name: "Посещаемость",          href: "/",            icon: SiAnalogue    },
    { name: "Сотрудники",            href: "/users",       icon: FaUserFriends },
    { name: "Статистика сотрудников",href: "/users/report",icon: MdBarChart    },
    { name: "Смены",                 href: "/shifts",      icon: IoTimer       },
    { name: "Должности",             href: "/positions",   icon: FaUserCog     },
];

const Sidebar = ({ className, onClose }: SidebarProps) => {
    const location = useLocation();

    const isActive = (href: string) => {
        if (href === "/users/report") return location.pathname.startsWith("/users/report");
        if (href === "/users")        return location.pathname.startsWith("/users") && !location.pathname.startsWith("/users/report");
        if (href === "/shifts")       return location.pathname.startsWith("/shifts");
        return location.pathname === href;
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
            <div className="px-5 h-[60px] flex items-center border-b border-white/[0.06]">
                <div className="min-w-0">
                    <p className="text-white font-semibold text-sm leading-none truncate">
                        {localStorage.getItem("company") || "FaceID"}
                    </p>
                    <span className="text-[11px] text-blue-400/80 font-medium mt-0.5 block">
                        Менеджер
                    </span>
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 px-3 py-4 overflow-y-auto space-y-0.5">
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-[0.12em] px-2 mb-3">
                    Навигация
                </p>

                {navigation.map((item) => {
                    const active = isActive(item.href);
                    const Icon = item.icon;

                    return (
                        <Link
                            key={item.name}
                            to={item.href}
                            onClick={onClose}
                            className={cn(
                                "relative flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium transition-all duration-100 group",
                                active
                                    ? "text-white bg-white/[0.07]"
                                    : "text-white/40 hover:text-white/75 hover:bg-white/[0.04]"
                            )}
                        >
                            {active && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-blue-500" />
                            )}
                            <span className={cn(
                                "flex items-center justify-center w-7 h-7 rounded-md transition-colors shrink-0",
                                active ? "text-blue-400" : "text-white/30 group-hover:text-white/60"
                            )}>
                                <Icon className="w-[15px] h-[15px]" />
                            </span>
                            <span className="truncate">{item.name}</span>
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
};

export default Sidebar;
