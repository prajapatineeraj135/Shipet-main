"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { estimateService } from "@/services/estimateService";
import { toast } from "sonner";
import { Calculator, Package, Truck, Globe, Plus, Trash2 } from "lucide-react";
import { COUNTRIES } from "@/lib/constant";

export default function EstimatePage() {
  const [activeTab, setActiveTab] = useState("single");
  const [singleEstimate, setSingleEstimate] = useState({
    length: "",
    breadth: "",
    height: "",
    weight: "",
    destination_pincode: "",
    origin_pincode: "",
    destination_country_code: "IN",
    origin_country_code: "IN",
    shipment_mode: "E",
    shipment_type: "P",
    shipment_value: "",
  });

  const [multiBoxItems, setMultiBoxItems] = useState({
    destination_pincode: "",
    origin_pincode: "",
    destination_country_code: "IN",
    origin_country_code: "IN",
    shipment_mode: "E",
    shipment_type: "P",
    shipment_value: "",
    boxes: [
      {
        quantity: "",
        length: "",
        breadth: "",
        height: "",
        dimension_unit: "cm",
        weight: "",
        weight_unit: "gm",
      },
    ],
  });

  const [internationalEstimate, setInternationalEstimate] = useState({
    weight: "",
    length: "",
    breadth: "",
    height: "",
    origin_pincode: "",
    origin_country_code: "IN",
    destination_country_code: "",
  });
  const [estimateType, setEstimateType] = useState<
    "single" | "multi" | "international" | ""
  >("");

  const [estimates, setEstimates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSingleEstimate = async () => {
    setIsLoading(true);
    try {
      // Convert relevant fields to numbers before sending to API
      const payload = {
        ...singleEstimate,
        length: Number(singleEstimate.length),
        breadth: Number(singleEstimate.breadth),
        height: Number(singleEstimate.height),
        weight: Number(singleEstimate.weight),
        shipment_value: Number(singleEstimate.shipment_value),
      };

      const results = await estimateService.getSingleEstimate(payload);
      console.log(results);
      setEstimates(results);
      setEstimateType("single");
      toast.success("Estimates calculated successfully");
    } catch (error) {
      toast.error("Failed to calculate estimates");
    } finally {
      setIsLoading(false);
    }
  };

  const handleMultiBoxEstimate = async () => {
    setIsLoading(true);
    try {
      // Prepare payload by converting string values to appropriate types
      const payload = {
        destination_pincode: multiBoxItems.destination_pincode,
        origin_pincode: multiBoxItems.origin_pincode,
        destination_country_code: multiBoxItems.destination_country_code,
        origin_country_code: multiBoxItems.origin_country_code,
        shipment_mode: multiBoxItems.shipment_mode,
        shipment_type: multiBoxItems.shipment_type,
        shipment_value: Number(multiBoxItems.shipment_value),
        boxes: multiBoxItems.boxes.map((box) => ({
          quantity: Number(box.quantity),
          length: Number(box.length),
          breadth: Number(box.breadth),
          height: Number(box.height),
          dimension_unit: box.dimension_unit,
          weight: Number(box.weight),
          weight_unit: box.weight_unit,
        })),
      };
      const results = await estimateService.getMultiBoxEstimate(payload);
      const normalized = Object.values(results).map((item: any) => ({
        courier_name: item.courier_group_name,
        courier_cost: item.courier_cost,
        freight_cost: item.freight_cost,
        cod_cost: item.cod_cost,
        courier_group_id: item.courier_group_id,
      }));
      setEstimates(normalized);
      setEstimateType("multi");
      console.log(results);
      toast.success("Multi-box estimates calculated successfully");
    } catch (error) {
      toast.error("Failed to calculate multi-box estimates");
    } finally {
      setIsLoading(false);
    }
  };

  const handleInternationalEstimate = async () => {
    setIsLoading(true);
    try {
      const payload = {
        weight: Number(internationalEstimate.weight),
        length: Number(internationalEstimate.length),
        breadth: Number(internationalEstimate.breadth),
        height: Number(internationalEstimate.height),
        origin_pincode: internationalEstimate.origin_pincode,
        origin_country_code: internationalEstimate.origin_country_code,
        destination_country_code:
          internationalEstimate.destination_country_code,
      };

      const results = await estimateService.getInternationalEstimate(payload);
      const normalized = results.map((item: any) => ({
        courier_name: item.courier_name,
        courier_cost: item.total,
        courier_id: item.courier_id,
        courier_shipping: item.shipping,
        tax: item.tax,
        surcharge: item.surcharge,
        fsc: item.fsc,
      }));
      setEstimates(normalized);
      setEstimateType("international");
      console.log(results);
      toast.success("International estimates calculated successfully");
    } catch (error) {
      toast.error("Failed to calculate international estimates");
    } finally {
      setIsLoading(false);
    }
  };

  // Add a new box
  const addMultiBoxItem = () => {
    setMultiBoxItems((prev) => ({
      ...prev,
      boxes: [
        ...prev.boxes,
        {
          quantity: "",
          length: "",
          breadth: "",
          height: "",
          dimension_unit: "cm",
          weight: "",
          weight_unit: "gm",
        },
      ],
    }));
  };

  // Remove box by index
  const removeMultiBoxItem = (index: number) => {
    if (multiBoxItems.boxes.length > 1) {
      setMultiBoxItems((prev) => ({
        ...prev,
        boxes: prev.boxes.filter((_, i) => i !== index),
      }));
    }
  };

  // Update a box field
  const updateMultiBoxItem = (
    index: number,
    field: keyof (typeof multiBoxItems.boxes)[0],
    value: any
  ) => {
    const updatedBoxes = [...multiBoxItems.boxes];
    updatedBoxes[index] = { ...updatedBoxes[index], [field]: value };

    setMultiBoxItems((prev) => ({
      ...prev,
      boxes: updatedBoxes,
    }));
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Shipping Cost Estimator
        </h1>
        <p className="text-gray-600">
          Calculate shipping costs for different service types (only India is
          supported)
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="single" className="flex items-center space-x-2">
            <Package className="h-4 w-4" />
            <span>Single Package</span>
          </TabsTrigger>
          <TabsTrigger value="multi" className="flex items-center space-x-2">
            <Truck className="h-4 w-4" />
            <span>Multi-Box</span>
          </TabsTrigger>
          <TabsTrigger
            value="international"
            className="flex items-center space-x-2"
          >
            <Globe className="h-4 w-4" />
            <span>International</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="single" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Single Package Estimate</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="origin">Origin Pincode</Label>
                  <Input
                    id="origin"
                    placeholder="Enter origin pincode"
                    value={singleEstimate.origin_pincode}
                    onChange={(e) =>
                      setSingleEstimate({
                        ...singleEstimate,
                        origin_pincode: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="destination">Destination Pincode</Label>
                  <Input
                    id="destination"
                    placeholder="Enter destination pincode"
                    value={singleEstimate.destination_pincode}
                    onChange={(e) =>
                      setSingleEstimate({
                        ...singleEstimate,
                        destination_pincode: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label htmlFor="weight">Weight (gm)</Label>
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder="0.0"
                    value={singleEstimate.weight}
                    onChange={(e) =>
                      setSingleEstimate({
                        ...singleEstimate,
                        weight: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="length">Length (cm)</Label>
                  <Input
                    id="length"
                    type="number"
                    placeholder="0"
                    value={singleEstimate.length}
                    onChange={(e) =>
                      setSingleEstimate({
                        ...singleEstimate,
                        length: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="width">Width (cm)</Label>
                  <Input
                    id="width"
                    type="number"
                    placeholder="0"
                    value={singleEstimate.breadth}
                    onChange={(e) =>
                      setSingleEstimate({
                        ...singleEstimate,
                        breadth: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="height">Height (cm)</Label>
                  <Input
                    id="height"
                    type="number"
                    placeholder="0"
                    value={singleEstimate.height}
                    onChange={(e) =>
                      setSingleEstimate({
                        ...singleEstimate,
                        height: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="declaredValue">Shipment Value (₹)</Label>
                  <Input
                    id="declaredValue"
                    type="number"
                    placeholder="0"
                    value={singleEstimate.shipment_value}
                    onChange={(e) =>
                      setSingleEstimate({
                        ...singleEstimate,
                        shipment_value: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="paymentMode">Payment Mode</Label>
                  <Select
                    value={singleEstimate.shipment_type}
                    onValueChange={(value: "P" | "C") =>
                      setSingleEstimate({
                        ...singleEstimate,
                        shipment_type: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="P">Prepaid</SelectItem>
                      <SelectItem value="C">Cash on Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="serviceType">Shipment Type</Label>
                  <Select
                    value={singleEstimate.shipment_mode}
                    onValueChange={(value: "E" | "S") =>
                      setSingleEstimate({
                        ...singleEstimate,
                        shipment_mode: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="E">Express / Air</SelectItem>
                      <SelectItem value="S">Surface</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleSingleEstimate}
                disabled={isLoading}
                className="w-full"
              >
                <Calculator className="mr-2 h-4 w-4" />
                {isLoading ? "Calculating..." : "Calculate Estimate"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="multi" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Truck className="h-5 w-5" />
                <span>Multi-Box Estimate</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="multiOrigin">Origin Pincode</Label>
                  <Input
                    id="multiOrigin"
                    placeholder="Enter origin pincode"
                    value={multiBoxItems.origin_pincode}
                    onChange={(e) =>
                      setMultiBoxItems({
                        ...multiBoxItems,
                        origin_pincode: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="multiDestination">Destination Pincode</Label>
                  <Input
                    id="multiDestination"
                    placeholder="Enter destination pincode"
                    value={multiBoxItems.destination_pincode}
                    onChange={(e) =>
                      setMultiBoxItems({
                        ...multiBoxItems,
                        destination_pincode: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-medium">Package Details</h3>
                  <Button onClick={addMultiBoxItem} variant="outline" size="sm">
                    <Plus className="mr-2 h-4 w-4" />
                    Add Package
                  </Button>
                </div>

                {multiBoxItems.boxes.map((item: any, index: any) => (
                  <Card key={index} className="p-4">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="font-medium">Package {index + 1}</h4>
                      {multiBoxItems.boxes.length > 1 && (
                        <Button
                          onClick={() => removeMultiBoxItem(index)}
                          variant="outline"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                      <div>
                        <Label>Weight (gm)</Label>
                        <Input
                          type="number"
                          step="0.1"
                          value={item.weight}
                          onChange={(e) =>
                            updateMultiBoxItem(
                              index,
                              "weight",
                              Number.parseFloat(e.target.value)
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label>Length (cm)</Label>
                        <Input
                          type="number"
                          value={item.length}
                          onChange={(e) =>
                            updateMultiBoxItem(
                              index,
                              "length",
                              Number.parseInt(e.target.value)
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label>Width (cm)</Label>
                        <Input
                          type="number"
                          value={item.breadth}
                          onChange={(e) =>
                            updateMultiBoxItem(
                              index,
                              "breadth",
                              Number.parseInt(e.target.value)
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label>Height (cm)</Label>
                        <Input
                          type="number"
                          value={item.height}
                          onChange={(e) =>
                            updateMultiBoxItem(
                              index,
                              "height",
                              Number.parseInt(e.target.value)
                            )
                          }
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="declaredValue">Shipment Value (₹)</Label>
                  <Input
                    id="declaredValue"
                    type="number"
                    placeholder="0"
                    value={multiBoxItems.shipment_value}
                    onChange={(e) =>
                      setMultiBoxItems({
                        ...multiBoxItems,
                        shipment_value: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Payment Mode</Label>
                  <Select
                    value={multiBoxItems.shipment_type}
                    onValueChange={(value: "P" | "C") =>
                      setMultiBoxItems({
                        ...multiBoxItems,
                        shipment_type: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="P">Prepaid</SelectItem>
                      <SelectItem value="C">Cash on Delivery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Shipment Type</Label>
                  <Select
                    value={multiBoxItems.shipment_mode}
                    onValueChange={(value: "S" | "E") =>
                      setMultiBoxItems({
                        ...multiBoxItems,
                        shipment_mode: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="E">Express / Air</SelectItem>
                      <SelectItem value="S">Surface</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleMultiBoxEstimate}
                disabled={isLoading}
                className="w-full"
              >
                <Calculator className="mr-2 h-4 w-4" />
                {isLoading ? "Calculating..." : "Calculate Multi-Box Estimate"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="international" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Globe className="h-5 w-5" />
                <span>International Estimate</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="intlOrigin">Origin Pincode</Label>
                  <Input
                    id="multiOrigin"
                    placeholder="Enter origin pincode"
                    value={internationalEstimate.origin_pincode}
                    onChange={(e) =>
                      setInternationalEstimate({
                        ...internationalEstimate,
                        origin_pincode: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="intlDestination">Destination Country</Label>
                  <Select
                    value={internationalEstimate.destination_country_code}
                    onValueChange={(value) =>
                      setInternationalEstimate({
                        ...internationalEstimate,
                        destination_country_code: value,
                      })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select destination country" />
                    </SelectTrigger>
                    <SelectContent>
                      {COUNTRIES.map((country) => (
                        <SelectItem key={country.code} value={country.code}>
                          {country.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Label>Weight (gm)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={internationalEstimate.weight}
                    onChange={(e) =>
                      setInternationalEstimate({
                        ...internationalEstimate,
                        weight: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Length (cm)</Label>
                  <Input
                    type="number"
                    value={internationalEstimate.length}
                    onChange={(e) =>
                      setInternationalEstimate({
                        ...internationalEstimate,
                        length: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Width (cm)</Label>
                  <Input
                    type="number"
                    value={internationalEstimate.breadth}
                    onChange={(e) =>
                      setInternationalEstimate({
                        ...internationalEstimate,
                        breadth: e.target.value,
                      })
                    }
                  />
                </div>
                <div>
                  <Label>Height (cm)</Label>
                  <Input
                    type="number"
                    value={internationalEstimate.height}
                    onChange={(e) =>
                      setInternationalEstimate({
                        ...internationalEstimate,
                        height: e.target.value,
                      })
                    }
                  />
                </div>
              </div>

              <Button
                onClick={handleInternationalEstimate}
                disabled={isLoading}
                className="w-full"
              >
                <Calculator className="mr-2 h-4 w-4" />
                {isLoading
                  ? "Calculating..."
                  : "Calculate International Estimate"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      {estimates.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Shipping Estimates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {estimates.map((estimate, index) => (
                <div
                  key={index}
                  className="border rounded-lg p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="font-semibold text-lg">
                          {estimate?.courier_name || "Unnamed Courier"}
                        </h3>

                        {/* Show group name only for "single" type */}
                        {estimateType === "single" &&
                          estimate?.courier_group_name && (
                            <Badge variant="outline">
                              {estimate.courier_group_name}
                            </Badge>
                          )}
                      </div>

                      {/* You can show extra info here based on estimateType */}
                      {estimateType === "multi" && (
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Freight Cost: ₹{estimate?.freight_cost}</p>
                          <p>COD Cost: ₹{estimate?.cod_cost}</p>
                        </div>
                      )}

                      {estimateType === "international" && (
                        <div className="text-sm text-gray-600 space-y-1">
                          <p>Shipping Cost: ₹{estimate?.courier_shipping}</p>
                          <p>Tax: ₹{estimate?.tax}</p>
                          <p>Surcharge: ₹{estimate?.surcharge}</p>
                          <p>Fuel Surcharge (FSC): ₹{estimate?.fsc}</p>
                        </div>
                      )}
                    </div>

                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">
                        ₹{estimate?.courier_cost}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
