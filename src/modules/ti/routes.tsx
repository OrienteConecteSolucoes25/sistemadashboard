import { RouteObject } from "react-router-dom";
import TiDashboard from "./ui/TiDashboard";
import CentralChamadosPage from "./ui/CentralChamadosPage";
import ChatAgenteTIPage from "./ui/ChatAgenteTIPage";

export const tiRoutes: RouteObject[] = [
  {
    path: "/ti",
    element: <TiDashboard />,
  },
  {
    path: "/ti/chamados",
    element: <CentralChamadosPage />,
  },
  {
    path: "/ti/agente",
    element: <ChatAgenteTIPage />,
  }
];
