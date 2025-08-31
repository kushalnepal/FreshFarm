import { Layout } from "@/components/layout/Layout";
import { api, ApiError, type Product } from "@/lib/api";
import { useEffect, useState } from "react";
import { toast } from "sonner";

const Gallery = () => {
  const [activeFilter, setActiveFilter] = useState("All");
  const [selectedImage, setSelectedImage] = useState<null | {
    src: string;
    alt: string;
  }>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  // Load products from backend
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const fetched = await api.getProducts();
        setProducts(fetched || []);
      } catch (err) {
        console.error("Failed to load products for gallery:", err);
        if (err instanceof ApiError)
          toast.error(`Failed to load gallery: ${err.message}`);
        else toast.error("Failed to load gallery");
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Build unique categories from product.tags (comma-separated supported)
  const categories = Array.from(
    new Set(
      products.flatMap((p) =>
        (p.tags || "")
          .split(",")
          .map((t) => t.trim())
          .filter(Boolean)
      )
    )
  );

  // Filter products based on active category
  const filteredProducts =
    activeFilter === "All"
      ? products
      : products.filter((p) =>
          (p.tags || "")
            .split(",")
            .map((t) => t.trim())
            .includes(activeFilter)
        );

  // Compute image src for product (backend returns raw base64 string in product.image)
  const getImageSrc = (p: Product) => {
    if (!p.image) return null;
    return p.image.startsWith("data:")
      ? p.image
      : `data:image/jpeg;base64,${p.image}`;
  };

  // Open image modal
  const openModal = (src: string, alt: string) =>
    setSelectedImage({ src, alt });
  const closeModal = () => setSelectedImage(null);

  return (
    <Layout>
      <section className="bg-farm-cream py-16 md:py-20">
        <div className="container-custom">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Gallery</h1>
          <p className="text-gray-600 max-w-2xl">
            Visual gallery of products available in the store. Click an image to
            preview.
          </p>
        </div>
      </section>

      <section className="container-custom py-12">
        {/* Filter Buttons */}
        <div className="flex flex-wrap gap-3 mb-8">
          <button
            onClick={() => setActiveFilter("All")}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeFilter === "All"
                ? "bg-farm-green-dark text-white"
                : "bg-farm-cream text-gray-700 hover:bg-gray-200"
            }`}
          >
            All Products
          </button>

          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setActiveFilter(category)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                activeFilter === category
                  ? "bg-farm-green-dark text-white"
                  : "bg-farm-cream text-gray-700 hover:bg-gray-200"
              }`}
            >
              {category}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="text-center py-12 text-gray-600">
            Loading products...
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-gray-600">
            No products to show
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-6">
            {filteredProducts.map((product) => {
              const src = getImageSrc(product);
              return (
                <div
                  key={product.id}
                  className="overflow-hidden rounded-lg shadow-md cursor-pointer transition-transform hover:scale-[1.02]"
                  onClick={() => src && openModal(src, product.name)}
                >
                  {src ? (
                    <img
                      src={src}
                      alt={product.name}
                      className="w-full h-72 object-cover"
                    />
                  ) : (
                    <div className="w-full h-72 bg-gray-100 flex items-center justify-center">
                      <span className="text-gray-500">No image</span>
                    </div>
                  )}
                  <div className="p-3 bg-white">
                    <div className="font-medium">{product.name}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      NPR {product.price}
                    </div>
                    <div className="text-xs text-gray-400 mt-2 truncate">
                      {product.tags}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/40 rounded-full flex items-center justify-center z-10 text-white"
              onClick={closeModal}
            >
              &times;
            </button>
            <img
              src={selectedImage.src}
              alt={selectedImage.alt}
              className="w-full h-full object-contain"
            />
          </div>
        </div>
      )}
    </Layout>
  );
};

export default Gallery;
