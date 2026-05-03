import { Navigate } from "react-router-dom";
import { useJuridicoAccess } from "../hooks/useJuridicoAccess";
import JuridicoLayout from "./JuridicoLayout";

const JuridicoGuard = () => {
  const { hasAccess, checking } = useJuridicoAccess();
  if (checking) return null;
  if (!hasAccess) return <Navigate to="/app" replace />;
  return <JuridicoLayout />;
};

export default JuridicoGuard;
