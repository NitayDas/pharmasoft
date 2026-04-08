import { useState, useEffect } from "react";
import Select from "react-select";
import AxiosInstance from "../../components/AxiosInstance";
import { toast } from "react-hot-toast";
import salesService from "../../services/salesService";
import { useUser } from "../../Provider/UserProvider";

const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Card" },
  { value: "mobile_banking", label: "Mobile Banking" },
];

export default function CustomerProductSale() {
  const { user } = useUser();
  // ---------- Custom Select Styles ----------
  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      minHeight: "30px",
      height: "30px",
      fontSize: "0.875rem",
      border: "1px solid #000000",
      borderRadius: "0.275rem",
      borderColor: state.isFocused ? "#000000" : "#d1d5db",
      boxShadow: state.isFocused ? "0 0 0 1px #000000" : "none",
      paddingTop: "0px",
      paddingBottom: "0px",
      display: "flex",
      alignItems: "center",
    }),
    valueContainer: (base) => ({
      ...base,
      height: "30px",
      padding: "0 6px",
      display: "flex",
      alignItems: "center",
      flexWrap: "nowrap",
    }),
    placeholder: (base) => ({
      ...base,
      fontSize: "0.875rem",
      color: "#9ca3af",
      margin: "0",
      position: "absolute",
      top: "50%",
      transform: "translateY(-50%)",
    }),
    singleValue: (base) => ({
      ...base,
      fontSize: "0.875rem",
      color: "#000000",
      margin: "0",
      position: "absolute",
      top: "50%",
      transform: "translateY(-50%)",
    }),
    input: (base) => ({
      ...base,
      fontSize: "0.875rem",
      margin: "0",
      padding: "0",
      color: "#000000",
      position: "absolute",
      top: "50%",
      transform: "translateY(-50%)",
    }),
    indicatorsContainer: (base) => ({
      ...base,
      height: "30px",
      display: "flex",
      alignItems: "center",
    }),
    indicatorSeparator: (base) => ({
      ...base,
      backgroundColor: "#d1d5db",
      height: "16px",
      marginTop: "auto",
      marginBottom: "auto",
    }),
    dropdownIndicator: (base) => ({
      ...base,
      color: "#6b7280",
      padding: "4px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      "&:hover": { color: "#000000" },
    }),
    clearIndicator: (base) => ({
      ...base,
      color: "#6b7280",
      padding: "4px",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      "&:hover": { color: "#000000" },
    }),
    option: (base, state) => ({
      ...base,
      fontSize: "0.875rem",
      backgroundColor: state.isSelected
        ? "#000000"
        : state.isFocused
        ? "#f3f4f6"
        : "white",
      color: state.isSelected ? "white" : "#000000",
      "&:hover": {
        backgroundColor: state.isSelected ? "#000000" : "#f3f4f6",
      },
    }),
    menu: (base) => ({ ...base, fontSize: "0.875rem" }),
    menuList: (base) => ({ ...base, fontSize: "0.875rem" }),
  };

  // ---------- Customer State ----------
  const [customers, setCustomers] = useState([]);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerData, setCustomerData] = useState({
    customer_name: "",
    phone1: "",
    address: "",
    previous_due_amount: "",
  });

  // ---------- Product / Stock ----------
  const [productList, setProductList] = useState([]);
  const [saleDate, setSaleDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [addedProducts, setAddedProducts] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [discountAmount, setDiscountAmount] = useState("");
  const [totalPayableAmount, setTotalPayableAmount] = useState(0);

  // Product selection/calculation
  const [basePrice, setBasePrice] = useState("");
  const [price, setPrice] = useState("");
  const [percentage, setPercentage] = useState("");
  const [saleQuantity, setSaleQuantity] = useState("");
  const [totalPrice, setTotalPrice] = useState("0.00");
  const [currentStock, setCurrentStock] = useState(0);
  const [selectedProductName, setSelectedProductName] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // ---------- Payment State ----------
  const [paymentMethod, setPaymentMethod] = useState("cash");
  const [paymentNote, setPaymentNote] = useState("");
  const [editing, setEditing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const query = new URLSearchParams(location.search);
  const editSaleId = query.get("edit");

    // ---------- Fetch customers + products ----------
    useEffect(() => {
    const fetchProductInfo = async () => {
        try {
        const productsData = await salesService.getProducts();
        setProductList(productsData);

        console.log("Fetched products:", productsData);
        } catch (error) {
        console.error("Error fetching Product data:", error);
        toast.error("Failed to load products.");
        }
    };

    fetchProductInfo();
    }, []);

    useEffect(() => {
    const fetchCustomerInfo = async () => {
        try {
        const customersData = await salesService.getCustomers();
        setCustomers(customersData);
        console.log("Fetched customers:", customersData);
        } catch (error) {
        console.error("Error fetching Customer data:", error);
        toast.error("Failed to load customers.");
        }
    };
    fetchCustomerInfo();
    }, []);

 useEffect(() => {
  if (!editSaleId) return;

  const fetchSale = async () => {
    try {
      const res = await AxiosInstance.get(`/sales/${editSaleId}/`);
      const sale = res.data;

      // ---------- Customer ----------
     const customerOption = customers.find(c => c.id === sale.customer.id);
     handleCustomerSelect(
        customerOption
          ? { label: customerOption.customer_name, value: customerOption.id, ...customerOption }
          : null
      );

      // ---------- Products ----------
      setAddedProducts(
        sale.products.map(p => ({
          id: p.product.id,
          productName: p.product.product_name,
          saleQuantity: parseFloat(p.sale_quantity),
          price: parseFloat(p.sale_price),
          totalPrice: parseFloat(p.total_price),
          currentStock: productList.find(product => product.id === p.product.id)?.stock_quantity || 0,
        }))
      );

      // ---------- Totals ----------
      setTotalAmount(parseFloat(sale.total_amount || 0));
      setDiscountAmount(parseFloat(sale.discount_amount || 0));
      setTotalPayableAmount(parseFloat(sale.total_payable_amount || 0));
      setPaymentMethod(sale.payment_method || "cash");
      setPaymentNote(sale.notes || "");

      // ---------- Sale Date ----------
      setSaleDate(sale.sale_date || new Date().toISOString().split("T")[0]);

      // ---------- Edit Mode ----------
      setEditing(true);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch sale for edit");
    }
  };

  fetchSale();
}, [editSaleId, customers]);


  // ---------- Select Options ----------
  const customerOptions = customers.map((c) => ({
    label: c.customer_name,
    value: c.id,
    ...c,
  }));

  const productNameOptions = productList.map((p) => ({
    label: p.name,
    value: p.id,
  }));

  // ---------- Customer handlers ----------
  const handleCustomerChange = (e) => {
    const { name, value } = e.target;
    setCustomerData((prev) => ({
      ...prev,
      [name]: value || "",
    }));
  };

  const handleCustomerSelect = (selectedOption) => {
    setSelectedCustomer(selectedOption);
    if (selectedOption) {
      setCustomerData({
        customer_name: selectedOption.customer_name || "",
        phone1: selectedOption.phone1 || "",
        email: selectedOption.email || "",
        address: selectedOption.address || "",
        previous_due_amount: selectedOption.previous_due_amount || 0,
      });
    } else {
      setCustomerData({
        customer_name: "",
        phone1: "",
        address: "",
        previous_due_amount: "",
      });
    }
  };

  // ---------- Set product data from selected product ----------
  const setProductData = (product) => {
    if (!product) return;

    const stockQty = product.stock_quantity || 0;
    setCurrentStock(stockQty);

    // Base price: prefer sale_price, then purchase_price, then product.price
    const basePrice = parseFloat(product.unit_price)
    const mrpValue = isNaN(basePrice) ? 0 : basePrice;

    setBasePrice(mrpValue.toFixed(2)); // base price before % markup
    setPrice(mrpValue.toFixed(2));   // will be updated after %
    setSaleQuantity("");
    setPercentage("");
    setTotalPrice("0.00");
  };

  // When user selects product by name
  const handleProductNameChange = (val) => {
    if (!val) {
      setSelectedProductName(null);
      setSelectedProduct(null);
      setCurrentStock(0);
      setBasePrice("");
      setPrice("");
      setPercentage("");
      setTotalPrice("0.00");
      setSaleQuantity("");
      return;
    }

    setSelectedProductName(val);

    const prod = productList.find((p) => p.id === val.value);
    if (prod) {
      setSelectedProduct({
        id: prod.id,
        product_code: prod.product_code,
      });
      setProductData(prod);
    }
  };

  // ---------- Recalculate price & totals ----------
  useEffect(() => {
    if (!selectedProduct) return;
    const qty = parseInt(saleQuantity) || 0;

    if (qty > currentStock) {
      if (currentStock > 0) {
        toast.error(
          `Sale quantity cannot exceed current stock (${currentStock})`
        );
        setSaleQuantity(currentStock);
      } else {
        toast.error("No stock available for this product");
        setSaleQuantity(0);
      }
      return;
    }

    const basePriceNum = parseFloat(basePrice) || 0;
    const perc = parseFloat(percentage);
    const manualPrice = parseFloat(price);

    // Determine final price
    let finalPrice = 0;
    if (!isNaN(perc) && perc !== 0) {
      finalPrice = basePriceNum + (basePriceNum * perc) / 100;
      setPrice(finalPrice.toFixed(2));
    } else if (!isNaN(manualPrice) ) {
      finalPrice = manualPrice;
    } 
  
    const tPrice = qty * finalPrice;
    setTotalPrice(tPrice.toFixed(2));

  }, [percentage, saleQuantity, selectedProduct, currentStock, basePrice, price]);

  // ---------- Add product to list ----------
  const addProduct = () => {
    if (!selectedProductName || !selectedProduct) {
      toast.error("Please select a product.");
      return;
    }

    if (!saleQuantity || saleQuantity <= 0) {
      toast.error("Please enter a valid sale quantity.");
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      toast.error("Price is required.");
      return;
    }

    const existingProduct = addedProducts.find(
      (p) => p.id === selectedProduct.id
    );
    if (existingProduct) {
      toast.error("This product is already added. Edit the existing line if needed.");
      return;
    }

    const newProd = {
      id: selectedProduct.id,
      productName: selectedProductName.label,
      currentStock: parseInt(currentStock) || 0,
      saleQuantity: parseInt(saleQuantity),
      basePrice: parseFloat(basePrice) == 0 ? parseFloat(price) : parseFloat(basePrice),   // base price
      price: parseFloat(price) || 0,       // final price after %
      percentage: parseFloat(percentage) || 0,
      totalPrice: parseFloat(totalPrice) || 0,
    };

    setAddedProducts((prev) => [...prev, newProd]);
    toast.success(`${selectedProductName.label} added to invoice.`);

    // Reset fields
    setSelectedProductName(null);
    setSelectedProduct(null);
    setCurrentStock(0);
    setSaleQuantity("");
    setBasePrice("");
    setPrice("");
    setPercentage("");
    setTotalPrice("0.00");
  };

  // ---------- Remove product ----------
  const removeProduct = (idx) => {
    setAddedProducts((prev) => prev.filter((_, i) => i !== idx));
  };

  // ---------- Edit product from added list ----------
  const editProduct = (idx) => {
    const productToEdit = addedProducts[idx];
    if (!productToEdit) return;

    const matchedProduct = productList.find((product) => product.id === productToEdit.id);

    setSelectedProductName({
      label: productToEdit.productName,
      value: productToEdit.id,
    });
    setSelectedProduct({
      id: productToEdit.id,
      product_code: matchedProduct?.product_code,
    });
    setCurrentStock(Number(productToEdit.currentStock) || 0);
    setSaleQuantity(String(productToEdit.saleQuantity ?? ""));
    setBasePrice(String(productToEdit.basePrice ?? ""));
    setPrice(String(productToEdit.price ?? ""));
    setPercentage(String(productToEdit.percentage ?? ""));
    setTotalPrice(String(productToEdit.totalPrice ?? "0.00"));

    setAddedProducts((prev) => prev.filter((_, i) => i !== idx));
  };

  // ---------- Total amount & payable ----------
  useEffect(() => {
    const total = addedProducts.reduce(
      (acc, p) => acc + parseFloat(p.totalPrice || 0),
      0
    );
    setTotalAmount(total);
    const discount = parseFloat(discountAmount) || 0;
    const payable = total - discount;
    setTotalPayableAmount(payable > 0 ? payable : 0);
  }, [addedProducts, discountAmount]);

  // ---------- Submit sale ----------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isSubmitting) return;

    if (!selectedCustomer) {
      toast.error("Please select a customer");
      return;
    }

    if (!user?.id) {
      toast.error("Logged-in user information is missing. Please sign in again.");
      return;
    }

    if (addedProducts.length === 0) {
      toast.error("Please add at least one product");
      return;
    }

    if (Number(discountAmount || 0) > Number(totalAmount || 0)) {
      toast.error("Discount amount cannot exceed total amount.");
      return;
    }

    try {
      setIsSubmitting(true);
      const insufficientProduct = addedProducts.find((product) => {
        const latestProduct = productList.find((item) => item.id === product.id);
        return !latestProduct || Number(product.saleQuantity) > Number(latestProduct.stock_quantity);
      });

      if (insufficientProduct) {
        const latestProduct = productList.find((item) => item.id === insufficientProduct.id);
        toast.error(
          `Insufficient stock for ${insufficientProduct.productName}. Available: ${latestProduct?.stock_quantity ?? 0}.`
        );
        return;
      }

      const payload = {
        customer_name: selectedCustomer.customer_name || customerData.customer_name || "Walk-in Customer",
        contact_number: selectedCustomer.phone1 || customerData.phone1 || "",
        sale_date: saleDate,
        served_by: user.id,
        payment_method: paymentMethod,
        notes: paymentNote,
        items: addedProducts.map((product) => {
          const latestProduct = productList.find((item) => item.id === product.id);
          return {
            product: product.id,
            item_name: product.productName,
            batch: latestProduct?.batch || "",
            unit: latestProduct?.unit || "",
            qty: parseInt(product.saleQuantity, 10),
            unit_price: parseFloat(product.price) || 0,
            discount_percent: parseFloat(product.percentage) || 0,
          };
        }),
      };

      const createdSale = await salesService.createSale(payload);
      toast.success(
        createdSale?.sale_no
          ? `Sale ${createdSale.sale_no} submitted successfully.`
          : "Sale submitted successfully."
      );

      const updatedProducts = await salesService.getProducts();
      setProductList(updatedProducts);
      resetForm();
    } catch (error) {
      console.error("Submission error:", error.response?.data || error);
      if (error.response?.data) {
        const data = error.response.data;
        if (data.items && Array.isArray(data.items)) {
          data.items.forEach((message) => {
            toast.error(message);
          });
        } else {
          for (const [field, errors] of Object.entries(data)) {
            toast.error(
              `${field}: ${
                Array.isArray(errors) ? errors.join(" ") : errors
              }`
            );
          }
        }
      } else {
        toast.error("Failed to submit sale");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ---------- Reset form ----------
  const resetForm = () => {
    setSelectedCustomer(null);
    setCustomerData({
      customer_name: "",
      phone1: "",
      address: "",
      previous_due_amount: "",
    });

    setSelectedProductName(null);
    setSelectedProduct(null);
    setSaleDate(new Date().toISOString().split("T")[0]);
    setAddedProducts([]);
    setTotalAmount(0);
    setTotalPayableAmount(0);
    setPaymentMethod("cash");
    setPaymentNote("");
    setBasePrice("");
    setPrice("");
    setPercentage("");
    setSaleQuantity("");
    setTotalPrice("0.00");
    setCurrentStock(0);
  };

  // ---------- Enter key navigation ----------
  const handleKeyDown = (e) => {
    if (e.key !== "Enter") return;

    const selectMenuOpen = document.querySelector(".react-select__menu");
    if (selectMenuOpen) return;

    e.preventDefault();

    const allFocusable = Array.from(
      document.querySelectorAll(
        `input:not([type="hidden"]),
         select,
         textarea,
         button,
         [tabindex]:not([tabindex="-1"])`
      )
    ).filter(
      (el) =>
        el.offsetParent !== null &&
        !el.disabled &&
        !(el.readOnly === true || el.getAttribute("readonly") !== null)
    );

    const currentIndex = allFocusable.indexOf(e.target);
    if (currentIndex !== -1) {
      for (let i = currentIndex + 1; i < allFocusable.length; i++) {
        const nextEl = allFocusable[i];
        nextEl.focus();
        break;
      }
    }
  };

  const formatCurrency = (value) =>
    `৳ ${Number(value || 0).toLocaleString("en-BD", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const canSubmitSale =
    Boolean(selectedCustomer) &&
    addedProducts.length > 0 &&
    !isSubmitting &&
    Number(discountAmount || 0) <= Number(totalAmount || 0);

  // ---------- RENDER ----------
  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Sales Entry
            </h1>
            <p className="mt-1 text-sm text-slate-500">
              Build a sale from customer selection through payment with a cleaner,
              audit-friendly workflow.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-slate-400">
                Items Added
              </div>
              <div className="mt-1 text-2xl font-semibold text-slate-900">
                {addedProducts.length}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-slate-400">
                Subtotal
              </div>
              <div className="mt-1 text-lg font-semibold text-slate-900">
                {formatCurrency(totalAmount)}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-slate-400">
                Payable
              </div>
              <div className="mt-1 text-lg font-semibold text-slate-900">
                {formatCurrency(totalPayableAmount)}
              </div>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
              <div className="text-xs uppercase tracking-wide text-slate-400">
                Paid
              </div>
              <div className="mt-1 text-lg font-semibold text-slate-900">
                {formatCurrency(totalPayableAmount)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Customer Details
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Select the customer first so previous due and contact details are visible before billing.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Select Customer
                </label>
                <Select
                  options={customerOptions}
                  value={selectedCustomer}
                  onChange={handleCustomerSelect}
                  isClearable
                  placeholder="Choose customer"
                  className="text-sm"
                  styles={customSelectStyles}
                  onKeyDown={handleKeyDown}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Phone
                </label>
                <input
                  type="text"
                  name="phone1"
                  value={customerData.phone1}
                  onChange={handleCustomerChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700"
                  placeholder="Phone"
                  readOnly
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Previous Due
                </label>
                <input
                  type="number"
                  name="previous_due_amount"
                  value={customerData.previous_due_amount}
                  onChange={handleCustomerChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700"
                  placeholder="Previous due"
                  readOnly
                />
              </div>

              <div className="md:col-span-2 xl:col-span-4">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={customerData.address}
                  onChange={handleCustomerChange}
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700"
                  placeholder="Address"
                  readOnly
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-4 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Product Selection
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Add products line by line with stock visibility, markup control, and quick recalculation.
                </p>
              </div>
              <div className="rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                Sale date: {saleDate}
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Sale Date
                </label>
                <input
                  type="date"
                  value={saleDate}
                  onChange={(e) => setSaleDate(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  onKeyDown={handleKeyDown}
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Product Name
                </label>
                <Select
                  options={productNameOptions}
                  value={selectedProductName}
                  onChange={handleProductNameChange}
                  isClearable
                  placeholder="Select product"
                  className="text-sm"
                  styles={customSelectStyles}
                  onKeyDown={handleKeyDown}
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Current Stock
                </label>
                <input
                  type="number"
                  value={currentStock}
                  disabled
                  placeholder="0"
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Sale Quantity
                </label>
                <input
                  type="number"
                  value={saleQuantity}
                  onChange={(e) => setSaleQuantity(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  placeholder="Enter quantity"
                  onKeyDown={handleKeyDown}
                  required
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  MRP
                </label>
                <input
                  type="number"
                  value={basePrice}
                  readOnly
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700"
                  onKeyDown={handleKeyDown}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Percentage
                </label>
                <input
                  type="number"
                  value={percentage}
                  onChange={(e) => setPercentage(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  placeholder="0"
                  onKeyDown={handleKeyDown}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Final Price
                </label>
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  onKeyDown={handleKeyDown}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Line Total
                </label>
                <input
                  type="text"
                  value={totalPrice}
                  readOnly
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700"
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>

            <div className="mt-5 flex justify-end">
              <button
                className="rounded-full bg-sky-800 px-5 py-2.5 text-sm font-medium text-white transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100"
                tabIndex={0}
                onClick={(e) => {
                  e.preventDefault();
                  addProduct();
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addProduct();
                  }
                }}
              >
                Add Product
              </button>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">
                  Added Products
                </h2>
                <p className="mt-1 text-sm text-slate-500">
                  Review line items before submitting the invoice.
                </p>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {addedProducts.length} line{addedProducts.length === 1 ? "" : "s"}
              </span>
            </div>

            {addedProducts.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                        <th className="px-4 py-3 font-medium">Product</th>
                        <th className="px-4 py-3 text-right font-medium">Stock</th>
                        <th className="px-4 py-3 text-right font-medium">Qty</th>
                        <th className="px-4 py-3 text-right font-medium">Price</th>
                        <th className="px-4 py-3 text-right font-medium">%</th>
                        <th className="px-4 py-3 text-right font-medium">Total</th>
                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {addedProducts.map((prod, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 font-medium text-slate-900">
                            {prod.productName}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {prod.currentStock}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {prod.saleQuantity}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {formatCurrency(prod.price)}
                          </td>
                          <td className="px-4 py-3 text-right text-slate-600">
                            {prod.percentage}
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-slate-900">
                            {formatCurrency(prod.totalPrice)}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => editProduct(idx)}
                                className="rounded-full border border-blue-200 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-50"
                                onKeyDown={handleKeyDown}
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => removeProduct(idx)}
                                className="rounded-full border border-red-200 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-50"
                                onKeyDown={handleKeyDown}
                              >
                                Remove
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-10 text-center text-sm text-slate-500">
                No products added yet. Select a product and add it to the invoice.
              </div>
            )}
          </div>
        </section>

        <section className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Invoice Totals
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Review the current invoice value before moving to payments.
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Total Amount
                </label>
                <input
                  type="text"
                  value={
                    isNaN(Number(totalAmount))
                      ? "0.00"
                      : Number(totalAmount).toFixed(2)
                  }
                  readOnly
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700"
                  onKeyDown={handleKeyDown}
                />
              </div>

              <div>
                <label
                  htmlFor="discount"
                  className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600"
                >
                  Discount Amount
                </label>
                <input
                  id="discount"
                  type="number"
                  min={0}
                  value={discountAmount}
                  onChange={(e) => setDiscountAmount(e.target.value)}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  placeholder="0.00"
                  onKeyDown={handleKeyDown}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Total Payable
                </label>
                <input
                  type="text"
                  value={
                    isNaN(Number(totalPayableAmount))
                      ? "0.00"
                      : Number(totalPayableAmount).toFixed(2)
                  }
                  readOnly
                  className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2.5 text-sm font-semibold text-emerald-800"
                  onKeyDown={handleKeyDown}
                />
              </div>
            </div>
          </div>

          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-slate-900">
                Payment Method
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Choose how the sale is paid and keep a short internal note with the invoice.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Payment Mode
                </label>
                <Select
                  options={PAYMENT_METHOD_OPTIONS}
                  value={PAYMENT_METHOD_OPTIONS.find((item) => item.value === paymentMethod) || null}
                  onChange={(selected) => setPaymentMethod(selected?.value || "cash")}
                  placeholder="Select payment mode"
                  className="text-sm"
                  styles={customSelectStyles}
                  onKeyDown={handleKeyDown}
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Internal Note
                </label>
                <textarea
                  value={paymentNote}
                  onChange={(e) => setPaymentNote(e.target.value)}
                  rows={4}
                  className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  placeholder="Optional note for this sale"
                />
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-slate-50 px-4 py-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-slate-400">
                  Payment Summary
                </div>
                <div className="mt-2 space-y-2 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Selected method</span>
                    <span className="font-medium text-slate-900">
                      {PAYMENT_METHOD_OPTIONS.find((item) => item.value === paymentMethod)?.label || "Cash"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Recorded as paid</span>
                    <span className="font-semibold text-emerald-700">
                      {formatCurrency(totalPayableAmount)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="sticky bottom-4 z-10">
        <div className="flex items-center justify-between rounded-3xl border border-slate-200 bg-white/95 px-5 py-4 shadow-lg backdrop-blur">
          <div>
            <div className="text-xs uppercase tracking-wide text-slate-400">
              Final Payable
            </div>
            <div className="mt-1 text-2xl font-semibold text-slate-900">
              {formatCurrency(totalPayableAmount)}
            </div>
            <div className="mt-1 text-sm text-slate-500">
              Payment method: {PAYMENT_METHOD_OPTIONS.find((item) => item.value === paymentMethod)?.label || "Cash"}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!canSubmitSale}
            className="rounded-full bg-sky-800 px-6 py-3 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-100"
          >
            {isSubmitting ? "Submitting..." : editing ? "Update Sale" : "Submit Sale"}
          </button>
        </div>
      </div>
    </div>
  );
}
