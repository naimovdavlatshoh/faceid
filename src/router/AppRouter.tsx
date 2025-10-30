import { createBrowserRouter, RouterProvider } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import Dashboard from "../pages/Dashboard";
import Users from "../pages/Users/Users";
import Positions from "../pages/Position/Positions";
import Shifts from "../pages/Shifts/Shifts";
import CreateShift from "../pages/Shifts/CreateShift";
import ShiftDays from "../pages/Shifts/ShiftDays";

import CreateUser from "@/pages/Users/CreateUser";
import Login from "../pages/Auth/Login";
import Account from "@/pages/Users/Account";
import ProtectedRoute from "@/components/ProtectedRoute";

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
        ],
    },
]);

const AppRouter = () => {
    return <RouterProvider router={router} />;
};

export default AppRouter;
