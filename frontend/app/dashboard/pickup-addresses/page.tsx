"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { pickupAddressService } from "@/services/pickupAddressService";
import { toast } from "sonner";
import { Plus, Edit, Trash2, MapPin, Phone, User, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { PickupAddressModal } from "@/components/modals/PickupAddressModal";

export default function PickupAddressesPage() {
  const [addresses, setAddresses] = useState<any[]>([]);
  const [filteredAddresses, setFilteredAddresses] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any | null>(null);

  useEffect(() => {
    fetchAddresses();
  }, []);
  console.log(addresses);
  useEffect(() => {
    const filtered = addresses?.filter(
      (address) =>
        address.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        address.nickname?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        address.city.toLowerCase().includes(searchTerm.toLowerCase()) ||
        address.pincode.includes(searchTerm) ||
        address.phone.includes(searchTerm) ||
        address.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAddresses(filtered);
  }, [addresses, searchTerm]);

  const fetchAddresses = async () => {
    try {
      setIsLoading(true);
      const data = await pickupAddressService.getAddresses();
      setAddresses(data);
      setFilteredAddresses(data);
    } catch (error) {
      toast.error("Failed to fetch pickup addresses");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!confirm("Are you sure you want to delete this pickup address?"))
      return;
    try {
      await pickupAddressService.deleteAddress(addressId);
      toast.success("Pickup address deleted successfully");
      fetchAddresses();
    } catch (error) {
      toast.error("Failed to delete pickup address");
    }
  };

  const handleSetDefault = async (addressId: string) => {
    try {
      const addressToUpdate = addresses.find((addr) => addr._id === addressId);
      if (!addressToUpdate) throw new Error("Address not found");

      await pickupAddressService.updateAddress(addressId, {
        ...addressToUpdate,
        isDefault: true,
      });
      toast.success("Default pickup address updated");

      fetchAddresses();
    } catch (error) {
      console.error("Set default address error:", error);
      toast.error("Failed to update default address");
    }
  };

  const handleEditAddress = (address: any) => {
    setEditingAddress(address);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setEditingAddress(null);
    fetchAddresses();
  };

  const canAddMore = addresses?.length < 5;

  const formatFullAddress = (address: any) => {
    return [address.street1, address.street2, address.locality]
      .filter(Boolean)
      .join(", ");
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="mb-6">
          <Skeleton className="h-10 w-64" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 })?.map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <div className="flex justify-between pt-4">
                    <Skeleton className="h-8 w-16" />
                    <div className="flex space-x-2">
                      <Skeleton className="h-8 w-8" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Pickup Addresses</h1>
          <p className="text-gray-600">
            Manage your pickup locations (Maximum 5 addresses allowed)
          </p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} disabled={!canAddMore}>
          <Plus className="mr-2 h-4 w-4" />
          Add Address {!canAddMore && "(Limit Reached)"}
        </Button>
      </div>

      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
        <Input
          placeholder="Search addresses by name, city, pincode..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredAddresses?.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MapPin className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchTerm
                ? "No matching addresses found"
                : "No pickup addresses"}
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm
                ? "Try adjusting your search terms"
                : "Add your first pickup address to start shipping"}
            </p>
            {!searchTerm && (
              <Button onClick={() => setIsModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Pickup Address
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAddresses?.map((address) => (
            <Card
              key={address._id}
              className={address.isDefault ? "ring-2 ring-blue-500" : ""}
            >
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">
                      {address.nickname || address.name}
                    </CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      {address.isDefault && (
                        <Badge className="bg-blue-100 text-blue-800">
                          Default
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="h-4 w-4 text-gray-400" />
                    <span>{address.name}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{address.phone}</span>
                  </div>
                  <div className="flex items-start space-x-2 text-sm">
                    <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                    <div>
                      <p>{formatFullAddress(address)}</p>
                      <p className="text-gray-600">
                        {address.city} - {address.pincode}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex justify-between items-center pt-4 mt-4 border-t">
                  {!address.isDefault ? (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleSetDefault(address._id)}
                    >
                      Set Default
                    </Button>
                  ) : (
                    <div></div>
                  )}
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={
                        address.nickname === "BillingAddress" ||
                        address.isDefault
                      }
                      onClick={() => handleEditAddress(address)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteAddress(address._id)}
                      disabled={address.isDefault}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <PickupAddressModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        address={editingAddress}
      />
    </div>
  );
}
