"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { orderService } from "@/services/orderService";
import { toast } from "sonner";
import {
  Plus,
  Search,
  Eye,
  X,
  RotateCcw,
  Truck,
  Package,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  console.log(orders);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      const data = await orderService.getOrders();
      setOrders(data);
    } catch (error) {
      toast.error("Failed to fetch products");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredOrders = orders?.filter((order) => {
    const matchesSearch =
      order?.client_order_id
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      order?.customerName?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || String(order.hasShipment) === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const canBookShipment = (order: any) => {
    return !order.hasShipment;
  };

  const canViewShipment = (order: any) => {
    return order.hasShipment && order.shipment;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-24" />
              <div className="flex space-x-2">
                <Skeleton className="h-10 w-64" />
                <Skeleton className="h-10 w-32" />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <div className="flex space-x-2">
                    <Skeleton className="h-8 w-16" />
                    <Skeleton className="h-8 w-8" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
          <p className="text-gray-600">Manage your orders and book shipments</p>
        </div>
        <Link href="/dashboard/orders/create">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Create Order
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Orders</CardTitle>
            <div className="flex space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search orders..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                <option value="true">Shipment Booked</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Customer</TableHead>
                  {/* <TableHead>Status</TableHead> */}
                  <TableHead>Items</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders?.map(
                  (
                    order // <--- Changed from 'orders' to 'filteredOrders'
                  ) => (
                    <TableRow key={order.client_order_id}>
                      <TableCell className="font-medium">
                        {order.client_order_id}
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{order?.customer?.name}</p>
                          <p className="text-sm text-gray-600">
                            {order?.customer?.mobile}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>{order?.products?.length}</TableCell>
                      <TableCell>₹{order?.totalAmount?.toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            order.paymentMethod === "prepaid"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {order?.paymentMethod?.toUpperCase()}
                          {order?.paymentMethod === "cod" &&
                            order?.totalAmount &&
                            ` (₹${order?.totalAmount})`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {new Date(order?.createdAt)?.toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm">
                              Actions <ChevronDown className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem asChild>
                              <Link
                                href={`/dashboard/orders/${
                                  order?.client_order_id ?? ""
                                }`}
                              >
                                <div className="flex items-center gap-2">
                                  <Eye className="h-4 w-4" /> View Order
                                </div>
                              </Link>
                            </DropdownMenuItem>

                            {canBookShipment(order) && (
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/dashboard/orders/${order.client_order_id}/book-shipment`}
                                >
                                  <div className="flex items-center gap-2 text-blue-600">
                                    <Truck className="h-4 w-4" /> Book Shipment
                                  </div>
                                </Link>
                              </DropdownMenuItem>
                            )}

                            {canViewShipment(order) && (
                              <DropdownMenuItem asChild>
                                <Link
                                  href={`/dashboard/shipments/${order.shipment?.id}`}
                                >
                                  <div className="flex items-center gap-2 text-green-600">
                                    <Package className="h-4 w-4" /> View
                                    Shipment
                                  </div>
                                </Link>
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                )}
              </TableBody>
            </Table>
          </div>
          {/* Ensure to use filteredOrders here */}
          {filteredOrders?.length === 0 && (
            <div className="text-center py-8">
              <p className="text-gray-500">No orders found</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
