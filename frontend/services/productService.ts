import { apiClient } from "./apiClient";

export interface Product {
  _id: string;
  name: string;
  pid: string; // Optional: user can provide or backend will generate
  description?: string;
  price: number;
  weight: number;
  dimensions: {
    length: number;
    breadth: number;
    height: number;
    unit: string;
  };
  createdAt: string;
  updatedAt: string;
}

// When creating, user may optionally pass pid
export type CreateProductInput = {
  name: string;
  pid?: string;
  description?: string;
  price: number;
  weight: number;
  dimensions: {
    length: number;
    breadth: number;
    height: number;
  };
};

export const productService = {
  async getProducts(): Promise<Product[]> {
    const response = await apiClient.get<Product[]>("/products");
    return response.data;
  },

  async getProduct(id: string): Promise<Product> {
    const response = await apiClient.get<Product>(`/products/${id}`);
    return response.data;
  },

  async createProduct(productData: CreateProductInput): Promise<Product> {
    const response = await apiClient.post<Product>("/products", productData);
    return response.data;
  },

  async updateProduct(
    id: string,
    productData: Partial<CreateProductInput>
  ): Promise<Product> {
    const response = await apiClient.put<Product>(
      `/products/${id}`,
      productData
    );
    return response.data;
  },

  async deleteProduct(id: string): Promise<void> {
    await apiClient.delete(`/products/${id}`);
  },
};
