import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./styles.css";
import { StudentsProvider } from "./contexts/StudentsContext";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <StudentsProvider>
      <App />
    </StudentsProvider>
  </React.StrictMode>
);
