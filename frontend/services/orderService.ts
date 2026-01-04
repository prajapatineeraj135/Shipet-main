import { apiClient } from "./apiClient";

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const orderService = {
  async getOrder(id: string): Promise<any> {
    try {
      const response = await apiClient.get<ApiResponse<any>>(`/orders/${id}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching order:", error);
      throw new Error("Failed to fetch order");
    }
  },
  async getOrders(): Promise<any[]> {
    const response = await apiClient.get<any[]>("/orders");
    return response.data;
  },
  async createOrder(orderData: any): Promise<any> {
    try {
      const response = await apiClient.post<ApiResponse<any>>(
        "/orders",
        orderData
      );
      return response.data;
    } catch (error) {
      console.error("Error creating order:", error);
      throw new Error("Failed to create order");
    }
  },

  async updateOrder(id: string, orderData: Partial<any>): Promise<any> {
    try {
      const response = await apiClient.put<ApiResponse<any>>(
        `/orders/${id}`,
        orderData
      );
      return response.data;
    } catch (error) {
      console.error("Error updating order:", error);
      throw new Error("Failed to update order");
    }
  },

  async updateOrderStatus(id: string, status: any["status"]): Promise<any> {
    try {
      const response = await apiClient.patch<ApiResponse<any>>(
        `/orders/${id}/status`,
        { status }
      );
      return response.data;
    } catch (error) {
      console.error("Error updating order status:", error);
      throw new Error("Failed to update order status");
    }
  },

  async cancelOrder(id: string): Promise<any> {
    try {
      const response = await apiClient.patch<ApiResponse<any>>(
        `/orders/${id}/cancel`
      );
      return response.data;
    } catch (error) {
      console.error("Error cancelling order:", error);
      throw new Error("Failed to cancel order");
    }
  },

  async reverseOrder(id: string): Promise<any> {
    try {
      const response = await apiClient.patch<ApiResponse<any>>(
        `/orders/${id}/reverse`
      );
      return response.data;
    } catch (error) {
      console.error("Error reversing order:", error);
      throw new Error("Failed to reverse order");
    }
  },

  async deleteOrder(id: string): Promise<void> {
    try {
      await apiClient.delete<ApiResponse<null>>(`/orders/${id}`);
    } catch (error) {
      console.error("Error deleting order:", error);
      throw new Error("Failed to delete order");
    }
  },

  async getOrderStats(): Promise<{
    totalOrders: number;
    totalRevenue: number;
    statusBreakdown: Array<{
      status: string;
      count: number;
      totalAmount: number;
    }>;
  }> {
    try {
      const response = await apiClient.get<
        ApiResponse<{
          totalOrders: number;
          totalRevenue: number;
          statusBreakdown: Array<{
            _id: string;
            count: number;
            totalAmount: number;
          }>;
        }>
      >("/orders/stats");

      return {
        totalOrders: response.data.data.totalOrders,
        totalRevenue: response.data.data.totalRevenue,
        statusBreakdown: response.data.data.statusBreakdown.map((item) => ({
          status: item._id,
          count: item.count,
          totalAmount: item.totalAmount,
        })),
      };
    } catch (error) {
      console.error("Error fetching order stats:", error);
      throw new Error("Failed to fetch order statistics");
    }
  },
};
