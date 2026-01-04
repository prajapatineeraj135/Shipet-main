import { apiClient } from "./apiClient";

type NDRData = any;

export const NDRService = {
  async getNDRDataFromIcarry(): Promise<NDRData[]> {
    const response = await apiClient.get<NDRData[]>("/ndr/webhook");
    return response.data;
  },

  async getNDRShipments(): Promise<NDRData> {
    const response = await apiClient.get<NDRData>(`/ndr/shipments`);
    return response.data;
  },
  async getNDRStats(): Promise<NDRData> {
    const response = await apiClient.get<NDRData>(`/ndr/stats`);
    return response.data;
  },
  async takeAction(id: string, payload: any): Promise<any> {
    const response = await apiClient.post<NDRData>(
      `/ndr/shipments/${id}/action`,
      payload
    );
    return response.data;
  },
};
