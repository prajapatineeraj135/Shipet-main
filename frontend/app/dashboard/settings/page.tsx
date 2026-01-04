"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { settingsService } from "@/services/settingsService";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import {
  User,
  Bell,
  Shield,
  CreditCard,
  Truck,
  Printer,
  Building,
  MapPin,
} from "lucide-react";
import { STATES } from "@/lib/constant";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

interface ProfileRequest {
  firstName: string;
  lastName: string;
  phone: string;
}

export default function SettingsPage() {
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("profile");

  const [profile, setProfile] = useState<ProfileRequest>({
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [email, setEmail] = useState("");

  const [billing, setBilling] = useState<any>({
    companyName: "",
    gstNumber: "",
    panNumber: "",
    nickname: "BillingAddress",
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
    countryId: "99",
    codRemittancePaymentMethod: "bank",
    bankDetails: {
      accountNumber: "",
      ifscCode: "",
      accountHolderName: "",
      bankName: "",
    },
    upiDetails: {
      upiId: "",
      verifiedName: "",
    },
    isActive: true,
    isVerified: false,
    isDefault: true,
    verificationStatus: "pending",
  });
  const [gstError, setGstError] = useState("");
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [printChoice, setPrintChoice] = useState<any>("thermal");

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const [profileData, billingData, printData] = await Promise.all([
        settingsService.getProfile(),
        settingsService.getBillingSettings(),
        settingsService.getPrintSettings(),
      ]);

      setProfile(profileData.data);
      setEmail(profileData.data.email);

      // Handle billing data with proper defaults
      if (billingData.data) {
        const bd = billingData.data;

        setBilling({
          companyName: bd.companyName || "",
          gstNumber: bd.gstNumber || "",
          panNumber: bd.panNumber || "",
          nickname: bd.nickname || "BillingAddress",
          name: bd.name || "",
          email: bd.email || "",
          phone: bd.phone || "",
          altPhone: bd.altPhone || "",
          street1: bd.street1 || "",
          street2: bd.street2 || "",
          locality: bd.locality || "",
          city: bd.city || "",
          pincode: bd.pincode || "",
          zoneId: bd.zoneId || 1,
          countryId: bd.countryId || "99",
          codRemittancePaymentMethod: bd.codRemittancePaymentMethod || "bank",

          bankDetails: {
            accountNumber: bd.bankDetails?.accountNumber || "",
            ifscCode: bd.bankDetails?.ifscCode || "",
            accountHolderName: bd.bankDetails?.accountHolderName || "",
            bankName: bd.bankDetails?.bankName || "",
          },
          upiDetails: {
            upiId: bd.upiDetails?.upiId || "",
            verifiedName: bd.upiDetails?.verifiedName || "",
          },

          isActive: bd.isActive ?? true,
          isVerified: bd.isVerified ?? false,
          isDefault: bd.isDefault ?? true,
          verificationStatus: bd.verificationStatus || "pending",
        });
      }

      if (printData) {
        setPrintChoice(printData.data);
      }

      console.log("Billing data:", billingData.data);
    } catch (error) {
      toast.error("Failed to fetch settings");
      console.error("Settings fetch error:", error);
    }
  };

  const handlePrintChoiceUpdate = async (choice: "thermal" | "a4") => {
    setIsLoading(true);
    try {
      await settingsService.updatePrintSettings({ choice });
      setPrintChoice(choice);
      toast.success("Print settings updated successfully");
    } catch (error) {
      toast.error("Failed to update print settings");
    } finally {
      setIsLoading(false);
    }
  };
  const handleProfileUpdate = async () => {
    setIsLoading(true);
    try {
      await settingsService.updateProfile(profile);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Failed to update profile");
    } finally {
      setIsLoading(false);
    }
  };

  const handleBillingUpdate = async () => {
    setIsLoading(true);
    try {
      await settingsService.updateBillingSettings(billing);
      toast.success("Billing settings updated successfully");
    } catch (error) {
      toast.error("Failed to update billing settings");
      console.error("Billing update error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setIsLoading(true);
    try {
      await settingsService.changePassword(
        passwordData.currentPassword,
        passwordData.newPassword
      );
      toast.success("Password changed successfully");
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      toast.error("Failed to change password");
    } finally {
      setIsLoading(false);
    }
  };

  // const handleCopyFromPickupAddress = async (pickupAddressId) => {
  //   try {
  //     const selectedAddress = pickupAddresses.find(
  //       (addr) => addr._id === pickupAddressId
  //     );
  //     if (selectedAddress) {
  //       setBilling((prev) => ({
  //         ...prev,
  //         nickname: selectedAddress.nickname + "Billing",
  //         name: selectedAddress.name,
  //         email: selectedAddress.email,
  //         phone: selectedAddress.phone,
  //         altPhone: selectedAddress.altPhone || "",
  //         street1: selectedAddress.street1,
  //         street2: selectedAddress.street2 || "",
  //         locality: selectedAddress.locality || "",
  //         city: selectedAddress.city,
  //         pincode: selectedAddress.pincode,
  //         zoneId: selectedAddress.zoneId || 1,
  //       }));
  //       toast.success("Billing address copied from pickup address");
  //     }
  //   } catch (error) {
  //     toast.error("Failed to copy from pickup address");
  //     console.error("Copy error:", error);
  //   }
  // };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
        <p className="text-gray-600">
          Manage your account and application preferences
        </p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="profile" className="flex items-center space-x-2">
            <User className="h-4 w-4" />
            <span>Profile</span>
          </TabsTrigger>
          <TabsTrigger value="billing" className="flex items-center space-x-2">
            <CreditCard className="h-4 w-4" />
            <span>Billing</span>
          </TabsTrigger>
          <TabsTrigger value="print" className="flex items-center space-x-2">
            <Printer className="h-4 w-4" />
            <span>Shipment</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center space-x-2">
            <Shield className="h-4 w-4" />
            <span>Security</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Profile Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={profile.firstName}
                    onChange={(e) =>
                      setProfile({ ...profile, firstName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={(e) =>
                      setProfile({ ...profile, lastName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={profile.phone}
                    onChange={(e) =>
                      setProfile({ ...profile, phone: e.target.value })
                    }
                  />
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} disabled />
                </div>
              </div>

              <Button onClick={handleProfileUpdate} disabled={isLoading}>
                {isLoading ? "Updating..." : "Update Profile"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-6">
          {!billing.phone && (
            <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg">
              ⚠️ You haven’t set up your billing information yet. Please fill
              the form below.
            </div>
          )}
          {/* … existing billing form here … */}

          {/* Company Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Building className="h-5 w-5" />
                <span>Company Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="companyName">Company Name</Label>
                  <Input
                    id="companyName"
                    value={billing.companyName}
                    placeholder="Company Name (optional)"
                    onChange={(e) =>
                      setBilling({ ...billing, companyName: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="gstNumber">GST Number</Label>
                  <Input
                    id="gstNumber"
                    value={billing.gstNumber}
                    placeholder="GSTIN (optional)"
                    onChange={(e) => {
                      const value = e.target.value.toUpperCase();
                      setBilling({ ...billing, gstNumber: value });

                      const gstRegex =
                        /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;

                      if (value && !gstRegex.test(value)) {
                        setGstError("Invalid GSTIN format");
                      } else {
                        setGstError("");
                      }
                    }}
                  />

                  {gstError && (
                    <p className="text-red-500 text-sm mt-1">{gstError}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="panNumber">PAN Number</Label>
                  <Input
                    id="panNumber"
                    value={billing.panNumber}
                    placeholder="PAN (optional)"
                    onChange={(e) =>
                      setBilling({ ...billing, panNumber: e.target.value })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Billing Address Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <MapPin className="h-5 w-5" />
                <span>Billing Address</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Contact Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* <div>
                  <Label htmlFor="nickname">Address Nickname</Label>
                  <Input
                    id="nickname"
                    value={billing.nickname}
                    onChange={(e) =>
                      setBilling({ ...billing, nickname: e.target.value })
                    }
                    placeholder="(Only Alphabets and no spaces allowed)"
                  />
                </div> */}
                <div>
                  <Label htmlFor="name">Contact Person *</Label>
                  <Input
                    id="name"
                    value={billing.name}
                    onChange={(e) =>
                      setBilling({ ...billing, name: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={billing.email}
                    onChange={(e) =>
                      setBilling({ ...billing, email: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    value={billing.phone}
                    onChange={(e) =>
                      setBilling({ ...billing, phone: e.target.value })
                    }
                    placeholder="Phone (10-digit, starts with 6-9)"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="altPhone">Alternate Phone</Label>
                  <Input
                    id="altPhone"
                    value={billing.altPhone}
                    onChange={(e) =>
                      setBilling({ ...billing, altPhone: e.target.value })
                    }
                    placeholder="Alternate Phone (10-digit)"
                  />
                </div>
              </div>

              {/* Address Fields */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="street1">Street Address Line 1 *</Label>
                  <Input
                    id="street1"
                    value={billing.street1}
                    onChange={(e) =>
                      setBilling({ ...billing, street1: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="street2">Street Address Line 2</Label>
                  <Input
                    id="street2"
                    value={billing.street2}
                    onChange={(e) =>
                      setBilling({ ...billing, street2: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="locality">Locality</Label>
                  <Input
                    id="locality"
                    value={billing.locality}
                    onChange={(e) =>
                      setBilling({ ...billing, locality: e.target.value })
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input
                    id="pincode"
                    value={billing.pincode}
                    onChange={async (e) => {
                      const value = e.target.value;
                      setBilling({ ...billing, pincode: value });

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
                            const foundState = STATES.find(
                              (s) =>
                                s.name.toLowerCase() ===
                                po.State.toLowerCase().trim()
                            );

                            setBilling((prev: any) => ({
                              ...prev,
                              city: po.District,
                              zoneId: foundState?.zone_id || 1,
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
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={billing.city}
                    onChange={(e) =>
                      setBilling({ ...billing, city: e.target.value })
                    }
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="zoneId">State *</Label>
                  <Select
                    value={billing.zoneId?.toString()}
                    onValueChange={(value) =>
                      setBilling({ ...billing, zoneId: Number(value) })
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
            </CardContent>
          </Card>

          {/* Payment Method */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <CreditCard className="h-5 w-5" />
                <span>COD Remittance Payment Method</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Select
                value={billing.codRemittancePaymentMethod}
                onValueChange={(value) =>
                  setBilling({
                    ...billing,
                    codRemittancePaymentMethod: value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select COD remittance method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="wallet">Wallet</SelectItem>
                  <SelectItem value="bank">Bank Transfer</SelectItem>
                  <SelectItem value="upi">UPI Transfer</SelectItem>
                </SelectContent>
              </Select>

              {/* Bank Details Section */}
              {billing.codRemittancePaymentMethod === "bank" && (
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <h3 className="font-semibold text-lg">
                    Bank Account Details
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="accountNumber">Account Number</Label>
                      <Input
                        id="accountNumber"
                        value={billing.bankDetails.accountNumber}
                        onChange={(e) =>
                          setBilling({
                            ...billing,
                            bankDetails: {
                              ...billing.bankDetails,
                              accountNumber: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="ifscCode">IFSC Code</Label>
                      <Input
                        id="ifscCode"
                        value={billing.bankDetails.ifscCode}
                        onChange={(e) =>
                          setBilling({
                            ...billing,
                            bankDetails: {
                              ...billing.bankDetails,
                              ifscCode: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="accountHolderName">
                        Account Holder Name
                      </Label>
                      <Input
                        id="accountHolderName"
                        value={billing.bankDetails.accountHolderName}
                        onChange={(e) =>
                          setBilling({
                            ...billing,
                            bankDetails: {
                              ...billing.bankDetails,
                              accountHolderName: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="bankName">Bank Name</Label>
                      <Input
                        id="bankName"
                        value={billing.bankDetails.bankName}
                        onChange={(e) =>
                          setBilling({
                            ...billing,
                            bankDetails: {
                              ...billing.bankDetails,
                              bankName: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* UPI Details Section */}
              {billing.codRemittancePaymentMethod === "upi" && (
                <div className="space-y-4 p-4 border rounded-lg bg-gray-50">
                  <h3 className="font-semibold text-lg">UPI Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="upiId">UPI ID</Label>
                      <Input
                        id="upiId"
                        value={billing.upiDetails.upiId}
                        placeholder="user@paytm"
                        onChange={(e) =>
                          setBilling({
                            ...billing,
                            upiDetails: {
                              ...billing.upiDetails,
                              upiId: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="verifiedName">Verified Name</Label>
                      <Input
                        id="verifiedName"
                        value={billing.upiDetails.verifiedName}
                        onChange={(e) =>
                          setBilling({
                            ...billing,
                            upiDetails: {
                              ...billing.upiDetails,
                              verifiedName: e.target.value,
                            },
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-4">
                <Button
                  onClick={handleBillingUpdate}
                  disabled={isLoading}
                  className="w-full md:w-auto"
                >
                  {isLoading ? "Updating..." : "Update Billing Settings"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="print" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Truck className="h-5 w-5" />
                <span>Default Print Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="printChoice"
                    value="thermal"
                    checked={printChoice === "thermal"}
                    onChange={() => handlePrintChoiceUpdate("thermal")}
                  />
                  <span>Thermal Printer (4x6)</span>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="printChoice"
                    value="a4"
                    checked={printChoice === "a4"}
                    onChange={() => handlePrintChoiceUpdate("a4")}
                  />
                  <span>A4 Size</span>
                </label>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Security Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  value={passwordData.currentPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      currentPassword: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="newPassword">New Password</Label>
                <Input
                  id="newPassword"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                />
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  value={passwordData.confirmPassword}
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                />
              </div>

              <Button onClick={handlePasswordChange} disabled={isLoading}>
                {isLoading ? "Changing..." : "Change Password"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
