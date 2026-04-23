import { Navigate } from "react-router-dom";
import { useUser } from "./UserProvider";

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useUser();

  if (loading) return null;
  if (!user) return <Navigate to="/" replace />;

  return children;
};

export default ProtectedRoute;
