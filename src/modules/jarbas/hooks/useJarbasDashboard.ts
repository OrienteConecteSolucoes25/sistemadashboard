import { useState, useEffect } from "react";
import { jarbasCore } from "../core/jarbasCore";
import { jarbasExecutive } from "../core/jarbasExecutiveMode";

export function useJarbasDashboard() {
  const [events, setEvents] = useState(jarbasCore.getEvents());
  const [insights, setInsights] = useState(jarbasCore.getInsights());
  const [status, setStatus] = useState(jarbasCore.getOperationalStatus());
  const [alerts, setAlerts] = useState(jarbasCore.getAlerts());
  const [executiveInsights, setExecutiveInsights] = useState<any[]>([]);

  useEffect(() => {
    fetchExecutiveInsights();
    
    const interval = setInterval(() => {
      setEvents([...jarbasCore.getEvents()]);
      setInsights([...jarbasCore.getInsights()]);
      setStatus(jarbasCore.getOperationalStatus());
      setAlerts([...jarbasCore.getAlerts()]);
      fetchExecutiveInsights();
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fetchExecutiveInsights = async () => {
    const data = await jarbasExecutive.getExecutiveSummary();
    setExecutiveInsights(data);
  };

  return {
    events,
    insights,
    status,
    alerts,
    executiveInsights
  };
}
