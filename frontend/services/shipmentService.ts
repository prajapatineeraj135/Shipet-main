import { apiClient } from "./apiClient";

type ShipmentData = any;
type TrackingData = any;
type LabelData = any;
type SyncData = any;

function buildQueryParams(params: Record<string, any>): string {
  const query = new URLSearchParams(params).toString();
  return query ? `?${query}` : "";
}

export const shipmentService = {
  // Book shipments
  async bookSingleShipment(payload: any): Promise<ShipmentData> {
    const response = await apiClient.post<ShipmentData>(
      "/shipments/book/single",
      payload
    );
    return response.data;
  },

  async bookMultiBoxShipment(payload: any): Promise<ShipmentData> {
    const response = await apiClient.post<ShipmentData>(
      "/shipments/book/multi-box",
      payload
    );
    return response.data;
  },

  async bookInternationalShipment(payload: any): Promise<ShipmentData> {
    const response = await apiClient.post<ShipmentData>(
      "/shipments/book/international",
      payload
    );
    return response.data;
  },

  // Get shipments
  async getAllShipments(): Promise<ShipmentData[]> {
    const response = await apiClient.get<ShipmentData[]>("/shipments");
    return response.data;
  },

  async getShipmentById(id: string): Promise<ShipmentData> {
    const response = await apiClient.get<ShipmentData>(`/shipments/${id}`);
    return response.data;
  },

  // Track and manage shipments
  async trackShipment(id: string): Promise<TrackingData> {
    const response = await apiClient.get<TrackingData>(
      `/shipments/track/${id}`
    );
    return response.data;
  },

  async syncShipmentStatus(payload: any): Promise<SyncData> {
    const response = await apiClient.patch<SyncData>(
      "/shipments/sync-status",
      payload
    );
    return response.data;
  },

  async syncShipmentBilling(payload: any): Promise<SyncData> {
    const response = await apiClient.patch<SyncData>(
      "/shipments/sync-billing",
      payload
    );
    return response.data;
  },

  // Print labels
  async printShipmentLabel(payload: any): Promise<LabelData> {
    const response = await apiClient.post<LabelData>(
      "/shipments/print-label",
      payload
    );
    return response.data;
  },

  async printMultipleLabel(payload: any): Promise<LabelData> {
    const response = await apiClient.post<LabelData>(
      "/shipments/print-multiple-label",
      payload
    );
    return response.data;
  },

  // Filtered search
  async getFilteredShipments(params: any): Promise<ShipmentData[]> {
    const query = buildQueryParams(params);
    const response = await apiClient.get<ShipmentData[]>(
      `/shipments/filter${query}`
    );
    return response.data;
  },

  async getORFilteredShipments(params: any): Promise<ShipmentData[]> {
    const query = buildQueryParams(params);
    const response = await apiClient.get<ShipmentData[]>(
      `/shipments/search${query}`
    );
    return response.data;
  },

  // Utility search methods
  async getShipmentByAwb(awb: string): Promise<ShipmentData> {
    const query = buildQueryParams({ awb });
    console.log(query);
    const response = await apiClient.get<ShipmentData[]>(
      `/shipments/search${query}`
    );
    return response.data;
  },

  async getShipmentByOrderId(orderId: string): Promise<ShipmentData> {
    const query = buildQueryParams({ orderId });
    const response = await apiClient.get<ShipmentData[]>(
      `/shipments/search${query}`
    );
    return response.data;
  },

  async getShipmentByClientOrderId(
    clientOrderId: string
  ): Promise<ShipmentData> {
    const query = buildQueryParams({ clientOrderId });
    const response = await apiClient.get<ShipmentData[]>(
      `/shipments/search${query}`
    );
    return response.data[0];
  },

  async cancelShipment(shipment_id: any): Promise<ShipmentData> {
    const response = await apiClient.post<ShipmentData>("/shipments/cancel", {
      shipment_id,
    });
    return response.data;
  },

  async reverseShipment(shipment_id: any): Promise<ShipmentData> {
    const response = await apiClient.post<ShipmentData>("/shipments/reverse", {
      shipment_id,
    });
    return response.data;
  },
};
