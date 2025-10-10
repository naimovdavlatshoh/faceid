import { cn } from "@/lib/utils";

import {
    Sheet,
    SheetContent,
    SheetTrigger,
    SheetClose,
} from "@/components/ui/sheet";

interface NavbarProps {
    className?: string;
    onToggleSidebar?: () => void;
}

const Navbar = ({ className }: NavbarProps) => {
    const handleLogout = () => {
        console.log("Logout clicked");
    };

    return (
        <header
            className={cn(
                "fixed top-0 left-72 right-0 z-40 bg-white/5 dark:bg-gray-900/30 backdrop-blur-xl px-6 py-4 flex items-center justify-between",
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
                        <button className="flex items-center space-x-3 text-sm rounded-full hover:bg-gray-50 dark:hover:bg-gray-800 px-2 py-1 transition-colors">
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
                        className="bg-white dark:bg-gray-900/90 backdrop-blur-xl border-l flex flex-col justify-between border-gray-100 dark:border-gray-800 p-6"
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
                            <h3 className="mt-4 text-xl font-semibold text-gray-900 dark:text-white">
                                Jaydon Frankie
                            </h3>
                            <p className="text-sm text-gray-500">
                                demo@minimals.cc
                            </p>

                            <div className="flex items-center gap-3 mt-4">
                                {[
                                    "/avatar-1.webp",
                                    "/avatar-2.webp",
                                    "/avatar-3.webp",
                                ].map((a) => (
                                    <img
                                        key={a}
                                        src={a}
                                        alt="a"
                                        className="w-10 h-10 rounded-full object-cover"
                                    />
                                ))}
                                <button className="w-10 h-10 rounded-full border border-dashed text-gray-400">
                                    +
                                </button>
                            </div>
                        </div>

                        <SheetClose asChild>
                            <button
                                onClick={handleLogout}
                                className="mt-4 w-full rounded-xl bg-red-100 text-red-600 py-3 font-medium"
                            >
                                Logout
                            </button>
                        </SheetClose>
                    </SheetContent>
                </Sheet>
            </div>
        </header>
    );
};

export default Navbar;
