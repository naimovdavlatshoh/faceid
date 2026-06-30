import { Navigate } from "react-router-dom";

interface AdminProtectedRouteProps {
    children: React.ReactNode;
}

const AdminProtectedRoute = ({ children }: AdminProtectedRouteProps) => {
    const token = localStorage.getItem("token");
    const roleId = localStorage.getItem("role_id");

    if (!token) {
        return <Navigate to="/login" replace />;
    }

    if (roleId !== "1") {
        return <Navigate to="/" replace />;
    }

    return <>{children}</>;
};

export default AdminProtectedRoute;
