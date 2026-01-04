import { apiClient } from "./apiClient";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

// You can define a better type than `any` for estimate data if known
type EstimateData = any;
type PincodeData = any;

export const estimateService = {
  async getMultiBoxEstimate(payload: any): Promise<EstimateData> {
    const response = await apiClient.post<ApiResponse<EstimateData>>(
      "/shipment-estimate/multi-box",
      payload
    );
    return response.data;
  },

  async getSingleEstimate(payload: any): Promise<EstimateData> {
    const response = await apiClient.post<ApiResponse<EstimateData>>(
      "/shipment-estimate/single",
      payload
    );
    return response.data;
  },

  async getInternationalEstimate(payload: any): Promise<EstimateData> {
    const response = await apiClient.post<ApiResponse<EstimateData>>(
      "/shipment-estimate/international",
      payload
    );
    return response.data;
  },

  async checkPincodeServiceability(pincode: string): Promise<PincodeData> {
    const response = await apiClient.post<ApiResponse<PincodeData>>(
      `/pincode/check`,
      { pincode: pincode }
    );
    return response.data;
  },
};
