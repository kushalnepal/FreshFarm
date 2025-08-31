
import { Link } from "react-router-dom";
import { Facebook, Instagram, Mail, Phone, MapPin } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-farm-green-dark text-white">
      <div className="container-custom py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Company Info */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center">
                <div className="w-8 h-8 rounded-full bg-farm-green-dark flex items-center justify-center text-white font-bold text-lg">F</div>
              </div>
              <div className="font-poppins font-bold text-xl">
                <span className="text-white">Farm</span>
                <span className="text-farm-cream">Fresh</span>
              </div>
            </div>
            <p className="mb-6 text-farm-cream/90">
              Your trusted source for fresh, organic farm products delivered right to your doorstep.
            </p>
            <div className="flex gap-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <Facebook size={20} />
              </a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <Instagram size={20} />
              </a>
              <a href="mailto:contact@farmfresh.com" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                <Mail size={20} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Quick Links</h3>
            <ul className="space-y-3">
              <li>
                <Link to="/" className="hover:text-farm-cream transition-colors">Home</Link>
              </li>
              <li>
                <Link to="/products" className="hover:text-farm-cream transition-colors">Products</Link>
              </li>
              <li>
                <Link to="/order-now" className="hover:text-farm-cream transition-colors">Order Now</Link>
              </li>
              <li>
                <Link to="/gallery" className="hover:text-farm-cream transition-colors">Gallery</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-farm-cream transition-colors">Contact</Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-xl font-semibold mb-4">Contact Us</h3>
            <ul className="space-y-4">
              <li className="flex items-start gap-3">
                <Phone size={20} className="mt-1 flex-shrink-0" />
                <div>
                  <p>Call to Order:</p>
                  <a href="tel:+9779812345678" className="hover:text-farm-cream transition-colors font-medium">+977 98-123-45678</a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Mail size={20} className="mt-1 flex-shrink-0" />
                <div>
                  <p>Email Us:</p>
                  <a href="mailto:contact@farmfresh.com" className="hover:text-farm-cream transition-colors font-medium">contact@farmfresh.com</a>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <MapPin size={20} className="mt-1 flex-shrink-0" />
                <div>
                  <p>Farm Location:</p>
                  <address className="not-italic">123 Farm Road, Kathmandu, Nepal</address>
                </div>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/20 mt-8 pt-6 text-center md:text-left md:flex md:justify-between md:items-center">
          <p>&copy; {currentYear} Farm Fresh. All rights reserved.</p>
          <div className="mt-4 md:mt-0">
            <a href="#" className="hover:text-farm-cream transition-colors mr-6">Privacy Policy</a>
            <a href="#" className="hover:text-farm-cream transition-colors">Terms of Service</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
