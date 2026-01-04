"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";

import {
  Search,
  Eye,
  CreditCard,
  IndianRupee,
  Package,
  Users,
  Download,
  RefreshCw,
  Wallet,
  Building2,
  Smartphone,
} from "lucide-react";
import { adminService } from "@/services/adminService";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { settingsService } from "@/services/settingsService";
import { useAuth } from "@/contexts/AuthContext";

export default function AdminCODPayoutsPage() {
  const [pendingShipments, setPendingShipments] = useState<any[]>([]);
  const [payoutHistory, setPayoutHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string>("");
  const [selectedShipments, setSelectedShipments] = useState<string[]>([]);
  const [payoutReference, setPayoutReference] = useState("");
  const [utrNumber, setUtrNumber] = useState("");
  const [processingPayout, setProcessingPayout] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");
  const [users, setUsers] = useState([]);
  const [isPayoutDialogOpen, setIsPayoutDialogOpen] = useState(false);
  const [currentShipment, setCurrentShipment] = useState<any>(null);

  // New billing-related states
  const [userBillingSettings, setUserBillingSettings] = useState<any>(null);
  console.log(userBillingSettings);
  const [loadingBillingSettings, setLoadingBillingSettings] = useState(false);
  const [selectedUserBilling, setSelectedUserBilling] = useState<any>(null);
  const [loadingSelectedUserBilling, setLoadingSelectedUserBilling] =
    useState(false);
  const [processingWalletCredit, setProcessingWalletCredit] = useState(false);

  useEffect(() => {
    loadData();
    getUsers();
  }, []);
  const { user } = useAuth();
  console.log(user);
  useEffect(() => {
    loadPendingShipments();
    // Load billing settings for selected user
    if (selectedUserId) {
      loadSelectedUserBillingSettings(selectedUserId);
    } else {
      setSelectedUserBilling(null);
    }
  }, [selectedUserId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [historyResponse] = await Promise.all([
        adminService.getAllPayoutSummaries(1, 50),
      ]);
      console.log("historyResponse", historyResponse);

      setPayoutHistory(historyResponse?.payoutSummaries || []);
      await loadPendingShipments();
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load COD payout data");
    } finally {
      setLoading(false);
    }
  };

  const loadPendingShipments = async () => {
    try {
      const requestBody = {
        page: 1,
        limit: 100,
        ...(selectedUserId && { userId: selectedUserId }),
      };

      const response = await adminService.getPendingCODShipmentsUserWise(
        requestBody
      );
      console.log(response);
      setPendingShipments(response?.shipments || []);
      setSelectedShipments([]);
    } catch (error) {
      console.error("Error loading pending shipments:", error);
      toast.error("Failed to load pending shipments");
    }
  };

  const getUsers = async () => {
    try {
      const res = await adminService.getAllUsers();
      const filtered = res.users.filter(
        (u: any) => u.role !== "admin" && u.role !== "support"
      );
      setUsers(filtered);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  // New billing settings functions
  const loadBillingSettings = async (userId: string) => {
    if (!userId) return;

    try {
      setLoadingBillingSettings(true);
      const response = await adminService.getBillingSettingsbyId(userId);
      console.log("response", response);
      setUserBillingSettings(response.data || null);
    } catch (error) {
      console.error("Error loading billing settings:", error);
      setUserBillingSettings(null);
    } finally {
      setLoadingBillingSettings(false);
    }
  };

  const loadSelectedUserBillingSettings = async (userId: string) => {
    if (!userId) return;

    try {
      setLoadingSelectedUserBilling(true);
      const response = await adminService.getBillingSettingsbyId(userId);
      console.log("response", response);

      setSelectedUserBilling(response.data || null);
    } catch (error) {
      console.error("Error loading selected user billing settings:", error);
      setSelectedUserBilling(null);
    } finally {
      setLoadingSelectedUserBilling(false);
    }
  };

  const handleWalletCredit = async () => {
    let userIdForCredit = selectedUserId;
    let amountToCredit = selectedShipmentsAmount;
    let shipmentsToProcess = selectedShipments;

    if (currentShipment) {
      userIdForCredit = currentShipment.userId;
      amountToCredit = currentShipment.parcel_value || 0;
      shipmentsToProcess = [currentShipment._id];
    }

    if (!userIdForCredit || amountToCredit <= 0) {
      toast.error("Invalid user or amount for wallet credit");
      return;
    }

    // if (!payoutReference.trim()) {
    //   toast.error("Transaction reference is required");
    //   return;
    // }

    try {
      setProcessingWalletCredit(true);

      // First credit the wallet
      const walletCreditPayload = {
        userId: userIdForCredit,
        amount: amountToCredit,
        paymentMethod: "online",
        reference: "",
        notes: `COD Payout wallet credit - ${
          currentShipment
            ? "1 shipment"
            : `${selectedShipments.length} shipments`
        }`,
      };

      await adminService.creditUserWallet(walletCreditPayload);

      // Then create the payout record
      const payoutPayload = {
        userId: userIdForCredit,
        shipmentIds: shipmentsToProcess,
        payoutReference: payoutReference.trim(),
        utrNumber: "WALLET_CREDIT",
      };

      await adminService.createPayout(payoutPayload);

      toast.success("Wallet credited and payout processed successfully");
      resetPayoutForm();
      await loadData();
    } catch (error: any) {
      console.error("Wallet credit error:", error);
      toast.error("Failed to process wallet credit");
    } finally {
      setProcessingWalletCredit(false);
    }
  };

  const handleShipmentSelect = (shipmentId: string, checked: boolean) => {
    if (checked) {
      setSelectedShipments((prev) => [...prev, shipmentId]);
    } else {
      setSelectedShipments((prev) => prev.filter((id) => id !== shipmentId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      const allShipmentIds = pendingShipments.map((ship) => ship._id);
      setSelectedShipments(allShipmentIds);
    } else {
      setSelectedShipments([]);
    }
  };

  const openPayoutDialog = (shipment?: any) => {
    setCurrentShipment(shipment || null);
    setIsPayoutDialogOpen(true);

    // Load billing settings for the user
    const userIdToLoad = shipment ? shipment.userId : selectedUserId;
    if (userIdToLoad) {
      loadBillingSettings(userIdToLoad);
    }
  };

  const handleProcessPayout = async () => {
    let shipmentsToProcess = selectedShipments;
    let userIdForPayout = selectedUserId;

    if (currentShipment) {
      shipmentsToProcess = [currentShipment._id];
      userIdForPayout = currentShipment.userId;
    }

    if (!userIdForPayout) {
      toast.error("User ID is required for payout processing");
      return;
    }

    if (shipmentsToProcess.length === 0) {
      toast.error("No shipments selected for payout");
      return;
    }

    try {
      setProcessingPayout(true);

      const payoutPayload = {
        userId: userIdForPayout,
        shipmentIds: shipmentsToProcess,
        payoutReference: payoutReference.trim() || undefined,
        utrNumber: utrNumber.trim() || undefined,
      };

      await adminService.createPayout(payoutPayload);
      toast.success("Payout processed successfully");
      resetPayoutForm();
      await loadData();
    } catch (error) {
      console.error("Payout processing error:", error);
      toast.error("Failed to process payout");
    } finally {
      setProcessingPayout(false);
    }
  };

  const resetPayoutForm = () => {
    setSelectedShipments([]);
    setPayoutReference("");
    setUtrNumber("");
    setIsPayoutDialogOpen(false);
    setCurrentShipment(null);
    setUserBillingSettings(null);
    setProcessingWalletCredit(false);
  };

  const filteredPendingShipments = pendingShipments.filter((shipment) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      shipment?.id?.toLowerCase().includes(searchLower) ||
      shipment?.awb?.toLowerCase().includes(searchLower) ||
      shipment?.client_order_id?.toLowerCase().includes(searchLower) ||
      shipment?.consignee_name?.toLowerCase().includes(searchLower)
    );
  });

  const filteredPayoutHistory = payoutHistory.filter((payout) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      payout?.userId?.firstName?.toLowerCase().includes(searchLower) ||
      payout?.userId?.lastName?.toLowerCase().includes(searchLower) ||
      payout?.userId?.email?.toLowerCase().includes(searchLower) ||
      payout?.payoutId?.toLowerCase().includes(searchLower)
    );
  });

  const totalPendingAmount = pendingShipments.reduce(
    (sum, shipment) => sum + (shipment?.parcel_value || 0),
    0
  );

  const selectedShipmentsAmount = pendingShipments
    .filter((ship) => selectedShipments.includes(ship._id))
    .reduce((sum, shipment) => sum + (shipment?.parcel_value || 0), 0);

  const totalProcessedAmount = payoutHistory.reduce(
    (sum, payout) => sum + (payout?.totalPayoutAmount || 0),
    0
  );

  const selectedUser: any = users.find(
    (user: any) => user._id === selectedUserId
  );

  const getPayoutAmount = () => {
    if (currentShipment) {
      return currentShipment.parcel_value || 0;
    }
    return selectedShipmentsAmount;
  };

  const getPayoutUser = () => {
    if (currentShipment) {
      return currentShipment.user;
    }
    return selectedUser;
  };
  console.log(currentShipment);
  console.log(selectedUserBilling);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">COD Payouts</h1>
          <p className="text-gray-600">Manage COD remittance and payouts</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={loadData}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Amount
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{totalPendingAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedUserId ? "For selected user" : "Total pending"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Pending Shipments
            </CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingShipments.length}</div>
            <p className="text-xs text-muted-foreground">
              Delivered COD shipments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Selected Amount
            </CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{selectedShipmentsAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {selectedShipments.length} selected shipments
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Processed Amount
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{totalProcessedAmount.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">Total paid out</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters and User Billing Info */}
      <div className="space-y-4">
        <div className="flex items-center justify-between space-x-4">
          <div className="flex items-center space-x-2 flex-1">
            <div className="relative max-w-sm">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search shipments, AWB, or consignee..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
            <Select
              value={selectedUserId || "all"}
              onValueChange={(value) =>
                setSelectedUserId(value === "all" ? "" : value)
              }
            >
              <SelectTrigger className="w-[250px]">
                <SelectValue placeholder="Select User (Optional)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users.map((user: any) => (
                  <SelectItem key={user._id} value={user._id}>
                    {`${user.firstName || ""} ${user.lastName || ""}`.trim() ||
                      user.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedShipments.length > 0 && (
            <Button onClick={() => openPayoutDialog()}>
              <CreditCard className="h-4 w-4 mr-2" />
              Process Payout ({selectedShipments.length})
            </Button>
          )}
        </div>

        {/* Selected User Billing Information */}
        {selectedUserId && (
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">
                  Selected User Payment Settings
                </CardTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    loadSelectedUserBillingSettings(selectedUserId)
                  }
                  disabled={loadingSelectedUserBilling}
                >
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${
                      loadingSelectedUserBilling ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {loadingSelectedUserBilling ? (
                <div className="space-y-3">
                  <div className="animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                  </div>
                </div>
              ) : selectedUserBilling ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700">
                      User Information
                    </h4>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p className="font-medium">
                        {selectedUser?.name || "Unknown User"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedUser?.email || "No email"}
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedUser?.phone || "No phone"}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700">
                      COD Remittance Method
                    </h4>
                    <div className="bg-gray-50 p-3 rounded-md">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">
                          Payment Method:
                        </span>
                        <Badge
                          variant={
                            selectedUserBilling.codRemittancePaymentMethod ===
                            "wallet"
                              ? "default"
                              : selectedUserBilling.codRemittancePaymentMethod ===
                                "bank"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          <span className="flex items-center">
                            {selectedUserBilling.codRemittancePaymentMethod ===
                              "wallet" && <Wallet className="w-3 h-3 mr-1" />}
                            {selectedUserBilling.codRemittancePaymentMethod ===
                              "bank" && <Building2 className="w-3 h-3 mr-1" />}
                            {selectedUserBilling.codRemittancePaymentMethod ===
                              "upi" && <Smartphone className="w-3 h-3 mr-1" />}
                            {selectedUserBilling.codRemittancePaymentMethod?.toUpperCase() ||
                              "NOT SET"}
                          </span>
                        </Badge>
                      </div>

                      {selectedUserBilling.codRemittancePaymentMethod ===
                        "bank" &&
                        selectedUserBilling.bankDetails && (
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Account:</span>
                              <span className="font-mono">
                                ****
                                {selectedUserBilling.bankDetails.accountNumber?.slice(
                                  -4
                                ) || "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Bank:</span>
                              <span>
                                {selectedUserBilling.bankDetails.bankName ||
                                  "N/A"}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">IFSC:</span>
                              <span className="font-mono">
                                {selectedUserBilling.bankDetails.ifscCode ||
                                  "N/A"}
                              </span>
                            </div>
                          </div>
                        )}

                      {selectedUserBilling.codRemittancePaymentMethod ===
                        "upi" &&
                        selectedUserBilling.upiDetails && (
                          <div className="text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">UPI ID:</span>
                              <span className="font-mono">
                                {selectedUserBilling.upiDetails.upiId || "N/A"}
                              </span>
                            </div>
                          </div>
                        )}

                      {selectedUserBilling.codRemittancePaymentMethod ===
                        "wallet" && (
                        <div className="text-sm">
                          <p className="text-green-700 bg-green-50 p-2 rounded">
                            Payouts will be credited to user's wallet
                            automatically
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-medium text-sm text-gray-700">
                      Payout Summary
                    </h4>
                    <div className="bg-blue-50 p-3 rounded-md">
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">
                          Pending Amount:
                        </span>
                        <span className="font-bold text-blue-600">
                          ₹{totalPendingAmount.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">
                          Shipments:
                        </span>
                        <span className="font-medium">
                          {pendingShipments.length}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-gray-600">Selected:</span>
                        <span className="font-medium text-blue-600">
                          {selectedShipments.length} (₹
                          {selectedShipmentsAmount.toLocaleString()})
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg">
                    <h3 className="font-medium text-amber-800 mb-2">
                      No Payment Settings Configured
                    </h3>
                    <p className="text-sm text-amber-700">
                      This user hasn't set up their COD remittance payment
                      method yet. They need to configure their billing settings
                      before payouts can be processed.
                    </p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>

      {/* Payout Dialog */}
      <Dialog open={isPayoutDialogOpen} onOpenChange={setIsPayoutDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Process COD Payout</DialogTitle>
            <DialogDescription>
              Process payout for{" "}
              {`${getPayoutUser()?.firstName} ${getPayoutUser()?.lastName}` ||
                "Unknown User"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <span className="font-medium">Total Payout Amount:</span>
                <span className="text-2xl font-bold text-blue-600">
                  ₹{getPayoutAmount().toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-600">
                {currentShipment
                  ? "1 shipment"
                  : `${selectedShipments.length} shipments`}{" "}
                selected
              </p>
            </div>

            {/* User Billing Settings */}
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium mb-3">User Payment Settings</h3>
              {loadingBillingSettings ? (
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              ) : userBillingSettings ? (
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Payment Method:</span>
                    <Badge
                      variant={
                        userBillingSettings.codRemittancePaymentMethod ===
                        "wallet"
                          ? "default"
                          : "secondary"
                      }
                    >
                      <span className="flex items-center">
                        {userBillingSettings.codRemittancePaymentMethod ===
                          "wallet" && <Wallet className="w-3 h-3 mr-1" />}
                        {userBillingSettings.codRemittancePaymentMethod ===
                          "bank" && <Building2 className="w-3 h-3 mr-1" />}
                        {userBillingSettings.codRemittancePaymentMethod ===
                          "upi" && <Smartphone className="w-3 h-3 mr-1" />}
                        {userBillingSettings.codRemittancePaymentMethod?.toUpperCase() ||
                          "Not Set"}
                      </span>
                    </Badge>
                  </div>
                  {userBillingSettings.codRemittancePaymentMethod ===
                    "bank" && (
                    <>
                      <div className="flex justify-between text-sm">
                        <span>Account Number:</span>
                        <span className="font-mono">
                          ****
                          {userBillingSettings.bankDetails?.accountNumber?.slice(
                            -4
                          ) || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Bank Name:</span>
                        <span>
                          {userBillingSettings.bankDetails?.bankName || "N/A"}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>IFSC:</span>
                        <span className="font-mono">
                          {userBillingSettings.bankDetails?.ifscCode || "N/A"}
                        </span>
                      </div>
                    </>
                  )}
                  {userBillingSettings.codRemittancePaymentMethod === "upi" && (
                    <div className="flex justify-between text-sm">
                      <span>UPI ID:</span>
                      <span className="font-mono">
                        {userBillingSettings.upiDetails?.upiId || "N/A"}
                      </span>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-amber-600">
                  No payment settings configured for this user
                </p>
              )}
            </div>

            {userBillingSettings?.codRemittancePaymentMethod === "wallet" ? (
              /* Wallet Credit Option */
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 p-4 rounded-lg">
                  <h3 className="font-medium text-green-800 mb-2 flex items-center">
                    <Wallet className="w-4 h-4 mr-2" />
                    Wallet Credit Process
                  </h3>
                  <p className="text-sm text-green-700">
                    This user prefers wallet credits. The amount will be
                    credited to their wallet automatically.
                  </p>
                </div>

                {/* <div>
                  <Label htmlFor="payoutReference">Transaction Reference</Label>
                  <Input
                    required
                    id="payoutReference"
                    value={payoutReference}
                    onChange={(e) => setPayoutReference(e.target.value)}
                    placeholder="Enter transaction reference"
                  />
                </div> */}

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={resetPayoutForm}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleWalletCredit}
                    disabled={processingWalletCredit || processingPayout}
                  >
                    {processingWalletCredit ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Processing Wallet Credit...
                      </>
                    ) : (
                      <>
                        <Wallet className="h-4 w-4 mr-2" />
                        Credit to Wallet
                      </>
                    )}
                  </Button>
                </div>
              </div>
            ) : (
              /* Bank/UPI Payout Option */
              <div className="space-y-4">
                <div>
                  <Label htmlFor="payoutReference">Payout Reference</Label>
                  <Input
                    required
                    id="payoutReference"
                    value={payoutReference}
                    onChange={(e) => setPayoutReference(e.target.value)}
                    placeholder="Enter payout reference"
                  />
                </div>

                <div>
                  <Label htmlFor="utrNumber">UTR Number</Label>
                  <Input
                    required
                    id="utrNumber"
                    value={utrNumber}
                    onChange={(e) => setUtrNumber(e.target.value)}
                    placeholder="Enter UTR number"
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={resetPayoutForm}>
                    Cancel
                  </Button>
                  <Button
                    onClick={handleProcessPayout}
                    disabled={processingPayout}
                  >
                    {processingPayout ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <CreditCard className="h-4 w-4 mr-2" />
                        Process Payout
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="pending">
            Pending COD ({pendingShipments.length})
          </TabsTrigger>
          <TabsTrigger value="history">
            Payout History ({payoutHistory.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Pending COD Shipments</CardTitle>
                  <CardDescription>
                    {selectedUserId
                      ? `Showing shipments for selected user. Select multiple to create payout.`
                      : `All pending COD shipments. Select a user to enable bulk payout.`}
                  </CardDescription>
                </div>
                {selectedUserId && filteredPendingShipments.length > 0 && (
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="select-all"
                      checked={
                        selectedShipments.length ===
                        filteredPendingShipments.length
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <Label htmlFor="select-all" className="text-sm">
                      Select All
                    </Label>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {filteredPendingShipments.length === 0 ? (
                <div className="text-center py-8">
                  <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No pending COD shipments
                  </h3>
                  <p className="text-gray-600">
                    {selectedUserId
                      ? "This user has no pending COD shipments."
                      : "No pending COD shipments found."}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      {selectedUserId && (
                        <TableHead className="w-12">Select</TableHead>
                      )}
                      <TableHead>User</TableHead>
                      <TableHead>Shipment ID</TableHead>
                      <TableHead>AWB</TableHead>
                      <TableHead>Consignee</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Delivered Date</TableHead>
                      {!selectedUserId && <TableHead>Actions</TableHead>}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPendingShipments.map((shipment) => (
                      <TableRow key={shipment._id}>
                        {selectedUserId && (
                          <TableCell>
                            <input
                              type="checkbox"
                              checked={selectedShipments.includes(shipment._id)}
                              onChange={(e) =>
                                handleShipmentSelect(
                                  shipment._id,
                                  e.target.checked
                                )
                              }
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                          </TableCell>
                        )}
                        <TableCell className="font-medium">
                          {`${shipment?.user?.firstName || ""} ${
                            shipment?.user?.lastName || ""
                          }`.trim() || "Unknown User"}
                        </TableCell>
                        <TableCell className="font-medium">
                          {shipment.id || "No ID"}
                        </TableCell>
                        <TableCell>{shipment.awb || "No AWB"}</TableCell>
                        <TableCell>
                          {shipment.consignee_name || "Unknown"}
                        </TableCell>
                        <TableCell>
                          {shipment.consignee_city || "Unknown"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            ₹{(shipment.parcel_value || 0).toLocaleString()}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {shipment.actual_delivery
                            ? new Date(
                                shipment.actual_delivery
                              ).toLocaleDateString()
                            : "Date not available"}
                        </TableCell>
                        {!selectedUserId && (
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openPayoutDialog(shipment)}
                            >
                              <CreditCard className="h-4 w-4 mr-2" />
                              Process Payout
                            </Button>
                          </TableCell>
                        )}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payout History</CardTitle>
              <CardDescription>
                Previously processed COD payouts
              </CardDescription>
            </CardHeader>
            <CardContent>
              {filteredPayoutHistory.length === 0 ? (
                <div className="text-center py-8">
                  <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    No payout history
                  </h3>
                  <p className="text-gray-600">
                    No payouts have been processed yet.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Payout ID</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Shipments</TableHead>
                      <TableHead>Method</TableHead>
                      <TableHead>UTR Number</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredPayoutHistory.map((payout) => (
                      <TableRow key={payout._id}>
                        <TableCell className="font-medium">
                          {payout.payoutId}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">
                              {`${payout?.userId?.firstName || ""} ${
                                payout?.userId?.lastName || ""
                              }`.trim() || "Unknown User"}
                            </p>
                            <p className="text-sm text-gray-600">
                              {payout?.userId?.email || "No email"}
                            </p>
                          </div>
                        </TableCell>
                        <TableCell>
                          ₹{(payout.totalPayoutAmount || 0).toLocaleString()}
                        </TableCell>
                        <TableCell>{payout.shipmentIds?.length || 0}</TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              payout.payoutMethodType === "wallet"
                                ? "default"
                                : payout.payoutMethodType === "bank"
                                ? "secondary"
                                : "outline"
                            }
                          >
                            <span className="flex items-center">
                              {payout.payoutMethodType === "wallet" && (
                                <Wallet className="w-3 h-3 mr-1" />
                              )}
                              {payout.payoutMethodType === "bank" && (
                                <Building2 className="w-3 h-3 mr-1" />
                              )}
                              {payout.payoutMethodType === "upi" && (
                                <Smartphone className="w-3 h-3 mr-1" />
                              )}
                              {(
                                payout?.payoutMethodType || "unknown"
                              ).toUpperCase()}
                            </span>
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {payout.utrNumber === "WALLET_CREDIT" ? (
                            <Badge variant="outline" className="text-green-600">
                              WALLET CREDIT
                            </Badge>
                          ) : (
                            payout.utrNumber || "-"
                          )}
                        </TableCell>
                        <TableCell>
                          {payout.paidOn
                            ? new Date(payout.paidOn).toLocaleDateString()
                            : "Date not available"}
                        </TableCell>
                        <TableCell>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Eye className="h-4 w-4 mr-2" />
                                View
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="max-w-4xl">
                              <DialogHeader>
                                <DialogTitle>
                                  Payout Details - {payout.payoutId}
                                </DialogTitle>
                                <DialogDescription>
                                  Complete payout information and shipment
                                  details
                                </DialogDescription>
                              </DialogHeader>
                              <div className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label>User Information</Label>
                                    <div className="mt-2 p-3 bg-gray-50 rounded">
                                      <p className="font-medium">
                                        {selectedUser?.name || "Unknown User"}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        {payout.userId?.email || "No email"}
                                      </p>
                                      <p className="text-sm text-gray-600">
                                        {payout.userId?.phone || "No phone"}
                                      </p>
                                    </div>
                                  </div>
                                  <div>
                                    <Label>Payout Information</Label>
                                    <div className="mt-2 p-3 bg-gray-50 rounded">
                                      <p>
                                        <span className="font-medium">
                                          Amount:
                                        </span>{" "}
                                        ₹
                                        {(
                                          payout.totalPayoutAmount || 0
                                        ).toLocaleString()}
                                      </p>
                                      <p className="flex items-center">
                                        <span className="font-medium">
                                          Method:
                                        </span>{" "}
                                        <Badge
                                          className="ml-2"
                                          variant={
                                            payout.payoutMethodType === "wallet"
                                              ? "default"
                                              : "secondary"
                                          }
                                        >
                                          <span className="flex items-center">
                                            {payout.payoutMethodType ===
                                              "wallet" && (
                                              <Wallet className="w-3 h-3 mr-1" />
                                            )}
                                            {payout.payoutMethodType ===
                                              "bank" && (
                                              <Building2 className="w-3 h-3 mr-1" />
                                            )}
                                            {payout.payoutMethodType ===
                                              "upi" && (
                                              <Smartphone className="w-3 h-3 mr-1" />
                                            )}
                                            {(
                                              payout.payoutMethodType ||
                                              "unknown"
                                            ).toUpperCase()}
                                          </span>
                                        </Badge>
                                      </p>
                                      <p>
                                        <span className="font-medium">
                                          UTR:
                                        </span>{" "}
                                        {payout.utrNumber ===
                                        "WALLET_CREDIT" ? (
                                          <Badge
                                            variant="outline"
                                            className="text-green-600"
                                          >
                                            WALLET CREDIT
                                          </Badge>
                                        ) : (
                                          payout.utrNumber || "N/A"
                                        )}
                                      </p>
                                      <p>
                                        <span className="font-medium">
                                          Reference:
                                        </span>{" "}
                                        {payout.payoutReference || "N/A"}
                                      </p>
                                      <p>
                                        <span className="font-medium">
                                          Date:
                                        </span>{" "}
                                        {payout.paidOn
                                          ? new Date(
                                              payout.paidOn
                                            ).toLocaleString()
                                          : "Date not available"}
                                      </p>
                                    </div>
                                  </div>
                                </div>

                                <div>
                                  <Label>Shipments Included</Label>
                                  <Table className="mt-2">
                                    <TableHeader>
                                      <TableRow>
                                        <TableHead>Shipment ID</TableHead>
                                        <TableHead>AWB</TableHead>
                                        <TableHead>Order ID</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead>Status</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {payout.shipmentIds?.map(
                                        (shipment: any) => (
                                          <TableRow key={shipment?._id}>
                                            <TableCell>
                                              {shipment?.id || "No ID"}
                                            </TableCell>
                                            <TableCell>
                                              {shipment?.awb || "No AWB"}
                                            </TableCell>
                                            <TableCell>
                                              {shipment?.client_order_id ||
                                                "No Order ID"}
                                            </TableCell>
                                            <TableCell>
                                              ₹
                                              {(
                                                shipment?.parcel?.value || 0
                                              ).toLocaleString()}
                                            </TableCell>
                                            <TableCell>
                                              <Badge variant="secondary">
                                                {"Delivered"}
                                              </Badge>
                                            </TableCell>
                                          </TableRow>
                                        )
                                      )}
                                    </TableBody>
                                  </Table>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
