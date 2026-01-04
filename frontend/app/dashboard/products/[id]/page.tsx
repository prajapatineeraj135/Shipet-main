"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { productService } from "@/services/productService";
import { toast } from "sonner";
import {
  ArrowLeft,
  Package,
  Tag,
  Weight,
  Ruler,
  DollarSign,
  Calendar,
  BarChart3,
} from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

export default function ProductViewPage() {
  const params = useParams();
  const [product, setProduct] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchProductData(params.id as string);
    }
  }, [params.id]);

  const fetchProductData = async (productId: string) => {
    try {
      setIsLoading(true);
      const productData = await productService.getProduct(productId);
      setProduct(productData);
    } catch (error) {
      toast.error("Failed to fetch product details");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-4">
          <Skeleton className="h-10 w-32" />
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-6">
                <Skeleton className="h-64 w-full rounded-lg" />
              </CardContent>
            </Card>
          </div>
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center space-x-3">
                      <Skeleton className="h-4 w-4" />
                      <Skeleton className="h-4 w-32" />
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Product not found
        </h3>
        <p className="text-gray-600 mb-4">
          The product you're looking for doesn't exist.
        </p>
        <Link href="/dashboard/products">
          <Button>Back to Products</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <Link href="/dashboard/products">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
          <p className="text-gray-600">Product Details</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Product Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center space-x-3">
                <Package className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="font-medium">{product.name}</p>
                  <p className="text-sm text-gray-600">Product Name</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Tag className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="font-medium font-mono">
                    {product.pid || "N/A"}
                  </p>
                  <p className="text-sm text-gray-600">PID</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <DollarSign className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="font-medium">₹{product.price.toFixed(2)}</p>
                  <p className="text-sm text-gray-600">Price</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Weight className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="font-medium">{product.weight} kg</p>
                  <p className="text-sm text-gray-600">Weight</p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Ruler className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="font-medium">
                    {product.dimensions.length} × {product.dimensions.breadth} ×{" "}
                    {product.dimensions.height} {product.dimensions.unit}
                  </p>
                  <p className="text-sm text-gray-600">
                    Dimensions (L × B × H)
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="font-medium">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-gray-600">Created Date</p>
                </div>
              </div>
              {product.status && (
                <div className="flex items-center space-x-3">
                  <div className="h-4 w-4 flex items-center justify-center">
                    <div
                      className={`h-2 w-2 rounded-full ${
                        product.status === "active"
                          ? "bg-green-500"
                          : "bg-red-500"
                      }`}
                    />
                  </div>
                  <div>
                    <Badge
                      className={
                        product.status === "active"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {product.status.charAt(0).toUpperCase() +
                        product.status.slice(1)}
                    </Badge>
                    <p className="text-sm text-gray-600">Status</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 leading-relaxed">
                {product.description ||
                  "No description available for this product."}
              </p>
            </CardContent>
          </Card>
        </div>
        {/* Product Image */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center">
                {product.image ? (
                  <Image
                    src={product.image}
                    alt={product.name}
                    width={300}
                    height={300}
                    className="rounded-lg object-cover"
                  />
                ) : (
                  <Package className="h-24 w-24 text-gray-400" />
                )}
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          {/* <Card className="mt-6">
            <CardHeader>
              <CardTitle>Quick Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Current Stock</span>
                <span
                  className={`font-bold text-2xl ${
                    product.stock && product.stock < 10
                      ? "text-red-600"
                      : "text-green-600"
                  }`}
                >
                  {product.stock ?? "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Total Sold</span>
                <span className="font-bold text-2xl">
                  {product.totalSold ?? 0}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Revenue</span>
                <span className="font-bold text-lg">
                  ₹{(product.revenue ?? 0).toFixed(2)}
                </span>
              </div>
            </CardContent>
          </Card> */}
        </div>
      </div>
    </div>
  );
}
