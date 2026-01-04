import { apiClient } from "@/services/apiClient";

export interface ProfileRequest {
  firstName: string;
  lastName: string;
  phone: string;
}

export const settingsService = {
  async getProfile(): Promise<{ data: any }> {
    return apiClient.get("/auth/profile");
  },

  async updateProfile(data: ProfileRequest): Promise<void> {
    await apiClient.put("/auth/update-profile", data);
  },

  async getBillingSettings(): Promise<any> {
    return apiClient.get("/auth/billing");
  },

  async updateBillingSettings(data: any): Promise<void> {
    await apiClient.post("/auth/billing", data);
  },
  async getPrintSettings(): Promise<any> {
    return apiClient.get("/auth/print");
  },

  async updatePrintSettings(data: any): Promise<void> {
    await apiClient.put("/auth/print", data);
  },

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    await apiClient.post("/auth/change-password", {
      currentPassword,
      newPassword,
    });
  },
};
