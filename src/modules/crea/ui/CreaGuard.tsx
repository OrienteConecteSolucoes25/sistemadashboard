import { Navigate } from "react-router-dom";
import { useCreaAccess } from "../hooks/useCreaAccess";
import CreaLayout from "./CreaLayout";

export default function CreaGuard() {
  const { hasAccess, checking } = useCreaAccess();
  if (checking) return null;
  if (!hasAccess) return <Navigate to="/app" replace />;
  return <CreaLayout />;
}
