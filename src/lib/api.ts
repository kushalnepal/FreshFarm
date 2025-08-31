// Prefer explicit Vite env var for API base URL so you can switch environments easily.
// If VITE_API_BASE_URL is not provided, use a sensible default:
// - in development use the local backend (http://localhost:5006/api)
// - in production use the hosted backend URL
const _metaEnv = (import.meta as any).env || {};
const API_BASE_URL =
  _metaEnv.VITE_API_BASE_URL ||
  (_metaEnv.DEV
    ? "http://localhost:5006/api"
    : "https://ecommerce-backend.kushalnepal.com.np/api");

// Helpful debug: show which base URL the client will use at runtime
try {
  // eslint-disable-next-line no-console
  console.debug("API_BASE_URL:", API_BASE_URL);
} catch (e) {
  /* ignore in environments without console */
}

interface User {
  id: string;
  name: string;
  email: string;
  role: "USER" | "ADMIN";
  createdAt?: string;
  updatedAt?: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
  description: string;
  tags: string;
  image?: string;
  createdAt: string;
  updatedAt: string;
}

class ApiError extends Error {
  public errorCode?: number | null;
  public errors?: any;

  constructor(
    public status: number,
    message: string,
    errorCode?: number | null,
    errors?: any
  ) {
    super(message);
    this.name = "ApiError";
    this.errorCode = errorCode ?? null;
    this.errors = errors;
  }
}

class ApiClient {
  private getAuthHeaders(isFormData = false) {
    const token = localStorage.getItem("authToken");
    const headers: Record<string, string> = {
      ...(token && { Authorization: `Bearer ${token}` }),
    };

    if (!isFormData) {
      headers["Content-Type"] = "application/json";
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options?: RequestInit & { isFormData?: boolean }
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const { isFormData, ...fetchOptions } = options || {};

    try {
      const response = await fetch(url, {
        headers: this.getAuthHeaders(isFormData),
        ...fetchOptions,
      });

      if (!response.ok) {
        const contentType = response.headers.get("content-type") || "";

        if (contentType.includes("application/json")) {
          // Try to parse structured error returned by backend
          const json = await response.json().catch(() => null);
          const msg =
            json?.message ||
            JSON.stringify(json) ||
            response.statusText ||
            "Request failed";
          // If the token is invalid/expired, clear stored auth so UI can redirect to login
          if (response.status === 401) {
            try {
              localStorage.removeItem("authToken");
              localStorage.removeItem("userData");
            } catch (e) {
              /* ignore */
            }
          }

          throw new ApiError(
            response.status,
            msg,
            json?.errorCode ?? null,
            json?.errors ?? null
          );
        }

        const errorText = await response.text();
        throw new ApiError(
          response.status,
          errorText || response.statusText || "Request failed"
        );
      }

      const contentType = response.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        return (await response.json()) as T;
      }

      // Fallback for endpoints that return plain text or empty responses
      const text = await response.text();
      return text as unknown as T;
    } catch (err: any) {
      // Normalize network / CORS errors so UI can show helpful message
      throw new ApiError(0, err?.message || "Network request failed");
    }
  }

  // Auth endpoints
  async login(
    email: string,
    password: string
  ): Promise<{ token: string; user: User }> {
    return this.request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  }

  async signup(
    name: string,
    email: string,
    password: string,
    role: "USER" | "ADMIN" = "USER"
  ): Promise<{ token: string; user: User }> {
    return this.request("/auth/signup", {
      method: "POST",
      body: JSON.stringify({ name, email, password, role }),
    });
  }

  // Product endpoints
  async getProducts(skip?: number): Promise<Product[]> {
    const params = skip ? `?skip=${skip}` : "";
    // Request may return either an array or an object { count, data }
    const res = await this.request<any>(`/products${params}`);

    if (Array.isArray(res)) {
      return res as Product[];
    }

    if (res && Array.isArray(res.data)) {
      return res.data as Product[];
    }

    console.warn("Unexpected products response:", res);
    return [];
  }

  async getProductById(id: string) {
    return this.request(`/products/${id}`);
  }

  async createProduct(productData: {
    name: string;
    price: number;
    description: string;
    tags: string;
    image?: File;
  }) {
    const formData = new FormData();
    formData.append("name", productData.name);
    formData.append("price", productData.price.toString());
    formData.append("description", productData.description);
    formData.append("tags", productData.tags);

    if (productData.image) {
      formData.append("image", productData.image);
    }

    return this.request("/products/createproduct", {
      method: "POST",
      body: formData,
      isFormData: true,
    });
  }

  async updateProduct(
    id: string,
    product: {
      name?: string;
      price?: number;
      description?: string;
      tags?: string;
    }
  ) {
    return this.request(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(product),
    });
  }

  async deleteProduct(id: string) {
    return this.request(`/products/${id}`, {
      method: "DELETE",
    });
  }

  // Admin user management endpoints
  async getUsers(): Promise<User[]> {
    return this.request("/admin/users");
  }

  async getUserById(id: string): Promise<User> {
    return this.request(`/admin/users/${id}`);
  }

  async updateUser(
    id: string,
    updates: { name?: string; email?: string; role?: "USER" | "ADMIN" }
  ): Promise<User> {
    return this.request(`/admin/users/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async deleteUser(id: string): Promise<void> {
    return this.request(`/admin/users/${id}`, {
      method: "DELETE",
    });
  }

  // Admin product management endpoints
  async createAdminProduct(product: {
    name: string;
    price: number;
    description: string;
    tags: string;
    category?: string;
    inStock?: boolean;
    onSale?: boolean;
    salePrice?: number;
    image?: File;
  }): Promise<Product> {
    // If an image File is provided, send as FormData so file uploads work
    if (product.image) {
      const formData = new FormData();
      formData.append("name", product.name);
      formData.append("price", product.price.toString());
      formData.append("description", product.description);
      formData.append("tags", product.tags);
      if (product.category) formData.append("category", product.category);
      if (product.inStock !== undefined)
        formData.append("inStock", String(product.inStock));
      if (product.onSale !== undefined)
        formData.append("onSale", String(product.onSale));
      if (product.salePrice !== undefined)
        formData.append("salePrice", product.salePrice.toString());
      formData.append("image", product.image);

      // backend create product endpoint is /products/createproduct
      return this.request("/products/createproduct", {
        method: "POST",
        body: formData,
        isFormData: true,
      });
    }

    // Otherwise send JSON
    const { image, ...payload } = product;
    return this.request("/products/createproduct", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  }

  async getAdminProducts(): Promise<Product[]> {
    // backend exposes product listing at /products/
    return this.request("/products/");
  }

  async getAdminProductById(id: string): Promise<Product> {
    return this.request(`/products/${id}`);
  }

  // Recommendation endpoint removed — collaborative filtering disabled

  async updateAdminProduct(
    id: string,
    updates: {
      name?: string;
      price?: number;
      description?: string;
      tags?: string;
      category?: string;
      inStock?: boolean;
      onSale?: boolean;
      salePrice?: number;
    }
  ): Promise<Product> {
    // backend update route is PUT /products/:id
    return this.request(`/products/${id}`, {
      method: "PUT",
      body: JSON.stringify(updates),
    });
  }

  async deleteAdminProduct(id: string): Promise<void> {
    return this.request(`/products/${id}`, {
      method: "DELETE",
    });
  }
}

export const api = new ApiClient();
export { ApiError, type Product, type User };
