"use client";

import type React from "react";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ArrowLeft,
  Search,
  MapPin,
  Clock,
  Package,
  Truck,
  CheckCircle,
  AlertCircle,
  XCircle,
  RefreshCw,
  Calendar,
  User,
  Phone,
  Mail,
  Copy,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime } from "@/lib/utils";
import { shipmentService } from "@/services/shipmentService";

export default function TrackShipmentPage() {
  const params = useParams();
  const router = useRouter();
  const idFromUrl = params.id as string;
  const [isLoading, setIsLoading] = useState(false);
  const [trackingInfo, setTrackingInfo] = useState<any | null>(null);
  const [idNumber, setIdNumber] = useState(idFromUrl || "");
  const [error, setError] = useState<string | null>(null);

  const fetchShipmentTrackingDetails = async (id: string) => {
    if (!id || id.trim() === "") {
      toast.error("Please enter a valid Shipment ID number");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      const data = await shipmentService.trackShipment(id.trim());
      console.log("Tracking data:", data);

      if (data.success === 1) {
        setTrackingInfo(data);
        // Update URL without page reload
        if (idFromUrl !== id.trim()) {
          router.push(`/dashboard/track/${id.trim()}`, { scroll: false });
        }
      } else {
        setTrackingInfo(null);
        setError("No tracking information found for this Shipment ID number");
      }
    } catch (error: any) {
      console.error("Tracking error:", error);
      setTrackingInfo(null);
      setError(error.message || "Failed to fetch tracking details");
      toast.error("Failed to fetch tracking details");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (idFromUrl) {
      setIdNumber(idFromUrl);
      fetchShipmentTrackingDetails(idFromUrl);
    }
  }, [idFromUrl]);

  const handleTrackSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!idNumber) return;
    router.push(`/dashboard/shipments/track/${idNumber}`);
  };

  const handleRefresh = () => {
    if (idNumber) {
      fetchShipmentTrackingDetails(idNumber);
    }
  };

  const copyIdNumber = () => {
    if (trackingInfo) {
      navigator.clipboard.writeText(idNumber);
      toast.success("Shipment ID copied to clipboard");
    }
  };

  const getStatusIcon = (status: string) => {
    const statusLower = status.toLowerCase();
    switch (statusLower) {
      case "delivered":
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case "out for delivery":
      case "out_for_delivery":
        return <Truck className="w-5 h-5 text-blue-600" />;
      case "in transit":
      case "in_transit":
      case "manifested":
        return <Package className="w-5 h-5 text-purple-600" />;
      case "returned":
      case "rto":
        return <XCircle className="w-5 h-5 text-red-600" />;
      case "exception":
      case "undelivered":
        return <AlertCircle className="w-5 h-5 text-orange-600" />;
      default:
        return <Package className="w-5 h-5 text-gray-600" />;
    }
  };

  const formatTrackingDateTime = (dateTimeStr: string) => {
    try {
      // Handle DD/MM/YY HH:mm:ss format
      if (dateTimeStr.includes("/")) {
        const [datePart, timePart] = dateTimeStr.split(" ");
        const [day, month, year] = datePart.split("/");
        const fullYear = year.length === 2 ? `20${year}` : year;
        const isoString = `${fullYear}-${month.padStart(2, "0")}-${day.padStart(
          2,
          "0"
        )}T${timePart}`;
        return new Date(isoString).toLocaleString();
      }
      // Handle ISO format
      return new Date(dateTimeStr).toLocaleString();
    } catch (error) {
      return dateTimeStr; // Return original if parsing fails
    }
  };

  const getProgressPercentage = () => {
    if (!trackingInfo) return 0;

    const status = trackingInfo.status.toLowerCase();
    switch (status) {
      case "manifested":
        return 20;
      case "picked up":
      case "pickup":
        return 40;
      case "in transit":
      case "in_transit":
        return 60;
      case "out for delivery":
      case "out_for_delivery":
        return 80;
      case "delivered":
        return 100;
      default:
        return 10;
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/shipments">
            <Button variant="outline" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Track Shipment</h1>
            <p className="text-gray-600">
              Real-time shipment tracking powered by Shipet
            </p>
          </div>
        </div>
        {trackingInfo && (
          <Button
            onClick={handleRefresh}
            variant="outline"
            disabled={isLoading}
          >
            <RefreshCw
              className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
            />
            Refresh
          </Button>
        )}
      </div>

      {/* Search Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>Track Your Shipment</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleTrackSubmit} className="flex space-x-4">
            <div className="flex-1">
              <Input
                placeholder="Enter Shipment ID Number (e.g., 76856788)"
                value={idNumber}
                onChange={(e) => setIdNumber(e.target.value)}
                className="text-lg"
                disabled={isLoading}
              />
            </div>
            <Button type="submit" disabled={isLoading || !idNumber.trim()}>
              <Search className="mr-2 h-4 w-4" />
              {isLoading ? "Tracking..." : "Track"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-48" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                  <Skeleton className="h-24" />
                </div>
                <Skeleton className="h-2 w-full" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex space-x-4">
                    <Skeleton className="w-5 h-5 rounded-full" />
                    <div className="flex-1">
                      <Skeleton className="h-4 w-32 mb-2" />
                      <Skeleton className="h-3 w-48" />
                    </div>
                    <Skeleton className="h-3 w-24" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tracking Results */}
      {trackingInfo && !isLoading && (
        <div className="space-y-6">
          {/* Progress Bar */}
          <Card>
            <CardContent className="pt-6">
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${getProgressPercentage()}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Order Placed</span>
                <span>In Transit</span>
                <span>Out for Delivery</span>
                <span>Delivered</span>
              </div>
            </CardContent>
          </Card>

          {/* Shipment Overview */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="flex items-center space-x-2">
                    {getStatusIcon(trackingInfo.status)}
                    <span>Shipment Status</span>
                  </CardTitle>
                  <div className="flex items-center space-x-2 mt-2">
                    <p className="text-gray-600">Shipment ID: {idNumber}</p>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={copyIdNumber}
                      className="h-6 w-6 p-0"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                <Badge className={`${trackingInfo.status} border`}>
                  {trackingInfo.status.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg border">
                  <MapPin className="mx-auto h-8 w-8 text-blue-600 mb-2" />
                  <h3 className="font-medium text-sm">Current Location</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {trackingInfo.location || "Unknown"}
                  </p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg border">
                  <Truck className="mx-auto h-8 w-8 text-purple-600 mb-2" />
                  <h3 className="font-medium text-sm">Courier Partner</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {`${trackingInfo.courier_name || "Unknown"} (${
                      trackingInfo.awb
                    })`}
                  </p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg border">
                  <Calendar className="mx-auto h-8 w-8 text-green-600 mb-2" />
                  <h3 className="font-medium text-sm">Pickup Date</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {formatTrackingDateTime(trackingInfo.picked_datetime) ||
                      "Yet to Pickup"}
                  </p>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg border">
                  <Clock className="mx-auto h-8 w-8 text-yellow-600 mb-2" />
                  <h3 className="font-medium text-sm">Expected Delivery</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    {trackingInfo.edd || "To be updated"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Delivery Information */}
          {(trackingInfo.receiver || trackingInfo.delivered_datetime) && (
            <Card>
              <CardHeader>
                <CardTitle>Delivery Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {trackingInfo.receiver && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500 flex items-center">
                        <User className="h-4 w-4 mr-1" />
                        Receiver
                      </label>
                      <p className="font-medium">{trackingInfo.receiver}</p>
                    </div>
                  )}
                  {trackingInfo.delivered_datetime && (
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-500 flex items-center">
                        <CheckCircle className="h-4 w-4 mr-1" />
                        Delivered At
                      </label>
                      <p className="font-medium">
                        {formatTrackingDateTime(
                          trackingInfo.delivered_datetime
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tracking Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Tracking Timeline</CardTitle>
              <p className="text-sm text-gray-600">
                Showing {trackingInfo.details.length} tracking events
              </p>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                {trackingInfo.details.map((event: any, index: any) => (
                  <div key={index} className="flex space-x-4">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-600" />
                      {index < trackingInfo.details.length - 1 && (
                        <div className="w-px h-12 mt-2 bg-gray-300" />
                      )}
                    </div>
                    <div className="flex-1 pb-4">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <p className="font-medium text-gray-900">
                              {event.notes}
                            </p>
                          </div>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <MapPin className="h-3 w-3" />
                            <span>{event.location}</span>
                          </div>
                        </div>
                        <div className="text-right ml-4">
                          <p className="text-sm text-gray-500">
                            {formatTrackingDateTime(event.datetime)}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Additional Actions */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-3">
                <Button variant="outline" size="sm">
                  <Phone className="mr-2 h-4 w-4" />
                  Contact Support
                </Button>
                <Button variant="outline" size="sm">
                  <Mail className="mr-2 h-4 w-4" />
                  Email Updates
                </Button>
                <Button variant="outline" size="sm">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Courier Website
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <Card>
          <CardContent className="text-center py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Tracking Information Not Found
            </h3>
            <p className="text-gray-600 mb-4">{error}</p>
            <div className="space-y-2">
              <p className="text-sm text-gray-500">Possible reasons:</p>
              <ul className="text-sm text-gray-500 space-y-1">
                <li>• Shipment number might be incorrect</li>
                <li>• Shipment might not be manifested yet</li>
                <li>• There might be a delay in data sync</li>
              </ul>
            </div>
            <Button
              onClick={() => setError(null)}
              variant="outline"
              className="mt-4"
            >
              Try Again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Empty State */}
      {!trackingInfo && !isLoading && !error && idNumber && (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Enter Shipment ID Number to Track
            </h3>
            <p className="text-gray-600">
              Use the search box above to track your shipment
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
