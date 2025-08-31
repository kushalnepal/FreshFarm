
import { Link } from "react-router-dom";
import { Phone, MessageCircle } from "lucide-react";

const ContactCTA = () => {
  return (
    <section className="relative bg-farm-green-dark text-white py-16 md:py-24 overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute right-0 bottom-0 w-64 h-64 bg-white/20 rounded-full -mr-32 -mb-32"></div>
        <div className="absolute left-0 top-0 w-96 h-96 bg-white/10 rounded-full -ml-48 -mt-48"></div>
      </div>
      
      <div className="container-custom relative">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Need Fresh Farm Products?</h2>
          <p className="text-lg md:text-xl mb-8 text-white/90">
            Contact us for bulk orders, special requests, or more information about our organic farm products.
            We're here to help you get the freshest produce straight from our farm to your table.
          </p>
          
          <div className="flex flex-col md:flex-row gap-4 justify-center">
            <a href="tel:+9779812345678" className="bg-white text-farm-green-dark hover:bg-farm-cream transition-colors duration-300 py-3 px-6 rounded-md font-semibold flex items-center justify-center gap-2">
              <Phone size={20} />
              <span>Call Us Now</span>
            </a>
            <Link to="/contact" className="bg-transparent border-2 border-white hover:bg-white/10 transition-colors duration-300 py-3 px-6 rounded-md font-semibold flex items-center justify-center gap-2">
              <MessageCircle size={20} />
              <span>Send a Message</span>
            </Link>
          </div>
          
          <p className="mt-8 text-white/80">
            Open for orders: Monday - Saturday, 8:00 AM - 6:00 PM
          </p>
        </div>
      </div>
    </section>
  );
};

export default ContactCTA;
