"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { estimateService } from "@/services/estimateService";

interface PincodeCheckerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PincodeCheckerModal({
  isOpen,
  onClose,
}: PincodeCheckerModalProps) {
  const [pincode, setPincode] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any[]>([]);

  const handleCheck = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setResult([]);

    try {
      const response = await estimateService.checkPincodeServiceability(
        pincode
      );

      if (response && response.length > 0) {
        setResult(response);
        toast.success("Serviceability fetched successfully");
      } else {
        toast.error("No serviceability found for this pincode");
      }
    } catch (error) {
      toast.error("Failed to check serviceability");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Pincode Serviceability Checker</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleCheck} className="space-y-4">
          <div>
            <Label htmlFor="pincode">Enter Pincode</Label>
            <Input
              id="pincode"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              required
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Close
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Checking..." : "Check Serviceability"}
            </Button>
          </div>
        </form>

        {result.length > 0 && (
          <div className="overflow-x-auto mt-4">
            <table className="min-w-full border border-gray-200 rounded-md">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left border-b">Service</th>
                  <th className="px-4 py-2 text-left border-b">Prepaid</th>
                  <th className="px-4 py-2 text-left border-b">COD</th>
                  <th className="px-4 py-2 text-left border-b">Pickup</th>
                </tr>
              </thead>
              <tbody>
                {result.map((service, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 border-b">{service.service}</td>
                    <td className="px-4 py-2 border-b">
                      {service.prepaid === "Y" ? "✅ Yes" : "❌ No"}
                    </td>
                    <td className="px-4 py-2 border-b">
                      {service.cod === "Y" ? "✅ Yes" : "❌ No"}
                    </td>
                    <td className="px-4 py-2 border-b">
                      {service.pickup === "Y" ? "✅ Yes" : "❌ No"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
