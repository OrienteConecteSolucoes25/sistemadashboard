import { Navigate } from "react-router-dom";
import { useRhdpAccess } from "../hooks/useRhdpAccess";
import RhdpLayout from "./RhdpLayout";

export default function RhdpGuard() {
  const { hasAccess, checking } = useRhdpAccess();
  if (checking) return null;
  if (!hasAccess) return <Navigate to="/app" replace />;
  return <RhdpLayout />;
}
