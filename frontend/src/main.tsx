import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { checkAndMigrateSchema } from "@/sync/schema";
import { syncWorker } from "@/sync/syncWorker";
import { registerServiceWorker } from "@/sync/swRegister";

checkAndMigrateSchema();
syncWorker.start();
registerServiceWorker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
