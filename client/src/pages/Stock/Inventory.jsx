import { useEffect, useMemo, useState } from "react";
import { FaBoxOpen, FaCubes, FaExclamationTriangle, FaSearch } from "react-icons/fa";

import stockService from "../../services/stockService";

const formatCurrency = (value) =>
  `৳ ${Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getStockMeta = (quantity) => {
  if (quantity <= 0) {
    return {
      label: "Out of stock",
      tone: "bg-red-50 text-red-700 ring-red-200",
      cardTone: "border-red-200 bg-red-50/60",
    };
  }
  if (quantity <= 10) {
    return {
      label: "Low stock",
      tone: "bg-amber-50 text-amber-700 ring-amber-200",
      cardTone: "border-amber-200 bg-amber-50/60",
    };
  }
  return {
    label: "Healthy stock",
    tone: "bg-emerald-50 text-emerald-700 ring-emerald-200",
    cardTone: "border-emerald-200 bg-emerald-50/60",
  };
};

export default function Inventory() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) =>
      [product.name, product.sku, product.batch, product.unit]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [products, search]);

  const metrics = useMemo(() => {
    const totalProducts = products.length;
    const activeProducts = products.filter((product) => product.is_active).length;
    const lowStockCount = products.filter(
      (product) => product.stock_quantity > 0 && product.stock_quantity <= 10
    ).length;
    const outOfStockCount = products.filter((product) => product.stock_quantity <= 0).length;

    return { totalProducts, activeProducts, lowStockCount, outOfStockCount };
  }, [products]);

  useEffect(() => {
    const loadInventory = async () => {
      try {
        setLoading(true);
        setError("");
        const data = await stockService.getProducts();
        setProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        setError(err.response?.data?.detail || err.message || "Failed to load inventory.");
      } finally {
        setLoading(false);
      }
    };

    loadInventory();
  }, []);

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-slate-900">Inventory Overview</h1>
              <p className="mt-1 text-sm text-slate-500">
                Monitor stock health, identify shortages fast, and keep the shelves ready for sales.
              </p>
            </div>

            <div className="relative w-full lg:w-80">
              <FaSearch className="absolute left-3 top-3 text-sm text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by product, SKU, batch, or unit"
                className="w-full rounded-full border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-500">Total Products</span>
                <FaCubes className="text-slate-400" />
              </div>
              <div className="mt-3 text-3xl font-semibold text-slate-900">{metrics.totalProducts}</div>
            </div>

            <div className="rounded-3xl border border-emerald-200 bg-emerald-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-emerald-700">Active Items</span>
                <FaBoxOpen className="text-emerald-500" />
              </div>
              <div className="mt-3 text-3xl font-semibold text-emerald-900">{metrics.activeProducts}</div>
            </div>

            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-amber-700">Low Stock</span>
                <FaExclamationTriangle className="text-amber-500" />
              </div>
              <div className="mt-3 text-3xl font-semibold text-amber-900">{metrics.lowStockCount}</div>
            </div>

            <div className="rounded-3xl border border-red-200 bg-red-50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-red-700">Out Of Stock</span>
                <FaExclamationTriangle className="text-red-500" />
              </div>
              <div className="mt-3 text-3xl font-semibold text-red-900">{metrics.outOfStockCount}</div>
            </div>
          </div>
        </section>

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-4 py-16 text-center text-sm text-slate-500 shadow-sm">
            Loading inventory...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-200 bg-white px-4 py-16 text-center text-sm text-slate-500 shadow-sm">
            No stock items found yet. Add products from the Products section to populate inventory.
          </div>
        ) : (
          <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-200 px-5 py-4">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Inventory List</h2>
                <p className="mt-1 text-sm text-slate-500">
                  Compact stock view for faster scanning across more products.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {filteredProducts.length} items
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                    <th className="px-4 py-3 font-medium">Product</th>
                    <th className="px-4 py-3 font-medium">SKU / Batch</th>
                    <th className="px-4 py-3 font-medium">Unit</th>
                    <th className="px-4 py-3 text-right font-medium">Stock Qty</th>
                    <th className="px-4 py-3 text-right font-medium">Unit Price</th>
                    <th className="px-4 py-3 text-center font-medium">Stock Status</th>
                    <th className="px-4 py-3 text-center font-medium">Sale Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {filteredProducts.map((product) => {
                    const stockMeta = getStockMeta(product.stock_quantity);

                    return (
                      <tr key={product.id} className="align-top transition hover:bg-slate-50/70">
                        <td className="px-4 py-3">
                          <div className="font-medium text-slate-900">{product.name}</div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          <div className="font-medium text-slate-700">{product.sku}</div>
                          <div className="mt-1 text-xs text-slate-500">
                            Batch: {product.batch || "Not set"}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-600">{product.unit}</td>
                        <td className="px-4 py-3 text-right font-semibold text-slate-900">
                          {product.stock_quantity}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-800">
                          {formatCurrency(product.unit_price)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${stockMeta.tone}`}
                          >
                            {stockMeta.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span
                            className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${
                              product.is_active
                                ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
                                : "bg-slate-100 text-slate-600 ring-slate-200"
                            }`}
                          >
                            {product.is_active ? "Active" : "Inactive"}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
