"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Users,
  CreditCard,
  Package,
  IndianRupee,
  MessageSquare,
  AlertTriangle,
  MessageCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  Shield,
  HelpCircle,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navigation = [
  {
    name: "Dashboard",
    href: "/customer-support/dashboard",
    icon: LayoutDashboard,
  },
  {
    name: "Helpdesk",
    href: "/customer-support/helpdesk",
    icon: MessageSquare,
  },
  { name: "Settings", href: "/customer-support/settings", icon: Settings },
];

export function SupportSidebar() {
  const { user, logout } = useAuth();

  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();

  return (
    <div
      className={cn(
        "border-r border-gray-200  bg-gray-900 transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      {/* Container with flex layout */}
      <div className="flex flex-col h-screen">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          {!collapsed && (
            <div className="flex items-center space-x-2">
              <div className="p-2 bg-orange-600 rounded-lg">
                <HelpCircle className="h-6 w-6 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Support Portal</h2>
                <p className="text-xs text-gray-400">Shipet Management</p>
              </div>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCollapsed(!collapsed)}
            className="text-gray-400 hover:text-white hover:bg-gray-800"
          >
            {collapsed ? (
              <ChevronRight className="h-4 w-4" />
            ) : (
              <ChevronLeft className="h-4 w-4" />
            )}
          </Button>
        </div>

        {/* Navigation (flex-grow makes this fill space) */}
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
                        ? "bg-orange-600 text-white"
                        : "text-gray-300 hover:bg-gray-800 hover:text-white",
                      collapsed && "justify-center"
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
          <div className="p-4 border-t border-gray-800">
            <div className="text-xs text-gray-400 text-center">
              <p>Shipet Customer Support</p>
              <p>© 2025 All rights reserved</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
