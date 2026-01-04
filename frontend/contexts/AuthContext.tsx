"use client";

import { authService, LoginResponse } from "@/services/authService";
import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";

interface AuthContextType {
  user: any | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<any>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!pathname || pathname.startsWith("/auth")) return;

    const initAuth = async () => {
      try {
        const res = await authService.getProfile();
        if (res.success) {
          setUser(res.data);
          const role = res.data?.role;

          // Redirect if logged in but on wrong dashboard
          if (role === "admin" && !pathname.startsWith("/admin")) {
            router.replace("/admin/dashboard");
          } else if (role === "user" && !pathname.startsWith("/dashboard")) {
            router.replace("/dashboard");
          } else if (
            role === "support" &&
            !pathname.startsWith("/customer-support")
          ) {
            router.replace("/customer-support/dashboard");
          }
        }
      } catch (error: any) {
        console.log(error);
        if (
          error.message !== "Logged out" &&
          error.message !== "Unauthorized"
        ) {
          toast.error("Something went wrong checking auth.");
          console.error("Auth Init Error:", error);
        }
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, [pathname]);

  const login = async (
    email: string,
    password: string
  ): Promise<LoginResponse> => {
    const res = await authService.login(email, password);

    if (res.data?.requiresVerification) {
      toast.info(res.message || "Please verify your account");
      return { requiresVerification: true };
    }

    const user = res.data?.user;
    const token = res.data?.token;
    setUser(user);
    toast.success("Logged in successfully");
    return { user, token }; // <-- always return LoginResponse
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn("Logout request failed silently", err);
    }
    setUser(null);
    toast.success("Logged out successfully");
    router.push("/auth/login");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
