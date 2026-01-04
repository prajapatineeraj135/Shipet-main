import { apiClient } from "./apiClient";

type CustomerData = any;

export const customerService = {
  async getCustomers(): Promise<CustomerData[]> {
    const response = await apiClient.get<CustomerData[]>("/customers");
    return response.data;
  },

  async getCustomer(id: string): Promise<CustomerData> {
    const response = await apiClient.get<CustomerData>(`/customers/${id}`);
    return response.data;
  },

  async getOrdersByCustomer(id: string): Promise<any> {
    const response = await apiClient.get(`/customers/${id}/orders`);
    return response.data;
  },
  async createCustomer(payload: any): Promise<CustomerData> {
    const response = await apiClient.post<CustomerData>("/customers", payload);
    return response.data;
  },

  async updateCustomer(
    id: string,
    payload: Partial<CustomerData>
  ): Promise<CustomerData> {
    const response = await apiClient.put<CustomerData>(
      `/customers/${id}`,
      payload
    );
    return response.data;
  },

  async deleteCustomer(id: string): Promise<void> {
    await apiClient.delete<CustomerData>(`/customers/${id}`);
  },
};
