import { useEffect, useMemo, useState } from "react";
import { FaBoxOpen, FaEdit, FaPlus, FaSearch, FaTrash } from "react-icons/fa";
import { toast } from "react-hot-toast";

import salesService from "../../services/salesService";

const EMPTY_FORM = {
  name: "",
  sku: "",
  batch: "",
  unit: "Box",
  unit_price: "",
  stock_quantity: "",
  is_active: true,
};

const formatCurrency = (value) =>
  `৳ ${Number(value || 0).toLocaleString("en-BD", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const getStockTone = (quantity) => {
  if (quantity <= 0) return "bg-red-50 text-red-700 ring-red-200";
  if (quantity <= 10) return "bg-amber-50 text-amber-700 ring-amber-200";
  return "bg-emerald-50 text-emerald-700 ring-emerald-200";
};

export default function Products() {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(true);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);
  const [currentStockLevel, setCurrentStockLevel] = useState(0);
  const [form, setForm] = useState(EMPTY_FORM);

  const filteredProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return products;
    return products.filter((product) =>
      [product.name, product.sku, product.batch, product.unit]
        .filter(Boolean)
        .some((value) => value.toLowerCase().includes(query))
    );
  }, [products, search]);

  const resetFormState = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setCurrentStockLevel(0);
  };

  const loadProducts = async (searchValue = "") => {
    try {
      setLoading(true);
      setError("");
      const data = await salesService.getProducts(searchValue.trim() ? { search: searchValue.trim() } : {});
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to load products.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadProducts(search);
    }, 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");

      const payload = {
        name: form.name.trim(),
        sku: form.sku.trim(),
        batch: form.batch.trim(),
        unit: form.unit.trim() || "Box",
        unit_price: form.unit_price === "" ? "0.00" : form.unit_price,
        stock_quantity: editingId
          ? currentStockLevel + (form.stock_quantity === "" ? 0 : Number(form.stock_quantity))
          : form.stock_quantity === "" ? 0 : Number(form.stock_quantity),
        is_active: form.is_active,
      };

      if (editingId) {
        await salesService.updateProduct(editingId, payload);
        toast.success("Product updated successfully.");
      } else {
        await salesService.createProduct(payload);
        toast.success("Product added successfully.");
      }

      resetFormState();
      setShowForm(false);
      await loadProducts(search);
    } catch (err) {
      const data = err.response?.data;
      const detail =
        data?.detail ||
        (data && typeof data === "object"
          ? Object.entries(data)
              .map(([field, messages]) => `${field}: ${[].concat(messages).join(" ")}`)
              .join(" ")
          : err.message) ||
        "Failed to save product.";
      setError(detail);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (product) => {
    setEditingId(product.id);
    setShowForm(true);
    setError("");
    setForm({
      name: product.name || "",
      sku: product.sku || "",
      batch: product.batch || "",
      unit: product.unit || "Box",
      unit_price: product.unit_price ?? "",
      stock_quantity: "",
      is_active: Boolean(product.is_active),
    });
    setCurrentStockLevel(Number(product.stock_quantity) || 0);
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;
    try {
      setDeleting(true);
      setError("");
      await salesService.deleteProduct(productToDelete.id);
      setProducts((current) => current.filter((item) => item.id !== productToDelete.id));
      if (editingId === productToDelete.id) resetFormState();
      setProductToDelete(null);
      toast.success("Product deleted successfully.");
    } catch (err) {
      setError(err.response?.data?.detail || err.message || "Failed to delete product.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="mx-auto max-w-7xl rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">Product Management</h1>
            <p className="mt-1 text-sm text-slate-500">
              Add products once and keep your stock, sales, and reporting perfectly aligned.
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-80">
              <FaSearch className="absolute left-3 top-3 text-sm text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by product, SKU, batch, or unit"
                className="w-full rounded-full border border-slate-200 py-2 pl-9 pr-3 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <button
              type="button"
              onClick={() => {
                if (!showForm) resetFormState();
                setShowForm((current) => !current);
              }}
              className="inline-flex items-center justify-center gap-2 rounded-full bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700"
            >
              <FaPlus className="text-xs" />
              {showForm ? "Close Form" : "Add Product"}
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className={`mt-6 flex flex-col gap-6 ${showForm ? "xl:flex-row" : ""}`}>
          <section className="min-w-0 flex-1">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-slate-800">Products</h2>
              <span className="text-xs text-slate-500">
                {filteredProducts.length} product{filteredProducts.length === 1 ? "" : "s"}
              </span>
            </div>

            {loading ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
                Loading products...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-12 text-center text-sm text-slate-500">
                No products found. Add your first product from the form.
              </div>
            ) : (
              <div className="overflow-hidden rounded-3xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                        <th className="px-4 py-3 font-medium">Product</th>
                        <th className="px-4 py-3 font-medium">SKU / Batch</th>
                        <th className="px-4 py-3 font-medium">Unit</th>
                        <th className="px-4 py-3 text-right font-medium">Price</th>
                        <th className="px-4 py-3 text-right font-medium">Stock</th>
                        <th className="px-4 py-3 text-center font-medium">Status</th>
                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {filteredProducts.map((product) => (
                        <tr key={product.id}>
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
                          <td className="px-4 py-3 text-right font-medium text-slate-800">
                            {formatCurrency(product.unit_price)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStockTone(
                                product.stock_quantity
                              )}`}
                            >
                              {product.stock_quantity}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${
                                product.is_active
                                  ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200"
                                  : "bg-slate-100 text-slate-600 ring-1 ring-slate-200"
                              }`}
                            >
                              {product.is_active ? "Active" : "Inactive"}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <button
                                type="button"
                                onClick={() => handleEdit(product)}
                                className="inline-flex items-center gap-2 rounded-full border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-50"
                              >
                                <FaEdit className="text-xs" />
                                Edit
                              </button>
                              <button
                                type="button"
                                onClick={() => setProductToDelete(product)}
                                className="inline-flex items-center gap-2 rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50"
                              >
                                <FaTrash className="text-xs" />
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </section>

          {showForm && (
            <aside className="xl:w-[380px] xl:border-l xl:border-slate-200 xl:pl-6">
              <div className="rounded-3xl bg-slate-50 p-5">
                <div className="mb-5">
                  <h3 className="text-lg font-semibold text-slate-900">
                    {editingId ? "Edit Product" : "Add Product"}
                  </h3>
                  <p className="mt-1 text-sm text-slate-500">
                    Build a clean product catalog that feeds the inventory view automatically.
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Product Name
                    </label>
                    <input
                      name="name"
                      value={form.name}
                      onChange={handleFormChange}
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                        SKU
                      </label>
                      <input
                        name="sku"
                        value={form.sku}
                        onChange={handleFormChange}
                        required
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Batch
                      </label>
                      <input
                        name="batch"
                        value={form.batch}
                        onChange={handleFormChange}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Unit
                      </label>
                      <input
                        name="unit"
                        value={form.unit}
                        onChange={handleFormChange}
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                        Unit Price
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0"
                        name="unit_price"
                        value={form.unit_price}
                        onChange={handleFormChange}
                        required
                        className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                      {editingId ? "Incoming Stock Quantity" : "Opening Stock Quantity"}
                    </label>
                    <input
                      type="number"
                      min="0"
                      name="stock_quantity"
                      value={form.stock_quantity}
                      onChange={handleFormChange}
                      required
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    />
                    <p className="mt-1 text-xs text-slate-500">
                      {editingId
                        ? "Enter only the newly arrived quantity. It will be added to the current stock automatically."
                        : "Set the opening stock when creating a brand-new product."}
                    </p>
                  </div>

                  {editingId && (
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Current Stock
                        </div>
                        <div className="mt-1 text-2xl font-semibold text-slate-900">
                          {currentStockLevel}
                        </div>
                      </div>
                      <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <div className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                          Projected Stock
                        </div>
                        <div className="mt-1 text-2xl font-semibold text-emerald-900">
                          {currentStockLevel + (form.stock_quantity === "" ? 0 : Number(form.stock_quantity))}
                        </div>
                      </div>
                    </div>
                  )}

                  <label className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3">
                    <div>
                      <div className="text-sm font-medium text-slate-800">Product is active</div>
                      <div className="text-xs text-slate-500">
                        Active products are available in sales and stock lists.
                      </div>
                    </div>
                    <input
                      type="checkbox"
                      name="is_active"
                      checked={form.is_active}
                      onChange={handleFormChange}
                      className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                    />
                  </label>

                  <div className="flex flex-col-reverse gap-2 pt-2 sm:flex-row sm:justify-end">
                    <button
                      type="button"
                      onClick={resetFormState}
                      className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
                    >
                      Reset
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="rounded-full bg-emerald-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 focus:outline-none focus:ring-4 focus:ring-emerald-100 disabled:cursor-not-allowed disabled:bg-emerald-400"
                    >
                      {saving ? (editingId ? "Updating..." : "Saving...") : editingId ? "Update Product" : "Save Product"}
                    </button>
                  </div>
                </form>
              </div>
            </aside>
          )}
        </div>
      </div>

      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl ring-1 ring-slate-200">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600">
                <FaTrash className="text-lg" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-lg font-semibold text-slate-900">Delete product?</h3>
                <p className="mt-2 text-sm leading-6 text-slate-500">
                  This will permanently remove{" "}
                  <span className="font-semibold text-slate-800">{productToDelete.name}</span>
                  {" "}from the catalog and stock views.
                </p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs font-medium uppercase tracking-wide text-slate-400">
                Product Summary
              </div>
              <div className="mt-2 space-y-1 text-sm text-slate-600">
                <div><span className="font-medium text-slate-800">SKU:</span> {productToDelete.sku}</div>
                <div><span className="font-medium text-slate-800">Batch:</span> {productToDelete.batch || "Not set"}</div>
                <div><span className="font-medium text-slate-800">Stock:</span> {productToDelete.stock_quantity}</div>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => !deleting && setProductToDelete(null)}
                disabled={deleting}
                className="rounded-full border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteProduct}
                disabled={deleting}
                className="rounded-full bg-red-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:bg-red-400"
              >
                {deleting ? "Deleting..." : "Delete Product"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
