"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Calendar,
  MessageSquare,
  User,
  Phone,
  Mail,
  Package,
  AlertCircle,
  Send,
  Trash2,
  CheckCircle,
  Clock,
  Tag,
  UserCheck,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { supportService } from "@/services/customerSupportService";
import { toast } from "sonner";
import { formatDate } from "@/lib/utils";

const statusColors: any = {
  open: "bg-emerald-100 text-emerald-800 border-emerald-200",
  closed: "bg-gray-100 text-gray-800 border-gray-200",
};

const priorityColors: any = {
  low: "bg-blue-100 text-blue-800 border-blue-200",
  medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
  high: "bg-orange-100 text-orange-800 border-orange-200",
  urgent: "bg-red-100 text-red-800 border-red-200",
};

export default function AdminTicketDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { ticketId } = params;
  const [ticket, setTicket] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [isInternal, setIsInternal] = useState(false);
  const [submittingComment, setSubmittingComment] = useState(false);
  const [closingTicket, setClosingTicket] = useState(false);
  const [showInternalComments, setShowInternalComments] = useState(true);

  useEffect(() => {
    if (ticketId) {
      loadTicket();
    }
  }, [ticketId]);

  const loadTicket = async () => {
    try {
      setLoading(true);
      const response = await supportService.getTicketById(ticketId);
      console.log(response);
      if (response) {
        setTicket(response);
      } else {
        toast.error("Failed to load ticket");
      }
    } catch (error) {
      console.error("Error loading ticket:", error);
      toast.error("Failed to load ticket");
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    try {
      setSubmittingComment(true);
      const response = await supportService.addComment(
        ticketId,
        newComment.trim(),
        isInternal
      );
      if (response) {
        setNewComment("");
        setIsInternal(false);
        await loadTicket();
        toast.success("Comment added successfully");
      } else {
        toast.error("Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      toast.error("Failed to add comment");
    } finally {
      setSubmittingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: any) => {
    if (!commentId) {
      toast.error("Invalid comment ID");
      return;
    }

    if (!confirm("Are you sure you want to delete this comment?")) {
      return;
    }

    try {
      const response = await supportService.deleteComment(ticketId, commentId);
      await loadTicket();
      toast.success("Comment deleted successfully");
    } catch (error) {
      console.error("Error deleting comment:", error);
      toast.error("Failed to delete comment");
    }
  };

  const handleCloseTicket = async () => {
    if (
      !confirm(
        "Are you sure you want to close this ticket? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setClosingTicket(true);
      await supportService.closeTicket(ticket.ticketId);
      await loadTicket();
      toast.success("Ticket closed successfully");
    } catch (error) {
      console.error("Error closing ticket:", error);
      toast.error("Failed to close ticket");
    } finally {
      setClosingTicket(false);
    }
  };

  const filteredComments =
    ticket?.comments?.filter(
      (comment: any) => showInternalComments || !comment.isInternal
    ) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-64 bg-gray-200 rounded-lg"></div>
                <div className="h-48 bg-gray-200 rounded-lg"></div>
              </div>
              <div className="h-96 bg-gray-200 rounded-lg"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center py-12">
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-6" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Ticket not found
            </h3>
            <p className="text-gray-600 mb-6">
              The requested ticket could not be found.
            </p>
            <Button onClick={() => router.back()} variant="outline" size="lg">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const isTicketClosed = ticket.status === "closed";

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button onClick={() => router.back()} variant="outline" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Tickets
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Ticket #{ticket.ticketId}
                </h1>
                <p className="text-sm text-gray-600 mt-1">
                  Created {formatDate(ticket.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <Badge
                className={`${
                  statusColors[ticket.status]
                } font-medium px-3 py-1`}
              >
                {isTicketClosed && <CheckCircle className="h-3 w-3 mr-1" />}
                {ticket.status.toUpperCase()}
              </Badge>
              <Badge
                className={`${
                  priorityColors[ticket.priority]
                } font-medium px-3 py-1`}
              >
                {ticket.priority.toUpperCase()}
              </Badge>
            </div>
          </div>
        </div>

        {/* Closed Ticket Alert */}
        {isTicketClosed && (
          <Alert className="border-amber-200 bg-amber-50">
            <Lock className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              This ticket is closed and cannot be modified.
              {ticket.resolvedByName && ` Resolved by ${ticket.resolvedByName}`}
              {ticket.closedAt && ` on ${formatDate(ticket.closedAt)}`}.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Ticket Details */}
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-gray-50">
                <CardTitle className="text-md text-gray-700">
                  Subject: {ticket.subject}
                </CardTitle>
                {ticket.topic && (
                  <div className="flex items-center mt-2">
                    <Tag className="h-4 w-4 mr-1 text-gray-900" />
                    <span className="text-lg text-gray-900">
                      {ticket.topic}
                    </span>
                  </div>
                )}
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {(ticket.awb || ticket.shipment_id) && (
                    <div className="bg-blue-50 rounded-lg p-4">
                      <div className="flex items-center space-x-2 mb-2">
                        <Package className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-900">
                          Shipment Information
                        </span>
                      </div>
                      <div className="text-sm space-y-1">
                        {ticket.awb && (
                          <div>
                            <span className="font-medium">AWB:</span>{" "}
                            {ticket.awb}
                          </div>
                        )}
                        {ticket.shipment_id && (
                          <div>
                            <span className="font-medium">Shipment ID:</span>{" "}
                            {ticket.shipment_id}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Description
                    </h4>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                        {ticket.description}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-600 pt-4 border-t">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        Created: {formatDate(ticket.createdAt)}
                      </div>
                      {ticket.closedAt && (
                        <div className="flex items-center">
                          <CheckCircle className="h-4 w-4 mr-1 text-green-600" />
                          Closed: {formatDate(ticket.closedAt)}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Comments Section */}
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center text-lg">
                    <MessageSquare className="h-5 w-5 mr-2" />
                    Comments ({filteredComments.length})
                  </CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      setShowInternalComments(!showInternalComments)
                    }
                    className="text-gray-600"
                  >
                    {showInternalComments ? (
                      <>
                        <EyeOff className="h-4 w-4 mr-1" />
                        Hide Internal
                      </>
                    ) : (
                      <>
                        <Eye className="h-4 w-4 mr-1" />
                        Show Internal
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  {filteredComments.length > 0 ? (
                    filteredComments.map((comment: any, index: any) => (
                      <div
                        key={comment._id || index}
                        className={`border rounded-lg p-4 ${
                          comment.isInternal
                            ? "bg-amber-50 border-amber-200"
                            : "bg-white border-gray-200"
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium text-gray-900">
                                {comment.commentByName}
                              </span>
                              {comment.isInternal && (
                                <Badge
                                  variant="secondary"
                                  className="text-xs bg-amber-100 text-amber-800"
                                >
                                  Internal Note
                                </Badge>
                              )}
                              <span className="text-xs text-gray-500">
                                {formatDate(comment.commentedAt)}
                              </span>
                            </div>
                            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
                              {comment.comment}
                            </p>
                          </div>
                          {!isTicketClosed && (
                            <Button
                              onClick={() => handleDeleteComment(comment._id)}
                              variant="ghost"
                              size="sm"
                              className="text-red-600 hover:text-red-800 hover:bg-red-50 ml-2"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>No comments yet</p>
                    </div>
                  )}

                  {!isTicketClosed && (
                    <>
                      <Separator className="my-6" />

                      {/* Add Comment */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-gray-900">
                          Add Comment
                        </h4>
                        <Textarea
                          placeholder="Type your comment here..."
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          rows={4}
                          className="resize-none"
                        />
                        <div className="flex items-center justify-between">
                          <label className="flex items-center space-x-2 text-sm">
                            <input
                              type="checkbox"
                              checked={isInternal}
                              onChange={(e) => setIsInternal(e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <span className="text-gray-700">
                              Internal comment (not visible to customer)
                            </span>
                          </label>
                          <Button
                            onClick={handleAddComment}
                            disabled={!newComment.trim() || submittingComment}
                            size="sm"
                          >
                            <Send className="h-4 w-4 mr-2" />
                            {submittingComment ? "Adding..." : "Add Comment"}
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Customer Information */}
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-gray-50">
                <CardTitle className="flex items-center text-lg">
                  <User className="h-5 w-5 mr-2" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-4">
                  <div>
                    <div className="font-medium text-gray-900 text-lg">
                      {ticket.userName || "Unknown User"}
                    </div>
                    <div className="text-sm text-gray-500">Customer</div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <Mail className="h-4 w-4 mr-3 text-gray-400" />
                      <span className="text-gray-700">
                        {ticket.userEmail || ticket.email || "No email"}
                      </span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="h-4 w-4 mr-3 text-gray-400" />
                      <span className="text-gray-700">
                        {ticket.userPhone || ticket.mobile || "No phone"}
                      </span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Assignment Information */}
            {ticket.assignedTo && ticket.assignedTo.length > 0 && (
              <Card className="shadow-sm">
                <CardHeader className="border-b bg-gray-50">
                  <CardTitle className="flex items-center text-lg">
                    <UserCheck className="h-5 w-5 mr-2" />
                    Assignment
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="text-sm text-gray-600">
                    Assigned to Customer Support Team
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card className="shadow-sm">
              <CardHeader className="border-b bg-gray-50">
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                {!isTicketClosed ? (
                  <Button
                    onClick={handleCloseTicket}
                    disabled={closingTicket}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {closingTicket ? "Closing..." : "Close Ticket"}
                  </Button>
                ) : (
                  <div className="text-center py-4">
                    <Lock className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-600">Ticket is closed</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resolution Information */}
            {isTicketClosed && (
              <Card className="shadow-sm border-green-200">
                <CardHeader className="border-b bg-green-50">
                  <CardTitle className="flex items-center text-lg text-green-800">
                    <CheckCircle className="h-5 w-5 mr-2" />
                    Resolution
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-2 text-sm">
                    {ticket.resolvedByName && (
                      <div>
                        <span className="font-medium text-gray-900">
                          Resolved by:
                        </span>
                        <br />
                        <span className="text-gray-700">
                          {ticket.resolvedByName}
                        </span>
                      </div>
                    )}
                    {ticket.closedAt && (
                      <div>
                        <span className="font-medium text-gray-900">
                          Closed on:
                        </span>
                        <br />
                        <span className="text-gray-700">
                          {formatDate(ticket.closedAt)}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
