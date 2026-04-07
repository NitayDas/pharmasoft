// src/router/AppRouter.jsx
import { Routes, Route } from "react-router-dom";
import Root from "../components/Root/Root";
import ProtectedRoute from "../Provider/ProtectedRoute";
import Layout from "../components/layout/MainLayout";
import Home from "../pages/Home"
import DashboardPage from "../pages/Dashboard/DashboardPage";
import LoginPage from "../pages/Login/Login";
import SalesPage from "../pages/Sales/Sales";
import Customers from "../pages/People/Customers";




export default function AppRouter() {
  return (
    <Routes>

      {/* Public routes */}
      <Route element={<Root />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Dashboard routes */}
      <Route
        element={<ProtectedRoute><Layout /></ProtectedRoute>}
      >
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/sales/sales-entry" element={<SalesPage />} />
        <Route path="/people/customers" element={<Customers />} />
      </Route>

    </Routes>
  );
}