import { apiClient } from "./apiClient";

type Ticket = any;
type Comment = any;

export const helpdeskService = {
  // Get tickets with optional filters
  async getTickets(params?: any): Promise<Ticket[]> {
    const response = await apiClient.post<Ticket[]>("/helpdesk/tickets", {
      params,
    });
    return response.data;
  },
  // Create a new ticket
  async createTicket(payload: any): Promise<Ticket> {
    const response = await apiClient.post<Ticket>(
      "/helpdesk/new-ticket",
      payload
    );
    return response.data;
  },

  // Get a single ticket by ID
  async getTicket(ticketId: string): Promise<Ticket> {
    const response = await apiClient.get<Ticket>(
      `/helpdesk/tickets/${ticketId}`
    );
    return response.data;
  },

  // Update a ticket
  async updateTicket(
    ticketId: string,
    payload: Partial<Ticket>
  ): Promise<Ticket> {
    const response = await apiClient.put<Ticket>(
      `/helpdesk/tickets/${ticketId}`,
      payload
    );
    return response.data;
  },

  // Add comment to a ticket
  async addComment(ticketId: string, commentPayload: any): Promise<Comment> {
    const response = await apiClient.post<Comment>(
      `/helpdesk/tickets/${ticketId}/comments`,
      commentPayload
    );
    return response.data;
  },

  // Close a ticket
  async closeTicket(ticketId: string): Promise<Ticket> {
    const response = await apiClient.put<Ticket>(
      `/helpdesk/tickets/${ticketId}/close`
    );
    return response.data;
  },
};
