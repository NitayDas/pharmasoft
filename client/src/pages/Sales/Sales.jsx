import { useState, useEffect } from "react";
import Select from "react-select";
import AxiosInstance from "../../components/AxiosInstance";
import { toast } from "react-hot-toast";
import salesService from "../../services/salesService";
import { useUser } from "../../Provider/UserProvider";

const PAYMENT_METHOD_OPTIONS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Bank" },
  { value: "mobile_banking", label: "Mobile Banking" },
];

const MOBILE_BANKING_OPTIONS = [
  { value: "bkash", label: "bKash" },
  { value: "nagad", label: "Nagad" },
  { value: "rocket", label: "Rocket" },
  { value: "upay", label: "Upay" },
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
  const [selectedMobileBanking, setSelectedMobileBanking] = useState(null);
  const [mobileBankingNumber, setMobileBankingNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [bankAccountNumber, setBankAccountNumber] = useState("");
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
        const customerOption = customers.find((c) => c.id === sale.customer.id);
        handleCustomerSelect(
          customerOption
            ? { label: customerOption.customer_name, value: customerOption.id, ...customerOption }
            : null
        );

        // ---------- Products ----------
        setAddedProducts(
          sale.products.map((p) => ({
            id: p.product.id,
            productName: p.product.product_name,
            saleQuantity: parseFloat(p.sale_quantity),
            price: parseFloat(p.sale_price),
            totalPrice: parseFloat(p.total_price),
            currentStock: productList.find((product) => product.id === p.product.id)?.stock_quantity || 0,
          }))
        );

        // ---------- Totals ----------
        setTotalAmount(parseFloat(sale.total_amount || 0));
        setDiscountAmount(parseFloat(sale.discount_amount || 0));
        setTotalPayableAmount(parseFloat(sale.total_payable_amount || 0));
        setPaymentMethod(sale.payment_method || "cash");
        setPaymentNote(sale.notes || "");

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

    const basePriceValue = parseFloat(product.unit_price);
    const mrpValue = isNaN(basePriceValue) ? 0 : basePriceValue;

    setBasePrice(mrpValue.toFixed(2));
    setPrice(mrpValue.toFixed(2));
    setSaleQuantity("");
    setPercentage("");
    setTotalPrice("0.00");
  };

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
        toast.error(`Sale quantity cannot exceed current stock (${currentStock})`);
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

    let finalPrice = 0;
    if (!isNaN(perc) && perc !== 0) {
      finalPrice = basePriceNum + (basePriceNum * perc) / 100;
      setPrice(finalPrice.toFixed(2));
    } else if (!isNaN(manualPrice)) {
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

    const existingProduct = addedProducts.find((p) => p.id === selectedProduct.id);
    if (existingProduct) {
      toast.error("This product is already added. Edit the existing line if needed.");
      return;
    }

    const newProd = {
      id: selectedProduct.id,
      productName: selectedProductName.label,
      currentStock: parseInt(currentStock) || 0,
      saleQuantity: parseInt(saleQuantity),
      basePrice: parseFloat(basePrice) == 0 ? parseFloat(price) : parseFloat(basePrice),
      price: parseFloat(price) || 0,
      percentage: parseFloat(percentage) || 0,
      totalPrice: parseFloat(totalPrice) || 0,
    };

    setAddedProducts((prev) => [...prev, newProd]);
    toast.success(`${selectedProductName.label} added to invoice.`);

    setSelectedProductName(null);
    setSelectedProduct(null);
    setCurrentStock(0);
    setSaleQuantity("");
    setBasePrice("");
    setPrice("");
    setPercentage("");
    setTotalPrice("0.00");
  };

  const removeProduct = (idx) => {
    setAddedProducts((prev) => prev.filter((_, i) => i !== idx));
  };

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
    const total = addedProducts.reduce((acc, p) => acc + parseFloat(p.totalPrice || 0), 0);
    setTotalAmount(total);
    const discount = parseFloat(discountAmount) || 0;
    const payable = total - discount;
    setTotalPayableAmount(payable > 0 ? payable : 0);
  }, [addedProducts, discountAmount]);

  useEffect(() => {
    if (paymentMethod !== "mobile_banking") {
      setSelectedMobileBanking(null);
      setMobileBankingNumber("");
    }

    if (paymentMethod !== "card") {
      setBankName("");
      setBankAccountNumber("");
    }
  }, [paymentMethod]);

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

    if (paymentMethod === "mobile_banking") {
      if (!selectedMobileBanking) {
        toast.error("Please select a mobile banking provider.");
        return;
      }
      if (!mobileBankingNumber.trim()) {
        toast.error("Please enter the mobile banking payment number.");
        return;
      }
    }

    if (paymentMethod === "card") {
      if (!bankName.trim()) {
        toast.error("Please enter the bank name.");
        return;
      }
      if (!bankAccountNumber.trim()) {
        toast.error("Please enter the bank account number.");
        return;
      }
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

      const paymentDetailLines = [];

      if (paymentMethod === "mobile_banking") {
        paymentDetailLines.push(
          `Mobile banking: ${selectedMobileBanking?.label || "N/A"}`,
          `Mobile number: ${mobileBankingNumber.trim()}`
        );
      }

      if (paymentMethod === "card") {
        paymentDetailLines.push(
          `Bank name: ${bankName.trim()}`,
          `Account number: ${bankAccountNumber.trim()}`
        );
      }

      const composedNote = [paymentNote.trim(), ...paymentDetailLines].filter(Boolean).join("\n");

      const payload = {
        customer_name: selectedCustomer.customer_name || customerData.customer_name || "Walk-in Customer",
        contact_number: selectedCustomer.phone1 || customerData.phone1 || "",
        served_by: user.id,
        payment_method: paymentMethod,
        notes: composedNote,
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
            toast.error(`${field}: ${Array.isArray(errors) ? errors.join(" ") : errors}`);
          }
        }
      } else {
        toast.error("Failed to submit sale");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

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
    setAddedProducts([]);
    setTotalAmount(0);
    setTotalPayableAmount(0);
    setPaymentMethod("cash");
    setSelectedMobileBanking(null);
    setMobileBankingNumber("");
    setBankName("");
    setBankAccountNumber("");
    setPaymentNote("");
    setBasePrice("");
    setPrice("");
    setPercentage("");
    setSaleQuantity("");
    setTotalPrice("0.00");
    setCurrentStock(0);
  };

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
    (paymentMethod !== "mobile_banking" || (selectedMobileBanking && mobileBankingNumber.trim())) &&
    (paymentMethod !== "card" || (bankName.trim() && bankAccountNumber.trim())) &&
    !isSubmitting &&
    Number(discountAmount || 0) <= Number(totalAmount || 0);

  const saleReference = editing && editSaleId ? `Editing sale #${editSaleId}` : "Auto on submit";
  const vatPreviewAmount = Number((Number(totalAmount || 0) * 0.03).toFixed(2));
  const estimatedGrandTotal = Math.max(
    0,
    Number((Number(totalAmount || 0) - Number(discountAmount || 0) + vatPreviewAmount).toFixed(2))
  );

  return (
    <div className="mx-auto w-full max-w-[1600px] p-3 md:p-4">
      <div className="grid gap-3 xl:grid-cols-[1.6fr_0.9fr]">
        <section className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
          <div className="pb-3">
            <div className="mb-1.5">
              <h2 className="text-lg font-semibold text-slate-900">Customer</h2>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
              <div className="md:col-span-4">
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

              <div className="md:col-span-3">
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

              <div className="md:col-span-2">
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

              <div className="md:col-span-3">
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

          <div className="border-t border-slate-200 py-3">
            <div className="mb-1.5">
              <h2 className="text-lg font-semibold text-slate-900">Sale Product Entry</h2>
            </div>

            <div className="grid grid-cols-1 gap-2 md:grid-cols-12">
              <div className="md:col-span-5">
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

              <div className="md:col-span-2">
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

              <div className="md:col-span-2">
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

              <div className="md:col-span-1">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Unit
                </label>
                <input
                  type="text"
                  value={productList.find((item) => item.id === selectedProduct?.id)?.unit || ""}
                  readOnly
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-700"
                />
              </div>

              <div className="md:col-span-2">
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

              <div className="md:col-span-2">
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

              <div className="md:col-span-2 md:pl-1">
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

              <div className="md:col-span-2">
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

            <div className="mt-2 flex justify-end">
              <button
                className="rounded-full bg-sky-800 px-4 py-2 text-sm font-medium text-white transition hover:bg-sky-700 focus:outline-none focus:ring-4 focus:ring-sky-100"
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

          <div className="border-t border-slate-200 pt-3">
            <div className="mb-2 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Added Products</h2>
              </div>
              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600">
                {addedProducts.length} line{addedProducts.length === 1 ? "" : "s"}
              </span>
            </div>

            {addedProducts.length > 0 ? (
              <div className="overflow-hidden rounded-2xl border border-slate-200">
                <div className="max-h-64 overflow-auto">
                  <table className="min-w-full divide-y divide-slate-200 text-sm">
                    <thead className="bg-slate-50">
                      <tr className="text-left text-xs uppercase tracking-wide text-slate-500">
                        <th className="px-4 py-3 font-medium">Product</th>
                        <th className="px-4 py-3 text-right font-medium">Stock</th>
                        <th className="px-4 py-3 text-right font-medium">Qty</th>
                        <th className="px-4 py-3 text-right font-medium">Sale Price</th>
                        <th className="px-4 py-3 text-right font-medium">%</th>
                        <th className="px-4 py-3 text-right font-medium">Total Price</th>
                        <th className="px-4 py-3 text-right font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {addedProducts.map((prod, idx) => (
                        <tr key={idx}>
                          <td className="px-4 py-3 font-medium text-slate-900">{prod.productName}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{prod.currentStock}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{prod.saleQuantity}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{formatCurrency(prod.price)}</td>
                          <td className="px-4 py-3 text-right text-slate-600">{prod.percentage}</td>
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
              <div className="rounded-2xl border border-dashed border-slate-200 px-4 py-8 text-center text-sm text-slate-500">
                No products added yet. Select a product and add it to the invoice.
              </div>
            )}
          </div>
        </section>

        <section className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-1.5">
              <h2 className="text-lg font-semibold text-slate-900">Invoice Summary</h2>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Invoice
                </label>
                <input
                  type="text"
                  value={saleReference}
                  readOnly
                  className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-2 xl:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Total Amount
                  </label>
                  <input
                    type="text"
                    value={isNaN(Number(totalAmount)) ? "0.00" : Number(totalAmount).toFixed(2)}
                    readOnly
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-medium text-slate-700"
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
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    placeholder="0.00"
                    onKeyDown={handleKeyDown}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                    VAT Preview
                  </label>
                  <input
                    type="text"
                    value={isNaN(Number(vatPreviewAmount)) ? "0.00" : Number(vatPreviewAmount).toFixed(2)}
                    readOnly
                    className="w-full rounded-2xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-800"
                    onKeyDown={handleKeyDown}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Estimated Grand Total
                  </label>
                  <input
                    type="text"
                    value={isNaN(Number(estimatedGrandTotal)) ? "0.00" : Number(estimatedGrandTotal).toFixed(2)}
                    readOnly
                    className="w-full rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-800"
                    onKeyDown={handleKeyDown}
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2">
                <div className="grid grid-cols-2 gap-3 text-sm xl:grid-cols-4">
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-400">Items</div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">{addedProducts.length}</div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-400">Subtotal</div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">
                      {formatCurrency(totalAmount)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-400">Discount</div>
                    <div className="mt-1 text-lg font-semibold text-slate-900">
                      {formatCurrency(discountAmount || 0)}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs uppercase tracking-wide text-slate-400">Recorded As Paid</div>
                    <div className="mt-1 text-lg font-semibold text-emerald-700">
                      {formatCurrency(estimatedGrandTotal)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm">
            <div className="mb-1.5">
              <h2 className="text-lg font-semibold text-slate-900">Payment</h2>
            </div>

            <div className="grid grid-cols-1 gap-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                  Payment Method
                </label>
                <Select
                  options={PAYMENT_METHOD_OPTIONS}
                  value={PAYMENT_METHOD_OPTIONS.find((item) => item.value === paymentMethod) || null}
                  onChange={(selected) => setPaymentMethod(selected?.value || "cash")}
                  placeholder="Select payment method"
                  className="text-sm"
                  styles={customSelectStyles}
                  onKeyDown={handleKeyDown}
                />
              </div>

              {paymentMethod === "mobile_banking" && (
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Mobile Banking
                    </label>
                    <Select
                      options={MOBILE_BANKING_OPTIONS}
                      value={selectedMobileBanking}
                      onChange={(selected) => setSelectedMobileBanking(selected)}
                      placeholder="Select mobile banking"
                      className="text-sm"
                      styles={customSelectStyles}
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Payment Mobile Number
                    </label>
                    <input
                      type="text"
                      value={mobileBankingNumber}
                      onChange={(e) => setMobileBankingNumber(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                </div>
              )}

              {paymentMethod === "card" && (
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      placeholder="Enter bank name"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                      Account Number
                    </label>
                    <input
                      type="text"
                      value={bankAccountNumber}
                      onChange={(e) => setBankAccountNumber(e.target.value)}
                      placeholder="Enter account number"
                      className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                      onKeyDown={handleKeyDown}
                    />
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 gap-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Internal Note
                  </label>
                  <textarea
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    rows={2}
                    className="w-full rounded-2xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                    placeholder="Optional note for this sale"
                  />
                </div>
              </div>

              <div className="mt-1 rounded-2xl bg-slate-50 px-3 py-2">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">Payment Summary</div>
                  <div className="mt-1.5 space-y-1.5 text-sm text-slate-600">
                    <div className="flex items-center justify-between">
                      <span>Selected method</span>
                      <span className="font-medium text-slate-900">
                        {PAYMENT_METHOD_OPTIONS.find((item) => item.value === paymentMethod)?.label || "Cash"}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Estimated invoice total</span>
                      <span className="font-semibold text-emerald-700">
                        {formatCurrency(estimatedGrandTotal)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-1.5 flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-3 py-2.5">
                <div>
                  <div className="text-xs uppercase tracking-wide text-slate-400">Final Payable</div>
                  <div className="mt-0.5 text-xl font-semibold text-slate-900">
                    {formatCurrency(estimatedGrandTotal)}
                  </div>
                  <div className="text-sm text-slate-500">
                    Payment method: {PAYMENT_METHOD_OPTIONS.find((item) => item.value === paymentMethod)?.label || "Cash"}
                  </div>
                </div>

                <button
                  onClick={handleSubmit}
                  disabled={!canSubmitSale}
                  className="rounded-full bg-sky-800 px-4 py-2 text-sm font-semibold text-white transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:text-slate-100"
                >
                  {isSubmitting ? "Submitting..." : editing ? "Update Sale" : "Submit Sale"}
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
