import { apiClient } from "./apiClient";

export const pickupAddressService = {
  async getAddresses(): Promise<any[]> {
    const response = await apiClient.get<any[]>("/pickup-address");
    return response.data;
  },

  async getAddress(id: string): Promise<any> {
    const response = await apiClient.get<any>(`/pickup-address/${id}`);
    return response.data;
  },
  async getAddressByWarehouseId(id: string): Promise<any> {
    const response = await apiClient.get<any>(
      `/pickup-address/warehouseId/${id}`
    );
    return response.data;
  },
  async createAddress(data: Partial<any>): Promise<any> {
    const response = await apiClient.post<any>("/pickup-address", data);
    return response.data;
  },

  async updateAddress(id: string, data: Partial<any>): Promise<any> {
    const response = await apiClient.put<any>(`/pickup-address/${id}`, data);
    return response.data;
  },

  async deleteAddress(id: string): Promise<void> {
    await apiClient.delete(`/pickup-address/${id}`);
  },
};
