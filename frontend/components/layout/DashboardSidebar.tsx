"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  Truck,
  Users,
  Wallet,
  MapPin,
  Calculator,
  FileText,
  Settings,
  ChevronLeft,
  ChevronRight,
  IndianRupee,
  Home,
  HelpCircleIcon,
  ParkingCircle,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Orders", href: "/dashboard/orders", icon: Package },
  { name: "Shipments", href: "/dashboard/shipments", icon: Truck },
  { name: "Customers", href: "/dashboard/customers", icon: Users },
  { name: "Products", href: "/dashboard/products", icon: Package },
  {
    name: "Pickup Addresses",
    href: "/dashboard/pickup-addresses",
    icon: MapPin,
  },
  { name: "Estimate Cost", href: "/dashboard/estimate", icon: Calculator },
  { name: "Check Pincode", href: "/dashboard/pincode", icon: Home },

  { name: "Wallet", href: "/dashboard/wallet", icon: Wallet },
  { name: "Plans", href: "/dashboard/plans", icon: IndianRupee },
  { name: "NDR Portal", href: "/dashboard/Ndr-portal", icon: Truck },
  { name: "Help Desk", href: "/dashboard/helpdesk", icon: HelpCircleIcon },

  {
    name: "COD Remittance",
    href: "/dashboard/cod-remittance",
    icon: ParkingCircle,
  },

  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export function DashboardSidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "bg-white border-r border-gray-200 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Full height with flex layout */}
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-gray-900">Shipet</span>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="p-2"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto mt-4 px-2">
          <ul className="space-y-1">
            {navigation.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href + "/");
              return (
                <li key={item.name}>
                  <Link
                    href={item.href}
                    className={cn(
                      "flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors",
                      isActive
                        ? "bg-blue-100 text-blue-700"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <item.icon
                      className={cn(
                        "flex-shrink-0 h-5 w-5",
                        collapsed ? "mx-auto" : "mr-3"
                      )}
                    />
                    {!collapsed && <span>{item.name}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer pinned at bottom */}
        {!collapsed && (
          <div className="p-4 border-t border-gray-200">
            <div className="text-xs text-gray-400 text-center">
              <p>Shipet Seller</p>
              <p>© 2025 All rights reserved</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
