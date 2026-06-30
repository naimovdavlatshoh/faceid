import { cn } from "@/lib/utils";
import { useState } from "react";
import { Outlet } from "react-router-dom";
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

    return (
        <div className={cn("flex h-screen bg-slate-100 overflow-hidden", className)}>
            {/* Desktop sidebar */}
            {!isMobile && <Sidebar />}

            {/* Mobile sidebar */}
            {isMobile && (
                <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
                    <SheetContent side="left" className="w-64 p-0 border-0">
                        <Sidebar onClose={() => setSidebarOpen(false)} />
                    </SheetContent>
                </Sheet>
            )}

            {/* Main */}
            <div className="flex-1 flex flex-col overflow-hidden min-w-0">
                <Navbar onToggleSidebar={() => setSidebarOpen(true)} />

                <main className="flex-1 overflow-auto">
                    <div className="max-w-[1400px] mx-auto w-full px-5 sm:px-7 py-6">
                        <Outlet />
                    </div>
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;
