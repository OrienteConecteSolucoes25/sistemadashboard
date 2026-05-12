import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { registerServiceWorker } from "./lib/registerSW";

createRoot(document.getElementById("root")!).render(<App />);

// PWA: registrar Service Worker apenas em produção/published, NUNCA em iframe/preview
registerServiceWorker();
