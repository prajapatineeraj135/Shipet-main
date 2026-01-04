"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Search,
  Filter,
  Eye,
  MessageSquare,
  Clock,
  User,
  AlertCircle,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";
import { formatDate } from "@/lib/utils";
import { supportService } from "@/services/customerSupportService";
import { toast } from "sonner";

const statusColors: any = {
  open: "bg-green-100 text-green-800",
  closed: "bg-gray-100 text-gray-800",
};

export default function AdminHelpdeskPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [pagination, setPagination] = useState({
    current: 1,
    total: 1,
    count: 0,
    totalRecords: 0,
  });

  useEffect(() => {
    loadTickets();
  }, [searchTerm, statusFilter, priorityFilter, assigneeFilter]);

  const loadTickets = async () => {
    try {
      setLoading(true);

      const queryParams = new URLSearchParams({
        page: "1",
        limit: "50",
        ...(statusFilter !== "all" && { status: statusFilter }),
        ...(priorityFilter !== "all" && { priority: priorityFilter }),
        ...(assigneeFilter !== "all" && { assignedTo: assigneeFilter }),
        ...(searchTerm && { search: searchTerm }),
      });

      const response = await supportService.getTickets(queryParams.toString());
      console.log(response);
      if (response) {
        setTickets(response.tickets || []);
        setPagination(
          response.pagination || {
            current: 1,
            total: 1,
            count: 0,
            totalRecords: 0,
          }
        );
      } else {
        toast.error("Failed to fetch tickets:");
        setTickets([]);
      }
    } catch (error) {
      toast.error("Error loading tickets");
      setTickets([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredTickets = tickets || [];

  // Calculate stats from the current tickets
  const stats = {
    total: filteredTickets.length,
    open: filteredTickets.filter((t) => t.status === "open").length,
    closed: filteredTickets.filter((t) => t.status === "closed").length,
    urgent: filteredTickets.filter((t) => t.priority === "urgent").length,
  };

  const handleRefresh = () => {
    loadTickets();
  };

  const getInitials = (name: any) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n: any) => n[0])
      .join("")
      .toUpperCase();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Helpdesk Management</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[...Array(5)].map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card>
          <CardContent className="p-6">
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
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
        <h1 className="text-3xl font-bold">Helpdesk Management</h1>
        <Button onClick={handleRefresh} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <MessageSquare className="h-8 w-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">
                  Total Tickets
                </p>
                <p className="text-2xl font-bold">
                  {pagination.totalRecords || stats.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Open</p>
                <p className="text-2xl font-bold">{stats.open}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <User className="h-8 w-8 text-gray-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Closed</p>
                <p className="text-2xl font-bold">{stats.closed}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Urgent</p>
                <p className="text-2xl font-bold">{stats.urgent}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tickets, AWB, customer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle>
            Support Tickets ({pagination.count || filteredTickets.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket ID</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>AWB/Shipment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTickets.map((ticket) => (
                  <TableRow key={ticket.ticketId || ticket._id}>
                    <TableCell className="font-medium">
                      {ticket.ticketId}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <div>
                          <div className="font-medium">
                            {ticket.userName || "Unknown User"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {ticket.userEmail || ticket.email || "No email"}
                          </div>
                          <div className="text-sm text-gray-500">
                            {ticket.userPhone || ticket.mobile || "No phone"}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{ticket.subject}</div>
                        <div className="text-sm text-gray-500">
                          {ticket.topic}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {ticket.awb && (
                          <div className="font-medium">{ticket.awb}</div>
                        )}
                        {ticket.shipment_id && (
                          <div className="text-gray-500">
                            ID: {ticket.shipment_id}
                          </div>
                        )}
                        {!ticket.awb && !ticket.shipment_id && (
                          <span className="text-gray-400">No shipment</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[ticket.status]}>
                        {ticket.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {formatDate(ticket.createdAt)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link
                        href={`/customer-support/helpdesk/${ticket.ticketId}`}
                      >
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {filteredTickets.length === 0 && !loading && (
            <div className="text-center py-8">
              <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No tickets found
              </h3>
              <p className="text-gray-500">
                {searchTerm ||
                statusFilter !== "all" ||
                priorityFilter !== "all" ||
                assigneeFilter !== "all"
                  ? "Try adjusting your filters to see more tickets."
                  : "No support tickets have been created yet."}
              </p>
            </div>
          )}

          {/* Pagination Info */}
          {pagination.totalRecords > 0 && (
            <div className="flex items-center justify-between mt-4 pt-4 border-t">
              <div className="text-sm text-gray-500">
                Showing {pagination.count} of {pagination.totalRecords} tickets
              </div>
              <div className="text-sm text-gray-500">
                Page {pagination.current} of {pagination.total}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
