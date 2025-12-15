import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetClose,
} from "@/components/ui/sheet";
import { useNavigate } from "react-router-dom";
import { PostSimple } from "@/services/data";
import { toast } from "sonner";

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

const Navbar = ({ className }: NavbarProps) => {
    const navigate = useNavigate();
    const [objects, setObjects] = useState<ObjectItem[]>([]);

    useEffect(() => {
        try {
            const objectsStr = localStorage.getItem("objects");
            if (objectsStr) {
                const parsed = JSON.parse(objectsStr);
                setObjects(Array.isArray(parsed) ? parsed : []);
            }
        } catch (error) {
            console.error("Error parsing objects from localStorage:", error);
            setObjects([]);
        }
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("token");
        navigate("/login");
    };

    const handleObjectChange = async (objectId: number) => {
        const currentObjectId = localStorage.getItem("object");
        if (currentObjectId === objectId.toString()) {
            return; // Already selected
        }

        try {
            await PostSimple(`api/user/changeobject/${objectId}`, {}).then(
                (res) => {
                    console.log(res);
                    localStorage.setItem("object", objectId.toString());
                    localStorage.setItem("token", res?.data?.jwt);
                    toast.success(res?.data?.message);
                    setTimeout(() => {
                        window.location.reload();
                    }, 100);
                }
            );
        } catch (error: any) {
            console.error("Error changing object:", error);
            toast.error(
                error?.response?.data?.message || "Не удалось изменить объект"
            );
        }
    };

    return (
        <header
            className={cn(
                "fixed top-0 left-72 right-0 z-40 bg-white/5  backdrop-blur-xl px-6 py-4 flex items-center justify-between",
                className
            )}
        >
            <div className="flex items-center space-x-2">
                {/* Sidebar Toggle Button */}
            </div>

            {/* User Menu */}
            <div className="flex justify-end items-center">
                <Sheet>
                    <SheetTrigger asChild>
                        <button className="flex items-center space-x-3 text-sm rounded-full hover:bg-gray-50  px-2 py-1 transition-colors">
                            <div className="w-10 h-10 bg-mainbg rounded-full flex items-center justify-center p-[2px]">
                                <div className="">
                                    <img
                                        src="/avatar-1.webp"
                                        alt="avatar"
                                        className="w-full h-full object-cover rounded-full"
                                    />
                                </div>
                            </div>
                        </button>
                    </SheetTrigger>
                    <SheetContent
                        side="right"
                        className="bg-white  backdrop-blur-xl border-l flex flex-col justify-between border-gray-100  p-6"
                    >
                        <div className="flex flex-col items-center text-center">
                            <div className="relative">
                                <div className="w-24 h-24 rounded-full p-[2px] bg-mainbg">
                                    <div className="w-full h-full rounded-full overflow-hidden bg-white p-1">
                                        <img
                                            src="/avatar-1.webp"
                                            alt="avatar"
                                            className="w-full h-full object-cover rounded-full"
                                        />
                                    </div>
                                </div>
                            </div>
                            <h3 className="mt-4 text-xl font-semibold text-gray-900 ">
                                {localStorage.getItem("company")}
                            </h3>
                            {/* <p className="text-sm text-gray-500">
                                demo@minimals.cc
                            </p> */}

                            <div className="w-full mt-6">
                                <h4 className="text-sm font-medium text-gray-700 mb-3">
                                    Объекты
                                </h4>
                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                    {objects.length > 0 ? (
                                        objects.map((obj, index) => (
                                            <div
                                                key={
                                                    obj.object_id ||
                                                    obj.id ||
                                                    index
                                                }
                                                onClick={() => {
                                                    const objectId =
                                                        obj.object_id || obj.id;
                                                    if (objectId) {
                                                        handleObjectChange(
                                                            objectId
                                                        );
                                                    }
                                                }}
                                                className={`flex cursor-pointer items-center justify-start gap-2 p-2 ${
                                                    localStorage.getItem(
                                                        "object"
                                                    ) ===
                                                    (
                                                        obj.object_id || obj.id
                                                    )?.toString()
                                                        ? "bg-mainbg/15"
                                                        : ""
                                                } rounded-lg hover:bg-gray-50 transition-colors`}
                                            >
                                                <div className="w-8 h-8 bg-mainbg/30 rounded-full flex items-center justify-center text-xs font-medium text-maintx">
                                                    {(
                                                        obj.object_name ||
                                                        obj.name ||
                                                        "?"
                                                    )
                                                        .charAt(0)
                                                        .toUpperCase()}
                                                </div>
                                                <span className="text-sm text-start text-gray-700 flex-1">
                                                    {obj.object_name ||
                                                        obj.name ||
                                                        "Неизвестный объект"}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-sm text-gray-500 text-center py-4">
                                            Нет объектов
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>

                        <SheetClose asChild>
                            <button
                                onClick={handleLogout}
                                className="mt-4 w-full rounded-xl bg-red-100 text-red-600 py-3 font-medium"
                            >
                                Выход из системы
                            </button>
                        </SheetClose>
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    );
};

export default Navbar;
