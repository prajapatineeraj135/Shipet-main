"use client";
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Users,
  UserCheck,
  UserX,
  Shield,
  Search,
  Eye,
  Trash2,
  Calendar,
  Wallet,
  HelpCircle,
} from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";
import { adminService } from "@/services/adminService";
import ConfirmDeleteDialog from "@/components/ui/deleteAlertBox";
import { toast } from "sonner";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [viewUserDialog, setViewUserDialog] = useState(false);
  //delete
  const [userToDelete, setUserToDelete] = useState<any>(null);
  const [deleteDialog, setDeleteDialog] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  useEffect(() => {
    filterUsers();
  }, [users, searchQuery]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const usersData = await adminService.getAllUsers();
      console.log(usersData.users);
      setTimeout(() => {
        setUsers(usersData.users);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Error loading users:", error);
      setLoading(false);
    }
  };

  const filterUsers = () => {
    let filtered = users;

    if (searchQuery) {
      filtered = filtered?.filter(
        (user) =>
          user?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          user?.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredUsers(filtered);
  };

  const handleViewUser = async (userId: any) => {
    try {
      const userDetails = await adminService.getUserById(userId);
      setSelectedUser(userDetails);
      console.log(selectedUser);
      setViewUserDialog(true);
    } catch (error) {
      console.error("Error fetching user details:", error);
    }
  };

  const handleDeleteUser = async () => {
    try {
      await adminService.deleteUser(userToDelete._id);
      setUsers(users?.filter((u) => u._id !== userToDelete._id));
      setUserToDelete(null);
      setDeleteDialog(false);
      toast.success("User deleted successfully");
    } catch (error) {
      console.error("Error deleting user:", error);
    }
  };

  const stats = {
    total: users?.length,
    support: users?.filter((u) => u.role === "support").length,
    unverified: users?.filter((u) => !u.isVerified).length,
    admins: users?.filter((u) => u.role === "admin").length,
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600">
            Manage platform users and their permissions
          </p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="animate-pulse space-y-4">
                  <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/2"></div>
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
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
        <p className="text-gray-600">
          Manage platform users and their permissions
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-gray-600">Total Users</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <UserX className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">{stats.unverified}</p>
                <p className="text-gray-600">Unverified</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <HelpCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{stats.support}</p>
                <p className="text-gray-600">Customer Support</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">{stats.admins}</p>
                <p className="text-gray-600">Admins</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card>
        <CardHeader>
          <CardTitle>Search Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle>Users ({filteredUsers?.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Wallet
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Activity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="font-medium text-gray-900">
                          {user.name}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.email}
                        </div>
                        <div className="text-sm text-gray-500">
                          {user.phone}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={
                          user.role === "admin" ? "default" : "destructive"
                        }
                      >
                        {user.role}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Badge
                        variant={user.isVerified ? "default" : "destructive"}
                      >
                        {user.isVerified ? "Verified" : "Unverified"}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                      {formatCurrency(user.walletBalance)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>{user.counts.customers} customers</div>
                        <div>{user.counts.shipments} shipments</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewUser(user._id)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => {
                            setUserToDelete(user);
                            setDeleteDialog(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* View User Dialog */}
      {/* View/Edit User Dialog */}
      <Dialog open={viewUserDialog} onOpenChange={setViewUserDialog}>
        <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>User Details</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-6">
              {/* Edit Mode Toggle */}
              <div className="flex justify-end">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() =>
                    setSelectedUser((prev: any) => ({
                      ...prev,
                      isEditing: !prev.isEditing,
                    }))
                  }
                >
                  {selectedUser.isEditing ? "Cancel Edit" : "Edit User"}
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* First Name */}
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    First Name
                  </label>
                  {selectedUser.isEditing ? (
                    <Input
                      value={selectedUser.firstName}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          firstName: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <p className="text-lg">{selectedUser.firstName}</p>
                  )}
                </div>

                {/* Last Name */}
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Last Name
                  </label>
                  {selectedUser.isEditing ? (
                    <Input
                      value={selectedUser.lastName}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          lastName: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <p className="text-lg">{selectedUser.lastName}</p>
                  )}
                </div>

                {/* Email */}
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Email
                  </label>
                  {selectedUser.isEditing ? (
                    <Input
                      value={selectedUser.email}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          email: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <p className="text-lg">{selectedUser.email}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Phone
                  </label>
                  {selectedUser.isEditing ? (
                    <Input
                      value={selectedUser.phone}
                      onChange={(e) =>
                        setSelectedUser({
                          ...selectedUser,
                          phone: e.target.value,
                        })
                      }
                    />
                  ) : (
                    <p className="text-lg">{selectedUser.phone}</p>
                  )}
                </div>

                {/* Role */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-500">
                    Role
                  </label>
                  <Badge
                    variant={
                      selectedUser.role === "admin" ? "default" : "destructive"
                    }
                  >
                    {selectedUser.role}
                  </Badge>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  <label className="text-sm font-medium text-gray-500">
                    Status
                  </label>
                  <Badge
                    variant={
                      selectedUser.isVerified ? "default" : "destructive"
                    }
                  >
                    {selectedUser.isVerified ? "Verified" : "Unverified"}
                  </Badge>
                </div>

                {/* Wallet Balance */}
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Wallet Balance
                  </label>
                  <p className="text-lg font-semibold text-green-600">
                    {formatCurrency(selectedUser.wallet.balance)}
                  </p>
                </div>
              </div>

              {/* Save Button */}
              {selectedUser.isEditing && (
                <div className="flex justify-end mt-4">
                  <Button
                    onClick={async () => {
                      try {
                        await adminService.updateUser(selectedUser._id, {
                          firstName: selectedUser.firstName,
                          lastName: selectedUser.lastName,
                          email: selectedUser.email,
                          phone: selectedUser.phone,
                        });
                        toast.success("User updated successfully");
                        setUsers((prev) =>
                          prev.map((u) =>
                            u._id === selectedUser._id ? selectedUser : u
                          )
                        );
                        setSelectedUser({ ...selectedUser, isEditing: false });
                        loadUsers();
                      } catch (error) {
                        console.error("Error updating user:", error);
                        toast.error("Failed to update user");
                      }
                    }}
                  >
                    Save Changes
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmDeleteDialog
        open={deleteDialog}
        onOpenChange={setDeleteDialog}
        title="Delete User"
        description={`Are you sure you want to delete ${userToDelete?.name}? This action cannot be undone. All user data including wallet, transactions, customers, orders, and shipments will be permanently deleted.`}
        confirmText="Delete User"
        onConfirm={handleDeleteUser}
      />
    </div>
  );
}
