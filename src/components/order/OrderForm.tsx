import { useCart } from "@/context/CartContext";
import { Phone } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

const OrderForm = () => {
  const { getCartTotal, clearCart, items } = useCart();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    orderDetails: "",
    preferredContact: "phone",
    paymentMethod: "cash", // options: cash, esewa, phonepay
  });

  const [showQrModal, setShowQrModal] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrSummary, setQrSummary] = useState<string | null>(null);
  const [qrItemsShort, setQrItemsShort] = useState<string | null>(null);
  const [currentOrderId, setCurrentOrderId] = useState<string | null>(null);

  useEffect(() => {
    // Listen for order updates (fired when admin updates orders in another tab)
    const onStorage = (e: StorageEvent) => {
      if (e.key !== "farmfresh_orders" || !currentOrderId) return;
      try {
        if (!e.newValue) return;
        const parsed = JSON.parse(e.newValue);
        if (!Array.isArray(parsed)) return;
        const myOrder = parsed.find((o: any) => o.id === currentOrderId);
        if (!myOrder) return;

        // Notify user when admin marks order as arrival
        if (myOrder.status === "arrival") {
          toast.success("Your order has been approved — arrival started!");
          // cleanup listener for this order
          setCurrentOrderId(null);
        }
      } catch (err) {
        console.warn(
          "Failed to parse farmfresh_orders storage event in OrderForm:",
          err
        );
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [currentOrderId]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Basic validation
    if (!formData.name || !formData.phone || !formData.orderDetails) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Calculate order total from cart
    const totalAmount = getCartTotal();

    // Create order object
    const isOnlinePayment =
      formData.paymentMethod && formData.paymentMethod !== "cash";
    const order = {
      id: Date.now().toString(),
      ...formData,
      paymentMethod: formData.paymentMethod,
      amount: totalAmount,
      // include item details so admin can view order contents
      items: (items || []).map((it: any) => ({
        id: it.id,
        name: it.name,
        price: it.price,
        quantity: it.quantity,
      })),
      // if customer chooses an online payment option, mark it so admin handles the payment request
      status: isOnlinePayment ? "payment_requested" : "pending",
      createdAt: new Date().toISOString(),
    };

    // Save to localStorage for admin panel
    const existingOrders = localStorage.getItem("farmfresh_orders");
    const orders = existingOrders ? JSON.parse(existingOrders) : [];
    orders.push(order);
    localStorage.setItem("farmfresh_orders", JSON.stringify(orders));

    console.log("Order submitted:", order);

    // Helper to generate QR: return the QR image URL from qrserver (no fetch, avoids CORS/tainting)
    const makeQrUrl = (payload: string, size = 600) =>
      `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(
        payload
      )}`;

    // Show QR if online payment selected
    if (order.status === "payment_requested") {
      // Build payload including item details and total (will be URL-encoded for QR)
      const itemsSummary = (items || [])
        .map((it) => `${it.name}x${it.quantity}@${it.price}`)
        .join(";");
      const payload = `${order.paymentMethod.toUpperCase()}|amount:${
        order.amount
      }|items:${itemsSummary}|details:${order.orderDetails}|order:${order.id}`;

      // Use direct QR image URL (no client-side fetch or image composition)
      setQrUrl(makeQrUrl(payload, 600));
      // Store a short human-friendly summary to show under the QR
      const itemsShort = (items || [])
        .map((it) => `${it.name} x${it.quantity}`)
        .join(", ");
      setQrItemsShort(itemsShort || null);
      setQrSummary(`Order ${order.id} · NPR ${order.amount}`);

      setShowQrModal(true);
      setCurrentOrderId(order.id);

      toast.success(
        "Payment requested. Scan the QR to pay. After payment click 'I've paid' so admin can verify."
      );
    } else {
      toast.success("Your order has been submitted! We'll contact you soon.");
      // For cash orders clear cart immediately
      clearCart();
    }

    // Clear form only (keep cart until payment confirmation)
    setFormData({
      name: "",
      email: "",
      phone: "",
      address: "",
      orderDetails: "",
      preferredContact: "phone",
      paymentMethod: "cash",
    });
  };

  const handlePaymentConfirmedByCustomer = () => {
    // Mark the order as customer_paid (admin still needs to approve)
    try {
      const existing = localStorage.getItem("farmfresh_orders");
      const arr = existing ? JSON.parse(existing) : [];
      const idx = arr.findIndex((o: any) => o.id === currentOrderId);
      if (idx !== -1) {
        arr[idx].status = "payment_confirmed";
        localStorage.setItem("farmfresh_orders", JSON.stringify(arr));
        toast.success(
          "Payment marked as paid. Admin will verify and approve soon."
        );
        // close modal and clear cart
        setShowQrModal(false);
        setQrUrl(null);
        clearCart();
      } else {
        toast.error("Order not found to mark as paid");
      }
    } catch (err) {
      console.error("Failed to update order payment state:", err);
      toast.error("Failed to mark payment as paid");
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
      <h3 className="text-2xl font-semibold mb-6">Place Your Order</h3>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium">
              Full Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-farm-green-dark focus:border-farm-green-dark"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="email" className="block text-sm font-medium">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-farm-green-dark focus:border-farm-green-dark"
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="phone" className="block text-sm font-medium">
              Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-farm-green-dark focus:border-farm-green-dark"
              required
            />
          </div>

          <div className="space-y-2">
            <label htmlFor="address" className="block text-sm font-medium">
              Delivery Address
            </label>
            <input
              type="text"
              id="address"
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-farm-green-dark focus:border-farm-green-dark"
            />
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <label htmlFor="orderDetails" className="block text-sm font-medium">
            Order Details <span className="text-red-500">*</span>
          </label>
          <textarea
            id="orderDetails"
            name="orderDetails"
            value={formData.orderDetails}
            onChange={handleChange}
            rows={5}
            placeholder="Please provide details of the products you want to order, including quantities and any special requests."
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-farm-green-dark focus:border-farm-green-dark"
            required
          ></textarea>
        </div>

        <div className="mt-6 space-y-2">
          <label className="block text-sm font-medium">
            Preferred Contact Method
          </label>
          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="preferredContact"
                value="phone"
                checked={formData.preferredContact === "phone"}
                onChange={handleChange}
                className="form-radio h-5 w-5 text-farm-green-dark"
              />
              <span className="ml-2 flex items-center">
                <Phone size={18} className="mr-1" /> Phone Call
              </span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="preferredContact"
                value="whatsapp"
                checked={formData.preferredContact === "whatsapp"}
                onChange={handleChange}
                className="form-radio h-5 w-5 text-farm-green-dark"
              />
              <span className="ml-2 flex items-center">
                <span>WhatsApp</span>
              </span>
            </label>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          <label className="block text-sm font-medium">Payment Method</label>
          <div className="flex flex-wrap gap-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="paymentMethod"
                value="cash"
                checked={formData.paymentMethod === "cash"}
                onChange={handleChange}
                className="form-radio h-5 w-5 text-farm-green-dark"
              />
              <span className="ml-2">Cash on Delivery</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="paymentMethod"
                value="esewa"
                checked={formData.paymentMethod === "esewa"}
                onChange={handleChange}
                className="form-radio h-5 w-5 text-farm-green-dark"
              />
              <span className="ml-2">eSewa</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="paymentMethod"
                value="phonepay"
                checked={formData.paymentMethod === "phonepay"}
                onChange={handleChange}
                className="form-radio h-5 w-5 text-farm-green-dark"
              />
              <span className="ml-2">PhonePay</span>
            </label>
          </div>
        </div>

        <div className="mt-8">
          <button
            type="submit"
            className="bg-farm-green-dark hover:bg-farm-green-light text-white font-semibold py-3 px-6 rounded-md transition-colors duration-300 w-full md:w-auto"
          >
            Submit Order
          </button>
        </div>
      </form>

      {/* Simple QR Modal for online payments */}
      {showQrModal && qrUrl && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-md p-6 w-11/12 max-w-md">
            <h4 className="text-lg font-semibold mb-4">Scan to pay</h4>
            <div className="flex flex-col items-center gap-4">
              <img
                src={qrUrl}
                alt="Payment QR"
                className="w-64 h-64 object-contain"
              />
              <div className="text-center">
                {qrSummary && (
                  <div className="text-sm text-gray-800 font-medium">
                    {qrSummary}
                  </div>
                )}
                {qrItemsShort && (
                  <div className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                    {qrItemsShort}
                  </div>
                )}
              </div>
            </div>

            <div className="mt-6 flex gap-4 justify-end">
              <button
                onClick={() => {
                  setShowQrModal(false);
                  setQrUrl(null);
                  setQrSummary(null);
                  setQrItemsShort(null);
                }}
                className="px-4 py-2 border rounded-md"
              >
                Close
              </button>
              <button
                onClick={handlePaymentConfirmedByCustomer}
                className="px-4 py-2 bg-farm-green-dark text-white rounded-md"
              >
                I've paid
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderForm;
