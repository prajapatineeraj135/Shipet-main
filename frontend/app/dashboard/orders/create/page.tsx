"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Plus,
  User,
  Package,
  CreditCard,
  Trash2,
} from "lucide-react";

import { orderService } from "@/services/orderService";
import { customerService } from "@/services/customerService";
import { Product, productService } from "@/services/productService";
import { cn } from "@/lib/utils";
import { COUNTRIES, STATES } from "@/lib/constant";
import { toast } from "sonner"; // Assuming sonner is configured for toast notifications
import Link from "next/link";
import { PincodeCheckerModal } from "@/components/modals/PincodeModal";
import { useRouter } from "next/navigation";

// Extend OrderItem to include a unique client-side ID
interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
}

export default function CreateOrderPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState("");
  const [orderItems, setOrderItems] = useState<OrderItem[]>([
    {
      productId: "",
      productName: "",
      quantity: 1,
      price: 0,
    }, // Generate unique ID
  ]);
  const [isPincodeModalOpen, setIsPincodeModalOpen] = useState(false);

  const [loadingStates, setLoadingStates] = useState({
    customers: false,
    products: false,
    creatingCustomer: false,
    creatingOrder: false,
  });

  // Customer form state
  const [customerForm, setCustomerForm] = useState({
    name: "",
    mobile: "",
    alt_mobile: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    country_code: "",
  });

  // Order details
  const [orderDetails, setOrderDetails] = useState({
    paymentMethod: "Prepaid" as "COD" | "Prepaid" | "Online Payment",
    shippingAddress: {
      name: "",
      mobile: "",
      address: "",
      city: "",
      state: "",
      pincode: "",
      country_code: "IN",
    },
    orderNotes: "",
  });

  // Load initial data
  useEffect(() => {
    loadCustomers();
    loadProducts();
  }, []);

  const loadCustomers = async () => {
    setLoadingStates((prev) => ({ ...prev, customers: true }));
    try {
      const data = await customerService.getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error("Failed to load customers:", error);
      toast.error("Failed to load customers."); // Use toast for better UX
    } finally {
      setLoadingStates((prev) => ({ ...prev, customers: false }));
    }
  };

  const loadProducts = async () => {
    setLoadingStates((prev) => ({ ...prev, products: true }));
    try {
      const data = await productService.getProducts();
      setProducts(data);
    } catch (error) {
      console.error("Failed to load products:", error);
      toast.error("Failed to load products."); // Use toast for better UX
    } finally {
      setLoadingStates((prev) => ({ ...prev, products: false }));
    }
  };

  const handleCustomerSelect = (customerId: string) => {
    setSelectedCustomer(customerId);
    const customer = customers.find((c) => c._id === customerId);
    if (customer) {
      setOrderDetails((prev) => ({
        ...prev,
        shippingAddress: {
          name: customer.name,
          mobile: customer.mobile,
          address: customer.address || "",
          city: customer.city || "",
          state: customer.state || "",
          pincode: customer.pincode || "",
          country_code: customer.country_code || "IN",
        },
      }));
    }
  };

  const handleCreateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    if (!customerForm.name.trim() || !customerForm.mobile.trim()) {
      toast.error("Name and mobile number are required for customer creation.");
      return;
    }

    setLoadingStates((prev) => ({ ...prev, creatingCustomer: true }));
    try {
      const newCustomer = await customerService.createCustomer(customerForm);

      // Add to customers list
      setCustomers((prev) => [...prev, newCustomer]);

      // Auto-select the new customer
      handleCustomerSelect(newCustomer._id);

      // Reset form
      setCustomerForm({
        name: "",
        mobile: "",
        alt_mobile: "",
        address: "",
        city: "",
        state: "",
        pincode: "",
        country_code: "",
      });

      toast.success("Customer created successfully!");
    } catch (error) {
      console.error("Failed to create customer:", error);
      toast.error("Failed to create customer.");
    } finally {
      setLoadingStates((prev) => ({ ...prev, creatingCustomer: false }));
    }
  };

  const addOrderItem = () => {
    setOrderItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        productId: "",
        productName: "",
        quantity: 1,
        price: 0,
      }, // Generate unique ID for new item
    ]);
  };

  // Modified updateOrderItem to use item.id for reliable updates
  const updateOrderItem = (
    itemId: string, // Use unique ID instead of index
    field: keyof OrderItem,
    value: any
  ) => {
    setOrderItems((prev) =>
      prev.map((item) => {
        if (item.productId === itemId) {
          // Find by unique ID
          const updatedItem = { ...item };
          if (field === "productId") {
            const selectedProduct = products.find((p) => p._id === value);
            if (selectedProduct) {
              updatedItem.productId = selectedProduct._id;
              updatedItem.productName = selectedProduct.name;
              updatedItem.price = selectedProduct.price;
            } else {
              updatedItem.productId = ""; // Clear if product not found
              updatedItem.productName = "";
              updatedItem.price = 0;
            }
          } else if (field === "quantity" || field === "price") {
            updatedItem[field] = Number(value); // Ensure numbers for quantity and price
          } else {
            updatedItem[field] = value;
          }
          return updatedItem;
        }
        return item;
      })
    );
  };
  console.log(customerForm);
  // Simplified updateOrderItemQuantity and updateOrderItemPrice to use the generic updateOrderItem
  const updateOrderItemQuantity = (itemId: string, quantity: number) => {
    // We can decide here if we want to remove the item if quantity is 0 or less
    if (quantity <= 0) {
      removeOrderItem(itemId);
      return;
    }
    setOrderItems((prev) =>
      prev.map((item) =>
        item.productId === itemId
          ? {
              ...item,
              quantity: quantity,
              price: item.price,
              total: quantity * item.price,
            } // Calculate total here for display
          : item
      )
    );
  };

  const updateOrderItemPrice = (itemId: string, price: number) => {
    setOrderItems((prev) =>
      prev.map((item) =>
        item.productId === itemId
          ? { ...item, price: price, total: item.quantity * price } // Calculate total here for display
          : item
      )
    );
  };

  // Modified removeOrderItem to use item.id
  const removeOrderItem = (itemId: string) => {
    setOrderItems((prev) => prev.filter((item) => item.productId !== itemId));
  };

  const calculateTotal = () => {
    return orderItems.reduce((total, item) => {
      const quantity = Number(item.quantity) || 0;
      const price = Number(item.price) || 0;
      return total + quantity * price;
    }, 0);
  };

  const validateForm = () => {
    // Check if customer is selected
    if (!selectedCustomer) {
      toast.error("Please select a customer or create a new one.");
      return false;
    }

    // Check if at least one product is selected
    const hasValidItems = orderItems.some(
      (item) =>
        item.productId && Number(item.quantity) > 0 && Number(item.price) > 0
    );
    if (!hasValidItems) {
      toast.error("Please add at least one valid product to the order.");
      return false;
    }

    // Check shipping address
    const { shippingAddress } = orderDetails;
    if (
      !shippingAddress.name ||
      !shippingAddress.mobile ||
      !shippingAddress.address ||
      !shippingAddress.city ||
      !shippingAddress.state ||
      !shippingAddress.pincode
    ) {
      toast.error("Please fill in all required shipping address fields.");
      return false;
    }

    return true;
  };
  console.log(orderDetails);
  console.log(orderItems);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoadingStates((prev) => ({ ...prev, creatingOrder: true }));

    try {
      const validOrderItems = orderItems
        .filter(
          (item) =>
            item.productId &&
            Number(item.quantity) > 0 &&
            Number(item.price) > 0
        )
        .map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })); // Ensure only necessary fields are sent to the backend

      const orderPayload = {
        customerId: selectedCustomer,
        products: validOrderItems,
        paymentMethod: orderDetails.paymentMethod,
        shippingAddress: orderDetails.shippingAddress,
        orderNotes: orderDetails.orderNotes || "",
        totalAmount: totalAmount,
      };

      const createdOrder = await orderService.createOrder(orderPayload);
      console.log(createdOrder);
      toast.success(`${createdOrder.client_order_id} created successfully`);

      // Reset form
      setSelectedCustomer("");
      setOrderItems([
        {
          productId: "",
          productName: "",
          quantity: 1,
          price: 0,
        },
      ]);
      setOrderDetails({
        paymentMethod: "COD",
        shippingAddress: {
          name: "",
          mobile: "",
          address: "",
          city: "",
          state: "",
          pincode: "",
          country_code: "IN",
        },
        orderNotes: "",
      });
      router.push(`/dashboard/orders`);
    } catch (error) {
      console.error("Failed to create order:", error);
      toast.error("Failed to create order.");
    } finally {
      setLoadingStates((prev) => ({ ...prev, creatingOrder: false }));
    }
  };
  const handleModalClose = () => {
    setIsPincodeModalOpen(false);
  };
  const totalAmount = calculateTotal();
  const showTotalAmount = orderDetails.paymentMethod === "COD";

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link href="/dashboard/orders">
              <Button variant="outline" size="sm">
                <ArrowLeft className="mr-2 h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Create Order</h1>
              <p className="text-gray-600">Create a new shipping order</p>
            </div>
          </div>
          <Button onClick={() => setIsPincodeModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Pincode Servicable?
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Summary Card */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex justify-between items-center">
                <div>
                  <Label className="text-sm text-gray-500">New Order</Label>
                  <p className="text-lg font-semibold text-gray-900">
                    Order will be created after submission
                  </p>
                </div>
                {showTotalAmount && (
                  <div className="text-right">
                    <Label className="text-sm text-gray-500">
                      Total Amount (COD)
                    </Label>
                    <p className="text-2xl font-bold text-green-600">
                      ₹{totalAmount.toFixed(2)}
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Customer Selection/Creation */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <User className="h-5 w-5" />
                <span>Customer Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="select" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="select">Select Customer</TabsTrigger>
                  <TabsTrigger value="create">Create New</TabsTrigger>
                </TabsList>

                <TabsContent value="select" className="space-y-4">
                  <div>
                    <Label htmlFor="customer">Search & Select Customer *</Label>
                    <Select
                      value={selectedCustomer}
                      onValueChange={handleCustomerSelect}
                      disabled={loadingStates.customers}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue
                          placeholder={
                            loadingStates.customers
                              ? "Loading customers..."
                              : "Select a customer"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {customers.map((customer) => (
                          <SelectItem key={customer._id} value={customer._id}>
                            <div>
                              <div className="font-medium">{customer.name}</div>
                              <div className="text-sm text-gray-600">
                                {customer.mobile}
                              </div>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="create" className="space-y-4">
                  <div>
                    <Label htmlFor="name">Full Name *</Label>
                    <Input
                      id="name"
                      value={customerForm.name}
                      onChange={(e) =>
                        setCustomerForm({
                          ...customerForm,
                          name: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="mobile">Mobile Number *</Label>
                      <Input
                        placeholder="10 digit mobile number"
                        id="mobile"
                        value={customerForm.mobile}
                        onChange={(e) =>
                          setCustomerForm({
                            ...customerForm,
                            mobile: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="alt_mobile">
                        Alternate Mobile Number *
                      </Label>
                      <Input
                        placeholder="10 digit mobile number"
                        id="alt_mobile"
                        value={customerForm.alt_mobile}
                        onChange={(e) =>
                          setCustomerForm({
                            ...customerForm,
                            alt_mobile: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="address">Address</Label>
                    <Textarea
                      placeholder="Address of the consignee including house or flat 
number, street name or number, locality and 
landmark "
                      id="address"
                      value={customerForm.address}
                      onChange={(e) =>
                        setCustomerForm({
                          ...customerForm,
                          address: e.target.value,
                        })
                      }
                    />
                  </div>

                  <div className="grid grid-cols-4 gap-4">
                    <div>
                      <Label htmlFor="pincode">Pincode</Label>
                      <Input
                        placeholder="Postal code"
                        id="pincode"
                        value={customerForm.pincode}
                        onChange={async (e) => {
                          const value = e.target.value;
                          setCustomerForm({ ...customerForm, pincode: value });

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

                                setCustomerForm((prev) => ({
                                  ...prev,
                                  city: po.District,
                                  state: foundState?.code || "", // Store state code
                                }));
                              }
                            } catch (err) {
                              console.error("Error fetching pincode:", err);
                            }
                          }
                        }}
                      />
                    </div>

                    <div>
                      <Label htmlFor="city">City</Label>
                      <Input
                        id="city"
                        value={customerForm.city}
                        onChange={(e) =>
                          setCustomerForm({
                            ...customerForm,
                            city: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <Label htmlFor="state">State</Label>
                      <Select
                        value={customerForm.state} // This is the state code like "MH"
                        onValueChange={(value) =>
                          setCustomerForm({
                            ...customerForm,
                            state: value, // Always store code
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
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

                    <div>
                      <Label htmlFor="intlDestination">Country</Label>
                      <Select
                        disabled
                        value="IN"
                        onValueChange={(value) =>
                          setCustomerForm({
                            ...customerForm,
                            country_code: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Country" />
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

                  <Button
                    type="button"
                    onClick={handleCreateCustomer}
                    className="w-full"
                    disabled={loadingStates.creatingCustomer}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    {loadingStates.creatingCustomer
                      ? "Creating..."
                      : "Create Customer"}
                  </Button>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="flex items-center space-x-2">
                  <Package className="h-5 w-5" />
                  <span>Order Items *</span>
                </CardTitle>
                <Button
                  type="button"
                  onClick={addOrderItem}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add Item
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {orderItems.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Order Items</h4>
                    {orderItems.map((item) => (
                      <div
                        key={item.productId}
                        className="flex items-center gap-4 p-4 border rounded-lg"
                      >
                        <div className="flex-1">
                          <Select
                            value={item.productId}
                            onValueChange={(value) =>
                              updateOrderItem(
                                item.productId,
                                "productId",
                                value
                              )
                            }
                            disabled={loadingStates.products}
                          >
                            <SelectTrigger className="w-full">
                              <SelectValue placeholder="Select a product" />
                            </SelectTrigger>
                            <SelectContent>
                              {products
                                .filter((product) => {
                                  // Allow this product if it's not already selected,
                                  // or if it's the current one being edited
                                  return (
                                    item.productId === product._id ||
                                    !orderItems.some(
                                      (otherItem) =>
                                        otherItem.productId === product._id &&
                                        otherItem.productId !== item.productId
                                    )
                                  );
                                })
                                .map((product) => (
                                  <SelectItem
                                    key={product._id}
                                    value={product._id}
                                  >
                                    <div>
                                      <div className="font-medium">
                                        {product.name}
                                      </div>
                                      <div className="text-sm text-gray-600">
                                        ₹{product.price}
                                      </div>
                                    </div>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Qty:</Label>
                          <Input
                            type="number"
                            min="1"
                            value={item.quantity}
                            onChange={(e) =>
                              updateOrderItemQuantity(
                                item.productId,
                                Number.parseInt(e.target.value) || 1
                              )
                            }
                            className="w-20"
                          />
                        </div>
                        <div className="flex items-center gap-2">
                          <Label className="text-sm">Price:</Label>
                          <Input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.price}
                            onChange={(e) =>
                              updateOrderItemPrice(
                                item.productId,
                                Number.parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-24"
                          />
                        </div>
                        <div className="text-right min-w-[80px]">
                          <p className="font-medium">
                            ₹{(item.quantity * item.price).toFixed(2)}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeOrderItem(item.productId)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="flex justify-end pt-4 border-t">
                      <div className="text-right">
                        <p className="text-lg font-bold">
                          Total: ₹{calculateTotal().toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-4 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Subtotal:</span>
                  <span className="text-2xl font-bold">
                    ₹{totalAmount.toFixed(2)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Shipping Address & Payment */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Address *</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="ship_name">Full Name *</Label>
                    <Input
                      id="ship_name"
                      value={orderDetails.shippingAddress.name}
                      onChange={(e) =>
                        setOrderDetails((prev) => ({
                          ...prev,
                          shippingAddress: {
                            ...prev.shippingAddress,
                            name: e.target.value,
                          },
                        }))
                      }
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="ship_mobile">Mobile *</Label>
                    <Input
                      placeholder="10 digit mobile number"
                      id="ship_mobile"
                      value={orderDetails.shippingAddress.mobile}
                      onChange={(e) =>
                        setOrderDetails((prev) => ({
                          ...prev,
                          shippingAddress: {
                            ...prev.shippingAddress,
                            mobile: e.target.value,
                          },
                        }))
                      }
                      required
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="ship_address">Address *</Label>
                  <Textarea
                    id="ship_address"
                    value={orderDetails.shippingAddress.address}
                    onChange={(e) =>
                      setOrderDetails((prev) => ({
                        ...prev,
                        shippingAddress: {
                          ...prev.shippingAddress,
                          address: e.target.value,
                        },
                      }))
                    }
                    required
                  />
                </div>
                <div className="grid grid-cols-4 gap-4">
                  <div>
                    <Label htmlFor="ship_pincode">Pincode *</Label>
                    <Input
                      id="ship_pincode"
                      value={orderDetails.shippingAddress.pincode}
                      onChange={async (e) => {
                        const value = e.target.value;
                        setOrderDetails((prev) => ({
                          ...prev,
                          shippingAddress: {
                            ...prev.shippingAddress,
                            pincode: value,
                          },
                        }));

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

                              setOrderDetails((prev) => ({
                                ...prev,
                                shippingAddress: {
                                  ...prev.shippingAddress,
                                  city: po.District,
                                  state: foundState?.code || "", // Store code, not name
                                },
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
                    <Label htmlFor="ship_city">City *</Label>
                    <Input
                      id="ship_city"
                      value={orderDetails.shippingAddress.city}
                      onChange={(e) =>
                        setOrderDetails((prev) => ({
                          ...prev,
                          shippingAddress: {
                            ...prev.shippingAddress,
                            city: e.target.value,
                          },
                        }))
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="ship_state">State *</Label>
                    <Select
                      value={orderDetails.shippingAddress.state} // Always state code
                      onValueChange={(value) =>
                        setOrderDetails((prev) => ({
                          ...prev,
                          shippingAddress: {
                            ...prev.shippingAddress,
                            state: value,
                          },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select state" />
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

                  <div>
                    <Label htmlFor="ship_country">Country</Label>
                    <Select
                      disabled
                      value="IN"
                      onValueChange={(value) =>
                        setOrderDetails((prev) => ({
                          ...prev,
                          shippingAddress: {
                            ...prev.shippingAddress,
                            country_code: value,
                          },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Country" />
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
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <CreditCard className="h-5 w-5" />
                  <span>Payment & Notes</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="paymentMethod">Payment Method *</Label>
                  <Select
                    value={orderDetails.paymentMethod}
                    onValueChange={(value: "COD" | "Prepaid") =>
                      setOrderDetails((prev) => ({
                        ...prev,
                        paymentMethod: value,
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Prepaid">Prepaid</SelectItem>

                      <SelectItem value="COD">
                        Cash on Delivery (COD)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-500 mt-1">
                    {orderDetails.paymentMethod === "COD"
                      ? "Payment will be collected on delivery"
                      : orderDetails.paymentMethod === "Prepaid"
                      ? "Payment collected before shipping"
                      : "Payment processed online"}
                  </p>
                </div>

                {showTotalAmount && (
                  <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-yellow-800">
                        COD Amount:
                      </span>
                      <span className="text-xl font-bold text-yellow-800">
                        ₹{totalAmount.toFixed(2)}
                      </span>
                    </div>
                    <p className="text-sm text-yellow-600 mt-1">
                      Customer will pay this amount on delivery
                    </p>
                  </div>
                )}

                <div>
                  <Label htmlFor="orderNotes">Order Notes</Label>
                  <Textarea
                    id="orderNotes"
                    value={orderDetails.orderNotes}
                    onChange={(e) =>
                      setOrderDetails((prev) => ({
                        ...prev,
                        orderNotes: e.target.value,
                      }))
                    }
                    placeholder="Add any special instructions or notes..."
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end space-x-4">
            <Button variant="outline" type="button">
              Cancel
            </Button>
            <Button type="submit" disabled={loadingStates.creatingOrder}>
              {loadingStates.creatingOrder
                ? "Creating Order..."
                : "Create Order"}
            </Button>
          </div>
        </form>
      </div>
      <PincodeCheckerModal
        isOpen={isPincodeModalOpen}
        onClose={() => setIsPincodeModalOpen(false)}
      />
    </div>
  );
}
