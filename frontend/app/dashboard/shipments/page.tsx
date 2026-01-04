"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { shipmentService } from "@/services/shipmentService";
import { ICARRY_STATUS_MAPPING } from "@/lib/statusMapping";
import { toast } from "sonner";
import {
  Search,
  Eye,
  Truck,
  Package,
  Calendar,
  RefreshCw,
  DollarSign,
  Printer,
  ChevronDown,
  MessageCircleHeart,
  Copy,
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { printLabels } from "@/components/print-label/LabelPrinting";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { pickupAddressService } from "@/services/pickupAddressService";
import { useAuth } from "@/contexts/AuthContext";

export default function ShipmentsPage() {
  const { user } = useAuth(); // Get user data
  const [shipments, setShipments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedShipments, setSelectedShipments] = useState<any[]>([]);
  const [isPrintingLabels, setIsPrintingLabels] = useState(false);
  const [pickupAddresses, setPickupAddresses] = useState<{
    [id: string]: string;
  }>({});
  console.log(shipments);
  useEffect(() => {
    fetchShipments();
  }, []);

  const fetchShipments = async () => {
    try {
      setIsLoading(true);
      const data = await shipmentService.getAllShipments();
      setShipments(data);
      toast.success("Data Synced");
      // Fetch pickup address names
      const uniquePickupIds = [
        ...new Set(data.map((s) => s.pickup_address_id)),
      ];
      const addressMap: { [id: string]: string } = {};

      for (const id of uniquePickupIds) {
        try {
          const res = await pickupAddressService.getAddressByWarehouseId(id);
          addressMap[id] = res?.name || "Unknown Address";
        } catch (e) {
          addressMap[id] = "Address Not Found";
        }
      }

      setPickupAddresses(addressMap);
    } catch (error) {
      toast.error("Failed to fetch shipments");
    } finally {
      setIsLoading(false);
    }
  };

  // Updated print labels handler - directly prints using user's default choice
  const handleDownloadMultipleLabels = async (
    shipmentIds = selectedShipments
  ) => {
    if (!Array.isArray(shipmentIds) || shipmentIds.length === 0) {
      toast.warning("Please select shipments to print labels");
      return;
    }

    if (!user?.defaultPrintChoice) {
      toast.error("Default print choice not set. Please update your profile.");
      return;
    }

    try {
      setIsPrintingLabels(true);
      const response = await shipmentService.printMultipleLabel({
        shipmentIds,
      });

      const labels = response || [];
      const labelData = labels.map((item: any) => ({
        ...item.label,
        shipmentId: item.id,
      }));
      console.log(labelData);
      // Directly print using user's default choice
      printLabels(labelData, user.defaultPrintChoice);
      toast.success(
        `Labels prepared for ${
          user.defaultPrintChoice === "thermal" ? "thermal" : "A4"
        } printing`
      );
    } catch (error) {
      console.error("Error printing labels:", error);
      toast.error("Failed to prepare labels for printing");
    } finally {
      setIsPrintingLabels(false);
    }
  };

  // Handle individual shipment selection
  const handleShipmentSelect = (
    shipmentId: string,
    checked: boolean | "indeterminate"
  ) => {
    const isChecked = checked === true;
    setSelectedShipments((prev) =>
      isChecked ? [...prev, shipmentId] : prev.filter((id) => id !== shipmentId)
    );
  };

  // Handle select all shipments
  const handleSelectAll = (checked: boolean | "indeterminate") => {
    const isChecked = checked === true;

    if (isChecked) {
      const allShipmentIds = filteredShipments.map((shipment) => shipment.id);
      setSelectedShipments(allShipmentIds);
    } else {
      setSelectedShipments([]);
    }
  };

  // Filter shipments
  const filteredShipments = shipments.filter((shipment) => {
    const searchableText = [
      shipment.awb,
      shipment.consignee?.name,
      shipment.client_order_id,
      shipment.consignee?.phone,
      shipment.label?.courierName,
      shipment?.parcel?.value,
    ]
      .filter(Boolean)
      .join(" ")
      .toLowerCase();

    const matchesSearch = searchableText.includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" ||
      String(shipment.status) === String(statusFilter);

    return matchesSearch && matchesStatus;
  });

  let getAllStatuses = () => {
    const requiredCodes = [1, 3, 7, 21];

    return Object.entries(ICARRY_STATUS_MAPPING.statusConfig)
      .filter(([code]) => requiredCodes.includes(Number(code)))
      .map(([code, config]: any) => ({
        code: Number(code),
        label: config.label,
      }));
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
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
          <h1 className="text-3xl font-bold text-gray-900">Shipments</h1>
          <p className="text-gray-600">Track and manage your shipments</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>All Shipments</CardTitle>
            <div className="flex space-x-2">
              {/* Bulk Action Buttons */}
              <Button
                onClick={() => handleDownloadMultipleLabels()}
                disabled={selectedShipments.length === 0 || isPrintingLabels}
                variant="outline"
                size="sm"
              >
                {isPrintingLabels ? (
                  <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <Printer className="h-4 w-4 mr-2" />
                )}
                Print Labels (
                {user?.defaultPrintChoice === "thermal" ? "Thermal" : "A4"})
              </Button>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search shipments..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>

              {/* Status Filter */}
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Status</option>
                {getAllStatuses().map((status) => (
                  <option key={status.code} value={status.code.toString()}>
                    {status.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {selectedShipments.length > 0 && (
            <div className="text-sm text-blue-600">
              {selectedShipments.length} shipment(s) selected
            </div>
          )}
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">
                    <Checkbox
                      checked={
                        filteredShipments.length > 0 &&
                        filteredShipments.every((shipment) =>
                          selectedShipments.includes(shipment.id)
                        )
                      }
                      onCheckedChange={handleSelectAll}
                    />
                  </TableHead>
                  <TableHead>Shipment ID</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Courier</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead>Charges</TableHead>
                  <TableHead>Pickup</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredShipments.map((shipment) => (
                  <TableRow key={shipment.id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedShipments.includes(shipment.id)}
                        onCheckedChange={(checked) =>
                          handleShipmentSelect(shipment.id, checked)
                        }
                      />
                    </TableCell>
                    <TableCell className="font-medium font-mono">
                      {shipment?.id}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          <span>
                            {new Date(shipment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <p>{shipment.consignee.name}</p>
                        <p>{shipment.consignee.mobile}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="font-medium">{shipment.courier_name}</p>
                        <p className="text-sm text-gray-600">{shipment.awb}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        className={
                          ICARRY_STATUS_MAPPING.statusConfig[shipment?.status]
                            ?.color
                        }
                      >
                        {ICARRY_STATUS_MAPPING.codeToString[shipment.status] ||
                          "Unknown"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {shipment.parcel.value
                        ? `₹${shipment.parcel.value.toFixed(2)}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {shipment.parcel.value
                        ? `₹${shipment?.commission_amount}`
                        : "-"}
                    </TableCell>
                    <TableCell>
                      {pickupAddresses[shipment.pickup_address_id] || (
                        <span className="text-gray-400 italic">Loading...</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Actions <ChevronDown className="h-4 w-4 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>

                        <DropdownMenuContent>
                          <DropdownMenuItem asChild>
                            <Link href={`/dashboard/shipments/${shipment.id}`}>
                              <div className="flex items-center gap-2 text-black">
                                <Eye className="h-4 w-4" /> View Shipment
                              </div>
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuItem asChild>
                            <Link
                              href={`/dashboard/shipments/track/${shipment.id}`}
                            >
                              <div className="flex items-center gap-2 text-black">
                                <Truck className="h-4 w-4" /> Track Shipment
                              </div>
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() =>
                              handleDownloadMultipleLabels([shipment.id])
                            }
                          >
                            <div className="flex items-center gap-2 text-black">
                              <Printer className="h-4 w-4" /> Print Label (
                              {user?.defaultPrintChoice === "thermal"
                                ? "Thermal"
                                : "A4"}
                              )
                            </div>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => {
                              navigator.clipboard.writeText(
                                `${process.env.NEXT_PUBLIC_FRONTEND}/dashboard/shipments/track/${shipment.id}`
                              );
                              toast.success("Link Copied");
                            }}
                          >
                            <div className="flex items-center gap-2 text-blue-600">
                              <Copy className="h-4 w-4" /> Copy Track Link
                            </div>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() => {
                              const mobile = shipment?.consignee?.mobile;
                              if (!mobile) return;

                              const message = `Hi, here's your shipment tracking link: ${process.env.NEXT_PUBLIC_FRONTEND}/dashboard/shipments/track/${shipment.id}`;
                              const encodedMessage =
                                encodeURIComponent(message);
                              const whatsappUrl = `https://wa.me/${mobile}?text=${encodedMessage}`;

                              window.open(whatsappUrl, "_blank");
                            }}
                          >
                            <div className="flex items-center gap-2 text-green-600">
                              <MessageCircleHeart className="h-4 w-4" /> Share
                              On WhatsApp
                            </div>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredShipments.length === 0 && (
            <div className="text-center py-8">
              <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No shipments found
              </h3>
              <p className="text-gray-600">
                Shipments will appear here once you book them from orders.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
