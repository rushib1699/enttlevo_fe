import React, { useEffect, useState } from 'react';
import { assignLead, getSalesUnassignedLeads, getUserPrefences } from '@/api';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
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
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface UnassignedSale {
  id: number;
  account_name: string;
  contact_name: string;
  linkedin: string;
  email: string;
  website: string;
  industry: string;
  product_name: string;
  account_status_id: number;
  mib: string | null;
  address: string | null;
  proposed_arr: number | null;
  contract_arr: number | null;
  lead_source: string;
  is_icp: number;
  city: string | null;
  state: string | null;
  country: string | null;
  contract_value: number | null;
  contract_duration: string | null;
  contract_stage: string;
  funnel_stage: string;
  created_by: string;
  updated_by: string;
  lead_owner: string;
  status: string;
  lable: string;
  account_status: string;
  contract_type: string;
  timezone: string;
  created_at: string;
  updated_at: string;
}

interface PaginationInfo {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

interface UnassignedSalesTableProps {
  team: any[];
  roleId: number;
  companyId: number;
  userId: number;
  refreshTrigger?: number;
}

const UnassignedSalesTable: React.FC<UnassignedSalesTableProps> = ({ team, roleId, companyId, userId, refreshTrigger = 0 }) => {
  const navigate = useNavigate();
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(0);
  const [unassignedSalesData, setUnassignedSalesData] = useState<UnassignedSale[]>([]);
  const [paginationInfo, setPaginationInfo] = useState<PaginationInfo>({
    total: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0
  });
  const [selectedManager, setSelectedManager] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<UnassignedSale | null>(null);
  const [assignLoading, setAssignLoading] = useState(false);
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});

  const fetchUnassignedSalesData = async (page: number = 1, size: number = 10) => {
    setLoading(true);
    try {
      const response = await getSalesUnassignedLeads({
        filters: [],
        company_id: companyId,
        user_id: userId,
        role_id: roleId,
        type: 'sales',
        page: page,
        pageSize: size
      });
      
      if (response && response.data && response.pagination) {
        setUnassignedSalesData(response.data);
        setPaginationInfo(response.pagination);
        setCurrentPage(page - 1); // DataGrid uses 0-based indexing
      } else {
        // Fallback for old API response format
        setUnassignedSalesData(response || []);
        setPaginationInfo({
          total: response?.length || 0,
          page: page,
          pageSize: size,
          totalPages: Math.ceil((response?.length || 0) / size)
        });
      }
    } catch (error) {
      console.error('Error fetching unassigned sales data:', error);
      toast.error('Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchUnassignedSalesData(1, pageSize);
  }, [refreshTrigger]);

  const handleAssignToMe = async () => {
    if (!selectedLead) return;
    setAssignLoading(true);
    try {
      await assignLead({
        user_id: userId,
        assign_to: userId,
        lead_id: selectedLead.id,
        company_id: companyId
      });
      toast.success(`Lead assigned to you successfully ${selectedLead.account_name} to ${userId}`);
      fetchUnassignedSalesData(currentPage + 1, pageSize);
    } catch (error) {
      console.error('Error assigning lead to you:', error);
      toast.error("Failed to assign lead to you");
    } finally {
      setAssignLoading(false);
      setSelectedLead(null);
    }
  }

  const handleAssignLead = async () => {
    if (!selectedManager || !selectedLead) return;

    setAssignLoading(true);
    try {
      await assignLead({
        user_id: userId,
        assign_to: selectedManager,
        lead_id: selectedLead.id,
        company_id: companyId
      });
      setIsDialogOpen(false);
      toast.success(`Lead assigned successfully ${selectedLead.account_name}`);
      // Refresh current page after assignment
      fetchUnassignedSalesData(currentPage + 1, pageSize);
    } catch (error) {
      console.error('Error assigning lead:', error);
      //toast.error("Failed to assign lead");
    } finally {
      setAssignLoading(false);
      setSelectedManager(null);
      setSelectedLead(null);
    }
  };

  const handlePaginationModelChange = (model: { page: number; pageSize: number }) => {
    const newPage = model.page + 1; // Convert to 1-based indexing for API
    const newPageSize = model.pageSize;
    
    setPageSize(newPageSize);
    fetchUnassignedSalesData(newPage, newPageSize);
  };

  const handleAssignClick = (record: any) => {
    setSelectedLead(record);
    setIsDialogOpen(true);
  };

  // Fetch and apply user preferences - FIXED
  const fetchAndApplyPreferences = async () => {
    if (!userId) return;
    
    try {
      const userPref = await getUserPrefences({
        user_id: userId
      });

      const userPrefJson = JSON.parse(userPref.preference || '{}');
      const leadsTablePrefs = userPrefJson?.unassigned_sales_table;
      
      //console.log('Raw leads table prefs:', leadsTablePrefs);
      
      // FIXED: Handle double nesting issue
      let columnModel = leadsTablePrefs?.columnVisibilityModel;
      
      // If there's another columnVisibilityModel nested inside, use that
      if (columnModel && typeof columnModel === 'object' && columnModel.columnVisibilityModel) {
        columnModel = columnModel.columnVisibilityModel;
      }
      
      //console.log('Extracted column model:', columnModel);
      
      // Apply the column visibility model to DataGrid
      if (columnModel && typeof columnModel === 'object') {
        setColumnVisibilityModel(columnModel);
      } else {
        setColumnVisibilityModel({});
      }
    } catch (error) {
      console.error('Failed to load user preferences:', error);
    }
  };

  // Load preferences on component mount and when refreshTrigger changes
  useEffect(() => {
    fetchAndApplyPreferences();
  }, [userId, refreshTrigger]);

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

  const handleNavigationToDetails = (record: any) => {
    navigate(`/sales/account/${record.id}`);
  }

  const columns: GridColDef[] = [
    { field: 'action', headerName: 'Action', width: 120, renderCell: (params: { row: any; }) => (
      <Button
        variant="default"
        size="sm"
        onClick={(e) => {
          e.stopPropagation();
          handleAssignClick(params.row);
        }}
      >
        Assign
      </Button>
    )},
    { field: 'id', headerName: 'ID', width: 100 },
    {  field: 'account_name',
       headerName: 'Account Name', 
       width: 200,
       renderCell: (params: { row: any; }) => (
        <button

          onClick={(e) => {
            e.stopPropagation();
            handleNavigationToDetails(params.row);
          }}
        >
          {params.row.account_name}
        </button>
      )
    },
    { field: 'contact_name', headerName: 'Contact Name', width: 150 }, 
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'phone', headerName: 'Phone', width: 150 },
    { field: 'industry', headerName: 'Industry', width: 150 },
    { field: 'product_name', headerName: 'Product', width: 150 },
    { field: 'status', headerName: 'Status', width: 120 },
    { field: 'lable', headerName: 'Label', width: 120 },
    { field: 'lead_source', headerName: 'Lead Source', width: 150 },
    { field: 'created_at', headerName: 'Created At', width: 180 },
    { field: 'updated_at', headerName: 'Updated At', width: 180 },
    { field: 'address', headerName: 'Address', width: 200 },
    { field: 'city', headerName: 'City', width: 150 },
    { field: 'state', headerName: 'State', width: 150 },
    { field: 'country', headerName: 'Country', width: 150 },
    { field: 'postal_code', headerName: 'Postal Code', width: 120 },
    { field: 'company_size', headerName: 'Company Size', width: 150 },
    { field: 'annual_revenue', headerName: 'Annual Revenue', width: 150 },
    { field: 'website', headerName: 'Website', width: 200 },
    { field: 'description', headerName: 'Description', width: 300 },
  ];

  return (
    <>
      <div style={{ height: pageSize === 10 ? 650 : 'auto', width: '100%' }}>
        <DataGrid
          rows={unassignedSalesData}
          columns={columns}
          loading={loading}
          columnVisibilityModel={columnVisibilityModel}
          checkboxSelection={false}
          pagination
          paginationMode="server"
          rowCount={paginationInfo.total}
          paginationModel={{ page: currentPage, pageSize: pageSize }}
          pageSizeOptions={[10, 25, 50, 100]}
          onPaginationModelChange={handlePaginationModelChange}
          disableRowSelectionOnClick
        />
      </div>

      <Dialog 
        open={isDialogOpen} 
        onOpenChange={(open) => {
          setIsDialogOpen(open);
          if (!open) {
            setSelectedManager(null);
            setSelectedLead(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Lead</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <Select
              value={selectedManager?.toString()}
              onValueChange={(value) => setSelectedManager(Number(value))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {team.map((member) => (
                  <SelectItem key={member.id} value={member.id.toString()}>
                    {member.first_name} {member.last_name} - ({member.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            
            <Button 
              variant="default"
              onClick={handleAssignLead}
              disabled={!selectedManager || assignLoading}
            >
              {assignLoading ? 'Assigning...' : 'Assign'}
            </Button>

            <Button 
              variant="default" 
              onClick={handleAssignToMe} 
              disabled={assignLoading || !selectedLead || selectedManager !== null}
            >
                {assignLoading ? 'Assigning...' : 'Assign to Me'}
            </Button>

            <Button
              variant="outline"
              onClick={() => {
                setIsDialogOpen(false);
                setSelectedManager(null);
                setSelectedLead(null);
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

export default UnassignedSalesTable