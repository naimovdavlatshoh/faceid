import { cn } from "@/lib/utils";
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Sidebar from "./Sidebar";

interface DashboardLayoutProps {
    className?: string;
}

const DashboardLayout = ({ className }: DashboardLayoutProps) => {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const location = useLocation();

    const toggleSidebar = () => {
        setIsSidebarCollapsed(!isSidebarCollapsed);
    };

    return (
        <div className={cn("flex h-screen bg-white ", className)}>
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <Navbar onToggleSidebar={toggleSidebar} />

                {/* Main Content */}
                <main className="flex-1 overflow-auto pt-24">
                    <div
                        className={cn(
                            location.pathname === "/"
                                ? "max-w-7xl mx-auto"
                                : "max-w-6xl mx-auto"
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
