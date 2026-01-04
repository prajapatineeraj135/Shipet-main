"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { estimateService } from "@/services/estimateService";
import { PackageSearch } from "lucide-react";

export default function PincodeCheckerPage() {
  const [pincode, setPincode] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<any[]>([]);

  // 🔹 Fetch City & State dynamically when pincode changes
  const handlePincodeChange = async (value: string) => {
    setPincode(value);
    setCity("");
    setState("");

    if (value.length === 6) {
      try {
        const res = await fetch(
          `https://api.postalpincode.in/pincode/${value}`
        );
        const data = await res.json();

        if (data[0].Status === "Success" && data[0].PostOffice?.length > 0) {
          const po = data[0].PostOffice[0];
          setCity(po.District);
          setState(po.State);
        }
      } catch (err) {
        console.error("Error fetching pincode:", err);
      }
    }
  };

  // 🔹 Check serviceability button click
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
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 flex items-center gap-2">
          <PackageSearch className="h-6 w-6 sm:h-8 sm:w-8 text-gray-700" />
          <span>Check Pincode Serviceability</span>
        </h1>
        <p className="text-sm sm:text-base text-gray-600 mt-1">
          Manage and track your support tickets
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card>
          <CardContent>
            <form onSubmit={handleCheck} className="space-y-4 pt-8">
              {/* Grid with Pincode, City, State */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="pincode">Pincode</Label>
                  <Input
                    id="pincode"
                    value={pincode}
                    onChange={(e) => handlePincodeChange(e.target.value)}
                    required
                    placeholder="e.g., 110001"
                  />
                </div>

                <div>
                  <Label htmlFor="city">City</Label>
                  <Input id="city" value={city} readOnly placeholder="city" />
                </div>

                <div>
                  <Label htmlFor="state">State</Label>
                  <Input
                    id="state"
                    value={state}
                    readOnly
                    placeholder="state"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button type="submit" disabled={isLoading || !pincode}>
                  {isLoading ? "Checking..." : "Check Serviceability"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Serviceability Results Table */}
        {result.length > 0 && (
          <div className="overflow-x-auto mt-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Serviceability Details
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full table-auto border border-gray-200 text-sm">
                  <thead className="bg-gray-100">
                    <tr className="text-left">
                      <th className="border px-4 py-2">Service</th>
                      <th className="border px-4 py-2">Prepaid</th>
                      <th className="border px-4 py-2">COD</th>
                      <th className="border px-4 py-2">Pickup</th>
                    </tr>
                  </thead>
                  <tbody>
                    {result.map((service, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border px-4 py-2">{service.service}</td>
                        <td className="border px-4 py-2">
                          {service.prepaid === "Y" ? "✅ Yes" : "❌ No"}
                        </td>
                        <td className="border px-4 py-2">
                          {service.cod === "Y" ? "✅ Yes" : "❌ No"}
                        </td>
                        <td className="border px-4 py-2">
                          {service.pickup === "Y" ? "✅ Yes" : "❌ No"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
