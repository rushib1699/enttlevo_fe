import React, { useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { getObTeamByCompanyId, assignObManager } from '@/api';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface UnassignedOB {
  id: number;
  name: string;
  support_email: string;
  website: string;
  linkedin: string;
  live_date: string | null;
  handoff_date: string | null;
  transfer_date: string | null;
  contract_start_date: string | null;
  contract_close_date: string | null;
  balance: number;
  contract_value: number;
  arr: number;
  contract_duration: number;
  mrr: number;
  am: string;
  om: string;
  status: string;
  contract_type: string;
  previous_platform: string;
  timezone: string;
  accounting_software: string;
  is_unassigned: number;
}

interface UnassignedOBTableProps {
  data: UnassignedOB[];
  loading: boolean;
  roleId: number;
  companyId: number;
  userId: number;
  onRefresh: () => void;
}

const UnassignedOBTable: React.FC<UnassignedOBTableProps> = ({ data, loading, companyId, userId, onRefresh }) => {
  const [pageSize, setPageSize] = useState(10);
  const [currentRecord, setCurrentRecord] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [managers, setManagers] = useState<any[]>([]);
  const [selectedManager, setSelectedManager] = useState<number | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);

  const handleAssignClick = async (record: any) => {
    setCurrentRecord(record);
    setIsModalOpen(true);
    
    try {
      const response = await getObTeamByCompanyId({ company_id: companyId });
      const managersData = response.map((manager: any) => ({
        id: manager.id,
        first_name: manager.first_name,
        last_name: manager.last_name,
        name: `${manager.first_name} ${manager.last_name}`
      }));
      setManagers(managersData);
    } catch (error) {
      console.error('Error fetching managers:', error);
      toast.error('Failed to fetch managers');
    }
  };

  const handleAssignToMe = async () => {
    if (!currentRecord) return;
    setAssignLoading(true);
    try {
      await assignObManager({
        user_id: userId,
        ob_manager_id: userId,
        company_customer_id: currentRecord.id,
        company_id: companyId,
      });
      setIsModalOpen(false);
      setSelectedManager(null);
      toast.success('Owner assigned to you successfully');
      onRefresh?.();
    } catch (error) {
      console.error('Error assigning owner to you:', error);
      toast.error('Failed to assign owner to you');
    } finally {
      setAssignLoading(false);
      setCurrentRecord(null);
    }
  }


  const handleAssignManager = async () => {
    if (!selectedManager || !currentRecord) return;
    
    setAssignLoading(true);
    try {
      await assignObManager({
        user_id: userId,
        ob_manager_id: selectedManager,
        company_customer_id: currentRecord.id,
        company_id: companyId,
      });
      setIsModalOpen(false);
      setSelectedManager(null);
      toast.success('Owner assigned successfully');
      onRefresh?.();
    } catch (error) {
      console.error('Error assigning manager:', error);
      //toast.error('Failed to assign manager');
    } finally {
      setAssignLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <div className="flex flex-col items-center gap-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <div className="text-gray-600 font-medium">Loading data...</div>
        </div>
      </div>
    );
  }

  const columns: GridColDef[] = [
    {
      field: 'actions',
      headerName: 'Actions',
      width: 140,
      renderCell: (params: { row: any; }) => (
        <Button
          variant="default"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            handleAssignClick(params.row);
          }}
        >
          <span className='rounded-lg'>
            Assign Owner
          </span>
        </Button>
      ),
      headerClassName: "table-header",
    },
    { field: 'name', headerName: 'Account Name', width: 200 },
    { field: 'support_email', headerName: 'Support Email', width: 200 },
    { field: 'website', headerName: 'Website', width: 200 },
    { field: 'linkedin', headerName: 'LinkedIn', width: 200 },
    { field: 'status', headerName: 'Status', width: 120 },
    { field: 'contract_type', headerName: 'Contract Type', width: 120 },
    { field: 'contract_value', headerName: 'Contract Value', width: 130, type: 'number' },
    { field: 'contract_duration', headerName: 'Duration (months)', width: 130, type: 'number' },
    { field: 'arr', headerName: 'ARR', width: 120, type: 'number' },
    { field: 'mrr', headerName: 'MRR', width: 120, type: 'number' },
    { field: 'balance', headerName: 'Balance', width: 120, type: 'number' },
    { field: 'am', headerName: 'Account Manager', width: 150 },
    { field: 'om', headerName: 'Onboarding Manager', width: 150 },
    { field: 'timezone', headerName: 'Timezone', width: 100 },
    { field: 'previous_platform', headerName: 'Previous Platform', width: 150 },
    { field: 'accounting_software', headerName: 'Accounting Software', width: 150 },
    // { field: 'live_date', headerName: 'Go Live Date', width: 150, type: 'date' },
    // { field: 'handoff_date', headerName: 'Handoff Date', width: 150, type: 'date' },
    // { field: 'transfer_date', headerName: 'Transfer Date', width: 150, type: 'date' },
    // { field: 'contract_start_date', headerName: 'Contract Start', width: 150, type: 'date' },
    // { field: 'contract_close_date', headerName: 'Contract End', width: 150, type: 'date' },
  ];

  return (
    <>
      <div style={{ height: pageSize === 10 ? 650 : 'auto', width: '100%' }}>
        <DataGrid
          rows={data}
          columns={columns}
          loading={loading}
          checkboxSelection={false}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: pageSize,
              },
            },
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          onPaginationModelChange={(model) => setPageSize(model.pageSize)}
          disableRowSelectionOnClick
        />
      </div>

      <Dialog open={isModalOpen} 
      onOpenChange={(open) => {
        setIsModalOpen(open);
        if (!open) {
          setSelectedManager(null);
          setCurrentRecord(null);
        }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Manager</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <Select
              value={selectedManager?.toString()}
              onValueChange={(value) => setSelectedManager(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a manager" />
              </SelectTrigger>
              <SelectContent>
                {managers.map((manager) => (
                  <SelectItem key={manager.id} value={manager.id.toString()}>
                    {manager.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button 
              variant="default"
              onClick={handleAssignManager}
              disabled={!selectedManager || assignLoading}
            >
              {assignLoading ? 'Assigning...' : 'Assign'}
            </Button>

            <Button 
              variant="default"
              onClick={handleAssignToMe}
              disabled={assignLoading || !currentRecord || selectedManager !== null}
            >
              {assignLoading ? 'Assigning...' : 'Assign to Me'}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                setSelectedManager(null);
                setCurrentRecord(null);
              }}
              disabled={assignLoading}
            >
              Cancel
            </Button>
            
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default UnassignedOBTable