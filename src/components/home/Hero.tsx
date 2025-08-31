import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

const Hero = () => {
  return (
    <section className="relative bg-farm-cream overflow-hidden">
      <div className="absolute inset-0 bg-farm-cream opacity-40"></div>

      <div className="container-custom relative min-h-[80vh] flex flex-col justify-center py-16 md:py-24 lg:min-h-[70vh]">
        <div className="max-w-2xl">
          <span className="inline-block bg-farm-green-light/20 text-farm-green-dark rounded-full px-4 py-1.5 font-medium text-sm mb-4">
            100% Organic Products
          </span>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 leading-tight">
            Fresh Farm Products <br />
            <span className="text-farm-green-dark">Delivered to Your Door</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-700 mb-8 max-w-xl">
            Experience the taste of fresh vegetables, free-range chicken, and
            quality farm products sourced directly from our organic farm.
          </p>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/products" className="btn-primary">
              Browse Products
              <ArrowRight size={18} />
            </Link>

            <Link to="/order-now" className="btn-outline">
              Place an Order
            </Link>
          </div>
        </div>
      </div>

      {/* Decorative element */}
      <div className="absolute bottom-0 left-0 w-full h-20 bg-gradient-to-b from-transparent to-white/90"></div>
    </section>
  );
};

export default Hero;
