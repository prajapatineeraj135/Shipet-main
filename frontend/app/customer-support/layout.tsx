"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";
import { SupportSidebar } from "@/components/customer-support/SupportSidebar";
import { SupportHeader } from "@/components/customer-support/SupportHeader";

export default function SupportLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        router.push("/auth/login");
      } else if (user.role === "admin") {
        router.push("/admin/dashboard");
      } else if (user.role === "user") {
        router.push("/dashboard");
      } else if (user.role === "support") {
        setIsAuthorized(true); // ✅ support can access this layout
      } else {
        router.push("/auth/login");
      }
    }
  }, [user, isLoading, router]);

  if (isLoading || !isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="h-6 w-6 animate-spin" />
          <span>Loading support portal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <SupportSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <SupportHeader />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
