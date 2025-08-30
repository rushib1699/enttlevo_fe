import React, { useEffect, useState } from 'react';
import {
  createUserRole,
  addPermissionRole,
  removePermissionRole,
  getPermissions,
  updateRole,
  getUserRoles,
} from '@/api';
import { useApplicationContext } from '@/hooks/useApplicationContext';
import { Trash2, Shield, UserPlus, Edit3 } from 'lucide-react';
import { DataGrid } from '@mui/x-data-grid';
import { useUserPermission } from '@/context/UserPermissionContext';
import { COMPANY_PERMISSION_SESSION_KEY } from '@/constants';
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

// shadcn/ui imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Checkbox } from "@/components/ui/checkbox";

interface Permission {
  id: number;
  permission_name: string;
}

interface Role {
  id: number;
  role: string;
  is_active: number;
  created_at: string;
  updated_at: string;
  is_deleted: number;
  company_id: number;
  created_by: number;
  updated_by: number;
  permission: Array<{
    id: number;
    role_id: number;
    permission_id: number;
    permission_name: string;
    is_active: number;
    is_deleted: number;
  }>;
}

interface RoleManagementProps {
  onRoleUpdate?: () => void;
}

const formSchema = z.object({
  name: z.string().min(1, "Role name is required"),
  permissions: z.array(z.number()).optional(),
  companyPermissions: z.array(z.number()).optional(),
  userTypes: z.array(z.number()).optional()
});

const RoleManagement: React.FC<RoleManagementProps> = ({ onRoleUpdate }) => {
  const { loginResponse } = useApplicationContext();
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [userType, setUserType] = useState<Permission[]>([]);
  const [companyPermissions, setCompanyPermissions] = useState<Permission[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const [pageSize, setPageSize] = useState<number>(10);
  const { hasAccess } = useUserPermission();

  const isSuperAdmin = hasAccess('superadmin');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      permissions: [],
      companyPermissions: [],
      userTypes: []
    }
  });

  const fetchRoles = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await getUserRoles({
        company_id: Number(loginResponse?.company_id)
      });
      setRoles(response);

    } catch (error) {
      toast.error("Failed to fetch roles");
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      // Get user permissions from API
      const response = await getPermissions({ company_id: Number(loginResponse?.company_id) }); 
      
      // Get company permissions from session storage
      const storedCompanyPermissions = sessionStorage.getItem(COMPANY_PERMISSION_SESSION_KEY);
      let companyPermissions = [];
      if (storedCompanyPermissions) {
        companyPermissions = JSON.parse(storedCompanyPermissions).map((cp: any) => ({
          id: cp.permission_id,
          permission_name: cp.permission_name,
          is_company_permission: true
        }));
      }

      const rolePermission = response.filter((p: any) => !['manager', 'user'].includes(p.permission_name.toLowerCase()))
      const userTypes = response.filter((p: any) =>
        ['manager', 'user'].includes(p.permission_name.toLowerCase())
      );
      // Combine both permissions, avoiding duplicates
      // const combinedPermissions = [
      //   ...response,
      //   ...companyPermissions.filter((cp: any) => 
      //     !response.some((p: any) => p.id === cp.id || p.permission_name === cp.permission_name)
      //   )
      // ];

      setPermissions(rolePermission);
      setUserType(userTypes)
      setCompanyPermissions(companyPermissions)
    } catch (error) {
      console.log("Failed to fetch permissions");
    }
  };

    // Fetch roles and permissions on component mount
    useEffect(() => {
      fetchRoles();
      fetchPermissions();
    }, []);

  const handleCreateOrUpdate = async (values: z.infer<typeof formSchema>) => {
    setSubmitLoading(true);
    try {
      let roleId;
      if (editingRole) {
        await updateRole({
          id: editingRole.id,
          name: values.name,
          company_id: Number(loginResponse?.company_id),
          user_id: Number(loginResponse?.id),
          is_active: 1,
        });
        roleId = editingRole.id;
      } else {
        const newRole = await createUserRole({
          name: values.name,
          company_id: Number(loginResponse?.company_id),
          user_id: Number(loginResponse?.id),
        });
        roleId = newRole.id;
      }

      const superadminId = permissions.find(p => p.permission_name === 'superadmin')?.id;
      let permissionsToSend = values.permissions || [];
      if (permissionsToSend.includes(superadminId!)) {
        permissionsToSend = [superadminId!];
      }
      
      const companyPerm = values.companyPermissions || [];
      const userTypes = values.userTypes || [];
      
      // Add the new permissions
      if (permissionsToSend.length || companyPerm.length || userTypes.length) {
        await addPermissionRole({
          role_id: roleId,
          permission: [...permissionsToSend, ...companyPerm, ...userTypes],
          company_id: Number(loginResponse?.company_id),
          user_id: Number(loginResponse?.id),
        });
      }

      toast.success(`Role ${editingRole ? 'updated' : 'created'} successfully`);
      setIsModalVisible(false);
      form.reset();
      fetchRoles();
      
      // Notify parent component to refresh user data
      onRoleUpdate?.();
    } catch (error) {
      toast.error('Operation failed');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleRemovePermission = async (id: number, permissionId: number, roleId: number) => {
    try {
      await removePermissionRole({
        id: id,
        role_id: roleId,
        permission_id: permissionId,
        company_id: Number(loginResponse?.company_id),
        user_id: Number(loginResponse?.id),
      });
      toast.success('Permission removed successfully');
      fetchRoles();
    } catch (error) {
      toast.error('Failed to remove permission');
    }
  };

  const handleDelete = async (role: Role) => {
    try {
      await updateRole({
        id: role.id,
        name: role.role,
        company_id: Number(loginResponse?.company_id),
        user_id: Number(loginResponse?.id),
        is_active: 0,
      });
      toast.success('Role deleted successfully');
      fetchRoles();
    } catch (error) {
      toast.error('Failed to delete role');
    }
  };

  const handleEditRole = (roleData: Role) => {
    setEditingRole(roleData);
    const globalPerms = roleData.permission
      .filter(p => permissions.some(global => global.id === p.permission_id))
      .map(p => p.permission_id);
  
    const companyPerms = roleData.permission
      .filter(p => companyPermissions.some(cp => cp.id === p.permission_id))
      .map(p => p.permission_id);

    const userTypes = roleData.permission
      .filter(p => ['manager', 'user'].some(cp => cp === p.permission_name))
      .map(p => p.permission_id);
  
    form.setValue('name', roleData.role);
    form.setValue('userTypes', userTypes);
    form.setValue('permissions', globalPerms);
    form.setValue('companyPermissions', companyPerms);
    setIsModalVisible(true);
  };

  const togglePermission = (permissionId: number, field: 'permissions' | 'companyPermissions' | 'userTypes') => {
    const currentValues = form.getValues(field) || [];
    if (currentValues.includes(permissionId)) {
      form.setValue(field, currentValues.filter(id => id !== permissionId));
    } else {
      form.setValue(field, [...currentValues, permissionId]);
    }
  };

  const handleSuperAdminChange = (checked: boolean) => {
    const superadminId = permissions.find(p => p.permission_name === 'superadmin')?.id;
    if (checked && superadminId) {
      const allIds = permissions.map(p => p.id);
      form.setValue('permissions', allIds);
    } else if (superadminId) {
      const currentPermissions = form.getValues('permissions') || [];
      form.setValue('permissions', currentPermissions.filter(id => id !== superadminId));
    }
  };

  const columns = [
    {
      field: 'role',
      headerName: 'Role Name',
      flex: 1,
      renderCell: (params: any) => (
        <div className="flex items-center gap-2 m-2">
          <Shield className="w-4 h-4 text-blue-600" />
          <span className="font-medium">{params.value}</span>
        </div>
      ),
      headerClassName: "table-header"
    },
    {
      field: 'permission',
      headerName: 'Permissions',
      flex: 3,
      renderCell: (params: any) => (
        <div className="flex flex-wrap gap-2 m-2">
          {params.value?.map((perm: any) => (
            <TooltipProvider key={perm.id}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Badge
                    variant="secondary"
                    className="px-3 py-1 cursor-pointer transition-all hover:bg-red-50 hover:text-red-700"
                    onClick={() => handleRemovePermission(perm.id, perm.permission_id, params.row.id)}
                  >
                    <span className="flex items-center gap-2">
                      {perm.permission_name}
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </span>
                  </Badge>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Click to remove permission</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          ))}
        </div>
      ),
      headerClassName: "table-header"
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 120,
      renderCell: (params: any) => (
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleEditRole(params.row)}
                  disabled={!isSuperAdmin}
                >
                  <Edit3 className="w-4 h-4 text-blue-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit Role</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(params.row)}
                  disabled={!isSuperAdmin}
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Delete Role</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      ),
      headerClassName: "table-header"
    },
  ];

  return (
    <div className="max-w-full mx-auto">
      <Card className="shadow-sm rounded-lg">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-xl">Role Management</CardTitle>
              <p className="text-sm text-muted-foreground">Manage user roles and their permissions</p>
            </div>
            
            <Dialog open={isModalVisible} onOpenChange={setIsModalVisible}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingRole(null);
                    form.reset();
                  }}
                  disabled={!isSuperAdmin}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Create New Role
                </Button>
              </DialogTrigger>
              
              <DialogContent className="max-w-4xl max-h-[100vh] overflow-y-auto rounded-lg">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    {editingRole ? 'Edit Role' : 'Create New Role'}
                  </DialogTitle>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleCreateOrUpdate)} className="space-y-6">
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Note:</strong> Selecting <strong>superadmin</strong> will automatically assign all permissions
                      </p>
                    </div>

                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Role Name</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Shield className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                              <Input
                                {...field}
                                placeholder="Enter role name"
                                className="pl-10"
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="userTypes"
                      render={() => (
                        <FormItem>
                          <FormLabel>User Type</FormLabel>
                          <div className="grid grid-cols-2 gap-2">
                            {userType.map((type) => (
                              <div key={type.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`userType-${type.id}`}
                                  checked={(form.getValues('userTypes') || []).includes(type.id)}
                                  onCheckedChange={(checked) => {
                                    if (checked) {
                                      togglePermission(type.id, 'userTypes');
                                    } else {
                                      togglePermission(type.id, 'userTypes');
                                    }
                                  }}
                                />
                                <label
                                  htmlFor={`userType-${type.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {type.permission_name}
                                </label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="permissions"
                      render={() => (
                        <FormItem>
                          <FormLabel>Permissions</FormLabel>
                          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                            {permissions.map((permission) => {
                              const isSuperAdmin = permission.permission_name === 'superadmin';
                              return (
                                <div key={permission.id} className="flex items-center space-x-2">
                                  <Checkbox
                                    id={`permission-${permission.id}`}
                                    checked={(form.getValues('permissions') || []).includes(permission.id)}
                                    onCheckedChange={(checked) => {
                                      if (isSuperAdmin) {
                                        handleSuperAdminChange(checked as boolean);
                                      } else {
                                        togglePermission(permission.id, 'permissions');
                                      }
                                    }}
                                  />
                                  <label
                                    htmlFor={`permission-${permission.id}`}
                                    className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                                      isSuperAdmin ? 'text-red-600 font-bold' : ''
                                    }`}
                                  >
                                    {permission.permission_name}
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="companyPermissions"
                      render={() => (
                        <FormItem>
                          <FormLabel>Modules Access</FormLabel>
                          <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto border rounded-md p-3">
                            {companyPermissions.map((permission) => (
                              <div key={permission.id} className="flex items-center space-x-2">
                                <Checkbox
                                  id={`companyPermission-${permission.id}`}
                                  checked={(form.getValues('companyPermissions') || []).includes(permission.id)}
                                  onCheckedChange={() => togglePermission(permission.id, 'companyPermissions')}
                                />
                                <label
                                  htmlFor={`companyPermission-${permission.id}`}
                                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                                >
                                  {permission.permission_name}
                                </label>
                              </div>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsModalVisible(false);
                          form.reset();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={submitLoading}>
                        {submitLoading ? 'Saving...' : (editingRole ? 'Update' : 'Create')}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          <div style={{ width: '100%', height: pageSize === 10 ? '900px' : 'auto' }}>
            <DataGrid
              rows={roles}
              columns={columns}
              pageSizeOptions={[10, 20, 50, 100]}
              initialState={{
                pagination: {
                  paginationModel: { pageSize: 10 }
                }
              }}
              onPaginationModelChange={(model) => setPageSize(model.pageSize)}
              loading={loading}
              disableRowSelectionOnClick
              getRowHeight={() => 'auto'}
              sx={{
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f8fafc',
                  color: '#1e293b',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderBottom: '1px solid #e2e8f0'
                },
                '& .table-header': {
                  backgroundColor: '#f8fafc',
                  color: '#1e293b',
                  fontSize: '14px',
                  fontWeight: '600',
                  borderBottom: '1px solid #e2e8f0'
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #f1f5f9'
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: '#f8fafc'
                }
              }}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default RoleManagement;