import { useState, useEffect, useRef } from "react";
import { jarbasCore } from "../core/jarbasCore";

export function useJarbasDashboard() {
  const [events, setEvents] = useState(jarbasCore.getEvents());
  const [insights, setInsights] = useState(jarbasCore.getInsights());
  const [status, setStatus] = useState(jarbasCore.getOperationalStatus());
  const [alerts, setAlerts] = useState(jarbasCore.getAlerts());

  useEffect(() => {
    // Em uma implementação real, usaríamos um EventEmitter ou similar no jarbasCore
    // Para agora, vamos simular atualizações periódicas
    const interval = setInterval(() => {
      setEvents([...jarbasCore.getEvents()]);
      setInsights([...jarbasCore.getInsights()]);
      setStatus(jarbasCore.getOperationalStatus());
      setAlerts([...jarbasCore.getAlerts()]);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    events,
    insights,
    status,
    alerts
  };
}
