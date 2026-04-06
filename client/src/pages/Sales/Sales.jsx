import { useState, useEffect } from "react";
import Select from "react-select";
import AxiosInstance from "../../components/AxiosInstance";
import { toast } from "react-hot-toast";
import salesService from "../../Services/salesService";

export default function CustomerProductSale() {
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
  const [paymentModes, setPaymentModes] = useState([]);
  const [banks, setBanks] = useState([]);
  const [paymentData, setPaymentData] = useState({
    paymentMode: "", // id of payment mode
    bankName: "",
    accountNo: "",
    chequeNo: "",
    paidAmount: "",
  });
  const [payments, setPayments] = useState([]);
  const [totalPaidAmount, setTotalPaidAmount] = useState(0);
  const [editing, setEditing] = useState(false);
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


  // ---------- Fetch payment modes & banks ----------
  useEffect(() => {
    const fetchPaymentData = async () => {
      try {
        const [pmRes, bankRes] = await Promise.all([
          AxiosInstance.get("payment-mode/"),
          AxiosInstance.get("banks/"),
        ]);
        setPaymentModes(
          pmRes.data.map((pm) => ({
            value: pm.id,
            label: pm.name,
          }))
        );
        setBanks(
          bankRes.data.map((bank) => ({
            value: bank.id,
            label: bank.name,
          }))
        );
      } catch (err) {
        console.error(err);
        toast.error("Failed to load payment data");
      }
    };
    fetchPaymentData();
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

      // ---------- Payments ----------
      setPayments(
        sale.payments.map(p => ({
          paymentMode: p.payment_mode?.id || "",
          bankName: p.bank?.id || "",
          paidAmount: parseFloat(p.paid_amount || 0),
          remarks: p.remarks || "",
        }))
      );

      // ---------- Totals ----------
      setTotalAmount(parseFloat(sale.total_amount || 0));
      setServiceCharge(parseFloat(sale.service_charge || 0));
      setDiscountAmount(parseFloat(sale.discount_amount || 0));
      setTotalPayableAmount(parseFloat(sale.total_payable_amount || 0));
      setTotalPaidAmount(
        sale.payments.reduce((acc, p) => acc + parseFloat(p.paid_amount || 0), 0)
      );

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
      alert("Please select a product");
      return;
    }

    if (!saleQuantity || saleQuantity <= 0) {
      alert("Please enter a valid sale quantity");
      return;
    }

    if (!price || parseFloat(price) <= 0) {
      alert("Price is required");
      return;
    }

    const existingProduct = addedProducts.find(
      (p) => p.id === selectedProduct.id
    );
    if (existingProduct) {
      alert("This product is already added to the list");
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

  // ---------- Payment handlers ----------
  const handlePaymentChange = (name, value) => {
    setPaymentData((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddPayment = () => {
    if (!paymentData.paymentMode || !paymentData.paidAmount) {
      toast.error("Payment Mode and Paid Amount are required");
      return;
    }

    setPayments((prev) => [...prev, paymentData]);
    setPaymentData({
      paymentMode: "",
      bankName: "",
      accountNo: "",
      chequeNo: "",
      paidAmount: "",
      remarks: "",
    });
  };

  const handleRemovePayment = (index) => {
    setPayments((prev) => prev.filter((_, i) => i !== index));
  };

  // Total paid amount
  useEffect(() => {
    const total = payments.reduce(
      (sum, payment) => sum + parseFloat(payment.paidAmount || 0),
      0
    );
    setTotalPaidAmount(total);
  }, [payments]);

  const selectedPaymentModeObj = paymentModes.find(
    (pm) => pm.value === paymentData.paymentMode
  );
  const selectedPaymentModeLabel = selectedPaymentModeObj?.label;

  const isCheque = selectedPaymentModeLabel === "Cheque";
  const isBank = selectedPaymentModeLabel === "Bank";

  // ---------- Submit sale ----------
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCustomer) {
      toast.error("Please select a customer");
      return;
    }

    if (addedProducts.length === 0) {
      toast.error("Please add at least one product");
      return;
    }

    try {
      const payload = {
        customer_id: selectedCustomer.value,
        sale_date: saleDate,
        total_amount: parseFloat(totalAmount) || 0,
        discount_amount: parseFloat(discountAmount) || 0,
        total_payable_amount: parseFloat(totalPayableAmount) || 0,

        products: addedProducts.map((product) => ({
          product_id: product.id,
          product_code: product.productCode,
          sale_quantity: parseInt(product.saleQuantity),
          // base price before %
          price: parseFloat(product.basePrice) || 0,
          percentage: parseFloat(product.percentage) || 0,
          // final price after %
          price_with_percentage: parseFloat(product.price) || 0,
          total_price: parseFloat(product.totalPrice) || 0,
        })),

        payments: payments.map((payment) => {
          return {
            payment_mode: payment.paymentMode,
            bank: payment.bankName || null,
            account_no: payment.accountNo || null,
            cheque_no: payment.chequeNo || null,
            paid_amount: parseFloat(payment.paidAmount) || 0,
            remarks: payment.remarks || null,
          };
        }),
      };

      if (editSaleId) {
        console.log("Updating sale with payload:", payload);
        await AxiosInstance.put(`sales/${editSaleId}/`, payload);
        alert("Sale updated successfully!");
      } else {
        await AxiosInstance.post("sales/", payload);
        alert("Sale created successfully!");
      }
      resetForm();
    } catch (error) {
      console.error("Submission error:", error.response?.data || error);
      if (error.response?.data) {
        const data = error.response.data;
        if (data.products) {
          data.products.forEach((err, index) => {
            if (err.product) {
              alert(`Product ${index + 1}: ${err.product.join(" ")}`);
            }
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
        alert("Failed to submit sale");
      }
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
    setPayments([]);
    setTotalPaidAmount(0);
    setPaymentData({
      paymentMode: "",
      bankName: "",
      accountNo: "",
      chequeNo: "",
      paidAmount: "",
      remarks: "",
    });
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

  // ---------- RENDER ----------
  return (
    <div className="max-w-7xl mx-auto p-4 bg-white rounded shadow">
      {/* Customer Section */}
      <section>
        <h2 className="font-semibold text-lg my-2">Customer Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-2">
          <div>
            <label className="block mb-1 font-medium text-sm">
              Select Customer
            </label>
            <Select
              options={customerOptions}
              value={selectedCustomer}
              onChange={handleCustomerSelect}
              isClearable
              placeholder="Select..."
              className="text-sm"
              styles={customSelectStyles}
              onKeyDown={handleKeyDown}
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-sm">Phone 1</label>
            <input
              type="text"
              name="phone1"
              value={customerData.phone1}
              onChange={handleCustomerChange}
              className="w-full border border-gray-400 rounded px-2 py-1 text-sm placeholder-gray-400"
              placeholder="Phone..."
              readOnly
            />
          </div>

          <div>
            <label className="block mb-1 font-medium text-sm">Address</label>
            <input
              type="text"
              name="address"
              value={customerData.address}
              onChange={handleCustomerChange}
              className="w-full border border-gray-400 rounded px-2 py-1 text-sm placeholder-gray-400"
              placeholder="Address..."
              readOnly
            />
          </div>

            <div>
            <label className="block mb-1 font-medium text-sm">Previous Due Amount</label>
            <input
              type="number"
              name="previous_due_amount"
              value={customerData.previous_due_amount}
              onChange={handleCustomerChange}
              className="w-full border border-gray-400 rounded px-2 py-1 text-sm placeholder-gray-400"
              placeholder="Previous Due Amount..."
              readOnly
            />
          </div>

        </div>
      </section>

      {/* Product Sale Section */}
      <section>
        <h2 className="font-semibold text-lg my-2">Product Sale</h2>

        <section>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-2 mb-2">
            {/* Sale Date */}
            <div>
              <label className="block text-sm mb-1 font-medium">
                Sale Date
              </label>
              <input
                type="date"
                value={saleDate}
                onChange={(e) => setSaleDate(e.target.value)}
                className="w-full text-sm border border-gray-400 px-2 py-1 rounded"
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* Product Name */}
            <div>
              <label className="block mb-1 font-medium text-sm">
                Product Name *
              </label>
              <Select
                options={productNameOptions}
                value={selectedProductName}
                onChange={handleProductNameChange}
                isClearable
                placeholder="Select product name"
                className="text-sm"
                styles={customSelectStyles}
                onKeyDown={handleKeyDown}
                required
              />
            </div>

            {/* Current Stock */}
            <div>
              <label className="block mb-1 font-medium text-sm">
                Current Stock Quantity
              </label>
              <input
                type="number"
                value={currentStock}
                disabled
                placeholder="Current stock will appear here"
                className="w-full border border-gray-400 rounded px-2 py-1 text-sm placeholder-gray-400 bg-gray-100"
              />
            </div>

            {/* Sale Quantity */}
            <div>
              <label className="block mb-1 font-medium text-sm">
                Sale Quantity *
              </label>
              <input
                type="number"
                value={saleQuantity}
                onChange={(e) => setSaleQuantity(e.target.value)}
                className="w-full border border-gray-400 rounded px-2 py-1 text-sm placeholder-gray-400"
                placeholder="Enter sale quantity"
                onKeyDown={handleKeyDown}
                required
              />
            </div>

            {/* MRP */}
            <div>
              <label className="block mb-1 font-medium text-sm">MRP</label>
              <input
                type="number"
                value={basePrice}
                readOnly
                className="w-full border border-gray-400 rounded px-2 py-1 text-sm bg-gray-100"
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* Percentage */}
            <div>
              <label className="block mb-1 font-medium text-sm">
                Percentage
              </label>
              <input
                type="number"
                value={percentage}
                onChange={(e) => setPercentage(e.target.value)}
                className="w-full border border-gray-400 rounded px-2 py-1 text-sm placeholder-gray-400"
                placeholder="Enter percentage"
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* Price */}
            <div>
              <label className="block mb-1 font-medium text-sm">Price *</label>
              <input
                type="number"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full border border-gray-400 rounded px-2 py-1 text-sm bg-gray-100"
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* Total Price */}
            <div>
              <label className="block mb-1 font-medium text-sm">
                Total Price
              </label>
              <input
                type="text"
                value={totalPrice}
                readOnly
                className="w-full border border-gray-400 rounded px-2 py-1 text-sm bg-gray-100"
                onKeyDown={handleKeyDown}
              />
            </div>

            {/* Add Button */}
            <div className="flex items-end">
              <button
                className="px-4 py-2 text-sm text-white rounded bg-sky-800 hover:bg-sky-700 focus:bg-green-700 focus:ring-2 focus:ring-green-400 focus:outline-none"
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
        </section>

        {/* Product Table */}
        {addedProducts.length > 0 && (
          <div className="overflow-x-auto my-2">
            <table className="min-w-full border border-gray-300">
              <thead className="bg-sky-800 text-md text-white">
                <tr>
                  <th className="border px-2 py-1">Product Name</th>
                  <th className="border px-2 py-1">Current Stock</th>
                  <th className="border px-2 py-1">Sale Qty</th>
                  <th className="border px-2 py-1">Sale Price</th>
                  <th className="border px-2 py-1">Percentage</th>
                  <th className="border px-2 py-1">Total Price</th>
                  <th className="border px-2 py-1">Remove</th>
                </tr>
              </thead>
              <tbody>
                {addedProducts.map((prod, idx) => (
                  <tr key={idx}>
                    <td className="border text-center px-2 py-1">
                      {prod.productName}
                    </td>
                    <td className="border text-center px-2 py-1">
                      {prod.currentStock}
                    </td>
                    <td className="border text-center px-2 py-1">
                      {prod.saleQuantity}
                    </td>
                    <td className="border text-center px-2 py-1">
                      {prod.price}
                    </td>
                    <td className="border text-center px-2 py-1">
                      {prod.percentage}
                    </td>
                    <td className="border text-center px-2 py-1">
                      {prod.totalPrice}
                    </td>
                    <td className="border px-2 py-1 text-center">
                      <button
                        onClick={() => removeProduct(idx)}
                        className="px-2 py-1 text-white bg-red-600 hover:bg-red-700 rounded text-xs"
                        onKeyDown={handleKeyDown}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Totals Section */}
        <div className="mt-4 max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>
              <label className="block mb-1 font-medium text-sm">
                Total Amount:
              </label>
              <input
                type="text"
                value={
                  isNaN(Number(totalAmount))
                    ? "0.00"
                    : Number(totalAmount).toFixed(2)
                }
                readOnly
                className="w-full border border-gray-400 rounded px-2 py-1 text-sm placeholder-gray-400"
                onKeyDown={handleKeyDown}
              />
            </div>

            <div>
              <label
                htmlFor="discount"
                className="block block mb-1 font-medium text-sm"
              >
                Discount Amount:
              </label>
              <input
                id="discount"
                type="number"
                min={0}
                value={discountAmount}
                onChange={(e) => setDiscountAmount(e.target.value)}
                className="w-full border border-gray-400 rounded px-2 py-1 text-sm placeholder-gray-400"
                placeholder="0.00"
                onKeyDown={handleKeyDown}
              />
            </div>

            <div >
              <label className="block mb-1 font-medium text-sm">
                Total Payable Amount:
              </label>
              <input
                type="text"
                value={
                  isNaN(Number(totalPayableAmount))
                    ? "0.00"
                    : Number(totalPayableAmount).toFixed(2)
                }
                readOnly
                className="w-full border border-gray-400 rounded px-2 py-1 text-sm placeholder-gray-400"
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Payment Section */}
      <div className="mt-4">
        <h3 className="font-semibold text-lg my-2">Payment</h3>
        <div className="grid grid-cols-1 md:grid-cols-6 gap-2">
          {/* Payment Mode */}
          <div>
            <label className="block text-sm mb-1 font-medium">
              Payment Mode*
            </label>
            <Select
              options={paymentModes}
              value={
                paymentModes.find(
                  (pm) => pm.value === paymentData.paymentMode
                ) || null
              }
              onChange={(selected) =>
                handlePaymentChange(
                  "paymentMode",
                  selected ? selected.value : ""
                )
              }
              placeholder="Select"
              className="text-sm"
              styles={customSelectStyles}
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Bank Name */}
          <div>
            <label className="block text-sm mb-1 font-medium">Bank Name</label>
            <Select
              options={banks}
              value={
                banks.find((opt) => opt.value === paymentData.bankName) || null
              }
              onChange={(selected) =>
                handlePaymentChange("bankName", selected ? selected.value : "")
              }
              placeholder="Select"
              isClearable
              isDisabled={!isBank}
              className="text-sm"
              styles={customSelectStyles}
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Account No */}
          <div>
            <label className="block text-sm mb-1 font-medium">Account No</label>
            <input
              type="text"
              value={paymentData.accountNo}
              onChange={(e) =>
                handlePaymentChange("accountNo", e.target.value)
              }
              disabled={!isBank}
              className={`w-full border border-gray-400 text-sm px-2 py-1 rounded ${
                !isBank ? "bg-gray-100 text-gray-500" : ""
              }`}
              placeholder="Account No"
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Cheque No */}
          <div>
            <label className="block text-sm mb-1 font-medium">Cheque No</label>
            <input
              type="text"
              value={paymentData.chequeNo}
              onChange={(e) =>
                handlePaymentChange("chequeNo", e.target.value)
              }
              disabled={!isCheque}
              className={`w-full border border-gray-400 px-2 py-1 rounded ${
                !isCheque ? "bg-gray-100 text-sm text-gray-400" : ""
              }`}
              placeholder="Cheque No"
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Paid Amount */}
          <div>
            <label className="block text-sm mb-1 font-medium">
              Paid Amount*
            </label>
            <input
              type="number"
              value={paymentData.paidAmount}
              onChange={(e) =>
                handlePaymentChange("paidAmount", e.target.value)
              }
              className="w-full border border-gray-400 rounded px-2 py-1 text-sm placeholder-gray-400"
              placeholder="0.00"
              onKeyDown={handleKeyDown}
            />
          </div>

          {/* Add Payment */}
          <div className="flex items-end">
            <button
              className="px-4 py-2 text-sm text-white rounded bg-sky-800 hover:bg-sky-700 focus:bg-green-700 focus:ring-2 focus:ring-green-400 focus:outline-none"
              tabIndex={0}
              onClick={(e) => {
                e.preventDefault();
                handleAddPayment();
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  handleAddPayment();
                }
              }}
            >
              Add
            </button>
          </div>
        </div>
      </div>

      {/* Payments Table */}
      {payments.length > 0 && (
        <div className="mt-2 overflow-x-auto">
          <table className="min-w-full border text-center text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-1">#</th>
                <th className="border px-2 py-1">Payment Mode</th>
                <th className="border px-2 py-1">Bank Name</th>
                <th className="border px-2 py-1">Account No</th>
                <th className="border px-2 py-1">Cheque No</th>
                <th className="border px-2 py-1">Paid Amount</th>
                <th className="border px-2 py-1">Action</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((pay, idx) => {
                const modeLabel =
                  paymentModes.find((mode) => mode.value === pay.paymentMode)
                    ?.label || "N/A";
                const bankLabel =
                  banks.find((bank) => bank.value === pay.bankName)?.label ||
                  "N/A";

                return (
                  <tr key={idx}>
                    <td className="border px-2 py-1">{idx + 1}</td>
                    <td className="border px-2 py-1">{modeLabel}</td>
                    <td className="border px-2 py-1">{bankLabel}</td>
                    <td className="border px-2 py-1">{pay.accountNo}</td>
                    <td className="border px-2 py-1">{pay.chequeNo}</td>
                    <td className="border px-2 py-1">
                      {parseFloat(pay.paidAmount || 0).toFixed(2)}
                    </td>
                    <td className="border px-2 py-1">
                      <button
                        type="button"
                        onClick={() => handleRemovePayment(idx)}
                        className="px-2 py-1 text-white bg-red-600 hover:bg-red-700 rounded text-xs"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Total Paid */}
      <div className="flex items-center gap-2 mt-4">
        <label className="block text-sm mb-1 font-medium">
          Total Paid Amount:
        </label>
        <input
          type="number"
          value={
            isNaN(Number(totalPaidAmount))
              ? "0.00"
              : Number(totalPaidAmount).toFixed(2)
          }
          readOnly
          className="border rounded px-2 py-1 text-sm placeholder-gray-400"
        />
      </div>

      {/* Submit */}
      <div className="flex justify-center mt-4">
        <button
          onClick={handleSubmit}
          className="px-6 py-2 text-sm bg-sky-800 text-white rounded hover:bg-sky-700"
        >
          { editing ? "Update" : "Submit"}
        </button>
      </div>
    </div>
  );
}
