"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { productService } from "@/services/productService";
import { toast } from "sonner";

interface Product {
  _id: string;
  name: string;
  pid?: string;
  description?: string;
  price: number;
  weight: number;
  dimensions: {
    length: number;
    breadth: number;
    height: number;
    unit: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  product?: Product | null;
}

export function ProductModal({ isOpen, onClose, product }: ProductModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    pid: "",
    description: "",
    price: 0,
    weight: 0,
    dimensions: {
      length: 0,
      breadth: 0,
      height: 0,
    },
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        pid: product.pid || "",
        description: product.description || "",
        price: product.price,
        weight: product.weight,
        dimensions: {
          length: product.dimensions.length,
          breadth: product.dimensions.breadth,
          height: product.dimensions.height,
        },
      });
    } else {
      setFormData({
        name: "",
        pid: "",
        description: "",
        price: 0,
        weight: 0,
        dimensions: {
          length: 0,
          breadth: 0,
          height: 0,
        },
      });
    }
  }, [product, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (product) {
        await productService.updateProduct(product._id, formData);
        toast.success("Product updated successfully");
      } else {
        await productService.createProduct(formData);
        toast.success("Product created successfully");
      }
      onClose();
    } catch (error) {
      toast.error(`Failed to ${product ? "update" : "create"} product`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{product ? "Edit Product" : "Add Product"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              required
            />
          </div>

          <div>
            <Label htmlFor="pid">Product ID (optional)</Label>
            <Input
              id="pid"
              value={formData.pid}
              onChange={(e) =>
                setFormData({ ...formData, pid: e.target.value })
              }
              placeholder="e.g. P12345"
            />
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price (₹)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                value={formData.price}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    price: parseFloat(e.target.value) || 0,
                  })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="weight">Weight (grams)</Label>
              <Input
                id="weight"
                type="number"
                step="1"
                value={formData.weight}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    weight: parseInt(e.target.value) || 0,
                  })
                }
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="length">Length (cm)</Label>
              <Input
                id="length"
                type="number"
                value={formData.dimensions.length}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dimensions: {
                      ...formData.dimensions,
                      length: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="breadth">Breadth (cm)</Label>
              <Input
                id="breadth"
                type="number"
                value={formData.dimensions.breadth}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dimensions: {
                      ...formData.dimensions,
                      breadth: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="height">Height (cm)</Label>
              <Input
                id="height"
                type="number"
                value={formData.dimensions.height}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    dimensions: {
                      ...formData.dimensions,
                      height: parseFloat(e.target.value) || 0,
                    },
                  })
                }
                required
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 space-x-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Saving..."
                : product
                ? "Update Product"
                : "Create Product"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
