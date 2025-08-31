import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useCart } from "@/context/CartContext";
import { useState } from "react";
import { toast } from "sonner";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  total: number;
}

const PaymentModal = ({ isOpen, onClose, total }: PaymentModalProps) => {
  const [paymentMethod, setPaymentMethod] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const { clearCart, items } = useCart();
  const [showQrModal, setShowQrModal] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [qrPayload, setQrPayload] = useState<string | null>(null);

  const handleESewaPayment = () => {
    setLoading(true);
    // Generate QR payload instead of redirecting to UAT domain (which may be unreachable).
    const itemsSummary = (items || [])
      .map((it: any) => `${it.name}x${it.quantity}@${it.price}`)
      .join(";");
    const payload = `ESEWA|amount:${total}|items:${itemsSummary}|time:${Date.now()}`;
    const qr = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
      payload
    )}`;
    setQrPayload(payload);
    setQrUrl(qr);
    setShowQrModal(true);
    setLoading(false);
    console.log("eSewa QR generated", { payload, qr });
    toast.success("QR generated — scan to pay");
  };

  const handlePayment = async () => {
    if (!paymentMethod) {
      toast.error("Please select a payment method");
      return;
    }

    if (paymentMethod === "eSewa") {
      handleESewaPayment();
      return;
    }

    if (paymentMethod === "FonePay") {
      // Generate QR for FonePay instead of external redirect
      setLoading(true);
      const itemsSummary = (items || [])
        .map((it: any) => `${it.name}x${it.quantity}@${it.price}`)
        .join(";");
      const payload = `FONEPAY|amount:${total}|items:${itemsSummary}|time:${Date.now()}`;
      const qr = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(
        payload
      )}`;
      setQrPayload(payload);
      setQrUrl(qr);
      setShowQrModal(true);
      setLoading(false);
      console.log("FonePay QR generated", { payload, qr });
      toast.success("QR generated — scan to pay");
      return;
    }

    setLoading(true);

    try {
      // Simulate payment processing for other methods
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success(`Payment of NPR ${total} successful via ${paymentMethod}!`);
      clearCart();
      onClose();
    } catch (error) {
      toast.error("Payment failed. Please try again.");
      console.error("Payment error:", error);
    } finally {
      setLoading(false);
    }
  };

  // show toast when user selects a method
  const onSelectMethod = (method: string) => {
    setPaymentMethod(method);
    toast.success(`Selected payment method: ${method}`);
  };

  // simple QR modal inside this component
  const QrModal = () =>
    showQrModal && qrUrl ? (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-md p-6 w-11/12 max-w-md">
          <h4 className="text-lg font-semibold mb-4">Scan to pay</h4>
          <div className="flex flex-col items-center gap-4">
            <img
              src={qrUrl}
              alt="Payment QR"
              className="w-64 h-64 object-contain"
            />
            <div className="text-sm text-gray-600">Amount: NPR {total}</div>
            {qrPayload && (
              <div className="text-xs text-gray-500 break-all">{qrPayload}</div>
            )}
          </div>
          <div className="mt-6 flex gap-4 justify-end">
            <button
              onClick={() => {
                setShowQrModal(false);
                setQrUrl(null);
                setQrPayload(null);
              }}
              className="px-4 py-2 border rounded-md"
            >
              Close
            </button>
            <button
              onClick={() => {
                toast.success("Marked as paid locally — ask admin to verify");
                clearCart();
                onClose();
                setShowQrModal(false);
              }}
              className="px-4 py-2 bg-farm-green-dark text-white rounded-md"
            >
              I've paid
            </button>
          </div>
        </div>
      </div>
    ) : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Choose Payment Method</DialogTitle>
        </DialogHeader>

        <div className="py-4 space-y-4">
          <div className="text-center mb-4">
            <span className="text-lg font-semibold">
              Total Amount: NPR {total}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div
              className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                paymentMethod === "eSewa"
                  ? "border-farm-green-dark bg-farm-cream"
                  : "border-gray-200"
              }`}
              onClick={() => onSelectMethod("eSewa")}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 flex items-center justify-center">
                  <img
                    src="/lovable-uploads/09072c16-f556-4a2d-b0da-4e05e8720c80.png"
                    alt="eSewa"
                    className="max-w-full max-h-full"
                  />
                </div>
                <span className="font-medium">eSewa</span>
              </div>
            </div>

            <div
              className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                paymentMethod === "FonePay"
                  ? "border-farm-green-dark bg-farm-cream"
                  : "border-gray-200"
              }`}
              onClick={() => onSelectMethod("FonePay")}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 flex items-center justify-center">
                  <img
                    src="/lovable-uploads/45815cb9-3684-42be-87f4-29fa35851e94.png"
                    alt="Fone Pay"
                    className="max-w-full max-h-full"
                  />
                </div>
                <span className="font-medium">Fone Pay</span>
              </div>
            </div>

            <div
              className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition-colors ${
                paymentMethod === "Cash"
                  ? "border-farm-green-dark bg-farm-cream"
                  : "border-gray-200"
              }`}
              onClick={() => onSelectMethod("Cash")}
              style={{ gridColumn: "1 / -1" }}
            >
              <div className="flex flex-col items-center gap-2">
                <div className="w-16 h-16 flex items-center justify-center">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="40"
                    height="40"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="2" y="6" width="20" height="12" rx="2" />
                    <circle cx="12" cy="12" r="2" />
                    <path d="M6 12h.01M18 12h.01" />
                  </svg>
                </div>
                <span className="font-medium">Cash on Delivery</span>
              </div>
            </div>
          </div>

          {/* Payment Instructions */}
          {paymentMethod === "eSewa" && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">
                eSewa Payment Gateway
              </h4>
              <div className="text-sm text-green-700 space-y-2">
                <p>
                  <strong>Amount:</strong> NPR {total}
                </p>
                <p className="text-xs bg-green-100 p-2 rounded">
                  <strong>Test Mode:</strong> Use test credentials
                  <br />
                  eSewa ID: 9806800001, Password: Nepal@123
                </p>
                <p>
                  Click "Pay with eSewa" to redirect to eSewa payment gateway
                  where you can complete your payment securely.
                </p>
              </div>
            </div>
          )}

          {paymentMethod === "FonePay" && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">
                Fone Pay Payment Instructions
              </h4>
              <div className="text-sm text-blue-700 space-y-1">
                <p>
                  <strong>Amount:</strong> NPR {total}
                </p>
                <p className="mt-2">
                  Complete your payment through Fone Pay and click "Pay Now" to
                  confirm your order.
                </p>
              </div>
            </div>
          )}

          {paymentMethod === "Cash" && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <h4 className="font-semibold text-amber-800 mb-2">
                Cash on Delivery
              </h4>
              <div className="text-sm text-amber-700">
                <p>
                  <strong>Amount:</strong> NPR {total}
                </p>
                <p className="mt-2">
                  Pay NPR {total} in cash when your order is delivered to your
                  doorstep.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button
            onClick={handlePayment}
            disabled={loading || !paymentMethod}
            className="bg-farm-green-dark hover:bg-farm-green-light"
          >
            {loading
              ? "Processing..."
              : paymentMethod === "eSewa"
              ? "Pay with eSewa"
              : "Pay Now"}
          </Button>
        </DialogFooter>
      </DialogContent>
      <QrModal />
      {/* Debug / QR preview when generated (helps if modal didn't appear) */}
      {qrUrl && (
        <div className="mt-4 p-3 border rounded bg-gray-50">
          <div className="font-medium mb-2">
            QR Debug (visible for troubleshooting)
          </div>
          <div className="flex items-center gap-4">
            <img
              src={qrUrl}
              alt="QR debug"
              className="w-24 h-24 object-contain border"
            />
            <div className="text-xs break-all">{qrPayload}</div>
          </div>
        </div>
      )}
    </Dialog>
  );
};

export default PaymentModal;
