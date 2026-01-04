import { apiClient } from "./apiClient";

export const supportService = {
  //ticket-all
  async getTickets(queryParams = ""): Promise<any> {
    const response = await apiClient.get(
      `/customer-support/tickets${queryParams ? `?${queryParams}` : ""}`
    );
    return response.data;
  },
  // Get specific ticket by ID
  async getTicketById(ticketId: any): Promise<any> {
    const response = await apiClient.get(
      `/customer-support/ticket/${ticketId}`
    );
    return response.data;
  },
  // Add comment to ticket
  async addComment(
    ticketId: any,
    comment: any,
    isInternal = false
  ): Promise<any> {
    const response = await apiClient.post(
      `/customer-support/ticket/${ticketId}/comment`,
      { comment, isInternal }
    );
    return response.data;
  },

  // Delete comment from ticket
  async deleteComment(ticketId: any, commentId: any): Promise<any> {
    const response = await apiClient.delete<any>(
      `/customer-support/ticket/${ticketId}/comment/${commentId}`
    );
    return response.data;
  },
  // Close ticket
  async closeTicket(ticketId: any): Promise<any> {
    const response = await apiClient.post<any>(
      `/customer-support/ticket/close`,
      {
        ticketId,
      }
    );
    return response.data;
  },
};
