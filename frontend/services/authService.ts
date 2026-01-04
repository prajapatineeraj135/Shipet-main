import { apiClient } from "@/services/apiClient";

export interface User {
  role: any;
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface LoginResponse {
  token?: string;
  user?: User;
  requiresVerification?: Boolean;
}

export interface ApiResponse<T> {
  data: T;
  message?: string;
  success: boolean;
}

export interface SignupData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phone: string;
}

export const authService = {
  async login(
    email: string,
    password: string
  ): Promise<ApiResponse<LoginResponse>> {
    return apiClient.post<LoginResponse>("/auth/login", { email, password });
  },

  async signup(data: SignupData): Promise<ApiResponse<null>> {
    return apiClient.post<null>("/auth/signup", {
      firstName: data.firstName,
      lastName: data.lastName,
      email: data.email,
      password: data.password,
      phone: data.phone,
    });
  },

  async verifyEmail(email: string, otp: string): Promise<ApiResponse<null>> {
    return apiClient.post<null>("/auth/verify-otp", { email, otp });
  },

  async resendVerificationOTP(
    email: string,
    type: string
  ): Promise<ApiResponse<null>> {
    return apiClient.post<null>("/auth/resend-otp", { email, type }); // Only if backend supports it
  },

  async forgotPassword(
    email: string
  ): Promise<ApiResponse<{ requiresVerification?: boolean } | null>> {
    return apiClient.post<null>("/auth/forgot-password", { email });
  },

  async verifyResetOTP(email: string, otp: string): Promise<ApiResponse<null>> {
    return apiClient.post<null>("/auth/verify-reset-otp", { email, otp }); // Only if needed separately
  },

  async resetPassword(email: string, otp: string, newPassword: string) {
    return apiClient.post("/auth/reset-password", {
      email: email.trim().toLowerCase(),
      otp: otp.trim(),
      newPassword,
    });
  },

  async changePassword(
    currentPassword: string,
    newPassword: string
  ): Promise<ApiResponse<null>> {
    return apiClient.post<null>("/auth/change-password", {
      currentPassword,
      newPassword,
    });
  },

  async getProfile(): Promise<ApiResponse<User>> {
    return apiClient.get<User>("/auth/profile");
  },

  async updateProfile(data: Partial<User>): Promise<ApiResponse<User>> {
    return apiClient.put<User>("/auth/update-profile", data);
  },

  async logout(): Promise<ApiResponse<null>> {
    return apiClient.post<null>("/auth/logout");
  },
};
