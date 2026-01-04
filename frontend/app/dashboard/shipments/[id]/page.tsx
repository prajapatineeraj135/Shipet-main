"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { shipmentService } from "@/services/shipmentService";
import { toast } from "sonner";
import {
  ArrowLeft,
  Package,
  MapPin,
  Truck,
  Download,
  X,
  RotateCcw,
  Phone,
  Calendar,
  DollarSign,
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatDateTime } from "@/lib/utils";
import { ICARRY_STATUS_MAPPING } from "@/lib/statusMapping";
import { pickupAddressService } from "@/services/pickupAddressService";

export default function ShipmentDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const [shipment, setShipment] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [pickupId, setPickupId] = useState("");
  const [pickupData, setPickupData] = useState<any>(null);
  const [isPrintingLabels, setIsPrintingLabels] = useState(false);
  const [showPrintDialog, setShowPrintDialog] = useState(false);
  const [labelsData, setLabelsData] = useState<any[]>([]);

  useEffect(() => {
    if (params.id) {
      fetchShipmentDetails(params.id as string);
    }
  }, [params.id]);

  const fetchShipmentDetails = async (id: string) => {
    try {
      setIsLoading(true);
      const data = await shipmentService.getShipmentById(id);
      setShipment(data);
      setPickupId(data.pickup_address_id);
      if (data.pickup_address_id) {
        const pickup = await pickupAddressService.getAddressByWarehouseId(
          data.pickup_address_id
        );
        setPickupData(pickup);
      }
    } catch (error) {
      toast.error("Failed to fetch shipment details");
    } finally {
      setIsLoading(false);
    }
  };
  console.log(shipment);

  const handleCancelShipment = async () => {
    if (!shipment || !confirm("Are you sure you want to cancel this shipment?"))
      return;

    try {
      await shipmentService.cancelShipment(shipment.id);
      toast.success("Shipment cancelled successfully");
      router.push("/dashboard/shipments");
    } catch (error) {
      toast.error("Failed to cancel shipment");
    }
  };

  const handleReverseShipment = async () => {
    if (
      !shipment ||
      !confirm("Are you sure you want to initiate return for this shipment?")
    )
      return;

    try {
      await shipmentService.reverseShipment(shipment.id);
      toast.success("Return initiated successfully");
      fetchShipmentDetails(shipment.id);
    } catch (error) {
      toast.error("Failed to initiate return");
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

  if (!shipment) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Shipment not found
        </h3>
        <p className="text-gray-600 mb-4">
          The shipment you're looking for doesn't exist.
        </p>
        <Link href="/dashboard/shipments">
          <Button>Back to Shipments</Button>
        </Link>
      </div>
    );
  }
  const formatStatus = (status: string) => {
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/shipments">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Shipment Details #{shipment.id}
            </h1>
            <p className="text-gray-600">AWB: {shipment.awb}</p>
          </div>
        </div>

        <div className="flex space-x-2">
          {ICARRY_STATUS_MAPPING.codeToString[shipment.status] !==
            "Delivered" &&
            ICARRY_STATUS_MAPPING.codeToString[shipment.status] !==
              "Cancelled" && (
              <Button onClick={handleCancelShipment} variant={"destructive"}>
                <X className="mr-2 h-4 w-4" />
                Cancel Shipment
              </Button>
            )}
          {ICARRY_STATUS_MAPPING.codeToString[shipment.status] ===
            "Delivered" &&
            ICARRY_STATUS_MAPPING.codeToString[shipment.status] !==
              "Cancelled" && (
              <Button onClick={handleReverseShipment} variant="outline">
                <RotateCcw className="mr-2 h-4 w-4" />
                Return
              </Button>
            )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          {/* Shipment Overview */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span className="flex items-center space-x-2">
                  <Truck className="h-5 w-5" />
                  <span>Shipment Overview</span>
                </span>
                <Badge
                  className={`text-sm ${
                    ICARRY_STATUS_MAPPING.statusConfig[shipment?.status]?.color
                  }`}
                >
                  {formatStatus(
                    ICARRY_STATUS_MAPPING.codeToString[shipment.status] ||
                      "Unknown"
                  )}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      AWB Number
                    </label>
                    <p className="font-mono">{shipment.awb}</p>
                  </div>
                  {shipment.client_order_id && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Order Number
                      </label>
                      <p>{shipment.client_order_id}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Courier Partner
                    </label>
                    <p>{shipment.courier_name}</p>
                  </div>
                  {shipment.cost_estimate && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        Courier Charge
                      </label>
                      <p>{shipment.commission_amount}</p>
                    </div>
                  )}
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Created On
                    </label>
                    <p className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>{formatDateTime(shipment.createdAt)}</span>
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Estimated Delivery
                    </label>
                    <p>
                      {shipment.estimatedDelivery
                        ? formatDateTime(shipment.estimatedDelivery)
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Actual Delivery
                    </label>
                    <p>
                      {shipment.actualDelivery
                        ? formatDateTime(shipment.actualDelivery)
                        : "N/A"}
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Payment Mode
                    </label>
                    <p className="capitalize">{shipment.parcel.type}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Addresses */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Addresses</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {pickupData && (
                  <div>
                    <h4 className="font-medium mb-3">Pickup Address</h4>
                    <div className="space-y-2">
                      <p className="font-medium">{pickupData.name}</p>
                      <p className="text-sm text-gray-600">
                        {pickupData.contact_person}
                      </p>
                      <p className="flex items-center space-x-1 text-sm">
                        <Phone className="h-3 w-3" />
                        <span>{pickupData.phone}</span>
                      </p>
                      <p className="text-sm">{pickupData.address}</p>
                      <p className="text-sm">
                        {`${pickupData.city}${
                          pickupData.state ? `, ${pickupData.state}` : ""
                        } - ${pickupData.pincode}`}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium mb-3">Delivery Address</h4>
                  <div className="space-y-2">
                    <p className="font-medium">{shipment.consignee.name}</p>
                    <p className="flex items-center space-x-1 text-sm">
                      <Phone className="h-3 w-3" />
                      <span>{shipment.consignee.mobile}</span>
                    </p>
                    <p className="text-sm">{shipment.consignee.address}</p>
                    <p className="text-sm">
                      {`${shipment.consignee.city}${
                        pickupData.state ? `, ${shipment.consignee.state}` : ""
                      } - ${shipment.consignee.pincode}`}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Package Details */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Package Details</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Shipment Value
                    </label>
                    <p className="flex items-center space-x-1">
                      <span>{formatCurrency(shipment.parcel.value)}</span>
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      Description
                    </label>
                    <p>{shipment.parcel.contents}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Pricing Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <DollarSign className="h-5 w-5" />
                <span>Pricing</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span>Billed Weight:</span>
                  <span>{shipment.billed_weight || 0}</span>
                </div>
                {shipment.billed_date && (
                  <div className="flex justify-between">
                    <span>Billed Date:</span>
                    <span>{formatDateTime(shipment.billed_date)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Billing Zone:</span>
                  <span>{shipment.billing_zone || "NA"}</span>
                </div>
                {shipment.shipping_mode && shipment.shipping_mode && (
                  <div className="flex justify-between">
                    <span>Shipping Mode:</span>
                    <span>
                      {shipment.shipping_mode === "S" ? "SURFACE" : "AIR"}
                    </span>
                  </div>
                )}
                <Separator />
                <div className="flex justify-between font-bold">
                  <span>Billed Amount:</span>
                  <span>
                    {shipment.billed_amount
                      ? formatCurrency(shipment.billed_amount)
                      : 0.0}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-2">
                <Link href={`/dashboard/shipments/track/${shipment.id}`}>
                  <Button
                    variant="outline"
                    className="w-full justify-start bg-transparent"
                  >
                    <Truck className="mr-2 h-4 w-4" />
                    Track Shipment
                  </Button>
                </Link>

                {/* <Button
                  variant="outline"
                  className="w-full justify-start bg-transparent"
                  onClick={handleDownloadLabel}
                >
                  <Download className="mr-2 h-4 w-4" />
                  Download Label
                </Button> */}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
