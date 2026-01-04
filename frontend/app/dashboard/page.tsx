"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Package,
  Truck,
  DollarSign,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertCircle,
  RotateCcw,
  Activity,
  Calendar,
  Target,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCcw,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { dashboardService } from "@/services/dashboardService";
import { formatCurrency } from "@/lib/utils";
import { ICARRY_STATUS_MAPPING } from "@/lib/statusMapping";

export default function DashboardPage() {
  const [stats, setStats] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [timeRange, setTimeRange] = useState("month");
  const { user, isLoading: isAuthorized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthorized) {
      if (!user) {
        router.push("/auth/login");
      } else if (user.role === "admin") {
        router.push("/admin/dashboard");
      } else if (user.role === "support") {
        router.push("/customer-support/dashboard");
      }
    }
  }, [user, router, isAuthorized]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      const result = await dashboardService.getStats();
      setStats(result || null);
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
      setStats(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatNumber = (num: any) => {
    return new Intl.NumberFormat("en-IN").format(num || 0);
  };

  if (isLoading || !user) {
    return (
      <div className="space-y-6 p-6">
        <div>
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-4 w-4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-3 w-24" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  console.log(stats);
  // Safe data access with fallbacks
  const safeStats = stats || {};

  const statCards = [
    {
      title: "Total Orders",
      value: formatNumber(safeStats.totalOrders || 0),
      description: `+${safeStats.ordersToday || 0} today`,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      trend: (safeStats.ordersToday || 0) > 0 ? "up" : "neutral",
    },
    {
      title: "Active Shipments",
      value: formatNumber(safeStats.activeShipments || 0),
      description: "Currently in progress",
      icon: Truck,
      color: "text-green-600",
      bgColor: "bg-green-50",
      trend: "neutral",
    },
    {
      title: "Wallet Balance",
      value: formatCurrency(safeStats.walletBalance || 0),
      description: "Available balance",
      icon: DollarSign,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      trend: "neutral",
    },
    {
      title: "Monthly Revenue",
      value: formatCurrency(safeStats.revenue || 0),
      description: `${(safeStats.revenueGrowth || 0) >= 0 ? "+" : ""}${
        safeStats.revenueGrowth || 0
      }% from last month`,
      icon: TrendingUp,
      color:
        (safeStats.revenueGrowth || 0) >= 0 ? "text-green-600" : "text-red-600",
      bgColor:
        (safeStats.revenueGrowth || 0) >= 0 ? "bg-green-50" : "bg-red-50",
      trend: (safeStats.revenueGrowth || 0) >= 0 ? "up" : "down",
    },
    {
      title: "Pending Pickups",
      value: formatNumber(safeStats.pendingPickups || 0),
      description: "Awaiting pickup",
      icon: Clock,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      trend: "neutral",
    },
    {
      title: "Delivered Orders",
      value: formatNumber(safeStats.delivered || 0),
      description: "Successful deliveries",
      icon: CheckCircle,
      color: "text-green-600",
      bgColor: "bg-green-50",
      trend: "up",
    },
    {
      title: "Success Rate",
      value: `${safeStats.successRate || 0}%`,
      description: "Delivery success rate",
      icon: Target,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      trend: "up",
    },
    {
      title: "Today's Revenue",
      value: formatCurrency(safeStats.todayRevenue || 0),
      description: "Revenue earned today",
      icon: Activity,
      color: "text-indigo-600",
      bgColor: "bg-indigo-50",
      trend: (safeStats.todayRevenue || 0) > 0 ? "up" : "neutral",
    },
  ];

  return (
    <div className="space-y-6 p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600 mt-1">
            Welcome back! Here's what's happening with your shipments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select> */}
          <Button
            variant={"outline"}
            onClick={fetchDashboardData}
            className="flex items-center gap-2 px-4 py-2 text-blue-600 rounded-lg text-sm hover:bg-blue-600 hover:text-white transition-colors"
          >
            <RefreshCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, index) => (
          <Card
            key={index}
            className="hover:shadow-lg transition-shadow duration-200"
          >
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-gray-700">
                {stat.title}
              </CardTitle>
              <div className={`p-2 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="text-2xl font-bold text-gray-900">
                  {stat.value}
                </div>
                {stat.trend === "up" && (
                  <ArrowUpRight className="h-4 w-4 text-green-500" />
                )}
                {stat.trend === "down" && (
                  <ArrowDownRight className="h-4 w-4 text-red-500" />
                )}
              </div>
              <p className="text-xs text-gray-600 mt-1">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts and Details Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Orders */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Recent Orders
            </CardTitle>
            <CardDescription>Your latest shipping orders</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {safeStats.recentOrders && safeStats.recentOrders.length > 0 ? (
                safeStats.recentOrders.map((order: any, i: any) => (
                  <div
                    key={order._id || i}
                    className="flex items-center justify-between p-4 bg-white border border-gray-100 rounded-lg hover:shadow-sm transition-shadow"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Package className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">
                            #{order.orderId || order.client_order_id || "N/A"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {order.customer_name || "Unknown Customer"}
                          </p>
                          {order.customer_mobile && (
                            <p className="text-xs text-gray-500">
                              {order.customer_mobile}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(
                          order.total_amount || order.totalAmount || 0
                        )}
                      </p>

                      <Badge
                        className={`text-sm ${
                          ICARRY_STATUS_MAPPING.statusConfig[
                            order?.shipment?.status
                          ]?.color
                        }`}
                      >
                        {ICARRY_STATUS_MAPPING.codeToString[
                          order?.shipment?.status
                        ] || "Processing"}
                      </Badge>
                      {order.shipment?.awb && (
                        <p className="text-xs text-gray-500 font-mono">
                          {order.shipment.awb}
                        </p>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No recent orders found</p>
                  <p className="text-sm text-gray-400">
                    Orders will appear here once you start shipping
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <a href="dashboard/orders/create">
                <button className="w-full p-4 bg-blue-50 rounded-lg text-left hover:bg-blue-100 transition-colors group">
                  <div className="flex items-center gap-3">
                    <Package className="h-6 w-6 text-blue-600 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="font-medium text-gray-900">Create Order</p>
                      <p className="text-sm text-gray-600">
                        Start new shipment
                      </p>
                    </div>
                  </div>
                </button>
              </a>

              <a href="/dashboard/shipments">
                <button className="w-full p-4 bg-yellow-50 rounded-lg text-left hover:bg-yellow-100 transition-colors group">
                  <div className="flex items-center gap-3">
                    <Truck className="h-6 w-6 text-yellow-600 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="font-medium text-gray-900">
                        View Shipments
                      </p>
                      <p className="text-sm text-gray-600">
                        All recent shipments
                      </p>
                    </div>
                  </div>
                </button>
              </a>

              <a href="/dashboard/estimate">
                <button className="w-full p-4 bg-indigo-50 rounded-lg text-left hover:bg-indigo-100 transition-colors group">
                  <div className="flex items-center gap-3">
                    <Package className="h-6 w-6 text-indigo-600 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="font-medium text-gray-900">
                        Estimate Delivery
                      </p>
                      <p className="text-sm text-gray-600">
                        Check delivery cost
                      </p>
                    </div>
                  </div>
                </button>
              </a>

              <a href="/dashboard/customers">
                <button className="w-full p-4 bg-purple-50 rounded-lg text-left hover:bg-purple-100 transition-colors group">
                  <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-purple-600 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="font-medium text-gray-900">
                        Manage Customers
                      </p>
                      <p className="text-sm text-gray-600">
                        View all customers
                      </p>
                    </div>
                  </div>
                </button>
              </a>

              <a href="/dashboard/wallet">
                <button className="w-full p-4 bg-pink-50 rounded-lg text-left hover:bg-pink-100 transition-colors group">
                  <div className="flex items-center gap-3">
                    <DollarSign className="h-6 w-6 text-pink-600 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="font-medium text-gray-900">Wallet</p>
                      <p className="text-sm text-gray-600">
                        View balance & history
                      </p>
                    </div>
                  </div>
                </button>
              </a>

              <a href="/dashboard/settings">
                <button className="w-full p-4 bg-gray-50 rounded-lg text-left hover:bg-gray-100 transition-colors group">
                  <div className="flex items-center gap-3">
                    <Users className="h-6 w-6 text-gray-600 group-hover:scale-110 transition-transform" />
                    <div>
                      <p className="font-medium text-gray-900">Manage User</p>
                      <p className="text-sm text-gray-600">Go to settings</p>
                    </div>
                  </div>
                </button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Status Overview and Top Routes */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-6">
        {/* Shipment Status Overview */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Shipment Status Overview
            </CardTitle>
            <CardDescription>Distribution of shipment statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {safeStats.statusBreakdown &&
              safeStats.statusBreakdown.length > 0 ? (
                safeStats.statusBreakdown
                  .slice(0, 6)
                  .map((status: any, i: any) => (
                    <div
                      key={status?.status || i}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            ICARRY_STATUS_MAPPING.statusConfig[status?.status]
                              ?.color
                          }}`}
                        ></div>
                        <span className="font-medium text-gray-900">
                          {`${
                            ICARRY_STATUS_MAPPING.codeToString[status?.status]
                          }`}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-lg font-bold text-gray-900">
                          {status?.count || 0}
                        </span>
                        <span className="text-sm text-gray-500">
                          (
                          {safeStats.totalShipments > 0
                            ? (
                                ((status.count || 0) /
                                  safeStats?.totalShipments) *
                                100
                              ).toFixed(1)
                            : "0.0"}
                          %)
                        </span>
                      </div>
                    </div>
                  ))
              ) : (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500">No status data available</p>
                  <p className="text-sm text-gray-400">
                    Status distribution will appear once you have shipments
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Shipments */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Truck className="h-5 w-5" />
            Recent Shipments
          </CardTitle>
          <CardDescription>Latest shipment updates</CardDescription>
        </CardHeader>
        <CardContent>
          {safeStats.recentShipments && safeStats.recentShipments.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Tracking ID
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Destination
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Status
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Amount
                    </th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">
                      Date
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {safeStats.recentShipments.map((shipment: any, i: any) => (
                    <tr
                      key={shipment.id || i}
                      className="border-b border-gray-100 hover:bg-gray-50"
                    >
                      <td className="py-3 px-4">
                        <span className="font-mono text-sm bg-gray-100 px-2 py-1 rounded">
                          {shipment.tracking_id || shipment.awb || "N/A"}
                        </span>
                      </td>
                      <td className="py-3 px-4 capitalize">
                        {shipment.destination_city || "N/A"}
                      </td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                            ICARRY_STATUS_MAPPING.statusConfig[shipment?.status]
                              ?.color
                          }`}
                        >
                          {ICARRY_STATUS_MAPPING.codeToString[
                            shipment?.status
                          ] || "Unknown"}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-medium">
                        {formatCurrency(shipment?.billed_amount || 0)}
                      </td>
                      <td className="py-3 px-4 text-gray-600">
                        {shipment.createdAt
                          ? new Date(shipment.createdAt).toLocaleDateString(
                              "en-IN"
                            )
                          : "N/A"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Truck className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No recent shipments found</p>
              <p className="text-sm text-gray-400">
                Shipments will appear here once you start processing orders
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance Insights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-blue-600 text-sm font-medium">
                  Average Order Value
                </p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatCurrency(safeStats.trends?.averageOrderValue || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-200 rounded-lg flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-green-600 text-sm font-medium">
                  Total Customers
                </p>
                <p className="text-2xl font-bold text-green-900">
                  {formatNumber(safeStats.totalCustomers || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-200 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-purple-600 text-sm font-medium">
                  Orders This Week
                </p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatNumber(safeStats.ordersThisWeek || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-200 rounded-lg flex items-center justify-center">
                <Calendar className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
