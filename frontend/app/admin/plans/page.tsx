"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { adminService } from "@/services/adminService";
import { CreatePlanModal } from "@/components/admin/CreatePlanModal";
import {
  Plus,
  Edit,
  Users,
  IndianRupee,
  Calendar,
  TrendingUp,
  Shield,
  Star,
  Zap,
  Crown,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { planService } from "@/services/planService";

const iconMap: any = {
  shield: Shield,
  star: Star,
  zap: Zap,
  crown: Crown,
};

export default function AdminPlansPage() {
  const [plans, setPlans] = useState<any[]>([]);
  const [statsData, setStatsData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<any | null>(null);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      setLoading(true);
      const data = await planService.getPlans();
      const statData = await adminService.planStats();
      setStatsData(statData);
      console.log(statData);
      console.log(data);
      setPlans(data);
    } catch (error) {
      toast.error("Failed to load plans");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (planData: any) => {
    try {
      await adminService.createPlan(planData);
      toast.success("Plan created successfully");
      loadPlans();
      setIsCreateModalOpen(false);
    } catch (error) {
      toast.error("Failed to create plan");
    }
  };
  console.log(editingPlan);

  const handleUpdatePlan = async (planData: any) => {
    if (!editingPlan) return;
    try {
      await adminService.updatePlan(editingPlan.id, planData);
      toast.success("Plan updated successfully");
      loadPlans();
      setEditingPlan(null);
    } catch (error) {
      toast.error("Failed to update plan");
    }
  };

  const mergedPlans = plans.map((plan) => {
    const stat = statsData.userPlanStats.find((s: any) => s._id === plan.id);
    return {
      ...plan,
      activeUsers: stat ? stat.userCount : 0,
    };
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Plans Management
            </h1>
            <p className="text-muted-foreground">
              Create and manage subscription plans
            </p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                <div className="h-4 w-4 bg-gray-200 rounded animate-pulse"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-gray-200 rounded w-16 animate-pulse mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <div className="h-6 bg-gray-200 rounded w-32 animate-pulse"></div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <div className="h-4 bg-gray-200 rounded flex-1 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                  <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            Plans Management
          </h1>
          <p className="text-muted-foreground">
            Create and manage subscription plans for your platform
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          disabled={plans.length === 4}
        >
          <Plus className="mr-2 h-4 w-4" />
          Create Plan
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsData?.totalPlans ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {` Max user plan : ${statsData.planWithMaxUsers.name}(${statsData.planWithMaxUsers.userCount})`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Subscribers
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {statsData.totalSubscribers ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">Across all plans</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Monthly Revenue
            </CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(statsData.monthlyRevenue ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              From active subscriptions
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Avg. Revenue per User
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(statsData.avgRevenuePerUser ?? 0)}
            </div>
            <p className="text-xs text-muted-foreground">Monthly ARPU</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>All Plans</CardTitle>
          <CardDescription>
            Manage your subscription plans and pricing
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Plans Table */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Plan</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Commission</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Active Users</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {mergedPlans.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      <div className="text-muted-foreground">
                        No plans created yet
                      </div>
                      <Button
                        variant="outline"
                        className="mt-2"
                        onClick={() => setIsCreateModalOpen(true)}
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Create Your First Plan
                      </Button>
                    </TableCell>
                  </TableRow>
                ) : (
                  mergedPlans.map((plan: any) => {
                    const IconComponent = iconMap[plan.iconType];
                    return (
                      <TableRow key={plan.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            <div
                              className={`p-2 rounded-lg ${plan.colorClass} text-white`}
                            >
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{plan.name}</span>
                                {plan.isPopular && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Popular
                                  </Badge>
                                )}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {plan.features.length} features
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">
                            {plan.price === 0
                              ? "Free"
                              : formatCurrency(plan.price)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {plan.period}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {plan.commissionPercentage}%
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {plan.discountDisplay > 0 ? (
                            <Badge variant="secondary">
                              {plan.discountDisplay}% off
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">
                              No discount
                            </span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{plan.activeUsers}</div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(plan.price * plan.activeUsers)}/mo
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {formatDate(plan.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Edit
                            className="mr-2 h-4 w-4"
                            onClick={() => setEditingPlan(plan)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Create/Edit Plan Modal */}
      <CreatePlanModal
        isOpen={isCreateModalOpen || !!editingPlan}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingPlan(null);
        }}
        onSubmit={editingPlan ? handleUpdatePlan : handleCreatePlan}
        plan={editingPlan}
        mode={editingPlan ? "edit" : "create"}
      />
    </div>
  );
}
