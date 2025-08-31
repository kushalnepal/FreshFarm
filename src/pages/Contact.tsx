
import { Layout } from "@/components/layout/Layout";
import { Phone, Mail, MapPin, Clock, Facebook, Instagram } from "lucide-react";

const Contact = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Here you would normally handle the form submission
    console.log("Form submitted");
    alert("Message sent! We'll get back to you soon.");
  };

  return (
    <Layout>
      <section className="bg-farm-cream py-16 md:py-20">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-gray-600 max-w-2xl">
            Have questions about our products or services? Get in touch with us using the information below or fill out the contact form.
          </p>
        </div>
      </section>

      <section className="container-custom py-12 md:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          {/* Contact Information */}
          <div>
            <h2 className="text-2xl font-semibold mb-6">Get In Touch</h2>
            
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="bg-farm-green-dark/10 p-3 rounded-full">
                  <Phone className="text-farm-green-dark" size={24} />
                </div>
                <div>
                  <h3 className="font-medium text-lg">Phone</h3>
                  <p className="text-gray-600 mb-1">Call us directly at:</p>
                  <a href="tel:+9779812345678" className="text-farm-green-dark font-medium hover:underline">
                    +977 98-123-45678
                  </a>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-farm-green-dark/10 p-3 rounded-full">
                  <Mail className="text-farm-green-dark" size={24} />
                </div>
                <div>
                  <h3 className="font-medium text-lg">Email</h3>
                  <p className="text-gray-600 mb-1">Send us an email at:</p>
                  <a href="mailto:contact@farmfresh.com" className="text-farm-green-dark font-medium hover:underline">
                    contact@farmfresh.com
                  </a>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-farm-green-dark/10 p-3 rounded-full">
                  <MapPin className="text-farm-green-dark" size={24} />
                </div>
                <div>
                  <h3 className="font-medium text-lg">Location</h3>
                  <p className="text-gray-600 mb-1">Visit our farm at:</p>
                  <address className="not-italic">
                    123 Farm Road, Kathmandu, Nepal
                  </address>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="bg-farm-green-dark/10 p-3 rounded-full">
                  <Clock className="text-farm-green-dark" size={24} />
                </div>
                <div>
                  <h3 className="font-medium text-lg">Business Hours</h3>
                  <p className="text-gray-600 mb-1">We are open:</p>
                  <ul className="space-y-1">
                    <li>Monday - Friday: 8:00 AM - 6:00 PM</li>
                    <li>Saturday: 9:00 AM - 5:00 PM</li>
                    <li>Sunday: Closed</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="mt-8">
              <h3 className="font-medium text-lg mb-3">Follow Us</h3>
              <div className="flex gap-4">
                <a 
                  href="https://facebook.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-farm-cream hover:bg-farm-green-dark hover:text-white flex items-center justify-center transition-colors"
                >
                  <Facebook size={20} />
                </a>
                <a 
                  href="https://instagram.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="w-12 h-12 rounded-full bg-farm-cream hover:bg-farm-green-dark hover:text-white flex items-center justify-center transition-colors"
                >
                  <Instagram size={20} />
                </a>
              </div>
            </div>
          </div>
          
          {/* Contact Form */}
          <div className="bg-white rounded-lg shadow-md p-6 md:p-8">
            <h2 className="text-2xl font-semibold mb-6">Send Us a Message</h2>
            
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-1">
                    Your Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-farm-green-dark focus:border-farm-green-dark"
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-farm-green-dark focus:border-farm-green-dark"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label htmlFor="subject" className="block text-sm font-medium mb-1">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-farm-green-dark focus:border-farm-green-dark"
                  required
                />
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-1">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows={5}
                  className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-farm-green-dark focus:border-farm-green-dark"
                  required
                ></textarea>
              </div>
              
              <div>
                <button
                  type="submit"
                  className="bg-farm-green-dark hover:bg-farm-green-light text-white font-semibold py-3 px-6 rounded-md transition-colors duration-300 w-full md:w-auto"
                >
                  Send Message
                </button>
              </div>
            </form>
          </div>
        </div>
      </section>
      
      {/* Google Maps (placeholder) */}
      <section className="py-8">
        <div className="container-custom">
          <div className="bg-gray-200 h-80 rounded-lg flex items-center justify-center">
            <p className="text-gray-500">Google Maps Embed would go here</p>
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default Contact;
