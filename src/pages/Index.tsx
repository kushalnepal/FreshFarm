
import Hero from "@/components/home/Hero";
import FeaturedProducts from "@/components/home/FeaturedProducts";
import ContactCTA from "@/components/home/ContactCTA";
import { Layout } from "@/components/layout/Layout";

const Index = () => {
  console.log('Index page rendering');
  
  return (
    <Layout>
      <Hero />
      <div className="bg-farm-beige py-16">
        <div className="container-custom">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Welcome to Farm Fresh</h2>
            <p className="text-lg text-gray-700">
              We are a family-owned organic farm dedicated to growing and delivering
              the freshest, healthiest produce directly to your doorstep. From vegetables
              to free-range chicken and quality grass feed, we provide everything you
              need for a healthy and sustainable lifestyle.
            </p>
          </div>
        </div>
      </div>
      <FeaturedProducts />
      <ContactCTA />
    </Layout>
  );
};

export default Index;
