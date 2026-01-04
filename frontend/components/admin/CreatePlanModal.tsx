"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { X, Plus, Trash2, Shield, Star, Zap, Crown } from "lucide-react";

interface CreatePlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  plan?: any | null;
  mode: "create" | "edit";
}

const iconOptions = [
  { value: "shield", label: "Shield", icon: Shield, color: "bg-blue-500" },
  { value: "star", label: "Star", icon: Star, color: "bg-yellow-500" },
  { value: "zap", label: "Zap", icon: Zap, color: "bg-purple-500" },
  { value: "crown", label: "Crown", icon: Crown, color: "bg-orange-500" },
];

const colorOptions = [
  { value: "bg-blue-500", label: "Blue", color: "bg-blue-500" },
  { value: "bg-green-500", label: "Green", color: "bg-green-500" },
  { value: "bg-purple-500", label: "Purple", color: "bg-purple-500" },
  { value: "bg-red-500", label: "Red", color: "bg-red-500" },
  { value: "bg-yellow-500", label: "Yellow", color: "bg-yellow-500" },
  { value: "bg-indigo-500", label: "Indigo", color: "bg-indigo-500" },
  { value: "bg-pink-500", label: "Pink", color: "bg-pink-500" },
  { value: "bg-gray-500", label: "Gray", color: "bg-gray-500" },
  { value: "bg-amber-600", label: "Amber", color: "bg-amber-600" },
  { value: "bg-emerald-500", label: "Emerald", color: "bg-emerald-500" },
];

export function CreatePlanModal({
  isOpen,
  onClose,
  onSubmit,
  plan,
  mode,
}: CreatePlanModalProps) {
  const [formData, setFormData] = useState<any>({
    name: "",
    price: 0,
    commissionPercentage: 0,
    discountDisplay: 0,
    period: "per month",
    features: [""],
    iconType: "shield",
    colorClass: "bg-blue-500",
    isPopular: false,
    sortOrder: 1,
  });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (plan && mode === "edit") {
      setFormData({
        name: plan.name,
        price: plan.price,
        commissionPercentage: plan.commissionPercentage,
        discountDisplay: plan.discountDisplay,
        period: plan.period,
        features: plan.features,
        iconType: plan.iconType,
        colorClass: plan.colorClass,
        isPopular: plan.isPopular,
        sortOrder: plan.sortOrder,
      });
    } else {
      setFormData({
        name: "",
        price: 0,
        commissionPercentage: 0,
        discountDisplay: 0,
        period: "per month",
        features: [""],
        iconType: "shield",
        colorClass: "bg-blue-500",
        isPopular: false,
        sortOrder: 1,
      });
    }
    setErrors({});
  }, [plan, mode, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Plan name is required";
    }

    if (formData.price < 0) {
      newErrors.price = "Price cannot be negative";
    }

    if (
      formData.commissionPercentage < 0 ||
      formData.commissionPercentage > 100
    ) {
      newErrors.commissionPercentage = "Commission must be between 0 and 100";
    }

    if (formData.discountDisplay < 0 || formData.discountDisplay > 100) {
      newErrors.discountDisplay = "Discount must be between 0 and 100";
    }

    if (formData.sortOrder < 1) {
      newErrors.sortOrder = "Sort order must be at least 1";
    }

    const validFeatures = formData.features.filter((f: any) => f.trim());
    if (validFeatures.length === 0) {
      newErrors.features = "At least one feature is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        features: formData.features.filter((f: any) => f.trim()),
      };
      await onSubmit(submitData);
    } catch (error) {
      console.error("Error submitting plan:", error);
    } finally {
      setLoading(false);
    }
  };

  const addFeature = () => {
    setFormData((prev: any) => ({
      ...prev,
      features: [...prev.features, ""],
    }));
  };

  const removeFeature = (index: number) => {
    setFormData((prev: any) => ({
      ...prev,
      features: prev.features.filter((_: any, i: any) => i !== index),
    }));
  };

  const updateFeature = (index: number, value: string) => {
    setFormData((prev: any) => ({
      ...prev,
      features: prev.features.map((f: any, i: any) =>
        i === index ? value : f
      ),
    }));
  };

  const selectedIcon = iconOptions.find(
    (icon) => icon.value === formData.iconType
  );
  const selectedColor = colorOptions.find(
    (color) => color.value === formData.colorClass
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === "create" ? "Create New Plan" : "Edit Plan"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a new subscription plan for your platform"
              : "Update the plan details and pricing"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Basic Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Plan Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="e.g., Professional Plan"
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-sm text-red-500">{errors.name}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="period">Billing Period</Label>
                  <Select
                    value={formData.period}
                    onValueChange={(
                      value: "Free Forever" | "per month" | "per year"
                    ) =>
                      setFormData((prev: any) => ({ ...prev, period: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Free Forever">Free Forever</SelectItem>
                      <SelectItem value="per month">Per Month</SelectItem>
                      <SelectItem value="per year">Per Year</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="sortOrder">Display Order</Label>
                  <Input
                    id="sortOrder"
                    type="number"
                    min="1"
                    value={formData.sortOrder}
                    onChange={(e) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        sortOrder: parseInt(e.target.value) || 1,
                      }))
                    }
                    className={errors.sortOrder ? "border-red-500" : ""}
                  />
                  {errors.sortOrder && (
                    <p className="text-sm text-red-500">{errors.sortOrder}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Popular Plan</Label>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="isPopular"
                      checked={formData.isPopular}
                      onCheckedChange={(checked) =>
                        setFormData((prev: any) => ({
                          ...prev,
                          isPopular: checked as boolean,
                        }))
                      }
                    />
                    <Label htmlFor="isPopular" className="text-sm">
                      Mark as popular plan
                    </Label>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Pricing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pricing & Commission</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price">Price (₹) *</Label>
                  <Input
                    id="price"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.price}
                    onChange={(e) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        price: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="0.00"
                    className={errors.price ? "border-red-500" : ""}
                  />
                  {errors.price && (
                    <p className="text-sm text-red-500">{errors.price}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="commissionPercentage">Commission (%)</Label>
                  <Input
                    id="commissionPercentage"
                    type="number"
                    min="0"
                    max="100"
                    value={formData.commissionPercentage}
                    onChange={(e) =>
                      setFormData((prev: any) => ({
                        ...prev,
                        commissionPercentage: parseFloat(e.target.value) || 0,
                      }))
                    }
                    placeholder="0"
                    className={
                      errors.commissionPercentage ? "border-red-500" : ""
                    }
                  />
                  {errors.commissionPercentage && (
                    <p className="text-sm text-red-500">
                      {errors.commissionPercentage}
                    </p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="discountDisplay">Discount Display (%)</Label>
                <Input
                  id="discountDisplay"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.discountDisplay}
                  onChange={(e) =>
                    setFormData((prev: any) => ({
                      ...prev,
                      discountDisplay: parseFloat(e.target.value) || 0,
                    }))
                  }
                  placeholder="0"
                  className={errors.discountDisplay ? "border-red-500" : ""}
                />
                <p className="text-xs text-muted-foreground">
                  This is for display purposes only and doesn't affect actual
                  pricing
                </p>
                {errors.discountDisplay && (
                  <p className="text-sm text-red-500">
                    {errors.discountDisplay}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Visual Design */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Visual Design</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Plan Icon</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {iconOptions.map((icon) => {
                      const IconComponent = icon.icon;
                      return (
                        <button
                          key={icon.value}
                          type="button"
                          onClick={() =>
                            setFormData((prev: any) => ({
                              ...prev,
                              iconType: icon.value as any,
                            }))
                          }
                          className={`p-3 border rounded-lg flex items-center space-x-2 hover:bg-gray-50 ${
                            formData.iconType === icon.value
                              ? "border-blue-500 bg-blue-50"
                              : "border-gray-200"
                          }`}
                        >
                          <div
                            className={`p-1 rounded ${icon.color} text-white`}
                          >
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <span className="text-sm">{icon.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Plan Color</Label>
                  <div className="grid grid-cols-5 gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() =>
                          setFormData((prev: any) => ({
                            ...prev,
                            colorClass: color.value,
                          }))
                        }
                        className={`p-2 border rounded-lg flex flex-col items-center space-y-1 hover:bg-gray-50 ${
                          formData.colorClass === color.value
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200"
                        }`}
                      >
                        <div className={`w-6 h-6 rounded ${color.color}`}></div>
                        <span className="text-xs">{color.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Plan Features</CardTitle>
              <CardDescription>
                Add the key features included in this plan
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {formData.features.map((feature: any, index: any) => (
                <div key={index} className="flex items-center space-x-2">
                  <Input
                    value={feature}
                    onChange={(e) => updateFeature(index, e.target.value)}
                    placeholder="Enter a feature..."
                    className="flex-1"
                  />
                  {formData.features.length > 1 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeFeature(index)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              <Button
                type="button"
                variant="outline"
                onClick={addFeature}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Feature
              </Button>

              {errors.features && (
                <p className="text-sm text-red-500">{errors.features}</p>
              )}
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg p-6 bg-white shadow-sm max-w-sm mx-auto">
                <div className="text-center mb-4">
                  <div
                    className={`inline-flex p-3 rounded-lg ${formData.colorClass} text-white mb-3`}
                  >
                    {selectedIcon && <selectedIcon.icon className="h-6 w-6" />}
                  </div>
                  <div className="flex items-center justify-center space-x-2 mb-2">
                    <h3 className="text-xl font-bold">
                      {formData.name || "Plan Name"}
                    </h3>
                    {formData.isPopular && (
                      <Badge variant="secondary" className="text-xs">
                        Popular
                      </Badge>
                    )}
                  </div>
                  <div className="text-3xl font-bold mb-1">
                    {formData.price === 0
                      ? "Free"
                      : `₹${formData.price.toLocaleString()}`}
                  </div>
                  <div className="text-sm text-muted-foreground mb-2">
                    {formData.period}
                  </div>
                  {formData.discountDisplay > 0 && (
                    <Badge variant="secondary" className="mb-4">
                      {formData.discountDisplay}% OFF
                    </Badge>
                  )}
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  {formData.features
                    .filter((f: any) => f.trim())
                    .map((feature: any, index: any) => (
                      <div key={index} className="flex items-center text-sm">
                        <div className="w-2 h-2 bg-green-500 rounded-full mr-3 flex-shrink-0"></div>
                        <span>{feature}</span>
                      </div>
                    ))}
                </div>

                {formData.commissionPercentage > 0 && (
                  <div className="mt-4 p-2 bg-blue-50 rounded text-center">
                    <span className="text-xs text-blue-600">
                      {formData.commissionPercentage}% Commission
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading
                ? "Saving..."
                : mode === "create"
                ? "Create Plan"
                : "Update Plan"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
