// src/index.js
import React, { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import "./index.css";
import AppRouter from "./Router/AppRouter";
import { UserProvider } from "./Provider/UserProvider";
import { Toaster } from "react-hot-toast";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <UserProvider>
        <AppRouter />
        <Toaster position="top-center" />
      </UserProvider>
    </BrowserRouter>
  </StrictMode>
);