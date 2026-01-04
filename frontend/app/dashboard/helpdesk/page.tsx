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
  Plus,
  MessageSquare,
  User,
  Mail,
  X,
  Eye,
  Edit,
  Trash2,
  HelpCircle,
  AlertCircle,
  MessageCircle,
  Tag,
  Paperclip,
  UserCheck,
  CheckCircle2,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { formatDateTime } from "@/lib/utils";
import { COMPLAINT_TOPICS } from "@/lib/constant";
import { helpdeskService } from "@/services/helpdeskService";

export default function HelpdeskPage() {
  const [tickets, setTickets] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<any>(null);
  const [showTicketDetails, setShowTicketDetails] = useState(false);
  const [publicComments, setPublicComments] = useState<any[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  // Form state
  const [formData, setFormData] = useState({
    subject: "",
    topic: "",
    description: "",
    mobile: "",
    awb: "",
    email: "",
    shipment_id: "",
  });

  const [formErrors, setFormErrors] = useState<any>({});

  useEffect(() => {
    fetchTickets();
  }, []);

  // Add effect to refetch when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchTickets();
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm, statusFilter, priorityFilter]);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      console.log("Fetching tickets...");
      const params = {
        page: 1,
        limit: 50,
        status: statusFilter !== "all" ? statusFilter : undefined,
        priority: priorityFilter !== "all" ? priorityFilter : undefined,
        search: searchTerm || undefined,
        sortBy: "createdAt",
        sortOrder: "desc",
      };

      const response: any = await helpdeskService.getTickets(params);
      console.log("Tickets response:", response);

      // Handle response structure based on your API
      const ticketsData =
        response?.tickets || response?.tickets || response || [];
      setTickets(ticketsData);

      console.log("Tickets set:", ticketsData);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      toast.error("Failed to fetch tickets");
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    fetchTickets();
    toast.info("Tickets refreshed");
  };
  const validateForm = () => {
    let errors: any = {};

    if (!formData.subject.trim()) {
      errors.subject = "Complaint Summary is required";
    }

    if (!formData.topic) {
      errors.topic = "Complaint Topic is required";
    }

    if (!formData.description.trim()) {
      errors.description = "Detailed Description is required";
    }
    if (!formData.shipment_id.trim()) {
      errors.shipment_id = "Detailed shipment ID is required";
    }
    if (!formData.mobile.trim()) {
      errors.mobile = "Mobile Number is required";
    } else if (!/^\+?[\d\s-()]{10,}$/.test(formData.mobile.trim())) {
      errors.mobile = "Please enter a valid mobile number";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    setIsSubmitting(true);

    try {
      const selectedTopic = COMPLAINT_TOPICS.find(
        (topic) => topic.label === formData.topic
      );
      const priority = selectedTopic?.priority || "low"; // fallback to medium
      const ticketPayload = {
        priority,
        subject: formData.subject.trim(),
        topic: formData.topic,
        description: formData.description.trim(),
        mobile: formData.mobile.trim(),
        email: formData.email ? formData.email.trim() : undefined,
        awb: formData.awb ? formData.awb.trim() : undefined,
        shipment_id: formData.shipment_id,
      };
      console.log(ticketPayload);

      const response = await helpdeskService.createTicket(ticketPayload);
      setTickets((prev) => [response, ...prev]);
      setShowCreateModal(false);
      setFormData({
        subject: "",
        topic: "",
        description: "",
        mobile: "",
        awb: "",
        email: "",
        shipment_id: "",
      });
      setFormErrors({});
      toast.success("Support ticket created successfully!");
      // Refresh tickets to get latest data
      fetchTickets();
    } catch (error) {
      toast.error("Failed to create ticket. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: any, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (formErrors[field]) {
      setFormErrors((prev: any) => ({ ...prev, [field]: "" }));
    }
  };

  const handleCloseModal = () => {
    setShowCreateModal(false);
    setFormData({
      subject: "",
      topic: "",
      description: "",
      mobile: "",
      awb: "",
      email: "",
      shipment_id: "",
    });
    setFormErrors({});
  };

  const getStatusColor = (status: any) => {
    switch (status) {
      case "open":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "unresolved":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "closed":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getPriorityColor = (priority: any) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800 border-red-200";
      case "high":
        return "bg-red-100 text-red-800 border-red-200";
      case "medium":
        return "bg-orange-100 text-orange-800 border-orange-200";
      case "low":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: any) => {
    switch (status) {
      case "open":
        return <AlertTriangle className="h-4 w-4" />;
      case "unresolved":
        return <Clock className="h-4 w-4" />;
      case "closed":
        return <CheckCircle className="h-4 w-4" />;
      default:
        return <HelpCircle className="h-4 w-4" />;
    }
  };

  const viewTicketDetails = async (ticket: any) => {
    try {
      const response = await helpdeskService.getTicket(ticket.ticketId);
      console.log("Ticket details response:", response);

      // Handle response structure based on your API
      setSelectedTicket(response);
      setShowTicketDetails(true);
    } catch (error) {
      console.error("Error fetching ticket details:", error);
      toast.error("Failed to fetch ticket details");
      // Fallback to basic ticket info if API call fails
      setSelectedTicket(ticket);
      setShowTicketDetails(true);
    }
  };
  useEffect(() => {
    if (selectedTicket?.comments) {
      setPublicComments(
        selectedTicket.comments.filter((comment: any) => !comment.isInternal)
      );
    } else {
      setPublicComments([]);
    }
  }, [selectedTicket]);

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      ticket?.subject?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket?.ticketId?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ticket?.trackingNumber?.includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "all" || ticket.status === statusFilter;
    const matchesPriority =
      priorityFilter === "all" || ticket.priority === priorityFilter;

    return matchesSearch && matchesStatus && matchesPriority;
  });
  console.log("publicComments", publicComments);
  if (isLoading) {
    return (
      <div className="space-y-6 max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center">
          <div>
            <div className="h-8 w-48 bg-gray-200 rounded animate-pulse mb-2"></div>
            <div className="h-4 w-64 bg-gray-200 rounded animate-pulse"></div>
          </div>
          <div className="h-10 w-32 bg-gray-200 rounded animate-pulse"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-32 bg-gray-200 rounded animate-pulse"
            ></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center space-x-2">
            <MessageSquare className="h-8 w-8" />
            <span>Help Desk</span>
          </h1>
          <p className="text-gray-600 mt-1">
            Manage and track your support tickets
          </p>
        </div>
        <div className="flex space-x-3">
          <Button
            onClick={handleRefresh}
            variant="outline"
            className="flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </Button>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            <span>Create New Ticket</span>
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="border-l-4 border-l-blue-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Tickets
                </p>
                <p className="text-2xl font-bold text-blue-600">
                  {tickets.length}
                </p>
              </div>
              <MessageSquare className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-yellow-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Open</p>
                <p className="text-2xl font-bold text-yellow-600">
                  {tickets.filter((t) => t.status === "open").length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-orange-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Unresolved</p>
                <p className="text-2xl font-bold text-orange-600">
                  {tickets.filter((t) => t.status === "unresolved").length}
                </p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-l-4 border-l-green-500">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Closed</p>
                <p className="text-2xl font-bold text-green-600">
                  {tickets.filter((t) => t.status === "closed").length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search by ticket ID, subject, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="unresolved">Unresolved</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-full md:w-40">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Tickets Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <HelpCircle className="h-5 w-5" />
            <span>Support Tickets</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTickets.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No Helpdesk Tickets
              </h3>
              <p className="text-gray-500 mb-6">
                {tickets.length === 0
                  ? "You haven't created any support tickets yet. Click the button below to create your first ticket."
                  : "No tickets match your current filters. Try adjusting your search criteria."}
              </p>
              {tickets.length === 0 && (
                <Button
                  onClick={() => setShowCreateModal(true)}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Create New Ticket
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Shipment ID</TableHead>
                    <TableHead>Subject</TableHead>
                    <TableHead>Topic</TableHead>
                    <TableHead>AWB</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTickets.map((ticket) => (
                    <TableRow
                      key={ticket.ticketId}
                      className="hover:bg-gray-50"
                    >
                      <TableCell className="font-mono font-medium text-blue-600">
                        #{ticket.ticketId}
                      </TableCell>
                      <TableCell className="font-mono font-medium text-blue-600">
                        {ticket.shipment_id}
                      </TableCell>
                      <TableCell>
                        <div
                          className="max-w-xs truncate"
                          title={ticket.subject}
                        >
                          {ticket.subject}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="text-xs max-w-[180px] truncate overflow-hidden whitespace-nowrap"
                        >
                          {ticket.topic}
                        </Badge>
                      </TableCell>
                      <TableCell>{ticket.awb ?? "-"}</TableCell>
                      <TableCell className="text-sm text-gray-600">
                        {formatDateTime(ticket.createdAt)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewTicketDetails(ticket)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Ticket Modal */}
      <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Plus className="h-5 w-5" />
              <span>Create New Support Ticket</span>
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Complaint Summary */}
            <div className="space-y-2">
              <Label htmlFor="subject" className="text-sm font-medium">
                Complaint Summary / Subject{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => handleInputChange("subject", e.target.value)}
                placeholder="Brief summary of your issue"
                className={formErrors.subject ? "border-red-500" : ""}
              />
              {formErrors.subject && (
                <p className="text-sm text-red-500">{formErrors.subject}</p>
              )}
            </div>

            {/* Complaint Topic */}
            <div className="space-y-2">
              <Label htmlFor="topic" className="text-sm font-medium">
                Complaint Topic <span className="text-red-500">*</span>
              </Label>
              <Select
                value={formData.topic}
                onValueChange={(value) => handleInputChange("topic", value)}
              >
                <SelectTrigger
                  className={formErrors.topic ? "border-red-500" : ""}
                >
                  <SelectValue placeholder="Select complaint topic" />
                </SelectTrigger>
                <SelectContent>
                  {COMPLAINT_TOPICS.map((topic) => (
                    <SelectItem key={topic.id} value={String(topic.label)}>
                      {topic.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formErrors.topic && (
                <p className="text-sm text-red-500">{formErrors.topic}</p>
              )}
            </div>

            {/* Detailed Description */}
            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-medium">
                Detailed Description of Complaint{" "}
                <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Please provide a detailed description of your issue..."
                rows={4}
                className={formErrors.description ? "border-red-500" : ""}
              />
              {formErrors.description && (
                <p className="text-sm text-red-500">{formErrors.description}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* awb Number */}
              <div className="space-y-2">
                <Label htmlFor="awb" className="text-sm font-medium">
                  AWB
                </Label>
                <Input
                  id="awb"
                  value={formData.awb}
                  onChange={(e) => handleInputChange("awb", e.target.value)}
                  placeholder="Enter AWB"
                />
              </div>
              {/* Shipment ID */}
              <div className="space-y-2">
                <Label htmlFor="shipment_id" className="text-sm font-medium">
                  Shipment ID
                </Label>
                <Input
                  id="shipment_id"
                  type="text"
                  value={formData.shipment_id}
                  onChange={(e) =>
                    handleInputChange("shipment_id", e.target.value)
                  }
                  placeholder="87654347"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Mobile Number */}
              <div className="space-y-2">
                <Label htmlFor="mobile" className="text-sm font-medium">
                  Mobile Number <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="mobile"
                  value={formData.mobile}
                  onChange={(e) => handleInputChange("mobile", e.target.value)}
                  placeholder="9876543210"
                  className={formErrors.mobile ? "border-red-500" : ""}
                />
                {formErrors.mobile && (
                  <p className="text-sm text-red-500">{formErrors.mobile}</p>
                )}
              </div>
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="your.email@example.com"
                />
              </div>
            </div>
            {/* Buttons */}
            <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 space-y-2 space-y-reverse sm:space-y-0 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={handleCloseModal}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4" />
                    Submit Ticket
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Ticket Details Modal */}
      <Dialog open={showTicketDetails} onOpenChange={setShowTicketDetails}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <MessageSquare className="h-6 w-6 text-blue-600" />
                <span className="text-xl">
                  Ticket #{selectedTicket?.ticketId}
                </span>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(selectedTicket?.status)}
                  <Badge
                    className={`border ${getStatusColor(
                      selectedTicket?.status
                    )}`}
                  >
                    {selectedTicket?.status.replace("-", " ").toUpperCase()}
                  </Badge>
                </div>
              </div>
              <Button
                onClick={() => setShowTicketDetails(false)}
                variant="outline"
              >
                ✕
              </Button>
            </DialogTitle>
          </DialogHeader>

          {selectedTicket && (
            <div className="p-6 space-y-6">
              {/* Status Overview Card */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold flex items-center">
                    <AlertCircle className="h-5 w-5 mr-2" />
                    Ticket Overview
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="flex justify-center mb-2">
                        {getStatusIcon(selectedTicket.status)}
                      </div>
                      <p className="text-sm text-gray-600">Status</p>
                      <Badge
                        className={`mt-1 border ${getStatusColor(
                          selectedTicket.status
                        )}`}
                      >
                        {selectedTicket.status.replace("-", " ").toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <AlertCircle className="h-5 w-5 mx-auto mb-2 text-gray-600" />
                      <p className="text-sm text-gray-600">Priority</p>
                      <Badge
                        className={`mt-1 border ${getPriorityColor(
                          selectedTicket.priority
                        )}`}
                      >
                        {selectedTicket.priority.toUpperCase()}
                      </Badge>
                    </div>
                    <div className="text-center p-4 bg-gray-50 rounded-lg">
                      <MessageCircle className="h-5 w-5 mx-auto mb-2 text-gray-600" />
                      <p className="text-sm text-gray-600">Topic</p>
                      <p className="font-medium mt-1">{selectedTicket.topic}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Main Details */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Customer Information */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold flex items-center">
                      <User className="h-5 w-5 mr-2" />
                      Customer Information
                    </h3>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <Phone className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm text-gray-600">Mobile Number</p>
                        <p className="font-mono font-medium">
                          {selectedTicket.mobile}
                        </p>
                      </div>
                    </div>
                    {selectedTicket.email && (
                      <div className="flex items-center space-x-3">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm text-gray-600">Email</p>
                          <p className="font-medium">{selectedTicket.email}</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Shipment Information */}
                <Card>
                  <CardHeader>
                    <h3 className="text-lg font-semibold flex items-center">
                      <Package className="h-5 w-5 mr-2" />
                      Shipment Information
                    </h3>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-gray-600">Shipment ID</p>
                      <p className="font-mono font-medium bg-gray-50 px-2 py-1 rounded text-sm">
                        {selectedTicket.shipment_id}
                      </p>
                    </div>
                    {selectedTicket.awb && (
                      <div>
                        <p className="text-sm text-gray-600">AWB Number</p>
                        <p className="font-mono font-medium bg-gray-50 px-2 py-1 rounded text-sm">
                          {selectedTicket.awb}
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Subject and Description */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Issue Details</h3>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Subject
                    </Label>
                    <p className="mt-1 font-semibold text-lg">
                      {selectedTicket.subject}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-600">
                      Description
                    </Label>
                    <div className="mt-1 p-4 bg-gray-50 rounded-lg">
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {selectedTicket.description}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tags and Attachments */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {selectedTicket.tags && selectedTicket.tags.length > 0 && (
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold flex items-center">
                        <Tag className="h-5 w-5 mr-2" />
                        Tags
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <div className="flex flex-wrap gap-2">
                        {selectedTicket.tags.map((tag: any, index: any) => (
                          <Badge
                            key={index}
                            className="bg-blue-100 text-blue-800 border-blue-200"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {selectedTicket.attachments &&
                  selectedTicket.attachments.length > 0 && (
                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-semibold flex items-center">
                          <Paperclip className="h-5 w-5 mr-2" />
                          Attachments
                        </h3>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {selectedTicket.attachments.map(
                            (attachment: any, index: any) => (
                              <div
                                key={index}
                                className="flex items-center p-2 bg-gray-50 rounded"
                              >
                                <Paperclip className="h-4 w-4 mr-2 text-gray-500" />
                                <span className="text-sm">{attachment}</span>
                              </div>
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}
              </div>

              {/* Assignment and Resolution */}
              {/* <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {selectedTicket.assignedTo &&
                  selectedTicket.assignedTo.length > 0 && (
                    <Card>
                      <CardHeader>
                        <h3 className="text-lg font-semibold flex items-center">
                          <UserCheck className="h-5 w-5 mr-2" />
                          Assigned To
                        </h3>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          {selectedTicket.assignedTo.map(
                            (assignee: any, index: any) => (
                              <div
                                key={index}
                                className="flex items-center p-2 bg-gray-50 rounded"
                              >
                                <User className="h-4 w-4 mr-2 text-gray-500" />
                                <span className="text-sm">
                                  {assignee.email}
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                {selectedTicket.resolvedBy && (
                  <Card>
                    <CardHeader>
                      <h3 className="text-lg font-semibold flex items-center">
                        <CheckCircle2 className="h-5 w-5 mr-2" />
                        Resolution
                      </h3>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center p-2 bg-green-50 rounded">
                          <CheckCircle2 className="h-4 w-4 mr-2 text-green-500" />
                          <div>
                            <p className="text-sm font-medium">
                              Resolved by: {selectedTicket.resolvedByName}
                            </p>
                            <p className="text-xs text-gray-600">
                              {selectedTicket.closedAt &&
                                formatDateTime(selectedTicket.closedAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div> */}

              {/* Comments Section */}
              {publicComments.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold flex items-center">
                        <MessageCircle className="h-5 w-5 mr-2" />
                        Comments ({publicComments.length})
                      </h3>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {/* Public Comments */}
                      {publicComments.map((comment: any, index: any) => (
                        <div
                          key={comment._id}
                          className="border-l-4 border-blue-500 pl-4 py-3 bg-blue-50 rounded-r"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center space-x-2">
                              <MessageCircle className="h-4 w-4 text-blue-500" />
                              <span className="font-medium text-sm">
                                {comment.commentByName}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500 pr-2">
                              {formatDateTime(comment.commentedAt)}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm whitespace-pre-wrap leading-relaxed">
                            {comment.comment}
                          </p>
                        </div>
                      ))}

                      {publicComments.length === 0 && (
                        <p className="text-gray-500 text-center py-4">
                          No comments yet
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )}
              {/* Add Comment Form */}
              <div className="mt-6 border-t pt-4">
                <h4 className="text-sm font-semibold mb-2">Post a Reply</h4>
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write your comment..."
                  className="w-full border rounded-lg p-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={3}
                />
                <div className="mt-2 flex justify-end">
                  <Button
                    onClick={async () => {
                      if (!newComment.trim()) return;

                      try {
                        setIsSubmittingComment(true);
                        const addedComment = await helpdeskService.addComment(
                          selectedTicket.ticketId,
                          { comment: newComment }
                        );
                        console.log(addedComment);

                        // Update comments list immediately
                        setPublicComments(addedComment?.comments);

                        setNewComment(""); // Clear textarea
                      } catch (error) {
                        console.error("Failed to add comment:", error);
                      } finally {
                        setIsSubmittingComment(false);
                      }
                    }}
                    disabled={isSubmittingComment}
                  >
                    {isSubmittingComment ? "Posting..." : "Post Comment"}
                  </Button>
                </div>
              </div>

              {/* Timeline */}
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold flex items-center">
                    <Clock className="h-5 w-5 mr-2" />
                    Timeline
                  </h3>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 w-2 h-2 bg-green-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Created</p>
                        <p className="text-xs text-gray-600">
                          {formatDateTime(selectedTicket.createdAt)}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full"></div>
                      <div className="flex-1">
                        <p className="text-sm font-medium">Last Updated</p>
                        <p className="text-xs text-gray-600">
                          {formatDateTime(selectedTicket.updatedAt)}
                        </p>
                      </div>
                    </div>
                    {selectedTicket.closedAt && (
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 w-2 h-2 bg-gray-500 rounded-full"></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium">Closed</p>
                          <p className="text-xs text-gray-600">
                            {formatDateTime(selectedTicket.closedAt)}
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => setShowTicketDetails(false)}
                >
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
