import { cn } from "@/lib/utils";
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { useIsMobile } from "@/components/hooks/use-mobile";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
    className?: string;
}

const DashboardLayout = ({ className }: DashboardLayoutProps) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const isMobile = useIsMobile();
    const location = useLocation();

    return (
        <div className={cn("flex h-screen bg-white ", className)}>
            {/* Desktop: always visible sidebar */}
            {!isMobile && <Sidebar />}

            {/* Mobile: sidebar inside sheet */}
            {isMobile && (
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                    <SheetContent
                        side="left"
                        className="w-72 p-0 pt-12 border-r border-gray-100 overflow-y-auto"
                    >
                        <Sidebar onClose={() => setSidebarOpen(false)} />
                    </SheetContent>
                </Sheet>
            )}

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <Navbar onToggleSidebar={() => setSidebarOpen(true)} />

                {/* Main Content */}
                <main className="flex-1 overflow-auto pt-20 md:pt-24">
                    <div
                        className={cn(
                            "max-w-7xl mx-auto w-full px-4 sm:px-6",
                            location.pathname === "/"
                                ? "max-w-7xl mx-auto"
                                : "max-w-7xl mx-auto"
                        )}
                    >
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
