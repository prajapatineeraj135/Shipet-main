"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
  ArrowLeft,
  Package,
  User,
  MapPin,
  FileText,
  Truck,
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export default function OrderViewPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // If the segment is "create" (static route) or "new", bail out
  if (params.id === "create" || params.id === "new") {
    // This page was matched by mistake. Redirect to the proper route.
    router.replace("/dashboard/orders/create");
    return null;
  }

  useEffect(() => {
    if (!params.id || params.id === "create" || params.id === "new") return;
    fetchOrderData(params.id as string);
  }, [params.id]);

  const fetchOrderData = async (orderId: string) => {
    try {
      setIsLoading(true);
      const orderData = await orderService.getOrder(orderId);
      setOrder(orderData);
    } catch (error) {
      toast.error("Failed to fetch order details");
    } finally {
      setIsLoading(false);
    }
  };
  console.log(order);
  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "confirmed":
        return "bg-blue-100 text-blue-800";
      case "shipped":
        return "bg-purple-100 text-purple-800";
      case "delivered":
        return "bg-green-100 text-green-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-32" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-32" />
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-24" />
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Order not found
        </h3>
        <p className="text-gray-600 mb-4">
          The order you're looking for doesn't exist.
        </p>
        <Link href="/dashboard/orders">
          <Button>Back to Orders</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/orders">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            {`Order ID: ${order.client_order_id}`}
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Order Items */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Order Items</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Product</TableHead>
                      <TableHead>Quantity</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {order?.products?.map((item: any, index: any) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">
                          {item?.product?.name}
                        </TableCell>
                        <TableCell>{item?.quantity}</TableCell>
                        <TableCell>₹{item?.price?.toFixed(2)}</TableCell>
                        <TableCell>
                          ₹{(item?.quantity * item?.price).toFixed(2)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              <div className="mt-4 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total Amount:</span>
                  <span className="text-2xl font-bold">
                    ₹
                    {typeof order?.totalAmount === "number"
                      ? order.totalAmount.toFixed(2)
                      : "0.00"}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Shipping Address</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="font-medium">{order?.shippingAddress?.name}</p>
                <p className="text-sm text-gray-600">
                  {order?.shippingAddress?.mobile}
                </p>
                <p className="text-sm mt-2">
                  {order?.shippingAddress?.address}
                </p>
                <p className="text-sm">
                  {order?.shippingAddress?.city},{" "}
                  {order?.shippingAddress?.state} -{" "}
                  {order?.shippingAddress?.pincode}
                </p>
                <p className="text-sm font-medium">
                  {order?.shippingAddress?.country_code}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Notes */}
          {order.notes && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="h-5 w-5" />
                  <span>Order Notes</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{order?.orderNotes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Summary Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payment:</span>
                <Badge
                  variant={
                    order?.paymentMethod === "Prepaid" ? "default" : "secondary"
                  }
                >
                  {order?.paymentMethod?.toUpperCase()}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Date:</span>
                <span className="font-medium">
                  {new Date(order?.createdAt)?.toLocaleDateString()}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Customer Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Customer</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <p className="font-medium">{order?.customer?.name}</p>
                <p className="text-sm text-gray-600">
                  {order?.customer?.mobile}
                </p>
              </div>
              <Link href={`/dashboard/customers/${order?.customer?._id}`}>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full bg-transparent"
                >
                  View Customer Profile
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {order?.hasShipment &&
              order?.shipment &&
              order?.shipment.isCancelled ? (
                <Link href={`/dashboard/shipments/${order?.shipment.id}`}>
                  <Button className="w-full">
                    <Truck className="mr-2 h-4 w-4" />
                    View Shipment
                  </Button>
                </Link>
              ) : (
                <Link
                  href={`/dashboard/orders/${order?.client_order_id}/book-shipment`}
                >
                  <Button className="w-full">
                    <Truck className="mr-2 h-4 w-4" />
                    Book Shipment
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
