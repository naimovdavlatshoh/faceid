import { createBrowserRouter, RouterProvider } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import AdminLayout from "../layout/AdminLayout";
import Dashboard from "../pages/Dashboard";
import Users from "../pages/Users/Users";
import Positions from "../pages/Position/Positions";
import Shifts from "../pages/Shifts/Shifts";
import CreateShift from "../pages/Shifts/CreateShift";
import ShiftDays from "../pages/Shifts/ShiftDays";
import CreateUser from "@/pages/Users/CreateUser";
import Login from "../pages/Auth/Login";
import Account from "@/pages/Users/Account";
import EmployeeReport from "@/pages/Users/EmployeeReport";
import ProtectedRoute from "@/components/ProtectedRoute";
import AdminProtectedRoute from "@/components/AdminProtectedRoute";
import AdminDashboard from "@/pages/Admin/AdminDashboard";
import AdminObjects from "@/pages/Admin/Objects";
import AdminUsers from "@/pages/Admin/AdminUsers";
import AdminEmployees from "@/pages/Admin/AdminEmployees";
import AdminTerminals from "@/pages/Admin/AdminTerminals";
import AdminObjectUsers from "@/pages/Admin/AdminObjectUsers";
import AdminObjectTelegram from "@/pages/Admin/AdminObjectTelegram";

const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />,
    },
    {
        path: "/",
        element: (
            <ProtectedRoute>
                <DashboardLayout />
            </ProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: <Dashboard />,
            },
            {
                path: "users",
                element: <Users />,
            },
            {
                path: "positions",
                element: <Positions />,
            },
            {
                path: "shifts",
                element: <Shifts />,
            },
            {
                path: "shifts/create",
                element: <CreateShift />,
            },
            {
                path: "shifts/days/:id/:name",
                element: <ShiftDays />,
            },
            {
                path: "users/create",
                element: <CreateUser />,
            },
            {
                path: "details/:id",
                element: <Account />,
            },
            {
                path: "users/report",
                element: <EmployeeReport />,
            },
            {
                path: "users/report/:id",
                element: <EmployeeReport />,
            },
        ],
    },
    {
        path: "/admin",
        element: (
            <AdminProtectedRoute>
                <AdminLayout />
            </AdminProtectedRoute>
        ),
        children: [
            {
                index: true,
                element: <AdminDashboard />,
            },
            {
                path: "objects",
                element: <AdminObjects />,
            },
            {
                path: "users",
                element: <AdminUsers />,
            },
            {
                path: "employees",
                element: <AdminEmployees />,
            },
            {
                path: "terminals",
                element: <AdminTerminals />,
            },
            {
                path: "object-users",
                element: <AdminObjectUsers />,
            },
            {
                path: "object-telegram",
                element: <AdminObjectTelegram />,
            },
        ],
    },
]);

const AppRouter = () => {
    return <RouterProvider router={router} />;
};

export default AppRouter;
