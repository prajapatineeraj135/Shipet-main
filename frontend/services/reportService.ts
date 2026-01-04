import { apiClient } from "./apiClient"

export const reportService = {
  async getStats(dateRange: string): Promise<any> {
    // Mock data for demo - replace with actual API call
    return {
      totalOrders: 1247,
      totalShipments: 892,
      totalRevenue: 89750.0,
      averageOrderValue: 720.5,
      deliveryRate: 94.2,
      returnRate: 2.8,
    }
  },

  async getOrderReports(dateRange: string): Promise<any[]> {
    // Mock data for demo - replace with actual API call
    return [
      {
        id: "1",
        orderNumber: "ORD001",
        customerName: "John Doe",
        amount: 1250.0,
        status: "delivered",
        createdAt: "2024-01-15T10:30:00Z",
      },
      {
        id: "2",
        orderNumber: "ORD002",
        customerName: "Jane Smith",
        amount: 850.0,
        status: "shipped",
        createdAt: "2024-01-14T15:45:00Z",
      },
    ]
  },

  async getShipmentReports(dateRange: string): Promise<any[]> {
    // Mock data for demo - replace with actual API call
    return [
      {
        id: "1",
        awbNumber: "AWB001234567",
        courierPartner: "Delhivery",
        status: "delivered",
        amount: 150.0,
        createdAt: "2024-01-15T10:30:00Z",
      },
      {
        id: "2",
        awbNumber: "AWB001234568",
        courierPartner: "Blue Dart",
        status: "in_transit",
        amount: 120.0,
        createdAt: "2024-01-14T15:45:00Z",
      },
    ]
  },

  async getRevenueReports(dateRange: string): Promise<any[]> {
    // Mock data for demo - replace with actual API call
    return [
      {
        month: "January 2024",
        orders: 156,
        revenue: 89750.0,
        growth: 12.5,
      },
      {
        month: "December 2023",
        orders: 142,
        revenue: 79800.0,
        growth: 8.2,
      },
    ]
  },

  async exportReport(reportType: string, dateRange: string): Promise<void> {
    const response = await apiClient.get("/reports/export", {
      params: { type: reportType, range: dateRange },
    })
    // Handle file download
    const blob = new Blob([response.data], { type: "application/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${reportType}-report.csv`
    a.click()
    window.URL.revokeObjectURL(url)
  },
}
