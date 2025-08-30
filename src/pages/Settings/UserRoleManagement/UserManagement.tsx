import { useState, useCallback, useEffect } from "react";
import { useApplicationContext } from "@/hooks/useApplicationContext";
import { UserList, getUserRoleList, UserData } from "@/types";
import { getUsers, getUserRoles, createUser, disableUser, enableUser, userRoleUpdate } from "@/api";
import { useUserPermission } from "@/context/UserPermissionContext";
import { DataGrid } from '@mui/x-data-grid';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Shield, UserPlus, Edit3, Power, UserRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { SelectValue, SelectTrigger, SelectContent, SelectItem } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { toast } from "sonner";

const UsersPage = () => {
  const { loginResponse } = useApplicationContext();
  const [userData, setUserData] = useState<UserList>([]);
  const [loading, setLoading] = useState(false);
  const { hasAccess } = useUserPermission();
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditRoleModalOpen, setIsEditRoleModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserData | null>(null);
  const [userRoles, setUserRoles] = useState<getUserRoleList[]>([]);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [pageSize, setPageSize] = useState<number>(10);

  const form = useForm({
    defaultValues: {
      first_name: "",
      last_name: "", 
      username: "",
      email: "",
      phone: "",
      role_id: ""
    }
  });
  const editRoleForm = useForm();

  const isSuperAdmin = hasAccess('superadmin');

  const fetchUsersData = useCallback(async () => {
    try {
      setLoading(true);
      const company_id = loginResponse?.company_id;
      const role_id = loginResponse?.role_id;
      const user_id = Number(loginResponse?.id);

      if (company_id && role_id) {
        const response = await getUsers({ company_id, role_id, user_id });
        setUserData(response);
      } else {
        console.error("Required loginResponse fields are undefined");
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      toast.error("Failed to fetch users");
    } finally {
      setLoading(false);
    }
  }, [loginResponse]);

  const fetchUserRoles = async () => {
    try {
      const roles = await getUserRoles({
        company_id: parseInt(loginResponse?.company_id)
      });
      setUserRoles(roles);
    } catch (error) {
      console.error("Error fetching user roles:", error);
      toast.error("Failed to fetch roles");
    }
  };

  useEffect(() => {
    if (isSuperAdmin) {
      fetchUsersData();
      fetchUserRoles();
    }
  }, [fetchUsersData, isSuperAdmin]);

  const handleCreateUser = async (data: any) => {
    try {
      setIsCreatingUser(true);
      await createUser({
        ...data,
        company_id: Number(loginResponse?.company_id),
        team_id: 1,
        role_id: userRoles.find(role => role.role === data.role_id)?.id
      });
      toast.success("User created successfully");
      setIsCreateModalOpen(false);
      form.reset();
      fetchUsersData();
    } catch (error) {
      toast.error("Failed to create user");
    } finally {
      setIsCreatingUser(false);
    }
  };

  const handleUpdateRole = async (data: any) => {
    try {
      await userRoleUpdate({
        user_id: selectedUser?.id,
        role_id: userRoles.find(role => role.role === data.role_id)?.id || 0
      });
      toast.success("Role updated successfully");
      setIsEditRoleModalOpen(false);
      fetchUsersData();
    } catch (error) {
      toast.error("Failed to update role");
    }
  };

  const handleToggleStatus = async (userId: number, currentStatus: number) => {
    try {
      if (currentStatus === 1) {
        await disableUser({ user_id: userId });
      } else {
        await enableUser({ user_id: userId });
      }
      toast.success(`User ${currentStatus === 1 ? 'disabled' : 'enabled'} successfully`);
      fetchUsersData();
    } catch (error) {
      toast.error("Failed to update user status");
    }
  };

  const filteredData = userData.filter(user => {
    const matchesSearch = 
      user.first_name.toLowerCase().includes(searchText.toLowerCase()) ||
      user.last_name.toLowerCase().includes(searchText.toLowerCase()) ||
      user.email.toLowerCase().includes(searchText.toLowerCase());

    const matchesStatus = 
      statusFilter === 'all' || 
      (statusFilter === 'active' ? user.is_active === 1 : user.is_active === 0);

    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    // Sort by active status first
    if (a.is_active !== b.is_active) {
      return b.is_active - a.is_active;
    }
    // Then sort by name
    return a.first_name.localeCompare(b.first_name);
  });

  const columns = [
    {
      field: 'first_name',
      headerName: 'Name',
      flex: 1.5,
      renderCell: (params: any) => (
        <div className="flex items-center gap-3 py-3 pl-4">
          <UserRound className="w-5 h-5 text-blue-600" />
          <div className="flex flex-col">
            <span className={`font-medium ${params.row.is_active === 0 ? 'text-gray-400' : ''}`}>
              {`${params.row.first_name} ${params.row.last_name}`}
            </span>
            <span className="text-sm text-gray-500">{params.row.email}</span>
          </div>
        </div>
      ),
      headerClassName: "table-header"
    },
    {
      field: 'username',
      headerName: 'Username',
      flex: 1,
      headerClassName: "table-header",
      renderCell: (params: any) => (
        <div className="py-3 pl-4">
          {params.value}
        </div>
      )
    },
    {
      field: 'email',
      headerName: 'Email',
      flex: 1.2,
      headerClassName: "table-header",
      renderCell: (params: any) => (
        <div className="py-3 pl-4">
          {params.value}
        </div>
      )
    },
    {
      field: 'contact',
      headerName: 'Contact',
      width: 150,
      headerClassName: "table-header",
      renderCell: (params: any) => (
        <div className="py-3 pl-4">
          {params.value}
        </div>
      )
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 180,
      renderCell: (params: any) => (
        <div className="py-3 pl-4">
          <Badge className="bg-blue-100 text-blue-800 px-4 py-1.5 text-sm font-medium">
            {params.row.role}
          </Badge>
        </div>
      ),
      headerClassName: "table-header"
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params: any) => (
        <div className="flex gap-3 py-3 pl-4">
          <Button
            variant="ghost" 
            size="sm"
            onClick={() => {
              setSelectedUser(params.row);
              setIsEditRoleModalOpen(true);
            }}
            disabled={!isSuperAdmin || params.row.is_active === 0}
            className="hover:bg-gray-100"
          >
            <Edit3 className="w-4 h-4 text-blue-600" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleToggleStatus(params.row.id, params.row.is_active)}
            disabled={!isSuperAdmin}
            className="hover:bg-gray-100"
          >
            <Power className={`w-4 h-4 ${params.row.is_active === 0 ? 'text-green-600' : 'text-red-500'}`} />
          </Button>
        </div>
      ),
      headerClassName: "table-header"
    }
  ];

  return (
    <div className="max-w-full mx-auto">
      <Card className="shadow-sm rounded-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">User Management</CardTitle>
              <p className="text-sm text-muted-foreground">Manage system users and their roles</p>
            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              disabled={!isSuperAdmin}
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Create New User
            </Button>
          </div>
        </CardHeader>
        
        <CardContent>
          <div className="flex gap-4 mb-4">
            <Input
              placeholder="Search users..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="max-w-sm"
            />
            <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div style={{ width: '100%', height: pageSize === 10 ? '600px' : 'auto' }}>
            <DataGrid
              rows={filteredData}
              columns={columns}
              loading={loading}
              pageSizeOptions={[10, 20, 50, 100]}
              onPageSizeChange={(newPageSize: number) => setPageSize(newPageSize)}
              disableRowSelectionOnClick
              className="border border-gray-200 rounded-lg"
              getRowHeight={() => 'auto'}
              sx={{
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f8fafc',
                  color: '#1e293b',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderBottom: '1px solid #e2e8f0',
                },
                '& .table-header': {
                  backgroundColor: '#f8fafc',
                  color: '#1e293b',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderBottom: '1px solid #e2e8f0'
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #f1f5f9',
                  padding: '0'
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: '#f8fafc'
                }
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New User</DialogTitle>
            <DialogDescription>
              Add a new user to the system
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleCreateUser)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="first_name"
                  rules={{ required: "First name is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="First Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="last_name"
                  rules={{ required: "Last name is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Last Name" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  rules={{ required: "Username is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Username</FormLabel>
                      <FormControl>
                        <Input placeholder="Username" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="email"
                  rules={{ 
                    required: "Email is required",
                    pattern: {
                      value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                      message: "Invalid email address"
                    }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="Email" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="phone"
                  rules={{ 
                    required: "Phone number is required",
                    pattern: {
                      value: /^\+?[1-9]\d{9,14}$/,
                      message: "Invalid phone number"
                    }
                  }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone</FormLabel>
                      <FormControl>
                        <Input placeholder="+1234567890" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="role_id"
                  rules={{ required: "Role is required" }}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Role</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                        <SelectContent>
                          {userRoles.map((role) => (
                            <SelectItem key={role.id} value={role.role}>
                              {role.role}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter>
                <Button 
                  type="submit" 
                  disabled={isCreatingUser}
                >
                  {isCreatingUser ? 'Creating...' : 'Create User'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditRoleModalOpen} onOpenChange={setIsEditRoleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User Role</DialogTitle>
            <DialogDescription>
              Change the role for this user
            </DialogDescription>
          </DialogHeader>

          <Form {...editRoleForm}>
            <form onSubmit={editRoleForm.handleSubmit(handleUpdateRole)} className="space-y-4">
              <FormField
                control={editRoleForm.control}
                name="role_id"
                rules={{ required: "Role is required" }}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                      <SelectContent>
                        {userRoles.map((role) => (
                          <SelectItem key={role.id} value={role.role}>
                            {role.role}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="submit">
                  Update Role
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UsersPage;
