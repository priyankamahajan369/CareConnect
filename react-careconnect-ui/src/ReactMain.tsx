import React from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter, HashRouter } from "react-router-dom";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { store } from "./ReduxStore";
import { ReactApp } from "./ReactApp";
import { initializeAuth, demoMode } from "./RestAuth";
import "./cssCareConnect.css";
const Router = demoMode ? HashRouter : BrowserRouter;
const theme = createTheme({
  palette: { primary: { main: "#17635a" }, secondary: { main: "#7b65b8" } },
  typography: { fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif" },
  shape: { borderRadius: 14 },
});
initializeAuth()
  .then(() =>
    createRoot(document.getElementById("root")!).render(
      <React.StrictMode>
        <Provider store={store}>
          <ThemeProvider theme={theme}>
            <Router>
              <ReactApp />
            </Router>
          </ThemeProvider>
        </Provider>
      </React.StrictMode>,
    ),
  )
  .catch(() => {
    document.getElementById("root")!.textContent =
      "Login could not be initialized. Check Keycloak and the configured URL, then refresh.";
  });
