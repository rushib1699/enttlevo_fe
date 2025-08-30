import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useApplicationContext } from '@/hooks/useApplicationContext';
import { createEcGroup, getECGroups, renameEcGroup, deleteEcGroup } from '@/api';
import { DataGrid, GridColDef, GridActionsCellItem } from '@mui/x-data-grid';

interface Group {
  group_id: string;
  group_name: string;
  is_active: number;
  is_deleted: number;
  created_by: string;
}

const GroupManagement: React.FC = () => {
  const { loginResponse } = useApplicationContext();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [groupName, setGroupName] = useState('');

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const response = await getECGroups({
        company_id: loginResponse?.company_id || 0,
        user_id: loginResponse?.id || 0,
      });
      setGroups(response || []);
    } catch (error) {
      console.log(error);
      //toast.error('Failed to fetch groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!groupName.trim()) {
      toast.error('Please enter a group name');
      return;
    }

    try {
      await createEcGroup({
        name: groupName,
        company_id: loginResponse?.company_id || 0,
        user_id: loginResponse?.id || 0,
      });
      toast.success('Group created successfully');
      setGroupName('');
      setIsCreateDialogOpen(false);
      fetchGroups();
    } catch (error) {
      toast.error('Failed to create group');
    }
  };

  const handleRenameGroup = async () => {
    if (!groupName.trim() || !selectedGroup) {
      toast.error('Please enter a valid group name');
      return;
    }

    try {
      await renameEcGroup({
        group_id: parseInt(selectedGroup.group_id),
        new_name: groupName,
        company_id: loginResponse?.company_id || 0,
        user_id: loginResponse?.id || 0,
      });
      toast.success('Group renamed successfully');
      setGroupName('');
      setIsRenameDialogOpen(false);
      setSelectedGroup(null);
      fetchGroups();
    } catch (error) {
      toast.error('Failed to rename group');
    }
  };

  const handleDeleteGroup = async (group: Group) => {
    if (window.confirm(`Are you sure you want to delete "${group.group_name}"? This action cannot be undone.`)) {
      try {
        await deleteEcGroup({
          group_id: parseInt(group.group_id),
          company_id: loginResponse?.company_id || 0,
          user_id: loginResponse?.id || 0,
        });
        toast.success('Group deleted successfully');
        fetchGroups();
      } catch (error) {
        toast.error('Failed to delete group');
      }
    }
  };

  const openRenameDialog = (group: Group) => {
    setSelectedGroup(group);
    setGroupName(group.group_name);
    setIsRenameDialogOpen(true);
  };

  const handleCloseRenameDialog = () => {
    setIsRenameDialogOpen(false);
    setSelectedGroup(null);
    setGroupName('');
  };

  const handleCloseCreateDialog = () => {
    setIsCreateDialogOpen(false);
    setGroupName('');
  };

  const columns: GridColDef[] = [
    { field: 'group_name', headerName: 'Group Name', flex: 1 },
    { field: 'created_by', headerName: 'Created By', flex: 1 },
    {
      field: 'is_active',
      headerName: 'Status',
      flex: 0.5,
      renderCell: (params) => (
        <span className={`px-2 py-1 rounded ${params.value ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {params.value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      type: 'actions',
      flex: 0.5,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<Edit className="h-4 w-4" />}
          label="Edit"
          onClick={() => openRenameDialog(params.row)}
        />,
        <GridActionsCellItem
          icon={<Trash2 className="h-4 w-4" />}
          label="Delete"
          onClick={() => handleDeleteGroup(params.row)}
          className="text-red-600"
        />,
      ],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Group Management</h2>
          <p className="text-gray-600">Create and manage subscriber groups</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              Create Group
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Group</DialogTitle>
              <DialogDescription>
                Enter a name for your new subscriber group.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="groupName">Group Name</Label>
                <Input
                  id="groupName"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  placeholder="Enter group name..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={handleCloseCreateDialog}>
                Cancel
              </Button>
              <Button onClick={handleCreateGroup}>Create Group</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Data Grid */}
      <div style={{ height: 400, width: '100%' }}>
        <DataGrid
          rows={groups}
          columns={columns}
          loading={loading}
          getRowId={(row) => row.group_id}
          disableRowSelectionOnClick
          autoPageSize
        />
      </div>

      {/* Rename Dialog */}
      <Dialog open={isRenameDialogOpen} onOpenChange={handleCloseRenameDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Group</DialogTitle>
            <DialogDescription>
              Enter a new name for "{selectedGroup?.group_name}".
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="renameGroupName">Group Name</Label>
              <Input
                id="renameGroupName"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="Enter new group name..."
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseRenameDialog}>
              Cancel
            </Button>
            <Button onClick={handleRenameGroup}>Rename Group</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default GroupManagement;