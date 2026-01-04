"use client";

import { useAuth } from "@/contexts/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function HomePage() {
  const { user, isLoading: isAuthorized } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthorized) {
      if (!user) {
        router.push("/auth/login");
      } else if (user.role === "admin") {
        router.push("/admin/dashboard");
      } else if (user.role === "support") {
        router.push("/customer-support/dashboard");
      } else {
        router.push("/dashboard");
      }
    }
  }, [user, router, isAuthorized]);
}
