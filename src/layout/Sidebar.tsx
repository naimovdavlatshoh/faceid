import { cn } from "@/lib/utils";
import { Link, useLocation } from "react-router-dom";
import { SiAnalogue } from "react-icons/si";
import { FaUserFriends } from "react-icons/fa";
import { IoIosArrowDown } from "react-icons/io";
import { useEffect, useState } from "react";
import { IoTimer } from "react-icons/io5";
import { FaUserCog } from "react-icons/fa";


interface SidebarProps {
    className?: string;
}

const navigation = [
    {
        name: "Аналитика",
        href: "/",
        icon: <SiAnalogue className="w-5 h-5" />,
    },
    {
        name: "Сотрудники",
        href: "/users",
        icon: <FaUserFriends className="w-5 h-5" />,
    },
    {
        name: "Смены",
        href: "/shifts",
        icon: <IoTimer className="w-5 h-5" />,
    },
    {
        name: "Должности",
        href: "/positions",
        icon: <FaUserCog className="w-5 h-5" />,
    },
];

const Sidebar = ({ className }: SidebarProps) => {
    const location = useLocation();
    const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const isUsersSection =
            location.pathname.startsWith("/users") ||
            location.pathname.startsWith("/details");
        const isShiftsSection = location.pathname.startsWith("/shifts");

        if (isUsersSection) {
            setOpenMenus((prev) => ({ ...prev, Пользователи: true }));
        }
        if (isShiftsSection) {
            setOpenMenus((prev) => ({ ...prev, Смены: true }));
        }
    }, [location.pathname]);

    const toggleMenu = (name: string) => {
        setOpenMenus((prev) => ({ ...prev, [name]: !prev[name] }));
    };

    return (
        <div
            className={cn(
                "bg-white z-50 dark:bg-gray-900 border-r border-gray-100 dark:border-gray-700 h-full flex flex-col transition-all duration-300 relative w-72",
                className
            )}
        >
            {/* Logo Section */}
            <div className="p-6">
                <h2 className="text-xl font-bold text-maintx dark:text-white">
                    D Admin
                </h2>
            </div>

            {/* Navigation Menu */}
            <nav className="flex-1 py-4">
                <ul className="space-y-1">
                    {navigation.map((item) => {
                        const isActive = location.pathname === item.href;
                        const hasChildren = (item as any).children?.length > 0;

                        if (!hasChildren) {
                            return (
                                <li key={item.name}>
                                    <Link
                                        to={item.href}
                                        className={cn(
                                            "flex items-center transition-all duration-200 text-sm relative px-3 py-1 ",
                                            isActive
                                                ? " text-[#078dee] dark:text-dark-blue-300 font-medium"
                                                : "text-gray-500 dark:text-gray-300 font-medium "
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "flex transition-all duration-200 py-3 px-3",
                                                isActive
                                                    ? "bg-mainbg/10 w-full rounded-lg text-maintx"
                                                    : "bg-transparent w-full rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                            )}
                                        >
                                            {item.icon}
                                            <span className="ml-3">
                                                {item.name}
                                            </span>
                                        </span>
                                    </Link>
                                </li>
                            );
                        }

                        const isOpen = openMenus[item.name];
                        const isSectionActive = location.pathname.startsWith(
                            item.href
                        );

                        return (
                            <li key={item.name}>
                                <button
                                    type="button"
                                    onClick={() => toggleMenu(item.name)}
                                    className={cn(
                                        "w-full flex items-center transition-all duration-200 text-sm relative px-3 py-1 ",
                                        isSectionActive
                                            ? " text-[#078dee] dark:text-dark-blue-300 font-medium"
                                            : "text-gray-500 dark:text-gray-300 font-medium "
                                    )}
                                >
                                    <span
                                        className={cn(
                                            "flex transition-all duration-200 py-3 px-3 w-full items-center justify-between",
                                            isSectionActive
                                                ? "bg-mainbg/10 rounded-lg text-maintx"
                                                : "bg-transparent rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                                        )}
                                    >
                                        <span className="flex items-center">
                                            <span
                                                className={cn(
                                                    "flex items-center justify-center w-6 h-6 rounded-md",
                                                    isSectionActive
                                                        ? "bg-mainbg/20 text-[#078dee]"
                                                        : "bg-gray-100 dark:bg-gray-800 text-gray-500"
                                                )}
                                            >
                                                {item.icon}
                                            </span>
                                            <span className="ml-3">
                                                {item.name}
                                            </span>
                                        </span>
                                        <IoIosArrowDown
                                            className={cn(
                                                "w-4 h-4 transition-transform",
                                                isOpen
                                                    ? "rotate-180"
                                                    : "rotate-0"
                                            )}
                                        />
                                    </span>
                                </button>

                                <div
                                    className={cn(
                                        "overflow-hidden transition-all duration-300 ease-in-out",
                                        isOpen
                                            ? "max-h-96 opacity-100 transition-[max-height,opacity] duration-300 ease-in-out"
                                            : "max-h-0 opacity-0 transition-[max-height,opacity] duration-300 ease-in-out"
                                    )}
                                >
                                    <ul className="mt-1 ml-6 space-y-1 border-l border-gray-300 dark:border-gray-700 pl-4">
                                        {(item as any).children.map(
                                            (child: {
                                                name: string;
                                                href: string;
                                            }) => {
                                                const childActive =
                                                    location.pathname ===
                                                    child.href;
                                                return (
                                                    <li
                                                        key={child.name}
                                                        className={cn(
                                                            "relative before:content-[''] before:absolute before:-left-[14px] before:top-1/2 before:w-3 before:h-px before:bg-gray-300 dark:before:bg-gray-700 after:content-[''] after:absolute after:-left-[15px] after:top-1/2 after:w-2 after:h-2 after:bg-white dark:after:bg-gray-900 after:border after:border-gray-300 dark:after:border-gray-700 after:rounded-full after:-translate-x-1 after:-translate-y-1",
                                                            childActive &&
                                                                "before:bg-[#078dee] after:border-[#078dee]"
                                                        )}
                                                    >
                                                        <Link
                                                            to={child.href}
                                                            className={cn(
                                                                "flex items-center transition-all duration-200 text-sm relative px-2 py-1 ",
                                                                childActive
                                                                    ? " text-gray-700 dark:text-white font-semibold"
                                                                    : "text-gray-500 dark:text-gray-300 font-medium "
                                                            )}
                                                        >
                                                            <span
                                                                className={cn(
                                                                    "flex transition-all duration-200 py-2 px-3 w-full rounded-lg",
                                                                    childActive
                                                                        ? "bg-gray-100 dark:bg-gray-800"
                                                                        : "hover:bg-gray-100 dark:hover:bg-gray-800"
                                                                )}
                                                            >
                                                                <span className="ml-2">
                                                                    {child.name}
                                                                </span>
                                                            </span>
                                                        </Link>
                                                    </li>
                                                );
                                            }
                                        )}
                                    </ul>
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </nav>
        </div>
    );
};

export default Sidebar;
