import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
  }).format(amount);
}

export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid Date";

  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function formatDate(dateString: string): string {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return "Invalid Date";

  return new Intl.DateTimeFormat("en-IN", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);
}

export function formatTime(dateString: string): string {
  return new Intl.DateTimeFormat("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(dateString));
}

export function generateOrderNumber(): string {
  return `ORD${Date.now().toString().slice(-6)}`;
}

export function generateAWBNumber(): string {
  return `AWB${Math.random().toString().substr(2, 9)}`;
}

export function calculateVolumetricWeight(dimensions: {
  length: number;
  width: number;
  height: number;
}): number {
  // Standard volumetric weight calculation: (L × W × H) / 5000
  return (dimensions.length * dimensions.width * dimensions.height) / 5000;
}

export function getShippingWeight(
  actualWeight: number,
  dimensions: { length: number; width: number; height: number }
): number {
  const volumetricWeight = calculateVolumetricWeight(dimensions);
  return Math.max(actualWeight, volumetricWeight);
}
