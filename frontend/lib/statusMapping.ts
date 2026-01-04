// lib/statusMapping.js - Status mapping configuration
export const ICARRY_STATUS_MAPPING: any = {
  // Code to String mapping (for backend storage)
  codeToString: {
    1: "Pending Pickup",
    2: "Processing",
    3: "Shipped",
    7: "Cancelled",
    12: "Damaged",
    14: "Lost",
    16: "Voided",
    21: "Delivered",
    22: "In Transit",
    23: "Returned to Origin",
    24: "Manifested",
    25: "Pickup Scheduled",
    26: "Out For Delivery",
    27: "Pending Return",
    50: "NDR",
  },

  // Status display configuration for UI
  statusConfig: {
    1: {
      label: "Pending Pickup",
      color: "bg-gray-100 text-gray-800",
      icon: "📦",
      description: "Waiting for pickup from seller",
    },
    2: {
      label: "Processing",
      color: "bg-blue-100 text-blue-800",
      icon: "⚙️",
      description: "Order is being processed",
    },
    3: {
      label: "Shipped",
      color: "bg-green-100 text-green-800",
      icon: "🚚",
      description: "Package has been shipped",
    },
    7: {
      label: "Cancelled",
      color: "bg-red-100 text-red-800",
      icon: "❌",
      description: "Order has been cancelled",
    },
    12: {
      label: "Damaged",
      color: "bg-red-200 text-red-800",
      icon: "💥",
      description: "Package is damaged",
    },
    14: {
      label: "Lost",
      color: "bg-red-200 text-red-800",
      icon: "❓",
      description: "Package is lost in transit",
    },
    16: {
      label: "Voided",
      color: "bg-gray-200 text-gray-800",
      icon: "🚫",
      description: "Shipment has been voided",
    },
    21: {
      label: "Delivered",
      color: "bg-green-100 text-green-800",
      icon: "✅",
      description: "Successfully delivered",
    },
    22: {
      label: "In Transit",
      color: "bg-yellow-100 text-yellow-800",
      icon: "🚛",
      description: "Package is in transit",
    },
    23: {
      label: "Returned to Origin",
      color: "bg-purple-100 text-purple-800",
      icon: "↩️",
      description: "Package returned to sender",
    },
    24: {
      label: "Manifested",
      color: "bg-blue-100 text-blue-800",
      icon: "📋",
      description: "Shipment manifested with courier",
    },
    25: {
      label: "Pickup Scheduled",
      color: "bg-orange-100 text-orange-800",
      icon: "📅",
      description: "Pickup has been scheduled",
    },
    26: {
      label: "Out For Delivery",
      color: "bg-orange-100 text-orange-800",
      icon: "🚚",
      description: "Out for delivery",
    },
    27: {
      label: "Pending Return",
      color: "bg-purple-100 text-purple-800",
      icon: "🔄",
      description: "Return is pending",
    },
    50: {
      label: "NDR",
      color: "bg-yellow-100 text-yellow-800",
      icon: "🚛",
      description: "Not Delivered",
    },
  },
};
