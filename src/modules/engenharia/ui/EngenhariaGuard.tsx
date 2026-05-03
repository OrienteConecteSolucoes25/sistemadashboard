import { Navigate } from "react-router-dom";
import { useEngenhariaAccess } from "../hooks/useEngenhariaAccess";
import EngenhariaLayout from "./EngenhariaLayout";

const EngenhariaGuard = () => {
  const { hasAccess, checking } = useEngenhariaAccess();
  if (checking) return null;
  if (!hasAccess) return <Navigate to="/app" replace />;
  return <EngenhariaLayout />;
};

export default EngenhariaGuard;
