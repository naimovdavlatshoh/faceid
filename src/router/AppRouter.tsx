import { createBrowserRouter, RouterProvider } from "react-router-dom";
import DashboardLayout from "../layout/DashboardLayout";
import Dashboard from "../pages/Dashboard";
import Users from "../pages/Users/Users";

import Details from "@/pages/Users/Details";
import CreateUser from "@/pages/Users/CreateUser";
import Login from "../pages/Auth/Login";
import Account from "@/pages/Users/Account";

const router = createBrowserRouter([
    {
        path: "/login",
        element: <Login />,
    },
    {
        path: "/",
        element: <DashboardLayout />,
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
                path: "users/create",
                element: <CreateUser />,
            },
            {
                path: "users/account",
                element: <Account />,
            },
            {
                path: "details/:id",
                element: <Details />,
            },
        ],
    },
]);

const AppRouter = () => {
    return <RouterProvider router={router} />;
};

export default AppRouter;
