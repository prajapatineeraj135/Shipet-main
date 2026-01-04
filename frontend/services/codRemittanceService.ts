import { apiClient } from "./apiClient";

type RemittanceData = any;

const codRemittanceService = {
  // Get all COD Remittances for a user
  async getCODRemittances(filters: any): Promise<RemittanceData[]> {
    const response = await apiClient.post<RemittanceData[]>(
      `/cod-remittance`,
      filters
    );
    return response.data;
  },

  // Get all COD Shipments for a user (which can be remitted)
  async getCODShipments(filters: any): Promise<RemittanceData[]> {
    const response = await apiClient.post<RemittanceData[]>(
      `/cod-remittance/shipments`,
      filters
    );
    return response.data;
  },

  // Get detailed info for a specific payout
  async getPayoutDetails(payoutId: string): Promise<RemittanceData> {
    const response = await apiClient.get<RemittanceData>(
      `/cod-remittance/payout/${payoutId}`
    );
    return response.data;
  },
};

export default codRemittanceService;
