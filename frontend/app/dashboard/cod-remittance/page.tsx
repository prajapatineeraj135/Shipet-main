"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Search,
  IndianRupee,
  Clock,
  CheckCircle,
  Eye,
  RefreshCw,
  Info,
  Building2,
  Smartphone,
  Wallet,
  CreditCard,
} from "lucide-react";
import codRemittanceService from "@/services/codRemittanceService";
import { ICARRY_STATUS_MAPPING } from "@/lib/statusMapping";
import { formatCurrency, formatDate, formatTime } from "@/lib/utils";

export default function CODRemittanceSystem() {
  const [codShipments, setCODShipments] = useState<any[]>([]);
  const [payouts, setPayouts] = useState<any[]>([]);
  const [payoutDetails, setPayoutDetails] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPayoutId, setSelectedPayoutId] = useState(null);
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);

  const [filters, setFilters] = useState({
    search: "",
    status: "all",
    dateFrom: "",
    dateTo: "",
  });

  const [summary, setSummary] = useState({
    totalPendingCOD: 0,
    settlementCycle: "T+7 days",
    totalRemitted: 0,
    totalPayouts: 0,
    lastPayout: null,
  });

  useEffect(() => {
    fetchCODShipments();
    fetchPayoutSummaries();
  }, []);

  const fetchCODShipments = async () => {
    try {
      setIsLoading(true);
      const response: any = await codRemittanceService.getCODShipments(filters);
      console.log("cod shipments", response);
      setCODShipments(response.shipments || []);
      setSummary((prev) => ({
        ...prev,
        totalPendingCOD: response.summary.totalPendingCOD,
        settlementCycle: response.summary.settlementCycle,
      }));
    } catch (error) {
      console.error("Error fetching COD shipments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchPayoutSummaries = async () => {
    try {
      const response: any = await codRemittanceService.getCODRemittances(
        filters
      );
      console.log("payout summaries", response);

      if (response.payoutSummaries) {
        setPayouts(response.payoutSummaries);
        setSummary((prev) => ({
          ...prev,
          totalRemitted: response.summary.totalRemitted,
          totalPayouts: response.summary.totalPayouts,
          lastPayout: response.summary.lastPayout,
        }));
      }
    } catch (error) {
      console.error("Error fetching payout summaries:", error);
    }
  };

  const getRemittedStatusBadge = (status: any) => {
    const statusConfig: any = {
      pending: { label: "Pending", variant: "secondary", icon: Clock },
      completed: { label: "Remitted", variant: "default", icon: CheckCircle },
      processing: { label: "Processing", variant: "outline", icon: RefreshCw },
    };

    const config = statusConfig[status] || {
      label: "Unknown",
      variant: "secondary",
      icon: Clock,
    };
    const Icon = config.icon;

    return (
      <Badge variant={config.variant} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const getPayoutMethodIcon = (type: any) => {
    switch (type) {
      case "bank":
        return <Building2 className="h-4 w-4" />;
      case "upi":
        return <Smartphone className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const handleViewPayout = async (payoutId: any) => {
    try {
      setSelectedPayoutId(payoutId);

      const response = await codRemittanceService.getPayoutDetails(payoutId);
      console.log("payout details", response);

      if (response) {
        setPayoutDetails(response);
        setShowPayoutDialog(true);
      }
    } catch (error) {
      console.error("Error fetching payout details:", error);
    }
  };

  const handleRefresh = () => {
    fetchCODShipments();
    fetchPayoutSummaries();
  };

  const filteredShipments = codShipments.filter((shipment) => {
    const matchesSearch =
      !filters.search ||
      shipment.id?.toLowerCase().includes(filters.search.toLowerCase()) ||
      shipment.client_order_id
        ?.toLowerCase()
        .includes(filters.search.toLowerCase()) ||
      shipment.awb?.toLowerCase().includes(filters.search.toLowerCase()) ||
      shipment.consignee?.name
        ?.toLowerCase()
        .includes(filters.search.toLowerCase()) ||
      shipment.consignee?.mobile?.includes(filters.search);

    const matchesStatus =
      filters.status === "all" ||
      (filters.status === "pending" &&
        shipment.codRemittedStatus === "pending") ||
      (filters.status === "completed" &&
        shipment.codRemittedStatus === "completed") ||
      (filters.status === "21" && shipment.status === "21");

    return matchesSearch && matchesStatus;
  });

  const filteredPayouts = payouts?.filter((payout) => {
    const matchesSearch =
      !filters.search ||
      payout.payoutId?.toLowerCase().includes(filters.search.toLowerCase()) ||
      payout.payoutReference
        ?.toLowerCase()
        .includes(filters.search.toLowerCase()) ||
      payout.utrNumber?.toLowerCase().includes(filters.search.toLowerCase());

    return matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">COD Remittance</h1>
          <p className="text-muted-foreground">
            Manage your cash on delivery collections and settlements
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex items-center gap-2"
            onClick={handleRefresh}
          >
            <RefreshCw className="h-4 w-4" />
            Sync
          </Button>
        </div>
      </div>

      {/* Important Notice */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          <strong>Reduce Returns:</strong> COD Payment credited 8 days after
          shipment is delivered (T+7 days settlement cycle)
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="shipments" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="shipments">My COD Shipments</TabsTrigger>
          <TabsTrigger value="remittances">My COD Remittances</TabsTrigger>
        </TabsList>

        <TabsContent value="shipments" className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5" />
                Total Pending COD Remittance:{" "}
                {formatCurrency(summary.totalPendingCOD)}
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                COD Remittance Cycle: <strong>{summary.settlementCycle}</strong>{" "}
                (COD Payment credited 8 days after shipment is delivered)
              </p>
            </CardHeader>
          </Card>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Search</Label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search Shipment ID, AWB, Customer..."
                      value={filters.search}
                      onChange={(e) =>
                        setFilters({ ...filters, search: e.target.value })
                      }
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Remittance Status</Label>
                  <Select
                    value={filters.status}
                    onValueChange={(value) =>
                      setFilters({ ...filters, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">
                        Pending Remittance
                      </SelectItem>
                      <SelectItem value="completed">Remitted</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Date Range</Label>
                  <div className="flex gap-2">
                    <Input
                      type="date"
                      value={filters.dateFrom}
                      onChange={(e) =>
                        setFilters({ ...filters, dateFrom: e.target.value })
                      }
                    />
                    <Input
                      type="date"
                      value={filters.dateTo}
                      onChange={(e) =>
                        setFilters({ ...filters, dateTo: e.target.value })
                      }
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* COD Shipments Table */}
          <Card>
            <CardHeader>
              <CardTitle>COD Shipments</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>Loading...</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Shipment ID</TableHead>
                        <TableHead>AWB</TableHead>
                        <TableHead>Customer</TableHead>
                        <TableHead>Delivered On</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Amount ₹</TableHead>
                        <TableHead>Remittance Status</TableHead>
                        <TableHead>Paid On</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredShipments.length > 0 ? (
                        filteredShipments.map((shipment) => (
                          <TableRow key={shipment._id}>
                            <TableCell className="font-medium">
                              {shipment.id}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {shipment.awb}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <p className="font-medium">
                                  {shipment.consignee?.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {shipment.consignee?.mobile}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>
                              {shipment.actual_delivery
                                ? formatDate(shipment.actual_delivery)
                                : "-"}
                            </TableCell>
                            <TableCell>
                              <Badge
                                className={`text-sm ${
                                  ICARRY_STATUS_MAPPING.statusConfig[
                                    shipment?.status
                                  ]?.color
                                }`}
                              >
                                {ICARRY_STATUS_MAPPING.codeToString[
                                  shipment?.status
                                ] || "Processing"}
                              </Badge>
                            </TableCell>
                            <TableCell className="font-medium">
                              {formatCurrency(shipment.parcel?.value)}
                            </TableCell>
                            <TableCell>
                              {getRemittedStatusBadge(
                                shipment.codRemittedStatus
                              )}
                            </TableCell>
                            <TableCell>
                              {shipment.cod_remitted_date ? (
                                <span className="text-sm">
                                  {formatTime(shipment.cod_remitted_date)}
                                </span>
                              ) : (
                                "—"
                              )}
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="text-center py-4 text-muted-foreground"
                          >
                            No Data
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="remittances" className="space-y-6">
          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5" />
                Remittance Summary
              </CardTitle>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Total Remitted
                  </p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(summary.totalRemitted)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Payouts</p>
                  <p className="text-lg font-bold">{summary.totalPayouts}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Last Payout</p>
                  <p className="text-lg font-bold">
                    {summary?.lastPayout
                      ? formatDate(summary?.lastPayout)
                      : "-"}
                  </p>
                </div>
              </div>
            </CardHeader>
          </Card>

          {/* Payouts Table */}
          <Card>
            <CardHeader>
              <CardTitle>My COD Remittances</CardTitle>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <p>Loading...</p>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Payout ID</TableHead>
                        <TableHead>Total Amount ₹</TableHead>
                        <TableHead>Method</TableHead>
                        <TableHead>Paid On</TableHead>
                        <TableHead>Reference</TableHead>
                        <TableHead>UTR Number</TableHead>
                        <TableHead>Action</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayouts.length > 0 ? (
                        filteredPayouts.map((payout) => (
                          <TableRow key={payout._id}>
                            <TableCell className="font-medium">
                              {payout.payoutId}
                            </TableCell>
                            <TableCell className="font-medium text-green-600">
                              {formatCurrency(payout.totalPayoutAmount)}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getPayoutMethodIcon(payout.payoutMethodType)}
                                <span className="capitalize">
                                  {payout.payoutMethodType}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell>{formatDate(payout.paidOn)}</TableCell>
                            <TableCell className="font-mono text-sm">
                              {payout.payoutReference || "—"}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {payout.utrNumber || "—"}
                            </TableCell>
                            <TableCell>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  handleViewPayout(payout.payoutId)
                                }
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={8}
                            className="text-center py-4 text-muted-foreground"
                          >
                            No Data
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Payout Details Dialog */}
      <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Payout Details - {selectedPayoutId}</DialogTitle>
          </DialogHeader>

          {payoutDetails && (
            <div className="space-y-6">
              {/* Payout Summary */}
              <Card>
                <CardHeader>
                  <CardTitle>Remittance Payout</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Payout ID
                      </Label>
                      <p className="text-md font-semibold">
                        {payoutDetails.payoutSummary.payoutId}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Total Amount
                      </Label>
                      <p className="text-md font-semibold text-green-600">
                        {formatCurrency(
                          payoutDetails.payoutSummary.totalPayoutAmount
                        )}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Payment Method
                      </Label>
                      <div className="flex items-center gap-2 mt-1">
                        {getPayoutMethodIcon(
                          payoutDetails.payoutSummary.payoutMethodType
                        )}
                        <span className="capitalize font-medium">
                          {payoutDetails.payoutSummary.payoutMethodType}
                        </span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Paid On
                      </Label>
                      <p className="text-md font-semibold">
                        {formatDate(payoutDetails.payoutSummary.paidOn)}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Reference
                      </Label>
                      <p className="text-md font-semibold font-mono">
                        {payoutDetails.payoutSummary.payoutReference || "—"}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        UTR Number
                      </Label>
                      <p className="text-md font-semibold font-mono">
                        {payoutDetails.payoutSummary.utrNumber || "—"}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Shipment Details */}
              <Card>
                <CardHeader>
                  <CardTitle>
                    Shipment Details (
                    {payoutDetails.payoutSummary.totalShipments} shipments)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Shipment ID</TableHead>
                          <TableHead>AWB</TableHead>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Amount ₹</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>City</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {payoutDetails.shipments.map((shipment: any) => (
                          <TableRow key={shipment._id}>
                            <TableCell className="font-medium">
                              {shipment.shipment_id}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {shipment.awb}
                            </TableCell>
                            <TableCell className="font-mono text-sm">
                              {shipment.order_id || shipment.client_order_id}
                            </TableCell>
                            <TableCell className="font-medium text-green-600">
                              {formatCurrency(shipment.amount)}
                            </TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <p className="font-medium">
                                  {shipment.consignee?.name}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {shipment.consignee?.mobile}
                                </p>
                              </div>
                            </TableCell>
                            <TableCell>{shipment.consignee?.city}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
