import { apiClient } from "./apiClient";

type AdminData = any;

export const adminService = {
  async createPlan(payload: any): Promise<any> {
    const response = await apiClient.post<any>("/admin/plan", payload);
    return response.data;
  },

  async updatePlan(planId: string, payload: any): Promise<any> {
    const response = await apiClient.put<any>(
      `/admin/update-plan/${planId}`,
      payload
    );
    return response.data;
  },
  //plan-stats
  async planStats(): Promise<any> {
    const response = await apiClient.get<any>("/admin/plan-stats");
    return response.data;
  },
  //ticket-all
  async getTickets(queryParams = ""): Promise<any> {
    const response = await apiClient.get(
      `/admin/customer-tickets${queryParams ? `?${queryParams}` : ""}`
    );
    return response.data;
  },
  // Get specific ticket by ID
  async getTicketById(ticketId: any): Promise<any> {
    const response = await apiClient.get(`/admin/customer-ticket/${ticketId}`);
    return response.data;
  },
  // Add comment to ticket
  async addComment(
    ticketId: any,
    comment: any,
    isInternal = false
  ): Promise<any> {
    const response = await apiClient.post(
      `/admin/customer-ticket/${ticketId}/comment`,
      { comment, isInternal }
    );
    return response.data;
  },

  async creditUserWallet(data: any) {
    return apiClient.post("/admin/payout-credit", data);
  },

  // Delete comment from ticket
  async deleteComment(ticketId: any, commentId: any): Promise<any> {
    const response = await apiClient.delete<any>(
      `/admin/customer-ticket/${ticketId}/comment/${commentId}`
    );
    return response.data;
  },
  // Close ticket
  async closeTicket(ticketId: any): Promise<any> {
    const response = await apiClient.post<any>(`/admin/customer-ticket/close`, {
      ticketId,
    });
    return response.data;
  },

  // Assign or unassign ticket
  async assignTicket(
    ticketId: any,
    assignedTo: any | null = null
  ): Promise<any> {
    const response = await apiClient.post<any>(
      `/admin/customer-ticket/assign`,
      {
        ticketId,
        assignedTo,
      }
    );
    return response.data;
  },

  // Update ticket status
  async updateTicketStatus(ticketId: any, status: any): Promise<any> {
    const response = await apiClient.post<any>(
      `/admin/customer-ticket/status`,
      {
        ticketId,
        status,
      }
    );
    return response.data;
  },

  // Update ticket priority
  async updateTicketPriority(ticketId: any, priority: any): Promise<any> {
    const response = await apiClient.post<any>(
      `/admin/customer-ticket/priority`,
      {
        ticketId,
        priority,
      }
    );
    return response.data;
  },

  //Get admin users
  async getAdminUsers(): Promise<any> {
    const response = await apiClient.get<any>(`/admin/admin-users`);
    return response.data;
  },

  //user-stats
  async getAllUsers(): Promise<any> {
    const response = await apiClient.get<any>("/admin/users");
    return response.data;
  },
  async getUserById(id: any): Promise<any> {
    const response = await apiClient.get<any>(`/admin/user/${id}`);
    return response.data;
  },
  async updateUserStatus(id: any): Promise<any> {
    const response = await apiClient.patch<any>(`/admin/user/${id}/status`);
    return response.data;
  },
  async updateUser(id: any, data: any): Promise<any> {
    const response = await apiClient.put<any>(`/admin/user/${id}`, data);
    return response.data;
  },
  async deleteUser(id: any): Promise<any> {
    const response = await apiClient.delete<any>(`/admin/user/${id}`);
    return response.data;
  },
  // Create payout
  async createPayout(payoutData: any): Promise<any> {
    const response = await apiClient.post("/admin/create-payout", payoutData);
    return response.data;
  },

  // Get all payout summaries
  async getAllPayoutSummaries(
    page = 1,
    limit = 10,
    userId?: string
  ): Promise<any> {
    const params: any = { page, limit };

    const response = await apiClient.post("/admin/payout-summaries", params);
    return response.data;
  },

  // Get all cod pending user wise
  async getPendingCODShipmentsUserWise(payload: any): Promise<any> {
    const response = await apiClient.post("/admin/cod-shipments", payload);
    return response.data;
  },

  async getBillingSettingsbyId(userId: any): Promise<any> {
    console.log(userId);
    return apiClient.get(`/admin/billing/${userId}`);
  },
};
