"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { pickupAddressService } from "@/services/pickupAddressService";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { STATES } from "@/lib/constant";

interface PickupAddress {
  _id: string;
  userId: string;
  nickname: string;
  name: string;
  email: string;
  phone: string;
  altPhone?: string;
  street1: string;
  street2?: string;
  locality?: string;
  city: string;
  pincode: string;
  zoneId: number;
  countryId?: string;
  warehouseId?: number;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

interface PickupAddressModalProps {
  isOpen: boolean;
  onClose: () => void;
  address?: PickupAddress | null;
}

export function PickupAddressModal({
  isOpen,
  onClose,
  address,
}: PickupAddressModalProps) {
  const [formData, setFormData] = useState({
    nickname: "",
    name: "",
    email: "",
    phone: "",
    altPhone: "",
    street1: "",
    street2: "",
    locality: "",
    city: "",
    pincode: "",
    zoneId: 1,
    countryId: "",
    isDefault: false,
    isActive: true,
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (address) {
      setFormData({
        nickname: address.nickname || "",
        name: address.name || "",
        email: address.email || "",
        phone: address.phone || "",
        altPhone: address.altPhone || "",
        street1: address.street1 || "",
        street2: address.street2 || "",
        locality: address.locality || "",
        city: address.city || "",
        pincode: address.pincode || "",
        zoneId: address.zoneId || 1,
        countryId: address.countryId || "",
        isDefault: address.isDefault || false,
        isActive: true,
      });
    } else {
      setFormData({
        nickname: "",
        name: "",
        email: "",
        phone: "",
        altPhone: "",
        street1: "",
        street2: "",
        locality: "",
        city: "",
        pincode: "",
        zoneId: 1,
        countryId: "",
        isDefault: false,
        isActive: true,
      });
    }
  }, [address, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (address) {
        await pickupAddressService.updateAddress(address._id, formData);
        toast.success("Pickup address updated successfully");
      } else {
        await pickupAddressService.createAddress(formData);
        toast.success("Pickup address created successfully");
      }
      onClose();
    } catch (error) {
      toast.error(`Failed to ${address ? "update" : "create"} pickup address`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {address ? "Edit Pickup Address" : "Add New Pickup Address"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nickname">Address Nickname</Label>
              <Input
                id="nickname"
                value={formData.nickname}
                onChange={(e) =>
                  setFormData({ ...formData, nickname: e.target.value })
                }
                placeholder="(Only Alphabets and no spaces allowed)"
              />
            </div>
            <div>
              <Label htmlFor="name">Contact Person</Label>
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
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                placeholder="Alternate Phone (10-digit, starts with 6-9)"
                required
              />
            </div>
            <div>
              <Label htmlFor="altPhone">Alternate Phone</Label>
              <Input
                id="altPhone"
                value={formData.altPhone}
                onChange={(e) =>
                  setFormData({ ...formData, altPhone: e.target.value })
                }
                placeholder="Alternate Phone (10-digit, starts with 6-9)"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="street1">Street Address Line 1</Label>
              <Input
                id="street1"
                value={formData.street1}
                onChange={(e) =>
                  setFormData({ ...formData, street1: e.target.value })
                }
                required
              />
            </div>
            <div>
              <Label htmlFor="street2">Street Address Line 2</Label>
              <Input
                id="street2"
                value={formData.street2}
                onChange={(e) =>
                  setFormData({ ...formData, street2: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="locality">Locality</Label>
              <Input
                id="locality"
                value={formData.locality}
                onChange={(e) =>
                  setFormData({ ...formData, locality: e.target.value })
                }
              />
            </div>
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

                        // Find state in STATES array by matching name
                        const foundState = STATES.find(
                          (s) =>
                            s.name.toLowerCase() ===
                            po.State.toLowerCase().trim()
                        );

                        setFormData((prev: any) => ({
                          ...prev,
                          city: po.District,
                          zoneId: foundState?.zone_id || null, // store zone_id here
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
              <Label htmlFor="zoneId">State</Label>
              <Select
                value={formData.zoneId?.toString()} // zone_id as string
                onValueChange={(value) =>
                  setFormData({ ...formData, zoneId: Number(value) })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select a state" />
                </SelectTrigger>
                <SelectContent>
                  {STATES.map((state) => (
                    <SelectItem
                      key={state.code}
                      value={state.zone_id.toString()}
                    >
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="isDefault">Set as Default</Label>
                <p className="text-sm text-gray-600">
                  Use this as the default pickup address
                </p>
              </div>
              <Switch
                id="isDefault"
                checked={formData.isDefault}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, isDefault: checked })
                }
              />
            </div>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading
                ? "Saving..."
                : address
                ? "Update Address"
                : "Create Address"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
