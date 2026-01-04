"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { customerService } from "@/services/customerService";
import { toast } from "sonner";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";

import { COUNTRIES, STATES } from "@/lib/constant";

interface CustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer?: any | null;
}

export function CustomerModal({
  isOpen,
  onClose,
  customer,
}: CustomerModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    alt_mobile: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country_code: "IN",
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (customer) {
      setFormData({
        name: customer.name,
        mobile: customer.mobile,
        alt_mobile: customer.alt_mobile || "",
        address: customer.address,
        city: customer.city,
        state: customer.state,
        pincode: customer.pincode,
        country_code: customer.country_code || "IN",
      });
    } else {
      setFormData({
        name: "",
        mobile: "",
        alt_mobile: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        country_code: "IN",
      });
    }
  }, [customer, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      if (customer) {
        await customerService.updateCustomer(customer._id, formData);
        toast.success("Customer updated successfully");
      } else {
        await customerService.createCustomer(formData);
        toast.success("Customer created successfully");
      }
      onClose();
    } catch (error) {
      toast.error(`Failed to ${customer ? "update" : "create"} customer`);
    } finally {
      setIsLoading(false);
    }
  };
  console.log(formData);
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {customer ? "Edit Customer" : "Add New Customer"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="mobile">Mobile Number</Label>
              <Input
                id="mobile"
                value={formData.mobile}
                onChange={(e) =>
                  setFormData({ ...formData, mobile: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="alt_mobile">Alternate Mobile</Label>
              <Input
                id="alt_mobile"
                value={formData.alt_mobile}
                onChange={(e) =>
                  setFormData({ ...formData, alt_mobile: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="intlDestination">Country</Label>
              <Select
                disabled
                // value={formData.country_code}
                value="IN"
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    country_code: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="IN" />
                </SelectTrigger>
                <SelectContent>
                  {COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      {country.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label htmlFor="address">Full Address</Label>
            <Textarea
              id="address"
              value={formData.address}
              onChange={(e) =>
                setFormData({ ...formData, address: e.target.value })
              }
              required
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="pincode">Pincode</Label>
              <Input
                id="pincode"
                value={formData.pincode}
                onChange={async (e) => {
                  const value = e.target.value;
                  setFormData({ ...formData, pincode: value });

                  if (value.length === 6) {
                    try {
                      const res = await fetch(
                        `https://api.postalpincode.in/pincode/${value}`
                      );
                      const data = await res.json();

                      if (
                        data[0].Status === "Success" &&
                        data[0].PostOffice?.length > 0
                      ) {
                        const po = data[0].PostOffice[0];

                        // Find state code from STATES array
                        const foundState = STATES.find(
                          (s) =>
                            s.name.toLowerCase() ===
                            po.State.toLowerCase().trim()
                        );

                        setFormData((prev: any) => ({
                          ...prev,
                          city: po.District,
                          state: foundState?.code || "", // Store code in DB
                        }));
                      }
                    } catch (err) {
                      console.error("Error fetching pincode:", err);
                    }
                  }
                }}
                required
              />
            </div>

            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) =>
                  setFormData({ ...formData, city: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="state">State</Label>
              <Select
                value={formData.state}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    state: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a state" />
                </SelectTrigger>
                <SelectContent>
                  {STATES.map((state) => (
                    <SelectItem key={state.code} value={state.code}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Saving..."
                : customer
                ? "Update Customer"
                : "Create Customer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
