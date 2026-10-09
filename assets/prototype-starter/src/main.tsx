import React from "react";
import { createRoot } from "react-dom/client";
import { Studio } from "./studio/Studio.tsx";
import "overlayscrollbars/overlayscrollbars.css";
import "./styles.css";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Studio />
  </React.StrictMode>,
);
