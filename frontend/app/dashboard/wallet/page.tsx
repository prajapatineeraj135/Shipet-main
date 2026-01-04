"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
// import * as XLSX from "xlsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { walletService } from "@/services/walletService";
import { toast } from "sonner";
import {
  Plus,
  Download,
  Search,
  Wallet,
  TrendingUp,
  TrendingDown,
  CreditCard,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle,
  Eye,
  ArrowUpRight,
  ArrowDownRight,
  IndianRupee,
  Calendar,
  Filter,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDateTime } from "@/lib/utils";
import { downloadInvoicePDF } from "@/lib/pdfGenerator";

export default function WalletPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState<any>("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [monthFilter, setMonthFilter] = useState("all");
  const [rechargeAmount, setRechargeAmount] = useState("");
  const [isRecharging, setIsRecharging] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<any>(null);
  const [showTransactionDetails, setShowTransactionDetails] = useState(false);
  const [selectedYear, setSelectedYear] = useState(
    new Date().getFullYear().toString()
  );
  const [selectedMonth, setSelectedMonth] = useState(
    (new Date().getMonth() + 1).toString()
  );
  const [isDownloading, setIsDownloading] = useState(false);

  // Generate years (current year and 2 years back)
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 3 }, (_, i) => currentYear - i);

  // Months array
  const months = [
    { value: "1", label: "January" },
    { value: "2", label: "February" },
    { value: "3", label: "March" },
    { value: "4", label: "April" },
    { value: "5", label: "May" },
    { value: "6", label: "June" },
    { value: "7", label: "July" },
    { value: "8", label: "August" },
    { value: "9", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
  ];
  const handleDownloadInvoice = async () => {
    if (!selectedYear || !selectedMonth) {
      alert("Please select both year and month");
      return;
    }

    setIsDownloading(true);
    try {
      const response = await walletService.exportTransactions(
        selectedMonth,
        selectedYear
      );
      console.log("response", response);

      if (response.transactions.length !== 0) {
        const success = downloadInvoicePDF(response);
      } else toast.info("No transactions found for the selected month");
    } catch (error: any) {
      toast.error("Error downloading invoice");

      console.log(error);
    } finally {
      setIsDownloading(false);
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, []);

  const fetchWalletData = async () => {
    try {
      setIsLoading(true);
      const [transactionsData, statsData]: any = await Promise.all([
        walletService.getTransactions({
          type: typeFilter,
          status: statusFilter,
          month: monthFilter,
          search: searchTerm,
          limit: 100,
        }),
        walletService.getWalletStats(),
      ]);
      console.log("transactionsData", transactionsData);
      console.log("statsData", statsData);

      setTransactions(transactionsData.transactions);

      setStats(statsData);
    } catch (error) {
      toast.error("Failed to fetch wallet data");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchWalletData();
    setIsRefreshing(false);
    toast.success("Wallet data refreshed");
  };

  const handleRecharge = async () => {
    if (!rechargeAmount || parseFloat(rechargeAmount) <= 0) {
      toast.error("Please enter a valid amount");

      return;
    }

    if (parseFloat(rechargeAmount) < 100) {
      toast.error("Minimum recharge amount is ₹100");
      return;
    }

    if (parseFloat(rechargeAmount) > 100000) {
      toast.error("Maximum recharge amount is ₹1,00,000");
      return;
    }

    setIsRecharging(true);
    try {
      await walletService.rechargeWallet(parseFloat(rechargeAmount));
      toast.success(`Wallet recharged with ₹${rechargeAmount} successfully`);

      setRechargeAmount("");
      fetchWalletData();
    } catch (error) {
      toast.error("Failed to recharge wallet");
    } finally {
      setIsRecharging(false);
    }
  };

  const handleExportTransactions = async (
    format: "csv" | "excel",
    transactions: any[]
  ) => {
    try {
      if (!transactions || transactions.length === 0) {
        toast.error("No transactions to export");
        return;
      }
      const cleanedData = transactions.map((txn: any) => ({
        Date: new Date(txn.createdAt).toLocaleString(),
        Description: txn.description,
        Reference: txn.reference,
        "Payment Method": txn.paymentMethod,
        Type: txn.type,
        Status: txn.status,
      }));
      const fileName = `wallet_transactions_${
        new Date().toISOString().split("T")[0]
      }`;

      if (format === "csv") {
        const csvContent = generateCSV(cleanedData);
        const blob = new Blob([csvContent], {
          type: "text/csv;charset=utf-8;",
        });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${fileName}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      }

      if (format === "excel") {
        // const worksheet = XLSX.utils.json_to_sheet(cleanedData);
        // const workbook = XLSX.utils.book_new();
        // XLSX.utils.book_append_sheet(workbook, worksheet, "Transactions");
        // const excelBuffer = XLSX.write(workbook, {
        //   bookType: "xlsx",
        //   type: "array",
        // });
        // const blob = new Blob([excelBuffer], {
        //   type: "application/octet-stream",
        // });
        // const url = window.URL.createObjectURL(blob);
        // const a = document.createElement("a");
        // a.href = url;
        // a.download = `${fileName}.xlsx`;
        // document.body.appendChild(a);
        // a.click();
        // document.body.removeChild(a);
        // window.URL.revokeObjectURL(url);
      }

      toast.success("Transactions exported successfully");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export transactions");
    }
  };

  // CSV generator helper
  function generateCSV(rows: any[]): string {
    const separator = ",";
    const keys = Object.keys(rows[0]);
    const csvContent =
      keys.join(separator) +
      "\n" +
      rows
        .map((row) =>
          keys
            .map((k) => `"${(row[k] ?? "").toString().replace(/"/g, '""')}"`)
            .join(separator)
        )
        .join("\n");
    return csvContent;
  }

  const handleSearch = () => {
    fetchWalletData();
  };

  const handleFilterChange = (filterType: any, value: any) => {
    switch (filterType) {
      case "type":
        setTypeFilter(value);
        break;
      case "status":
        setStatusFilter(value);
        break;
      case "month":
        setMonthFilter(value);
        break;
    }
  };

  useEffect(() => {
    fetchWalletData();
  }, [typeFilter, statusFilter, monthFilter]);

  const viewTransactionDetails = async (transactionId: any) => {
    try {
      console.log(transactionId);
      const transaction = await walletService.getTransactionById(transactionId);
      setSelectedTransaction(transaction);
      setShowTransactionDetails(true);
    } catch (error) {
      toast.error("Failed to fetch transaction details");
    }
  };

  const filteredTransactions = transactions?.filter((transaction) => {
    const matchesSearch =
      transaction.description
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      transaction.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (transaction.orderId &&
        transaction.orderId.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesSearch;
  });

  const getStatusColor = (status: any) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800 border-green-200";
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "failed":
        return "bg-red-100 text-red-800 border-red-200";
      case "cancelled":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: any) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      case "failed":
        return <XCircle className="h-4 w-4" />;
      case "cancelled":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getTypeIcon = (type: any) => {
    return type === "credit" ? (
      <ArrowUpRight className="h-4 w-4 text-green-600" />
    ) : (
      <ArrowDownRight className="h-4 w-4 text-red-600" />
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
          <Skeleton className="h-10 w-24" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 })?.map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-3 w-16" />
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-32" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex space-x-4">
                <Skeleton className="h-10 flex-1" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-20" />
                <Skeleton className="h-10 w-24" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Wallet</h1>
          <p className="text-gray-600">
            Manage your wallet balance and transactions
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Invoice Download Section */}{" "}
          <Calendar className="h-4 w-4 text-gray-500" />
          {/* Year Selector */}
          <div className="flex items-center gap-2">
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-20 h-8 border-2 ">
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Month Selector */}
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-20 h-8 border-2 ">
                <SelectValue placeholder="Month" />
              </SelectTrigger>
              <SelectContent>
                {months.map((month) => (
                  <SelectItem key={month.value} value={month.value}>
                    {month.label.slice(0, 3)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {/* Download Button */}
            <Button
              onClick={handleDownloadInvoice}
              variant="outline"
              size="sm"
              disabled={isDownloading}
              className="h-8"
            >
              <Download
                className={`h-3 w-3 ${isDownloading ? "animate-pulse" : ""}`}
              />
            </Button>
          </div>
          {/* Refresh Button */}
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={isRefreshing}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isRefreshing ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        </div>
      </div>

      {/* Low Balance Alert */}
      {stats && stats?.balance < 1000 && (
        <Alert className="border-yellow-200 bg-yellow-50">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <AlertDescription className="text-yellow-800">
            Your wallet balance is low (₹{stats.balance.toFixed(2)}). Consider
            recharging to avoid shipping delays.
          </AlertDescription>
        </Alert>
      )}

      {/* Wallet Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Current Balance
            </CardTitle>
            <div className="p-2 bg-blue-100 rounded-full">
              <Wallet className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600 flex items-center">
              <IndianRupee className="h-5 w-5 mr-1" />
              {stats?.balance?.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Available for shipping
            </p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Credits</CardTitle>
            <div className="p-2 bg-green-100 rounded-full">
              <TrendingUp className="h-4 w-4 text-green-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 flex items-center">
              <IndianRupee className="h-5 w-5 mr-1" />
              {stats?.totalCredits?.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Money added</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-red-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Debits</CardTitle>
            <div className="p-2 bg-red-100 rounded-full">
              <TrendingDown className="h-4 w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 flex items-center">
              <IndianRupee className="h-5 w-5 mr-1" />
              {stats?.totalDebits?.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Money spent</p>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-purple-500">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Monthly Spend</CardTitle>
            <div className="p-2 bg-purple-100 rounded-full">
              <CreditCard className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 flex items-center">
              <IndianRupee className="h-5 w-5 mr-1" />
              {stats?.monthlySpend?.toFixed(2) || "0.00"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>
      </div>

      {/* Recharge Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Recharge Wallet</span>
          </CardTitle>
          <p className="text-sm text-gray-600">
            Add money to your wallet for seamless shipping
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4 items-end">
            <div className="flex-1">
              <label
                htmlFor="rechargeAmount"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Amount (₹)
              </label>
              <Input
                id="rechargeAmount"
                type="number"
                placeholder="Enter amount (Min: ₹100, Max: ₹1,00,000)"
                value={rechargeAmount}
                onChange={(e) => setRechargeAmount(e.target.value)}
                min="100"
                max="100000"
                step="1"
              />
            </div>
            <div className="flex flex-wrap gap-2">
              {[500, 1000, 2000, 5000, 10000]?.map((amount) => (
                <Button
                  key={amount}
                  variant="outline"
                  size="sm"
                  onClick={() => setRechargeAmount(amount.toString())}
                  className="min-w-[80px]"
                >
                  ₹{amount}
                </Button>
              ))}
            </div>
            <Button
              onClick={handleRecharge}
              disabled={
                isRecharging ||
                !rechargeAmount ||
                parseFloat(rechargeAmount) < 100
              }
              className="min-w-[120px]"
            >
              <Plus className="mr-2 h-4 w-4" />
              {isRecharging ? "Processing..." : "Recharge"}
            </Button>
          </div>
          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-gray-600">
              <AlertCircle className="h-4 w-4" />
              <span>
                Secure payment processing. Your money will be instantly credited
                to your wallet.
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transactions */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
            <div>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="h-5 w-5" />
                <span>Transaction History</span>
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                Showing {filteredTransactions?.length} of {transactions?.length}{" "}
                transactions
              </p>
            </div>
            <div className="flex flex-col md:flex-row space-y-2 md:space-y-0 md:space-x-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                  className="pl-10 w-full md:w-64"
                />
              </div>
              <Select
                value={typeFilter}
                onValueChange={(value) => handleFilterChange("type", value)}
              >
                <SelectTrigger className="w-full md:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="credit">Credit</SelectItem>
                  <SelectItem value="debit">Debit</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={statusFilter}
                onValueChange={(value) => handleFilterChange("status", value)}
              >
                <SelectTrigger className="w-full md:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select
                value={monthFilter}
                onValueChange={(value) => handleFilterChange("month", value)}
              >
                <SelectTrigger className="w-full md:w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Months</SelectItem>
                  <SelectItem value="0">January</SelectItem>
                  <SelectItem value="1">February</SelectItem>
                  <SelectItem value="2">March</SelectItem>
                  <SelectItem value="3">April</SelectItem>
                  <SelectItem value="4">May</SelectItem>
                  <SelectItem value="5">June</SelectItem>
                  <SelectItem value="6">July</SelectItem>
                  <SelectItem value="7">August</SelectItem>
                  <SelectItem value="8">September</SelectItem>
                  <SelectItem value="9">October</SelectItem>
                  <SelectItem value="10">November</SelectItem>
                  <SelectItem value="11">December</SelectItem>
                </SelectContent>
              </Select>
              <Button
                onClick={() => handleExportTransactions("csv", transactions)}
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
              {/* <Button
                onClick={() => handleExportTransactions("csv", transactions)}
                variant="outline"
              >
                <Download className="mr-2 h-4 w-4" />
                Excel
              </Button> */}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reference</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions?.map((transaction) => (
                  <TableRow
                    key={transaction._id || transaction.id}
                    className="hover:bg-gray-50"
                  >
                    <TableCell className="font-mono text-sm">
                      {formatDateTime(transaction.createdAt)}
                    </TableCell>
                    <TableCell>
                      <div
                        className="max-w-xs truncate"
                        title={transaction.description}
                      >
                        {transaction.description}
                      </div>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {transaction.reference}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(transaction.type)}
                        <Badge
                          className={
                            transaction.type === "credit"
                              ? "bg-green-100 text-green-800 border-green-200"
                              : "bg-red-100 text-red-800 border-red-200"
                          }
                        >
                          {transaction.type === "credit" ? "Credit" : "Debit"}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span
                        className={`font-medium flex items-center ${
                          transaction.type === "credit"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {transaction.type === "credit" ? "+" : "-"}
                        <IndianRupee className="h-3 w-3 mx-1" />
                        {transaction.amount?.toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(transaction.status)}
                        <Badge className={getStatusColor(transaction.status)}>
                          {transaction.status.charAt(0).toUpperCase() +
                            transaction.status.slice(1)}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewTransactionDetails(transaction?._id)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {filteredTransactions?.length === 0 && (
            <div className="text-center py-12">
              <Wallet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No transactions found
              </h3>
              <p className="text-gray-500">
                {searchTerm || typeFilter !== "all" || monthFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Start by recharging your wallet to see transactions here"}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Transaction Details Modal would go here */}
      {showTransactionDetails && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-medium mb-4">Transaction Details</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500">Reference</label>
                <p className="font-mono">{selectedTransaction.reference}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Amount</label>
                <p
                  className={`font-medium ${
                    selectedTransaction.type === "credit"
                      ? "text-green-600"
                      : "text-red-600"
                  }`}
                >
                  {selectedTransaction.type === "credit" ? "+" : "-"}₹
                  {selectedTransaction.amount?.toFixed(2)}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Status</label>
                <Badge className={getStatusColor(selectedTransaction.status)}>
                  {selectedTransaction.status}
                </Badge>
              </div>
              <div>
                <label className="text-sm text-gray-500">Date & Time</label>
                <p>{formatDateTime(selectedTransaction.createdAt)}</p>
              </div>
              {selectedTransaction.description && (
                <div>
                  <label className="text-sm text-gray-500">Description</label>
                  <p>{selectedTransaction.description}</p>
                </div>
              )}
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowTransactionDetails(false)}
              >
                Close
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
