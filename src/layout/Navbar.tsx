import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetClose,
} from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { PostSimple } from "@/services/data";
import { toast } from "sonner";
import { useIsMobile } from "@/components/hooks/use-mobile";
import { Menu, LogOut, ChevronRight } from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";

interface NavbarProps {
    className?: string;
    onToggleSidebar?: () => void;
}

interface ObjectItem {
    object_id?: number;
    object_name?: string;
    id?: number;
    name?: string;
}

const Navbar = ({ className, onToggleSidebar }: NavbarProps) => {
    const navigate  = useNavigate();
    const isMobile  = useIsMobile();
    const { t }     = useTranslation();
    const [objects, setObjects] = useState<ObjectItem[]>([]);

    useEffect(() => {
        try {
            const raw = localStorage.getItem("objects");
            if (raw) {
                const parsed = JSON.parse(raw);
                setObjects(Array.isArray(parsed) ? parsed : []);
            }
        } catch {
            setObjects([]);
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    const handleObjectChange = async (objectId: number) => {
        if (localStorage.getItem("object") === objectId.toString()) return;
        try {
            await PostSimple(`api/user/changeobject/${objectId}`, {}).then((res) => {
                localStorage.setItem("object", objectId.toString());
                localStorage.setItem("token", res?.data?.jwt);
                toast.success(res?.data?.message);
                setTimeout(() => window.location.reload(), 100);
            });
        } catch (error: any) {
            toast.error(error?.response?.data?.message || t("navbar.changeObjectError"));
        }
    };

    const company   = localStorage.getItem("company") ?? "M";
    const initial   = company.charAt(0).toUpperCase();

    return (
        <header
            className={cn(
                "h-[60px] bg-white border-b border-slate-200/80 flex items-center justify-between px-5 sm:px-6 shrink-0 z-30",
                className
            )}
        >
            {/* Left: mobile burger */}
            <div className="flex items-center gap-3">
                {isMobile && onToggleSidebar && (
                    <button
                        type="button"
                        onClick={onToggleSidebar}
                        className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500"
                    >
                        <Menu className="w-5 h-5" />
                    </button>
                )}
            </div>

            {/* Right: language + object switcher + avatar sheet */}
            <div className="flex items-center gap-2">
                <LanguageSwitcher />
                <Sheet>
                    <SheetTrigger asChild>
                        <button className="flex items-center gap-2.5 pl-3 border-l border-slate-200 hover:opacity-80 transition-opacity">
                            <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-[11px] font-bold shrink-0">
                                {initial}
                            </div>
                            <span className="text-[13px] font-medium text-slate-700 hidden sm:block leading-none">
                                {company}
                            </span>
                            <ChevronRight className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
                        </button>
                    </SheetTrigger>

                    <SheetContent
                        side="right"
                        className="w-72 bg-white border-l border-slate-200 flex flex-col p-0"
                    >
                        {/* Profile header */}
                        <div className="px-6 py-6 border-b border-slate-100">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center text-white text-lg font-bold shrink-0">
                                    {initial}
                                </div>
                                <div>
                                    <p className="text-[14px] font-semibold text-slate-900 leading-none">
                                        {company}
                                    </p>
                                    <span className="text-[11px] text-slate-400 mt-0.5 block">
                                        {t("common.manager")}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Objects list */}
                        <div className="flex-1 overflow-y-auto px-4 py-4">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.1em] px-2 mb-3">
                                {t("navbar.objects")}
                            </p>
                            <div className="space-y-1">
                                {objects.length > 0 ? (
                                    objects.map((obj, idx) => {
                                        const id   = obj.object_id ?? obj.id;
                                        const name = obj.object_name ?? obj.name ?? t("navbar.noName");
                                        const isCurrentObj = localStorage.getItem("object") === id?.toString();
                                        return (
                                            <div
                                                key={id ?? idx}
                                                onClick={() => id && handleObjectChange(id)}
                                                className={cn(
                                                    "flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-colors",
                                                    isCurrentObj
                                                        ? "bg-blue-50 text-blue-700"
                                                        : "hover:bg-slate-50 text-slate-700"
                                                )}
                                            >
                                                <div className={cn(
                                                    "w-7 h-7 rounded-md flex items-center justify-center text-[11px] font-bold shrink-0",
                                                    isCurrentObj
                                                        ? "bg-blue-100 text-blue-600"
                                                        : "bg-slate-100 text-slate-500"
                                                )}>
                                                    {name.charAt(0).toUpperCase()}
                                                </div>
                                                <span className="text-[13px] font-medium truncate flex-1">
                                                    {name}
                                                </span>
                                                {isCurrentObj && (
                                                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0" />
                                                )}
                                            </div>
                                        );
                                    })
                                ) : (
                                    <p className="text-[13px] text-slate-400 text-center py-6">
                                        {t("navbar.noObjects")}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Logout */}
                        <div className="px-4 pb-5 border-t border-slate-100 pt-3">
                            <SheetClose asChild>
                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 text-[13px] font-medium transition-colors"
                                >
                                    <LogOut className="w-4 h-4" />
                                    {t("navbar.logout")}
                                </button>
                            </SheetClose>
                        </div>
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    );
};

export default Navbar;
