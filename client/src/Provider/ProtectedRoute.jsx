import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";

const ProtectedRoute = ({ children }) => {
  const user = useSelector((state) => state.auth.user);


console.log("user",user)
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return children; // Render the protected content if the user is authenticated
};

export default ProtectedRoute;