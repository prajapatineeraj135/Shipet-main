"use client";

import { Suspense } from "react";
import ResetPasswordPage from "@/components/reset-page/index";
export default function ResetPasswordWrapper() {
  return (
    <Suspense fallback={<div className="text-center p-8">Loading...</div>}>
      <ResetPasswordPage />
    </Suspense>
  );
}
