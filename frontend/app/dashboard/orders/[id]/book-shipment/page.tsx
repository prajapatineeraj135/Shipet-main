"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { orderService } from "@/services/orderService";
import { shipmentService } from "@/services/shipmentService";
import { Loader2, Package, MapPin, Plus, Trash2 } from "lucide-react";
import { estimateService } from "@/services/estimateService";
import { pickupAddressService } from "@/services/pickupAddressService";
import { planService } from "@/services/planService";

export default function BookShipmentPage() {
  const [order, setOrder] = useState<any | null>(null);
  const [pickupAddresses, setPickupAddresses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [isMultiBox, setIsMultiBox] = useState(false);
  const [CommisionAmount, setCommisionAmount] = useState("");

  const [selectedPickupAddress, setSelectedPickupAddress] = useState(0);
  const [packages, setPackages] = useState<any[]>([
    {
      quantity: 1,
      length: 0,
      breadth: 0,
      height: 0,
      weight: 0,
      weight_unit: "gm",
      dimension_unit: "cm",
    },
  ]);
  const [singlePackage, setSinglePackage] = useState<any>({
    length: 0,
    breadth: 0,
    height: 0,
    weight: 0,
    weight_unit: "gm",
  });
  const [rates, setRates] = useState<any[]>([]);
  const [selectedRate, setSelectedRate] = useState("");
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  useEffect(() => {
    loadOrderDetails();
    loadPickupAddresses();
  }, [orderId]);

  console.log("Order", order);
  console.log("rate id", selectedRate);
  console.log("rates", rates);
  console.log("selectedRate", selectedRate);
  // console.log("isMultiBox", isMultiBox);
  const loadOrderDetails = async () => {
    try {
      const orderData = await orderService.getOrder(orderId);
      setOrder(orderData);
    } catch (error) {
      toast.error("Failed to load order details");
      router.push("/dashboard/orders");
    } finally {
      setIsLoading(false);
    }
  };

  const loadPickupAddresses = async () => {
    try {
      const addresses = await pickupAddressService.getAddresses();
      setPickupAddresses(addresses);
      const defaultAddress = addresses.find((addr) => addr.isDefault);
      if (defaultAddress) {
        setSelectedPickupAddress(Number(defaultAddress.warehouseId));
      }
    } catch (error) {
      toast.error("Failed to load pickup addresses");
    }
  };

  const addPackage = () => {
    setPackages((prev) => [
      ...prev,
      {
        quantity: 1,
        length: 0,
        breadth: 0,
        height: 0,
        weight: 0,
        weight_unit: "gm",
        dimension_unit: "cm",
      },
    ]);
  };

  const removePackage = (index: number) => {
    if (packages.length > 1) {
      setPackages((prev) => prev.filter((_, i) => i !== index));
    }
  };

  const updatePackage = (index: number, field: keyof any, value: any) => {
    setPackages((prev) =>
      prev.map((pkg, i) => (i === index ? { ...pkg, [field]: value } : pkg))
    );
  };

  const updateSinglePackage = (field: keyof any, value: any) => {
    setSinglePackage((prev: any) => ({ ...prev, [field]: value }));
  };

  const calculateTotalWeight = () => {
    if (!isMultiBox) {
      return singlePackage.weight_unit === "kg"
        ? singlePackage.weight
        : singlePackage.weight / 1000;
    }
    return packages.reduce((total, pkg) => {
      const weight = pkg.weight_unit === "kg" ? pkg.weight : pkg.weight / 1000;
      return total + weight * pkg.quantity;
    }, 0);
  };

  const getMaxDimensions = () => {
    if (!isMultiBox) {
      return {
        length: singlePackage.length,
        breadth: singlePackage.breadth,
        height: singlePackage.height,
      };
    }
    return packages.reduce(
      (max, pkg) => ({
        length: Math.max(max.length, pkg.length),
        breadth: Math.max(max.breadth, pkg.breadth),
        height: Math.max(max.height, pkg.height),
      }),
      { length: 0, breadth: 0, height: 0 }
    );
  };

  // Add function to calculate commission for individual rate
  const calculateRateWithCommission = async (baseRate: number) => {
    try {
      const commissionData = await planService.calculateShippingRate({
        price: baseRate,
      });
      console.log("commission data", commissionData);
      return commissionData;
    } catch (error) {
      console.error("Error calculating commission:", error);
      return {
        baseRate,
        commissionPercentage: 0,
        commissionAmount: 0,
        finalRate: baseRate,
        planName: "Unknown",
        discountDisplay: "",
      };
    }
  };
  console.log(CommisionAmount);
  const handleGetRates = async () => {
    if (!selectedPickupAddress) {
      toast.error("Please select a pickup address");
      return;
    }

    if (!order?.shippingAddress) {
      toast.error("Order shipping address not found");
      return;
    }

    try {
      setIsLoading(true);
      let rateData: any[] = [];
      // Multi-box estimate
      if (isMultiBox) {
        const payload = {
          destination_pincode: order.shippingAddress.pincode,
          origin_pincode:
            pickupAddresses.find(
              (addr) => addr.warehouseId === selectedPickupAddress
            )?.pincode || "",
          destination_country_code: order.shippingAddress.country_code,
          origin_country_code: "IN",
          shipment_mode: "S",
          shipment_type: order.paymentMethod === "COD" ? "C" : "P",
          shipment_value: Number(order.totalAmount || 0),
          boxes: packages.map((box) => ({
            quantity: Number(box.quantity),
            length: Number(box.length),
            breadth: Number(box.breadth),
            height: Number(box.height),
            dimension_unit: "cm",
            weight: Number(box.weight),
            weight_unit: "gm",
          })),
        };
        console.log(payload);
        const results = await estimateService.getMultiBoxEstimate(payload);
        console.log(results);
        rateData = Object.values(results).map((item: any) => ({
          id: item.courier_group_id,
          carrier: item.courier_group_name,
          service: `SURFACE`,
          amount: item.courier_cost,
          deliveryTime: "3-5 business days",
          courier_id: item.courier_group_id,
          freight_cost: item.freight_cost,
          cod_cost: item.cod_cost,
          baseAmount: item.courier_cost, // Store original amount
        }));
      } else {
        // Single package estimate
        const payload = {
          length: Number(singlePackage.length),
          breadth: Number(singlePackage.breadth),
          height: Number(singlePackage.height),
          weight: Number(singlePackage.weight),
          destination_pincode: order.shippingAddress.pincode,
          origin_pincode:
            pickupAddresses.find(
              (addr) => addr.warehouseId === selectedPickupAddress
            )?.pincode || "",
          destination_country_code: "IN",
          origin_country_code: "IN",
          shipment_mode: "S",
          shipment_type: order.paymentMethod === "COD" ? "C" : "P",
          shipment_value: Number(order.totalAmount || 0),
        };
        console.log(payload);
        const results = await estimateService.getSingleEstimate(payload);
        console.log("Fetched rates", results);
        rateData = results.map((item: any) => ({
          id: item.courier_id,
          carrier: item.courier_name,
          service: `SURFACE`,
          amount: item.courier_cost,
          deliveryTime: item.estimated_delivery_days
            ? `${item.estimated_delivery_days} days`
            : "3-5 business days",
          courier_id: item.courier_id,
          freight_cost: item.freight_cost,
          cod_cost: item.cod_cost,
          baseAmount: item.courier_cost, // Store original amount
        }));
      }
      // Calculate commission for each rate
      const ratesWithCommission = await Promise.all(
        rateData.map(async (rate) => {
          const commissionData = await calculateRateWithCommission(
            rate.baseAmount
          );
          const finalRate = parseFloat(commissionData.finalRate);
          const discountPercent = parseFloat(commissionData.discountDisplay);
          const inflatedAmount: any =
            discountPercent > 0
              ? (finalRate / (1 - discountPercent / 100)).toFixed(2)
              : finalRate.toFixed(2);
          return {
            ...rate,
            inflatedAmount,
            amount: finalRate.toFixed(2), // Final rate shown
            baseAmount: rate.baseRate,
            discountDisplay: discountPercent,
            discountAmount: (inflatedAmount - finalRate).toFixed(2),
            commissionAmount: commissionData.commissionAmount,
            commissionPercentage: commissionData.commissionPercentage,
          };
        })
      );

      setRates(ratesWithCommission);
    } catch (error: any) {
      console.error("Rate calculation error:", error);
      toast.error("Failed to get shipping rates");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const selected = rates.find((r) => r.id === selectedRate);
    if (selected) {
      setCommisionAmount(String(selected.amount));
    }
  }, [selectedRate, rates]);
  const handleBookShipment = async () => {
    if (!selectedRate) {
      toast.error("Please select a shipping rate");
      return;
    }

    setIsBooking(true);

    try {
      let shipment: any;
      // Book multi-box shipment
      if (isMultiBox) {
        const payload = {
          orderId,
          pickup_address_id: selectedPickupAddress,
          boxes: packages.map((pkg) => ({
            quantity: pkg.quantity,
            length: pkg.length,
            breadth: pkg.breadth,
            height: pkg.height,
            weight: pkg.weight,
            weight_unit: pkg.weight_unit,
          })),
          courier_id: 1,
          shipment_mode: "S",
          commission_amount: CommisionAmount,
        };
        console.log(payload);
        shipment = await shipmentService.bookMultiBoxShipment(payload);
        console.log(shipment);
      } else {
        // Book single shipment
        const payload = {
          orderId,
          pickup_address_id: selectedPickupAddress,
          shipment_mode: "S",
          courier_id: selectedRate,
          dimensions: [
            {
              length: singlePackage.length,
              breadth: singlePackage.breadth,
              height: singlePackage.height,
              weight: singlePackage.weight,
            },
          ],
          commission_amount: CommisionAmount,
        };
        console.log(payload);
        shipment = await shipmentService.bookSingleShipment(payload);
        console.log(shipment);
      }
      toast.success("Shipment booked successfully");

      // Navigate to shipment details or shipments list
      router.push(`/dashboard/shipments/${shipment?.id}`);
    } catch (error: any) {
      console.error("Booking error:", error);
      toast.error("Failed to book shipment");
    } finally {
      setIsBooking(false);
    }
  };

  if (isLoading && !order) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Order not found</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Book Shipment</h1>
        <p className="text-gray-600">
          Create shipment for order #{order.client_order_id}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Summary */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="font-medium">Order #{order.client_order_id}</p>
                {order?.hasShipment && (
                  <p className="text-sm text-gray-600">
                    Status: order?.shipment?.status
                  </p>
                )}
              </div>
              <div>
                <p className="font-medium">Customer</p>
                <p className="text-sm">{order.customer.name}</p>
                <p className="text-sm text-gray-600">{order.customer.mobile}</p>
              </div>
              <div>
                <p className="font-medium">
                  Items ({order.products?.length || 0})
                </p>
                {order.products?.map((item: any, index: any) => (
                  <div key={index} className="text-sm">
                    {item.product.name} × {item.quantity} = ₹
                    {item.price * item.quantity}
                  </div>
                ))}
              </div>
              <div>
                <p className="font-medium">Shipping Address</p>
                <div className="text-sm text-gray-600">
                  <p>{order.shippingAddress?.name}</p>
                  <p>{order.shippingAddress?.phone}</p>
                  <p>{order.shippingAddress?.address}</p>
                  <p>
                    {order.shippingAddress?.city},{" "}
                    {order.shippingAddress?.state}{" "}
                    {order.shippingAddress?.pincode}
                  </p>
                  <p>{order.shippingAddress?.country_code}</p>
                </div>
              </div>
              <div className="pt-2 border-t">
                <p className="font-bold">Total: ₹{order.totalAmount}</p>
                <p className="text-sm text-gray-600">
                  Payment: {order.paymentMethod}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Shipment Configuration */}
        <div className="lg:col-span-2 space-y-6">
          {/* Pickup Address */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Pickup Address
              </CardTitle>
              <CardDescription>
                Select the pickup location for this shipment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Select
                value={String(selectedPickupAddress)}
                onValueChange={(val) => setSelectedPickupAddress(Number(val))} // convert back to number
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select pickup address" />
                </SelectTrigger>
                <SelectContent>
                  {pickupAddresses.map((address) => (
                    <SelectItem
                      key={address.warehouseId}
                      value={String(address.warehouseId)} // ensure it's string here
                    >
                      <div className="flex flex-col">
                        <span className="font-medium">{address.nickname}</span>
                        <span className="text-sm text-gray-500">
                          {address.street1}, {address.city} - {address.pincode}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>

          {/* Multi-box Option */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Package Configuration
              </CardTitle>
              <CardDescription>
                Configure package details for shipping
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="multibox"
                    checked={isMultiBox}
                    onCheckedChange={(checked) =>
                      setIsMultiBox(checked as boolean)
                    }
                  />
                  <Label htmlFor="multibox">
                    Multiple packages (Multi-box shipment)
                  </Label>
                </div>

                {isMultiBox ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium">Package Details</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addPackage}
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add Package
                      </Button>
                    </div>
                    {packages.map((pkg, index) => (
                      <div
                        key={index}
                        className="p-4 border rounded-lg space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <h5 className="font-medium">Package {index + 1}</h5>
                          {packages.length > 1 && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => removePackage(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                          <div>
                            <Label>Quantity</Label>
                            <Input
                              type="number"
                              min="1"
                              value={pkg.quantity || ""}
                              onChange={(e) =>
                                updatePackage(
                                  index,
                                  "quantity",
                                  Number.parseInt(e.target.value) || 1
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label>Length (cm)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.1"
                              value={pkg.length || ""}
                              onChange={(e) =>
                                updatePackage(
                                  index,
                                  "length",
                                  Number.parseFloat(e.target.value) || 0
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label>Breadth (cm)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.1"
                              value={pkg.breadth || ""}
                              onChange={(e) =>
                                updatePackage(
                                  index,
                                  "breadth",
                                  Number.parseFloat(e.target.value) || 0
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label>Height (cm)</Label>
                            <Input
                              type="number"
                              min="0"
                              step="0.1"
                              value={pkg.height || ""}
                              onChange={(e) =>
                                updatePackage(
                                  index,
                                  "height",
                                  Number.parseFloat(e.target.value) || 0
                                )
                              }
                            />
                          </div>
                          <div>
                            <Label>Weight (gm)</Label>
                            <div className="flex gap-2">
                              <Input
                                type="number"
                                min="0"
                                step="0.01"
                                value={pkg.weight || ""}
                                onChange={(e) =>
                                  updatePackage(
                                    index,
                                    "weight",
                                    Number.parseFloat(e.target.value) || 0
                                  )
                                }
                                className="flex-1"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <h5 className="font-medium mb-2">Total Summary</h5>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p>
                            Total Packages:{" "}
                            {packages.reduce(
                              (sum, pkg) => sum + pkg.quantity,
                              0
                            )}
                          </p>
                          <p>
                            Total Weight: {calculateTotalWeight().toFixed(2)} kg
                          </p>
                        </div>
                        <div>
                          <p>Max Dimensions (L×B×H):</p>
                          <p>
                            Minimum Chargeable weight is 10 Kg
                            {getMaxDimensions().length} ×{" "}
                            {getMaxDimensions().breadth} ×{" "}
                            {getMaxDimensions().height} cm
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Length (cm)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={singlePackage.length || ""}
                        onChange={(e) =>
                          updateSinglePackage("length", e.target.value || 0)
                        }
                      />
                    </div>
                    <div>
                      <Label>Breadth (cm)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={singlePackage.breadth || ""}
                        onChange={(e) =>
                          updateSinglePackage("breadth", e.target.value || 0)
                        }
                      />
                    </div>
                    <div>
                      <Label>Height (cm)</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.1"
                        value={singlePackage.height || ""}
                        onChange={(e) =>
                          updateSinglePackage("height", e.target.value || 0)
                        }
                      />
                    </div>
                    <div>
                      <Label>Weight (gm)</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          value={singlePackage.weight || ""}
                          onChange={(e) =>
                            updateSinglePackage("weight", e.target.value || 0)
                          }
                          className="flex-1"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Get Rates */}
          <Card>
            <CardHeader>
              <CardTitle>Shipping Rates</CardTitle>
              <CardDescription>
                Get shipping rates from different carriers
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button
                  onClick={handleGetRates}
                  disabled={isLoading}
                  className="w-full"
                >
                  {isLoading && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Get Shipping Rates
                </Button>

                {rates?.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Available Rates</h4>
                    <RadioGroup
                      value={selectedRate}
                      onValueChange={setSelectedRate}
                    >
                      {rates?.map((rate) => (
                        <div
                          key={rate.id}
                          className="flex items-center space-x-2 p-4 border rounded-lg hover:border-blue-300 transition-colors relative"
                        >
                          <RadioGroupItem value={rate.id} id={rate.id} />
                          <Label
                            htmlFor={rate.id}
                            className="flex-1 cursor-pointer"
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex-1">
                                <p className="font-semibold text-lg">
                                  {rate.carrier}
                                </p>
                                <p className="text-sm text-gray-600 mb-1">
                                  {rate.service}
                                </p>
                                <p className="text-sm text-blue-600 font-medium">
                                  Delivery: {rate.deliveryTime}
                                </p>

                                {/* Additional cost breakdown */}
                                <div className="mt-2 text-xs text-gray-500 space-y-1">
                                  {rate.freight_cost && (
                                    <div className="flex justify-between">
                                      <span>Freight Cost:</span>
                                      <span>₹{rate.freight_cost}</span>
                                    </div>
                                  )}
                                  {rate.cod_cost && (
                                    <div className="flex justify-between">
                                      <span>COD Charges:</span>
                                      <span>₹{rate.cod_cost}</span>
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="text-right ml-4">
                                {/* Price Display */}
                                <div className="flex flex-col items-end">
                                  {rate.discountDisplay > 0 ? (
                                    <>
                                      {/* Strikethrough original price */}
                                      <div className="flex items-center gap-2 mb-1">
                                        <span className="text-sm text-gray-400 line-through font-medium">
                                          ₹
                                          {parseFloat(
                                            rate.inflatedAmount
                                          ).toFixed(2)}
                                        </span>
                                        <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-semibold">
                                          -{rate.discountDisplay}%
                                        </span>
                                      </div>

                                      {/* Final discounted price */}
                                      <div className="flex items-center gap-1">
                                        <span className="text-2xl font-bold text-green-600">
                                          ₹{parseFloat(rate.amount).toFixed(2)}
                                        </span>
                                        <span className="text-green-600 text-sm font-medium">
                                          Final
                                        </span>
                                      </div>

                                      {/* Savings amount */}
                                      <div className="text-xs text-green-600 font-medium mt-1">
                                        You save ₹
                                        {(
                                          parseFloat(rate.inflatedAmount) -
                                          parseFloat(rate.amount)
                                        ).toFixed(2)}
                                      </div>
                                    </>
                                  ) : (
                                    // No discount case
                                    <div className="flex items-center gap-1">
                                      <span className="text-2xl font-bold text-gray-800">
                                        ₹{parseFloat(rate.amount).toFixed(2)}
                                      </span>
                                    </div>
                                  )}
                                </div>

                                {/* Plan indicator */}
                                {rate.discountDisplay > 0 && (
                                  <div className="mt-2 text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">
                                    Premium Plan Discount
                                  </div>
                                )}
                              </div>
                            </div>
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>

                    {/* Rate comparison info */}
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-2">
                        <div className="text-blue-600 mt-1">
                          <svg
                            className="w-4 h-4"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-blue-800 mb-1">
                            Plan Benefits Applied
                          </p>
                          <p className="text-xs text-blue-700">
                            Discounts are automatically applied based on your
                            current subscription plan.
                            {rates.some((rate) => rate.discountDisplay > 0)
                              ? " You're saving money with your premium plan!"
                              : " Upgrade your plan to unlock better rates!"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Book Shipment */}
          {/* Book Shipment - Enhanced Detailed Version */}
          {rates?.length > 0 && selectedRate && (
            <Card className="border-2 border-blue-100">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Package className="h-6 w-6 text-blue-600" />
                  Confirm Booking
                </CardTitle>
                <CardDescription className="text-base">
                  Review all details carefully before confirming your shipment
                  booking
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6">
                <div className="space-y-6">
                  {/* Selected Rate Summary */}
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                    <h4 className="font-semibold mb-3 text-green-800 flex items-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Selected Shipping Option
                    </h4>
                    {(() => {
                      const selectedRateData = rates.find(
                        (rate) => rate.id === selectedRate
                      );
                      return selectedRateData ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">
                                Carrier:
                              </span>
                              <span className="text-sm font-bold">
                                {selectedRateData.carrier}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">
                                Service:
                              </span>
                              <span className="text-sm">
                                {selectedRateData.service}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sm font-medium">
                                Delivery Time:
                              </span>
                              <span className="text-sm font-semibold text-blue-600">
                                {selectedRateData.deliveryTime}
                              </span>
                            </div>
                          </div>
                          <div className="space-y-2">
                            {selectedRateData.discountDisplay > 0 && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-sm font-medium">
                                    Original Rate:
                                  </span>
                                  <span className="text-sm line-through text-gray-500">
                                    ₹
                                    {parseFloat(
                                      selectedRateData.inflatedAmount
                                    ).toFixed(2)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-sm font-medium text-green-600">
                                    Plan Discount:
                                  </span>
                                  <span className="text-sm font-semibold text-green-600">
                                    -{selectedRateData.discountDisplay}%
                                  </span>
                                </div>
                              </>
                            )}
                            <div className="flex justify-between border-t pt-2">
                              <span className="font-semibold">Final Rate:</span>
                              <span className="font-bold text-lg text-green-600">
                                ₹
                                {parseFloat(selectedRateData.amount).toFixed(2)}
                              </span>
                            </div>
                            {selectedRateData.discountDisplay > 0 && (
                              <div className="flex justify-between">
                                <span className="text-xs text-green-600">
                                  You Save:
                                </span>
                                <span className="text-xs font-semibold text-green-600">
                                  ₹
                                  {(
                                    parseFloat(
                                      selectedRateData.inflatedAmount
                                    ) - parseFloat(selectedRateData.amount)
                                  ).toFixed(2)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : null;
                    })()}
                  </div>

                  {/* Shipment Details */}
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold mb-3 flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-gray-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      Shipment Details
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">Order ID:</span>
                          <span className="text-sm font-mono bg-white px-2 py-1 rounded border">
                            {order.client_order_id}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">
                            Shipment Type:
                          </span>
                          <span className="text-sm capitalize font-semibold">
                            Domestic
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">
                            Shipment Mode:
                          </span>
                          <span className="text-sm font-semibold">SURFACE</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">
                            Payment Method:
                          </span>
                          <span
                            className={`text-sm font-semibold px-2 py-1 rounded-full ${
                              order.paymentMethod === "COD"
                                ? "bg-orange-100 text-orange-800"
                                : "bg-green-100 text-green-800"
                            }`}
                          >
                            {order.paymentMethod}
                          </span>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">
                            Package Type:
                          </span>
                          <span className="text-sm font-semibold">
                            {isMultiBox
                              ? `Multi-box (${packages.reduce(
                                  (sum, pkg) => sum + pkg.quantity,
                                  0
                                )} packages)`
                              : "Single package"}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">
                            Total Weight:
                          </span>
                          <span className="text-sm font-semibold">
                            {calculateTotalWeight().toFixed(2)} kg
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">
                            Order Value:
                          </span>
                          <span className="text-sm font-semibold">
                            ₹{order.totalAmount}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm font-medium">
                            Pickup Address:
                          </span>
                          <span className="text-sm font-semibold">
                            {pickupAddresses.find(
                              (addr) =>
                                addr.warehouseId === selectedPickupAddress
                            )?.nickname || "N/A"}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Package Dimensions Summary */}
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold mb-3 text-blue-800 flex items-center gap-2">
                      <Package className="w-5 h-5" />
                      Package Dimensions
                    </h4>
                    {isMultiBox ? (
                      <div className="space-y-3">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <p className="text-sm font-medium text-blue-700 mb-2">
                              Package Summary:
                            </p>
                            <div className="space-y-1 text-sm">
                              <div className="flex justify-between">
                                <span>Total Packages:</span>
                                <span className="font-semibold">
                                  {packages.reduce(
                                    (sum, pkg) => sum + pkg.quantity,
                                    0
                                  )}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Total Weight:</span>
                                <span className="font-semibold">
                                  {calculateTotalWeight().toFixed(2)} kg
                                </span>
                              </div>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-blue-700 mb-2">
                              Max Dimensions (L×B×H):
                            </p>
                            <div className="text-sm">
                              <span className="font-mono bg-white px-2 py-1 rounded border">
                                {getMaxDimensions().length} ×{" "}
                                {getMaxDimensions().breadth} ×{" "}
                                {getMaxDimensions().height} cm
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800">
                          <strong>Note:</strong> Minimum chargeable weight is 10
                          kg for multi-box shipments
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div className="text-center p-2 bg-white rounded border">
                          <div className="font-semibold text-blue-600">
                            {singlePackage.length}
                          </div>
                          <div className="text-xs text-gray-600">
                            Length (cm)
                          </div>
                        </div>
                        <div className="text-center p-2 bg-white rounded border">
                          <div className="font-semibold text-blue-600">
                            {singlePackage.breadth}
                          </div>
                          <div className="text-xs text-gray-600">
                            Breadth (cm)
                          </div>
                        </div>
                        <div className="text-center p-2 bg-white rounded border">
                          <div className="font-semibold text-blue-600">
                            {singlePackage.height}
                          </div>
                          <div className="text-xs text-gray-600">
                            Height (cm)
                          </div>
                        </div>
                        <div className="text-center p-2 bg-white rounded border">
                          <div className="font-semibold text-blue-600">
                            {singlePackage.weight}
                          </div>
                          <div className="text-xs text-gray-600">
                            Weight (gm)
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Address Details */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Pickup Address */}
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-semibold mb-2 flex items-center gap-2 text-green-700">
                        <MapPin className="w-4 h-4" />
                        Pickup From
                      </h5>
                      {(() => {
                        const pickupAddr = pickupAddresses.find(
                          (addr) => addr.warehouseId === selectedPickupAddress
                        );
                        return pickupAddr ? (
                          <div className="text-sm space-y-1">
                            <p className="font-medium">{pickupAddr.nickname}</p>
                            <p>{pickupAddr.street1}</p>
                            <p>
                              {pickupAddr.city}, {pickupAddr.state} -{" "}
                              {pickupAddr.pincode}
                            </p>
                            <p className="text-gray-600">
                              Contact: {pickupAddr.contact}
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">
                            Address not found
                          </p>
                        );
                      })()}
                    </div>

                    {/* Delivery Address */}
                    <div className="p-4 border rounded-lg">
                      <h5 className="font-semibold mb-2 flex items-center gap-2 text-blue-700">
                        <MapPin className="w-4 h-4" />
                        Deliver To
                      </h5>
                      <div className="text-sm space-y-1">
                        <p className="font-medium">
                          {order.shippingAddress?.name}
                        </p>
                        <p>{order.shippingAddress?.address}</p>
                        <p>
                          {order.shippingAddress?.city},{" "}
                          {order.shippingAddress?.state} -{" "}
                          {order.shippingAddress?.pincode}
                        </p>
                        <p className="text-gray-600">
                          Contact: {order.shippingAddress?.phone}
                        </p>
                        <p className="text-gray-600">
                          Country: {order.shippingAddress?.country_code}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Important Notes */}
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <h5 className="font-semibold mb-2 text-yellow-800 flex items-center gap-2">
                      <svg
                        className="w-5 h-5"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Important Notes
                    </h5>
                    <ul className="text-sm text-yellow-800 space-y-1 ml-7 list-disc">
                      <li>
                        Please ensure all package dimensions and weights are
                        accurate
                      </li>
                      <li>
                        Incorrect dimensions may result in additional charges
                      </li>
                      <li>
                        Pickup will be scheduled within 24 hours of booking
                      </li>
                      <li>
                        You will receive tracking information via SMS and email
                      </li>
                      {order.paymentMethod === "COD" && (
                        <li className="font-semibold">
                          COD amount of ₹{order.totalAmount} will be collected
                          from recipient
                        </li>
                      )}
                    </ul>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-3 pt-4">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedRate("")}
                      className="flex-1"
                    >
                      Back to Rates
                    </Button>
                    <Button
                      onClick={handleBookShipment}
                      disabled={isBooking}
                      className="flex-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                    >
                      {isBooking && (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      )}
                      {isBooking
                        ? "Booking Shipment..."
                        : "Confirm & Book Shipment"}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
