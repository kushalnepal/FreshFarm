import { Layout } from "@/components/layout/Layout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { api, ApiError, type Product, type User } from "@/lib/api";
import {
  Clock,
  Image,
  Loader2,
  LogOut,
  Package,
  Plus,
  ShoppingBag,
  Upload,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

interface Order {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  orderDetails: string;
  preferredContact: string;
  status: string;
  createdAt: string;
}

const Admin = () => {
  const [activeTab, setActiveTab] = useState<
    "orders" | "products" | "sales" | "algorithms" | "users"
  >("products");
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [loading, setLoading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const navigate = useNavigate();

  // New product form data
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    description: "",
    tags: "all",
    image: null as File | null,
  });

  // Edit product state
  const [showEditProduct, setShowEditProduct] = useState(false);
  const [editProduct, setEditProduct] = useState({
    id: "",
    name: "",
    price: "",
    description: "",
    tags: "all",
    image: null as File | null,
  });
  const [editImagePreview, setEditImagePreview] = useState<string | null>(null);

  // show/hide completed orders history
  const [showHistory, setShowHistory] = useState(false);
  // Active orders: exclude approved (arrival) and completed statuses
  const activeOrders = orders.filter(
    (o) => o.status !== "arrival" && o.status !== "completed"
  );
  const historyOrders = orders.filter((o) => o.status === "completed");
  // Only show real users (exclude ADMIN or other roles) in user management
  const filteredUsers = users.filter((u: any) => {
    const r = (u.role || "").toString();
    return ["USER", "User", "user"].includes(r);
  });

  // Check admin authentication based on user role
  useEffect(() => {
    const userData = localStorage.getItem("userData");
    if (userData) {
      const user = JSON.parse(userData);
      if (user.role !== "ADMIN") {
        toast.error("Access denied. Admin privileges required.");
        navigate("/");
        return;
      }
    } else {
      toast.error("Please login as admin to access this page.");
      navigate("/admin-login");
      return;
    }
  }, [navigate]);

  // Load data from backend on component mount
  useEffect(() => {
    loadProducts();
    loadUsers();
  }, []);

  // Load orders created by customers (stored in localStorage)
  const loadOrdersFromStorage = () => {
    try {
      const stored = localStorage.getItem("farmfresh_orders");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setOrders(parsed);
          return;
        }
      }
      setOrders([]);
    } catch (err) {
      console.warn("Failed to parse stored orders:", err);
    }
  };

  useEffect(() => {
    // initial load
    loadOrdersFromStorage();

    // listen for storage events so admin UI updates when orders are created from other tabs/devices
    const onStorage = (e: StorageEvent) => {
      if (e.key === "farmfresh_orders") {
        try {
          if (!e.newValue) {
            setOrders([]);
            return;
          }
          const parsed = JSON.parse(e.newValue);
          if (Array.isArray(parsed)) setOrders(parsed);
        } catch (err) {
          console.warn("Failed to parse farmfresh_orders storage event:", err);
        }
      }
    };

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const loadProducts = async (skip = 0) => {
    try {
      setLoading(true);
      const fetchedProducts = await api.getProducts(skip);

      // Ensure we always have an array
      if (Array.isArray(fetchedProducts)) {
        setProducts(fetchedProducts);
      } else {
        console.warn("API returned non-array response:", fetchedProducts);
        setProducts([]);
        toast.error("Invalid products data received from server");
      }
    } catch (error) {
      console.error("Failed to load products:", error);
      setProducts([]); // Reset to empty array on error
      if (error instanceof ApiError) {
        toast.error(`Failed to load products: ${error.message}`);
      } else {
        toast.error("Failed to load products");
      }
    } finally {
      setLoading(false);
    }
  };

  const loadUsers = async () => {
    try {
      const fetchedUsers = await api.getUsers();
      setUsers(fetchedUsers);
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(`Failed to load users: ${error.message}`);
      } else {
        toast.error("Failed to load users");
      }
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("userData");
    toast.success("Logged out successfully");
    navigate("/auth");
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewProduct({ ...newProduct, image: file });
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditProduct({ ...editProduct, image: file });
      const reader = new FileReader();
      reader.onload = (ev) => setEditImagePreview(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  const openEditProduct = (product: Product) => {
    setEditProduct({
      id: String(product.id),
      name: product.name,
      price: String(product.price),
      description: product.description,
      tags: (product as any).tags || "all",
      image: null,
    });
    setEditImagePreview(
      product.image
        ? product.image.startsWith("data:")
          ? product.image
          : `data:image/jpeg;base64,${product.image}`
        : null
    );
    setShowEditProduct(true);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newProduct.name || !newProduct.price || !newProduct.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const productData = {
        name: newProduct.name,
        price: parseFloat(newProduct.price),
        description: newProduct.description,
        tags: newProduct.tags,
        image: newProduct.image || undefined,
      };

      await api.createProduct(productData);

      // Reset form
      setNewProduct({
        name: "",
        price: "",
        description: "",
        tags: "all",
        image: null,
      });
      setImagePreview(null);
      setShowAddProduct(false);

      // Reload products
      await loadProducts();
      toast.success("Product added successfully!");
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(`Failed to add product: ${error.message}`);
      } else {
        toast.error("Failed to add product");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editProduct.name || !editProduct.price || !editProduct.description) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      setLoading(true);
      // Prepare payload (only fields supported by updateAdminProduct)
      const payload: any = {
        name: editProduct.name,
        price: parseFloat(editProduct.price),
        description: editProduct.description,
        tags: editProduct.tags,
      };

      await api.updateAdminProduct(editProduct.id, payload);
      await loadProducts();
      setShowEditProduct(false);
      setEditImagePreview(null);
      toast.success("Product updated successfully!");
    } catch (err) {
      console.error("Failed to update product:", err);
      if (err instanceof ApiError) {
        toast.error(`Failed to update product: ${err.message}`);
      } else {
        toast.error("Failed to update product");
      }
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (productId: string) => {
    try {
      await api.deleteProduct(productId);
      await loadProducts();
      toast.success("Product deleted successfully!");
    } catch (error) {
      if (error instanceof ApiError) {
        toast.error(`Failed to delete product: ${error.message}`);
      } else {
        toast.error("Failed to delete product");
      }
    }
  };

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    // Normalize status values the UI and customers expect
    const normalized = newStatus === "processing" ? "arrival" : newStatus;
    const updatedOrders = orders.map((order) =>
      order.id === orderId ? { ...order, status: normalized } : order
    );
    setOrders(updatedOrders);
    try {
      localStorage.setItem("farmfresh_orders", JSON.stringify(updatedOrders));
      toast.success("Order status updated!");
    } catch (err) {
      console.error("Failed to persist orders:", err);
      toast.error("Failed to persist order status");
    }
  };

  return (
    <Layout>
      <div className="container-custom py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Admin Panel</h1>
            <p className="text-gray-600">Manage orders, products, and sales</p>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="flex items-center gap-2"
          >
            <LogOut size={18} />
            Logout
          </Button>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 flex-wrap">
          <Button
            variant={activeTab === "orders" ? "default" : "outline"}
            onClick={() => setActiveTab("orders")}
            className="flex items-center gap-2"
          >
            <ShoppingBag size={18} />
            Orders ({activeOrders.length})
          </Button>
          <Button
            variant={activeTab === "products" ? "default" : "outline"}
            onClick={() => setActiveTab("products")}
            className="flex items-center gap-2"
          >
            <Package size={18} />
            Products ({products.length})
          </Button>
          <Button
            variant={activeTab === "users" ? "default" : "outline"}
            onClick={() => setActiveTab("users")}
            className="flex items-center gap-2"
          >
            <Users size={18} />
            Users ({filteredUsers.length})
          </Button>
          <Button
            variant={activeTab === "algorithms" ? "default" : "outline"}
            onClick={() => setActiveTab("algorithms")}
            className="flex items-center gap-2"
          >
            🧠 Algorithms
          </Button>
        </div>

        {/* Orders Tab */}
        {activeTab === "orders" && (
          <Card>
            <CardHeader className="flex items-start justify-between gap-4">
              <div>
                <CardTitle>Customer Orders</CardTitle>
                <CardDescription>
                  Manage and track customer orders
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={loadOrdersFromStorage}
                >
                  Refresh
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setShowHistory((s) => !s)}
                  className="flex items-center gap-2"
                >
                  <Clock size={16} />
                  History ({historyOrders.length})
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activeOrders.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  No active orders
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Customer</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Order Details</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activeOrders.map((order) => (
                      <TableRow key={order.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{order.name}</div>
                            <div className="text-sm text-gray-500">
                              {order.email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="text-sm">{order.phone}</div>
                            <div className="text-xs text-gray-500">
                              {order.preferredContact}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="max-w-xs">
                            <div className="text-sm">{order.orderDetails}</div>
                            {order.address && (
                              <div className="text-xs text-gray-500 mt-1">
                                📍 {order.address}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              order.status === "completed"
                                ? "default"
                                : order.status === "arrival"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-sm">
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                // Approve the order -> mark as 'arrival'
                                updateOrderStatus(order.id, "arrival")
                              }
                            >
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                updateOrderStatus(order.id, "completed")
                              }
                            >
                              Complete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}

              {/* Collapsible history of completed orders */}
              {showHistory && (
                <div className="mt-6">
                  <h4 className="text-sm font-semibold mb-2 flex items-center gap-2">
                    <Clock size={16} /> Order History ({historyOrders.length})
                  </h4>
                  {historyOrders.length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No completed orders yet
                    </p>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Customer</TableHead>
                          <TableHead>Contact</TableHead>
                          <TableHead>Order Details</TableHead>
                          <TableHead>Date</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {historyOrders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell>
                              <div>
                                <div className="font-medium">{order.name}</div>
                                <div className="text-sm text-gray-500">
                                  {order.email}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div>
                                <div className="text-sm">{order.phone}</div>
                                <div className="text-xs text-gray-500">
                                  {order.preferredContact}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="max-w-xs">
                                <div className="text-sm">
                                  {order.orderDetails}
                                </div>
                              </div>
                            </TableCell>
                            <TableCell className="text-sm">
                              {new Date(order.createdAt).toLocaleDateString()}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Products Tab */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Products</h2>
              <Button
                onClick={() => setShowAddProduct(true)}
                className="flex items-center gap-2"
              >
                <Plus size={18} />
                Add Product
              </Button>
            </div>

            {/* Add Product Form */}
            {showAddProduct && (
              <Card>
                <CardHeader>
                  <CardTitle>Add New Product</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleAddProduct} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="productName">Product Name *</Label>
                        <Input
                          id="productName"
                          value={newProduct.name}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              name: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="productPrice">Price (NPR) *</Label>
                        <Input
                          id="productPrice"
                          type="number"
                          value={newProduct.price}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              price: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="productTags">Tags</Label>
                        <Input
                          id="productTags"
                          value={newProduct.tags}
                          onChange={(e) =>
                            setNewProduct({
                              ...newProduct,
                              tags: e.target.value,
                            })
                          }
                          placeholder="e.g., organic, fresh, premium"
                        />
                      </div>
                      <div>
                        <Label htmlFor="productImage">Product Image</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="productImage"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              document.getElementById("productImage")?.click()
                            }
                            className="flex items-center gap-2"
                          >
                            <Upload size={16} />
                            Upload Image
                          </Button>
                          {imagePreview && (
                            <div className="flex items-center gap-2">
                              <Image size={16} className="text-green-600" />
                              <span className="text-sm text-green-600">
                                Image selected
                              </span>
                            </div>
                          )}
                        </div>
                        {imagePreview && (
                          <div className="mt-2">
                            <img
                              src={imagePreview}
                              alt="Preview"
                              className="w-20 h-20 object-cover rounded border"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="productDescription">Description *</Label>
                      <Textarea
                        id="productDescription"
                        value={newProduct.description}
                        onChange={(e) =>
                          setNewProduct({
                            ...newProduct,
                            description: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="flex gap-4">
                      <Button type="submit">Add Product</Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowAddProduct(false);
                          setImagePreview(null);
                          setNewProduct({
                            name: "",
                            price: "",
                            description: "",
                            tags: "all",
                            image: null,
                          });
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Edit Product Form */}
            {showEditProduct && (
              <Card>
                <CardHeader>
                  <CardTitle>Edit Product</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleUpdateProduct} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="editProductName">Product Name *</Label>
                        <Input
                          id="editProductName"
                          value={editProduct.name}
                          onChange={(e) =>
                            setEditProduct({
                              ...editProduct,
                              name: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="editProductPrice">Price (NPR) *</Label>
                        <Input
                          id="editProductPrice"
                          type="number"
                          value={editProduct.price}
                          onChange={(e) =>
                            setEditProduct({
                              ...editProduct,
                              price: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="editProductTags">Tags</Label>
                        <Input
                          id="editProductTags"
                          value={editProduct.tags}
                          onChange={(e) =>
                            setEditProduct({
                              ...editProduct,
                              tags: e.target.value,
                            })
                          }
                          placeholder="e.g., organic, fresh, premium"
                        />
                      </div>
                      <div>
                        <Label htmlFor="editProductImage">Product Image</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="editProductImage"
                            type="file"
                            accept="image/*"
                            onChange={handleEditImageChange}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              document
                                .getElementById("editProductImage")
                                ?.click()
                            }
                            className="flex items-center gap-2"
                          >
                            <Upload size={16} />
                            Upload Image
                          </Button>
                          {editImagePreview && (
                            <div className="flex items-center gap-2">
                              <Image size={16} className="text-green-600" />
                              <span className="text-sm text-green-600">
                                Image selected
                              </span>
                            </div>
                          )}
                        </div>
                        {editImagePreview && (
                          <div className="mt-2">
                            <img
                              src={editImagePreview}
                              alt="Preview"
                              className="w-20 h-20 object-cover rounded border"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="editProductDescription">
                        Description *
                      </Label>
                      <Textarea
                        id="editProductDescription"
                        value={editProduct.description}
                        onChange={(e) =>
                          setEditProduct({
                            ...editProduct,
                            description: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="flex gap-4">
                      <Button type="submit">Update Product</Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowEditProduct(false);
                          setEditImagePreview(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </CardContent>
              </Card>
            )}

            {/* Products List */}
            <Card>
              <CardContent className="p-6">
                {loading ? (
                  <div className="flex justify-center items-center py-8">
                    <Loader2 className="animate-spin" size={24} />
                    <span className="ml-2">Loading products...</span>
                  </div>
                ) : products.length === 0 ? (
                  <p className="text-gray-500 text-center py-8">
                    No products yet
                  </p>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Image</TableHead>
                        <TableHead>Product Name</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Tags</TableHead>
                        <TableHead>Description</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {products.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            {product.image ? (
                              <img
                                src={`data:image/jpeg;base64,${product.image}`}
                                alt={product.name}
                                className="w-12 h-12 object-cover rounded border"
                              />
                            ) : (
                              <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center">
                                <Image size={16} className="text-gray-400" />
                              </div>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">
                            {product.name}
                          </TableCell>
                          <TableCell>NPR {product.price}</TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.tags}</Badge>
                          </TableCell>
                          <TableCell className="max-w-xs">
                            <div className="text-sm truncate">
                              {product.description}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => openEditProduct(product)}
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deleteProduct(product.id)}
                              >
                                Delete
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === "users" && (
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>Manage user accounts and roles</CardDescription>
            </CardHeader>
            <CardContent>
              {filteredUsers.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No users yet</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Created</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredUsers.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">
                          {user.name}
                        </TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              user.role === "ADMIN" ? "default" : "secondary"
                            }
                          >
                            {user.role}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {new Date(user.createdAt || "").toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Button size="sm" variant="outline">
                            Edit Role
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        )}

        {/* Algorithms Tab */}
        {activeTab === "algorithms" && (
          <Card>
            <CardHeader>
              <CardTitle>Algorithms Used in Website</CardTitle>
              <CardDescription>
                Technical documentation of algorithms implemented in the farm
                fresh application
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  🛒 1. Cart & Order Optimization
                </h3>

                <div className="pl-4 space-y-3">
                  <h4 className="font-medium">
                    📦 Greedy Algorithm for Delivery Packing
                  </h4>
                  <p className="text-sm text-gray-600">
                    If you later offer delivery: Problem: Fit items into
                    delivery boxes based on volume/weight. Solution: Use a
                    greedy algorithm to optimize item arrangement into boxes.
                  </p>

                  <h4 className="font-medium">
                    🔁 Deduplication / Quantity Merge
                  </h4>
                  <p className="text-sm text-gray-600">
                    When the same product is added again to cart: Use a hash map
                    (object or Map) to merge quantities instead of duplicate
                    entries.
                  </p>
                </div>

                <h3 className="text-xl font-semibold flex items-center gap-2">
                  🔍 2. Search & Filter System
                </h3>

                <div className="pl-4 space-y-3">
                  <h4 className="font-medium">✅ Basic Filtering</h4>
                  <p className="text-sm text-gray-600">
                    Filter by category, price range, availability, etc. Use
                    array filters or index-based sorting.
                  </p>

                  <h4 className="font-medium">
                    🔠 Fuzzy Search (Product Names)
                  </h4>
                  <p className="text-sm text-gray-600">
                    Use Levenshtein Distance or Tries for fuzzy search (e.g.,
                    "lettice" → "lettuce"). Consider using libraries like:
                    Fuse.js (lightweight fuzzy search), lunr.js (search
                    indexing)
                  </p>
                </div>

                <h3 className="text-xl font-semibold flex items-center gap-2">
                  📊 3. Inventory & Sales
                </h3>

                <div className="pl-4 space-y-3">
                  <h4 className="font-medium">
                    📉 Time Series Forecasting (Future Feature)
                  </h4>
                  <p className="text-sm text-gray-600">
                    Predict future demand (e.g., peak chicken sales on
                    weekends). Use algorithms like: Simple Moving Average,
                    Exponential Smoothing. Later: integrate ARIMA or ML-based
                    models
                  </p>

                  <h4 className="font-medium">🧮 Inventory Threshold Alerts</h4>
                  <p className="text-sm text-gray-600">
                    When stock &lt; threshold, alert admin. Simple if-check
                    logic, or use priority queues to show low-stock items first.
                  </p>
                </div>

                {/* Recommendations section removed */}

                <h3 className="text-xl font-semibold flex items-center gap-2">
                  🔐 5. Security / Auth
                </h3>

                <div className="pl-4 space-y-3">
                  <h4 className="font-medium">🔐 Password Hashing</h4>
                  <p className="text-sm text-gray-600">
                    Handled by Supabase, but if doing manually: Use bcrypt or
                    argon2 for secure password storage.
                  </p>

                  <h4 className="font-medium">👮 Role-Based Access Control</h4>
                  <p className="text-sm text-gray-600">
                    Use role-check logic or Supabase RLS policies to: Allow
                    admin access to /admin, Restrict users from viewing others'
                    orders
                  </p>
                </div>

                <h3 className="text-xl font-semibold flex items-center gap-2">
                  💳 6. Payment Validations
                </h3>

                <div className="pl-4 space-y-3">
                  <h4 className="font-medium">🔄 Retry Logic for Payments</h4>
                  <p className="text-sm text-gray-600">
                    Retry failed payments with exponential backoff: Use retry
                    algorithms like: delay = base * 2^attempt
                  </p>
                </div>

                <h3 className="text-xl font-semibold flex items-center gap-2">
                  🗺️ 7. Routing & UI Logic
                </h3>

                <div className="pl-4 space-y-3">
                  <h4 className="font-medium">
                    📦 Client-Side State Management
                  </h4>
                  <p className="text-sm text-gray-600">
                    Use Finite State Machines (with xstate) for: Checkout
                    process, Authentication flow (login → loading →
                    success/error)
                  </p>
                </div>

                <h3 className="text-xl font-semibold flex items-center gap-2">
                  🧠 Bonus (Advanced / Optional AI)
                </h3>

                <div className="pl-4 space-y-3">
                  <p className="text-sm text-gray-600">
                    If you want to go further: Integrate a chatbot (GPT-style)
                    for customer help.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </Layout>
  );
};

export default Admin;
