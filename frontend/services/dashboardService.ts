import { apiClient } from "./apiClient";

type DashboardStatsData = any;

export const dashboardService = {
  async getStats(): Promise<DashboardStatsData> {
    const response = await apiClient.get<DashboardStatsData>(
      "/dashboard/overview"
    );
    console.log(response);
    return response.data;
  },

  async getRevenueChart(): Promise<DashboardStatsData[]> {
    const response = await apiClient.get<DashboardStatsData[]>(
      "/dashboard/revenue-chart"
    );
    return response.data;
  },
  async getStatusDistribution(): Promise<DashboardStatsData[]> {
    const response = await apiClient.get<DashboardStatsData[]>(
      "/dashboard/status-distribution"
    );
    return response.data;
  },
};
