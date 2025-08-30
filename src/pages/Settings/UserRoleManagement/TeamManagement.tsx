import React, { useEffect, useState } from 'react';
import { useApplicationContext } from '@/hooks/useApplicationContext';
import { Trash2, Shield, UserPlus, Edit3, Power, X } from 'lucide-react';
import { DataGrid } from '@mui/x-data-grid';
import { useUserPermission } from '@/context/UserPermissionContext';
import { getTeamMembers, getTeamMembersList, createTeam, deleteTeam, deleteTeamMember } from '@/api';
import { toast } from "sonner";

// shadcn/ui imports
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  is_active: number;
  team_owner_id: number;
  members?: {
    id: number;
    member_id: number;
    name: string;
    team_owner_id: number;
  }[];
}

interface TeamMemberOption {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  contact: number;
  team_owner_id: number;
  permission_name: string;
  team_id: number;
  role_id: number;
  is_active: number;
}

const formSchema = z.object({
  team_owner_id: z.number().min(1, "Please select a team owner"),
  members: z.array(z.number()).min(1, "Please select at least one team member")
});

const TeamManagement: React.FC = () => {
  const { loginResponse } = useApplicationContext();
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [submitLoading, setSubmitLoading] = useState<boolean>(false);
  const { hasAccess } = useUserPermission();
  const [teamOwners, setTeamOwners] = useState<TeamMemberOption[]>([]);
  const [availableMembers, setAvailableMembers] = useState<TeamMemberOption[]>([]);
  const [pageSize, setPageSize] = useState<number>(10);

  const isSuperAdmin = hasAccess('superadmin');

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      team_owner_id: 0,
      members: []
    }
  });

  const fetchTeamMembers = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const response = await getTeamMembers({
        company_id: Number(loginResponse?.company_id),
        user_id: Number(loginResponse?.id)
      });
      
      const transformedData = response.map((team: any) => ({
        id: team.owner.id,
        name: `${team.owner.first_name} ${team.owner.last_name}`,
        is_active: team.owner.is_active,
        team_owner_id: team.owner.team_owner_id,
        members: team.members.map((member: any) => ({
          id: member.id,
          member_id: member.member_id,
          name: `${member.first_name} ${member.last_name}`,
          team_owner_id: member.team_owner_id
        }))
      }));
      
      setTeamMembers(transformedData);
    } catch (error) {
      toast.error("Failed to fetch team members");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeamOwners = async () => {
    try {
      const response = await getTeamMembersList({
        company_id: Number(loginResponse?.company_id),
        user_id: Number(loginResponse?.id),
        manager: 1
      });
      setTeamOwners(response);
    } catch (error) {
      toast.error('Failed to fetch team owners');
    }
  };

  const fetchAvailableMembers = async () => {
    try {
      const response = await getTeamMembersList({
        company_id: Number(loginResponse?.company_id),
        user_id: Number(loginResponse?.id),
        manager: 0
      });
      setAvailableMembers(response);
    } catch (error) {
      toast.error('Failed to fetch available members');
    }
  };

  const handleCreateOrUpdate = async (values: z.infer<typeof formSchema>) => {
    setSubmitLoading(true);
    try {
      await createTeam({
        company_id: Number(loginResponse?.company_id),
        user_id: Number(loginResponse?.id),
        team_owner_id: values.team_owner_id,
        members: values.members
      });

      toast.success(`Team ${editingMember ? 'updated' : 'created'} successfully`);
      setIsModalVisible(false);
      form.reset();
      fetchTeamMembers();
    } catch (error) {
      toast.error('Operation failed');
    } finally {
      setSubmitLoading(false);
    }
  };

  const handleDeleteMember = async (teamOwnerId: number, memberId: number) => {
    try {
      await deleteTeamMember({
        company_id: Number(loginResponse?.company_id),
        user_id: Number(loginResponse?.id),
        team_owner_id: teamOwnerId,
        member_id: memberId
      });
      toast.success('Team member removed successfully');
      fetchTeamMembers();
    } catch (error) {
      toast.error('Failed to remove team member');
    }
  };

  const handleToggleStatus = async (member: TeamMember) => {
    try {
      await deleteTeam({
        company_id: Number(loginResponse?.company_id),
        user_id: Number(loginResponse?.id),
        team_owner_id: member.id,
        is_active: member.is_active === 1 ? 0 : 1,
      });
      toast.success(`Team ${member.is_active === 1 ? 'disabled' : 'enabled'} successfully`);
      fetchTeamMembers();
    } catch (error) {
      toast.error('Failed to update team status');
    }
  };

  useEffect(() => {
    fetchTeamMembers();
    fetchTeamOwners();
    fetchAvailableMembers();
  }, []);

  const columns = [
    {
      field: 'name',
      headerName: 'Team Name',
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
      field: 'members',
      headerName: 'Team Members',
      flex: 1,
      renderCell: (params: any) => (
        <div className="flex flex-wrap gap-2 py-2">
          {params.row.members?.map((member: { id: number; member_id: number; name: string }) => (
            <div 
              key={member.id} 
              className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 px-3 py-1.5 rounded-full border border-gray-200 transition-colors"
            >
              <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-sm">
                {member.name.charAt(0)}
              </div>
              <span className="text-sm font-medium text-gray-700">{member.name}</span>
              {isSuperAdmin && (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="!p-0 h-5 w-5 hover:text-red-500 transition-colors"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteMember(params.row.team_owner_id, member.member_id);
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-red-500" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Remove Member</p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          ))}
        </div>
      ),
      headerClassName: "table-header" 
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params: any) => {
        const isActive = params.row.is_active === 1;
        return (
          <Badge 
            variant={isActive ? 'default' : 'destructive'}
            className="m-2"
          >
            {isActive ? 'Active' : 'Inactive'}
          </Badge>
        );
      },
      headerClassName: "table-header" 
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params: any) => (
        <div className="flex items-center gap-2">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setEditingMember(params.row);
                    form.setValue('team_owner_id', params.row.team_owner_id);
                    form.setValue('members', params.row.members?.map((member: { member_id: number }) => member.member_id) || []);
                    setIsModalVisible(true);
                  }}
                  disabled={!isSuperAdmin || params.row.is_active === 0}
                >
                  <Edit3 className="w-4 h-4 text-blue-600" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Edit Member</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleStatus(params.row)}
                  disabled={!isSuperAdmin}
                >
                  <Power className={`w-4 h-4 ${params.row.is_active === 0 ? 'text-green-600' : 'text-red-500'}`} />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{params.row.is_active === 0 ? "Enable Team" : "Disable Team"}</p>
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
              <CardTitle className="text-xl">Team Management</CardTitle>
              <p className="text-sm text-muted-foreground">Manage team members and their members</p>
            </div>
            
            <Dialog open={isModalVisible} onOpenChange={setIsModalVisible}>
              <DialogTrigger asChild>
                <Button
                  onClick={() => {
                    setEditingMember(null);
                    form.reset();
                  }}
                  disabled={!isSuperAdmin}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Team Member
                </Button>
              </DialogTrigger>
              
              <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-blue-600" />
                    {editingMember ? 'Edit Team Member' : 'Add Team Member'}
                  </DialogTitle>
                </DialogHeader>
                
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleCreateOrUpdate)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="team_owner_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Team Owner</FormLabel>
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(Number(value));
                              form.setValue('members', []);
                            }}
                            value={field.value?.toString()}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select team owner" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {teamOwners.map(owner => (
                                <SelectItem key={owner.id} value={owner.id.toString()}>
                                  {owner.first_name} {owner.last_name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="members"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Team Members</FormLabel>
                          <div className="space-y-2">
                            {field.value && field.value.length > 0 && (
                              <div className="flex flex-wrap gap-2">
                                {field.value.map(memberId => {
                                  const member = availableMembers.find(m => m.id === memberId);
                                  return member ? (
                                    <Badge key={memberId} variant="secondary" className="flex items-center gap-1">
                                      {member.first_name} {member.last_name}
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="h-4 w-4 p-0 hover:bg-transparent"
                                        onClick={() => {
                                          field.onChange(field.value.filter(id => id !== memberId));
                                        }}
                                      >
                                        <X className="h-3 w-3" />
                                      </Button>
                                    </Badge>
                                  ) : null;
                                })}
                              </div>
                            )}
                            <Select 
                              onValueChange={(value) => {
                                const currentValues = field.value || [];
                                const newValue = Number(value);
                                if (!currentValues.includes(newValue)) {
                                  field.onChange([...currentValues, newValue]);
                                }
                              }}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select team members" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {availableMembers
                                  .filter(member => 
                                    member.id !== form.getValues('team_owner_id') && 
                                    !(field.value || []).includes(member.id)
                                  )
                                  .map(member => (
                                    <SelectItem key={member.id} value={member.id.toString()}>
                                      {member.first_name} {member.last_name}
                                    </SelectItem>
                                  ))}
                              </SelectContent>
                            </Select>
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
                        {submitLoading ? 'Saving...' : (editingMember ? 'Update' : 'Add')}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        
        <CardContent>
          <div style={{ width: '100%', height: pageSize === 10 ? '600px' : 'auto' }}>
            <DataGrid
              rows={teamMembers}
              columns={columns}
              pageSizeOptions={[10, 20, 50, 100]}
              onPageSizeChange={(newPageSize: number) => setPageSize(newPageSize)}
              loading={loading}
              disableRowSelectionOnClick
              className="border border-gray-200 rounded-lg"
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

export default TeamManagement;