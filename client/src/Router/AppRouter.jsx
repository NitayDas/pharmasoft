// src/router/AppRouter.jsx
import { Routes, Route } from "react-router-dom";
import Root from "../components/Root/Root";
import Layout from "../components/layout/MainLayout";
import Home from "../pages/Home"
import DashboardPage from "../pages/Dashboard/DashboardPage";
import LoginPage from "../pages/Login/Login";
import SalesPage from "../pages/Sales/Sales";
import Customers from "../pages/People/Customers";
import Inventory from "../pages/Stock/Inventory";
import Products from "../pages/Stock/Products";



export default function AppRouter() {
  return (
    <Routes>

      {/* Public routes */}
      <Route element={<Root />}>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
      </Route>

      {/* Dashboard routes */}
      <Route element={<Layout />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/sales/sales-entry" element={<SalesPage />} />
        <Route path="/people/customers" element={<Customers />} />
        <Route path="/stock/inventory" element={<Inventory />} />
        <Route path="/stock/products" element={<Products />} />
      </Route>

    </Routes>
  );
}
