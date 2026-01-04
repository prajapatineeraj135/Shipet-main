"use client";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Search,
  Filter,
  RefreshCw,
  Package,
  Phone,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  RotateCcw,
  ArrowLeft,
  ExternalLink,
} from "lucide-react";
import { NDR_EVENT_DESCRIPTIONS } from "@/lib/constant";
import { NDRService } from "@/services/ndrServices";
import { toast } from "sonner";
import Link from "next/link";

export default function NDRPage() {
  const [shipments, setShipments] = useState<any[]>([]);
  const [filteredShipments, setFilteredShipments] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedShipment, setSelectedShipment] = useState<any | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<string>("");
  const [actionRemarks, setActionRemarks] = useState("");
  const [scheduledDate, setScheduledDate] = useState("");
  const [isProcessingAction, setIsProcessingAction] = useState(false);
  const [stats, setStats] = useState<any>({
    total: 0,
    open: 0,
    closed: 0,
    reattempt_scheduled: 0,
  });

  useEffect(() => {
    loadNDRData();
  }, []);

  useEffect(() => {
    filterShipments();
  }, [shipments, searchTerm, statusFilter]);

  const loadNDRData = async () => {
    try {
      setIsLoading(true);
      const [shipmentsData, statsData] = await Promise.all([
        NDRService.getNDRShipments(),
        NDRService.getNDRStats(),
      ]);
      setShipments(shipmentsData);
      setStats(statsData);
    } catch (error) {
      console.error("Error loading NDR data:", error);
      toast("Failed to load NDR data. Using sample data.");
      // Set empty arrays as fallback
      setShipments([]);
      setStats({ total: 0, open: 0, closed: 0, reattempt_scheduled: 0 });
    } finally {
      setIsLoading(false);
    }
  };

  const filterShipments = () => {
    let filtered = shipments;

    if (searchTerm) {
      filtered = filtered.filter(
        (shipment) =>
          shipment.awb.toLowerCase().includes(searchTerm.toLowerCase()) ||
          shipment.customerName
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          shipment.customerPhone.includes(searchTerm)
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter(
        (shipment) => shipment.status === statusFilter
      );
    }

    setFilteredShipments(filtered);
  };

  const handleAction = async (shipment: any, action: string) => {
    setSelectedShipment(shipment);
    setActionType(action);
    setActionDialogOpen(true);
    setActionRemarks("");
    setScheduledDate("");
  };

  const executeAction = async () => {
    if (!selectedShipment) return;

    try {
      setIsProcessingAction(true);

      const payload: any = {
        action: actionType as any,
        remarks: actionRemarks,
      };

      if (actionType === "reattempt" && scheduledDate) {
        payload.scheduledDate = scheduledDate;
      }

      const updatedShipment = await NDRService.takeAction(
        selectedShipment.id,
        payload
      );

      // Update local state
      setShipments((prev) =>
        prev.map((s) => (s.id === selectedShipment.id ? updatedShipment : s))
      );

      // Update stats
      const newStats = await NDRService.getNDRStats();
      setStats(newStats);

      toast.error(`Action ${actionType} completed successfully`);

      setActionDialogOpen(false);
    } catch (error) {
      console.error("Error executing action:", error);
      toast.error("Failed to execute action");
    } finally {
      setIsProcessingAction(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "open":
        return (
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Open
          </Badge>
        );
      case "closed":
        return (
          <Badge
            variant="default"
            className="flex items-center gap-1 bg-green-600"
          >
            <CheckCircle className="h-3 w-3" />
            Closed
          </Badge>
        );
      case "reattempt_scheduled":
        return (
          <Badge variant="secondary" className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            Reattempt Scheduled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getEventTypeBadge = (eventType: string) => {
    const colors = {
      "REATTEMPT-CONTACT": "bg-orange-100 text-orange-800",
      REATTEMPT: "bg-yellow-100 text-yellow-800",
      MISROUTE: "bg-red-100 text-red-800",
      "DC-ADDRESS": "bg-purple-100 text-purple-800",
      "URGENT-DELIVERY": "bg-red-100 text-red-800",
      "REATTEMPT-COD-NOT-READY": "bg-blue-100 text-blue-800",
      "CONSIGNEE-OPENED": "bg-pink-100 text-pink-800",
      REFUSED: "bg-red-100 text-red-800",
    } as const;

    const colorClass =
      colors[eventType as keyof typeof colors] || "bg-gray-100 text-gray-800";

    return <Badge className={`${colorClass} border-0`}>{eventType}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse mt-2"></div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="h-4 w-16 bg-gray-200 rounded animate-pulse mb-2"></div>
                <div className="h-8 w-12 bg-gray-200 rounded animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-16 bg-gray-200 rounded animate-pulse"
                ></div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">NDR Management</h1>
          <p className="text-gray-600">
            You can also Open an{" "}
            <Link
              className=" underline text-blue-600"
              href={"/dashboard/helpdesk"}
            >
              Helpdesk Ticket
            </Link>{" "}
            if you need additional help.{" "}
          </p>
        </div>
        <Button onClick={loadNDRData} disabled={isLoading}>
          <RefreshCw
            className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total NDR</p>
                <p className="text-2xl font-bold text-gray-900">
                  {stats.total}
                </p>
              </div>
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open</p>
                <p className="text-2xl font-bold text-red-600">{stats.open}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Reattempt Scheduled
                </p>
                <p className="text-2xl font-bold text-yellow-600">
                  {stats.reattempt_scheduled}
                </p>
              </div>
              <Clock className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Closed</p>
                <p className="text-2xl font-bold text-green-600">
                  {stats.closed}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search by AWB, customer name, or phone..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="reattempt_scheduled">
                    Reattempt Scheduled
                  </SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* NDR Shipments List */}
      <Card>
        <CardHeader>
          <CardTitle>NDR Shipments ({filteredShipments.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {filteredShipments.length === 0 ? (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No NDR shipments found
              </h3>
              <p className="text-gray-600">
                {searchTerm || statusFilter !== "all"
                  ? "Try adjusting your search or filter criteria"
                  : "All shipments are being delivered successfully"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredShipments.map((shipment) => (
                <div
                  key={shipment.id}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className="font-mono text-sm font-medium bg-gray-100 px-2 py-1 rounded">
                          {shipment.awb}
                        </span>
                        {getStatusBadge(shipment.status)}
                        {getEventTypeBadge(shipment.ndrEventType)}
                        <Badge variant="outline" className="text-xs">
                          {shipment.courierName}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                        <div className="flex items-center gap-2">
                          <Phone className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="font-medium">
                              {shipment.customerName}
                            </p>
                            <p className="text-gray-600">
                              {shipment.customerPhone}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-gray-900">
                              {shipment.city}, {shipment.state}
                            </p>
                            <p className="text-gray-600">{shipment.pincode}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <div>
                            <p className="text-gray-900">
                              Last Attempt: {shipment.lastAttemptDate}
                            </p>
                            {shipment.nextAttemptDate && (
                              <p className="text-gray-600">
                                Next: {shipment.nextAttemptDate}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="text-sm">
                        <p className="text-gray-900 font-medium">NDR Reason:</p>
                        <p className="text-gray-600">{shipment.ndrReason}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          {NDR_EVENT_DESCRIPTIONS[
                            shipment.ndrEventType as keyof typeof NDR_EVENT_DESCRIPTIONS
                          ] || shipment.ndrEventType}
                        </p>
                      </div>

                      {shipment.remarks && (
                        <div className="text-sm">
                          <p className="text-gray-900 font-medium">Remarks:</p>
                          <p className="text-gray-600">{shipment.remarks}</p>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col gap-2 lg:w-48">
                      {shipment.status === "open" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => handleAction(shipment, "reattempt")}
                            className="w-full"
                          >
                            <RotateCcw className="h-4 w-4 mr-2" />
                            Schedule Reattempt
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleAction(shipment, "return_to_origin")
                            }
                            className="w-full"
                          >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Return to Origin
                          </Button>
                        </>
                      )}

                      {shipment.status === "reattempt_scheduled" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() =>
                              handleAction(shipment, "mark_delivered")
                            }
                            className="w-full"
                          >
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Mark Delivered
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleAction(shipment, "return_to_origin")
                            }
                            className="w-full"
                          >
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Return to Origin
                          </Button>
                        </>
                      )}

                      {shipment.status === "closed" && (
                        <Badge
                          variant="default"
                          className="bg-green-600 justify-center"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Resolved
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {actionType === "reattempt" && "Schedule Reattempt"}
              {actionType === "return_to_origin" && "Return to Origin"}
              {actionType === "mark_delivered" && "Mark as Delivered"}
              {actionType === "cancel" && "Cancel Shipment"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedShipment && (
              <div className="bg-gray-50 p-3 rounded-lg">
                <p className="text-sm font-medium">
                  AWB: {selectedShipment.awb}
                </p>
                <p className="text-sm text-gray-600">
                  Customer: {selectedShipment.customerName}
                </p>
              </div>
            )}

            {actionType === "reattempt" && (
              <div>
                <Label htmlFor="scheduledDate">Scheduled Date</Label>
                <Input
                  id="scheduledDate"
                  type="date"
                  value={scheduledDate}
                  onChange={(e) => setScheduledDate(e.target.value)}
                  min={new Date().toISOString().split("T")[0]}
                />
              </div>
            )}

            <div>
              <Label htmlFor="remarks">Remarks</Label>
              <Textarea
                id="remarks"
                placeholder="Add any additional notes..."
                value={actionRemarks}
                onChange={(e) => setActionRemarks(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                onClick={executeAction}
                disabled={isProcessingAction}
                className="flex-1"
              >
                {isProcessingAction ? "Processing..." : "Confirm"}
              </Button>
              <Button
                variant="outline"
                onClick={() => setActionDialogOpen(false)}
                disabled={isProcessingAction}
              >
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
