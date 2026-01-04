"use client";

import type React from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Check,
  Crown,
  Star,
  Zap,
  Shield,
  Calendar,
  CreditCard,
  History,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { planService } from "@/services/planService";

const planIcons: Record<string, React.ReactNode> = {
  bronze: <Shield className="h-6 w-6" />,
  silver: <Star className="h-6 w-6" />,
  gold: <Zap className="h-6 w-6" />,
  platinum: <Crown className="h-6 w-6" />,
};

const planColors: Record<string, string> = {
  bronze: "bg-amber-600",
  silver: "bg-gray-500",
  gold: "bg-yellow-500",
  platinum: "bg-purple-600",
};

export default function PlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [currentUserPlan, setCurrentUserPlan] = useState<any | null>(null);
  const [planHistory, setPlanHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [upgradingPlan, setUpgradingPlan] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("plans");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [plansData, currentPlanData] = await Promise.all([
        planService.getPlans(),
        planService.getCurrentUserPlan(),
      ]);
      console.log("plansData", plansData);
      console.log("currentPlanData", currentPlanData);

      setPlans(plansData);
      setCurrentUserPlan(currentPlanData);
    } catch (error) {
      console.error("Error loading plans:", error);
      toast.error("Failed to load plans. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const loadPlanHistory = async () => {
    try {
      const historyData = await planService.getUserPlanHistory();
      console.log("historyData", historyData);
      setPlanHistory(historyData);
    } catch (error) {
      console.error("Error loading plan history:", error);
      toast.error("Failed to load plan history.");
    }
  };

  const handlePlanUpgrade = async (planId: string) => {
    if (currentUserPlan?.currentPlanId === planId) {
      toast.error("You are already on this plan.");
      return;
    }

    setUpgradingPlan(planId);

    try {
      const selectedPlan = plans.find((p) => p.id === planId);

      // For free plans, upgrade directly
      if (selectedPlan?.price === 0) {
        await planService.upgradeUserPlan({ planId });

        toast.success(
          `You have successfully switched to the ${selectedPlan.name} plan.`
        );

        // Reload current plan data
        await loadData();
      } else {
        // For paid plans, you might want to integrate with payment gateway
        // For now, we'll simulate a payment process
        const paymentReference = `PAY_${Date.now()}_${Math.random()
          .toString(36)
          .substr(2, 9)}`;

        await planService.upgradeUserPlan({
          planId,
          paymentReference,
        });

        toast.success(
          `You have successfully upgraded to the ${selectedPlan?.name} plan.`
        );

        // Reload current plan data
        await loadData();
      }
    } catch (error: any) {
      console.error("Error upgrading plan:", error);
      toast.error("There was an error upgrading your plan. Please try again.");
    } finally {
      setUpgradingPlan(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getRemainingDaysText = (remainingDays: number | null) => {
    if (remainingDays === null) return "Lifetime";
    if (remainingDays <= 0) return "Expired";
    if (remainingDays === 1) return "1 day remaining";
    return `${remainingDays} days remaining`;
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="flex items-center gap-2">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span>Loading plans...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4">Choose Your Plan</h1>
        <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
          Upgrade your shipping experience with better rates and premium
          features. Save more on every shipment with our monthly plans.
        </p>
      </div>
      {/* Current Plan Status */}
      {currentUserPlan && (
        <Card className="bg-muted/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Current Plan Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="font-semibold">
                  {currentUserPlan.planDetails.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <Badge
                  variant={
                    currentUserPlan.planStatus === "active"
                      ? "default"
                      : "secondary"
                  }
                >
                  {currentUserPlan.planStatus}
                </Badge>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Started</p>
                <p className="font-semibold">
                  {formatDate(currentUserPlan.planStartDate)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Remaining</p>
                <p className="font-semibold">
                  {getRemainingDaysText(currentUserPlan.remainingDays)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Available Plans */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-8">
        {plans.map((plan) => {
          const isCurrentPlan = currentUserPlan?.currentPlanId === plan.id;
          const icon = planIcons[plan.id] || <Shield className="h-6 w-6" />;
          const color = planColors[plan.id] || "bg-gray-500";

          return (
            <Card
              key={plan.id}
              className={`relative transition-all duration-300 hover:shadow-lg ${
                plan.popular ? "ring-2 ring-primary scale-105" : ""
              } ${isCurrentPlan ? "ring-2 ring-green-500" : ""}`}
            >
              {plan.isPopular && !isCurrentPlan && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary">
                  Most Popular
                </Badge>
              )}
              {isCurrentPlan && (
                <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-green-500">
                  Current Plan
                </Badge>
              )}

              <CardHeader className="text-center pb-4">
                <div
                  className={`w-12 h-12 rounded-full ${color} flex items-center justify-center text-white mx-auto mb-4`}
                >
                  {icon}
                </div>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>
                  {plan.discountDisplay > 0 ? (
                    <div className="space-y-1">
                      <div className="text-2xl font-bold text-primary">
                        {plan.discountDisplay}% OFF
                      </div>
                      <div className="text-sm font-medium text-green-600">
                        on shipping charges
                      </div>
                    </div>
                  ) : (
                    <div className="text-lg font-medium text-muted-foreground">
                      Standard Rates
                    </div>
                  )}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="text-center">
                  <div className="text-3xl font-bold">
                    {plan.price === 0
                      ? "Free"
                      : `₹${plan.price.toLocaleString()}`}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {plan.period}
                  </div>
                </div>

                <ul className="space-y-2">
                  {plan.features.map((feature: any, index: any) => (
                    <li key={index} className="flex items-start gap-2">
                      <Check className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>

              <CardFooter>
                <Button
                  className="w-full"
                  variant={
                    isCurrentPlan
                      ? "outline"
                      : plan.popular
                      ? "default"
                      : "outline"
                  }
                  onClick={() => handlePlanUpgrade(plan.id)}
                  disabled={upgradingPlan === plan.id || isCurrentPlan}
                >
                  {upgradingPlan === plan.id ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing...
                    </div>
                  ) : isCurrentPlan ? (
                    "Current Plan"
                  ) : plan.price === 0 ? (
                    "Switch to Free"
                  ) : (
                    `Upgrade to ${plan.name}`
                  )}
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      <div className="text-center mt-8 text-sm text-muted-foreground">
        <p>
          All plans include secure payment processing and can be cancelled
          anytime.
        </p>
        <p>Prices are in Indian Rupees (INR) and exclude applicable taxes.</p>
      </div>
    </div>
  );
}
