import React from "react";
import ReactDOM from "react-dom/client";
import { registerSW } from "virtual:pwa-register";
import App from "./App";
import "./styles.css";

registerSW({ immediate: true });
const Root = import.meta.env.DEV ? React.lazy(() => import("./teacher/DevelopmentRoot")) : App;
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <React.Suspense fallback={<div role="status">Carregando…</div>}><Root /></React.Suspense>
  </React.StrictMode>,
);
