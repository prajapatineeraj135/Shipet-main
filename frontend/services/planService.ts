import { apiClient } from "./apiClient";

type PlanData = any;

export const planService = {
  // ===== PUBLIC ROUTES =====

  async getPlans(): Promise<PlanData[]> {
    const response = await apiClient.get<PlanData[]>("/plans");
    return response.data;
  },

  async getPlanById(planId: string): Promise<PlanData> {
    const response = await apiClient.get<PlanData>(`/plans/${planId}`);
    return response.data;
  },

  // ===== USER-PROTECTED ROUTES =====

  async getCurrentUserPlan(): Promise<PlanData> {
    const response = await apiClient.get<PlanData>("/plans/user/current-plan");
    return response.data;
  },

  async upgradeUserPlan(payload: any): Promise<PlanData> {
    const response = await apiClient.post<PlanData>(
      "/plans/user/upgrade-plan",
      payload
    );
    return response.data;
  },

  async getUserPlanHistory(): Promise<PlanData[]> {
    const response = await apiClient.get<PlanData>("/plans/user/plan-history");
    return response.data;
  },

  async calculateShippingRate(payload: any): Promise<PlanData> {
    const response = await apiClient.post<PlanData>(
      "/plans/user/calculate-shipping",
      payload
    );
    return response.data;
  },

  // ===== UTILITY ROUTES =====

  async checkHealth(): Promise<PlanData> {
    const response = await apiClient.get<PlanData>("/plans/health");
    return response.data;
  },
};
