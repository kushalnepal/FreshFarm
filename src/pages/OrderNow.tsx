
import { Layout } from "@/components/layout/Layout";
import OrderForm from "@/components/order/OrderForm";

const OrderNow = () => {
  return (
    <Layout>
      <section className="bg-farm-cream py-16 md:py-20">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Order Now</h1>
          <p className="text-gray-600 max-w-2xl mb-8">
            Fill out the form below to place your order directly from our farm. We'll contact you to confirm your order and arrange delivery.
          </p>
        </div>
      </section>

      <section className="container-custom py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
          <div className="md:col-span-7">
            <OrderForm />
          </div>
          
          <div className="md:col-span-5">
            <div className="bg-white rounded-lg shadow-md p-6 md:p-8 h-full">
              <h3 className="text-2xl font-semibold mb-6">Order Information</h3>
              
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-medium mb-2">How It Works</h4>
                  <ol className="list-decimal pl-5 space-y-2 text-gray-700">
                    <li>Fill out the order form with your details and requirements</li>
                    <li>We'll contact you to confirm availability and prices</li>
                    <li>Confirm your order and payment method</li>
                    <li>Receive fresh farm products delivered to your doorstep</li>
                  </ol>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium mb-2">Delivery Information</h4>
                  <p className="text-gray-700">
                    We deliver within Kathmandu Valley and surrounding areas. Delivery charges may apply based on location and order size.
                  </p>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium mb-2">Payment Options</h4>
                  <p className="text-gray-700">
                    We accept cash on delivery, mobile payment, and bank transfers.
                  </p>
                </div>
                
                <div className="pt-4 mt-6 border-t">
                  <h4 className="text-lg font-medium mb-3">Need Quick Assistance?</h4>
                  <a 
                    href="https://wa.me/9779812345678" 
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-md transition-colors duration-300 flex items-center justify-center gap-2 w-full"
                  >
                    {/* Removed WhatsApp icon reference */}
                    <span>Order via WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default OrderNow;
