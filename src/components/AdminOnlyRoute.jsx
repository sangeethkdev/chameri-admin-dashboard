import { useAuth } from "../context/AuthContext";
import { Navigate, Outlet } from "react-router-dom";

// Only allow admin and superadmin roles
const AdminOnlyRoute = () => {
  const { admin } = useAuth();
  const isAdmin = admin?.role === "admin" || admin?.role === "superadmin";
  return isAdmin ? <Outlet /> : <Navigate to="/" replace />;
};


export default AdminOnlyRoute;
