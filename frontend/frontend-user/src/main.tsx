import React from "react";
import ReactDOM from "react-dom/client";
import { AppRouter } from "@/app/router/AppRouter";
import { AppProviders } from "@/app/providers/AppProviders";
import "@/styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AppProviders>
      <AppRouter />
    </AppProviders>
  </React.StrictMode>,
);
