"use client";

import { Suspense } from "react";
import VerifyOTPPage from "@/components/verify-otp";
export default function VerifyOtpWrapper() {
  return (
    <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
      <VerifyOTPPage />
    </Suspense>
  );
}
