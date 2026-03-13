// DEMO_MODE fetch 인터셉터 — 반드시 최상단에서 import (다른 모듈보다 먼저 실행)
import { DEMO_MODE } from "./mocks/installDemo.js";

import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { MsalProvider } from "@azure/msal-react";
import { LicenseInfo } from "@mui/x-license-pro";
import { store } from "./store/index.js";
import { msalInstance } from "./services/authService.js";
import { queryClient } from "./lib/queryClient.js";
import { initSentry } from "./lib/sentry.js";
import { initSocket } from "./lib/socket.js";
import App from "./App.jsx";
import "./styles/fnco-tokens.css";
import "./index.css";

// Initialize Sentry & Socket.IO (skip in DEMO_MODE)
if (!DEMO_MODE) {
  initSentry();
  initSocket();
}

const MUI_LICENSE_KEY = import.meta.env.VITE_MUI_LICENSE_KEY || "";

if (MUI_LICENSE_KEY) {
  LicenseInfo.setLicenseKey(MUI_LICENSE_KEY);
}

createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <MsalProvider instance={msalInstance}>
          <App />
        </MsalProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </Provider>
);
