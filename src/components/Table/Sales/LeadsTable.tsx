import * as React from 'react';
import { useEffect, useState, useMemo } from 'react';
import { LeadsData } from '@/types';
import Box from '@mui/material/Box';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { useUserPermission } from '@/context/UserPermissionContext';
import { useApplicationContext } from '@/hooks/useApplicationContext';
import {
  logICP,
  updateInlineDropdown,
  getContractStages,
  getLeadLable,
  getLeadStatus,
  getIndustries,
  deleteCustomer,
  getUserPrefences,
} from "@/api";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { DollarSign, CheckCircle, Star, Users, Trash2 } from 'lucide-react';

interface LeadTableProps {
  data: LeadsData[];
  loading?: boolean;
  companyId: number;
  userId: number;
  onRefresh?: () => void;
  refreshTrigger?: number; // Add this to force refresh from parent
  paginationInfo?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  onPaginationChange?: (page: number, pageSize: number) => void;
}

// StatsCard component for displaying a stat with icon
const StatsCard = ({ icon, label, value, color = "#1976d2" }: 
  { icon: React.ReactNode; label: string; value: string | number; color?: string; }) => (
  <div className="bg-[#fffaf5] rounded-lg p-4 border border-gray-200 transition-all duration-200 shadow-md">
    <div className="flex items-center justify-between mb-4">
      <div className="p-3 bg-blue-50 rounded-lg">
        <div style={{ color }}>{icon}</div>
      </div>
    </div>
    <div>
      <div className="text-xs text-gray-500 font-bold">{label}</div>
      <div className="text-lg font-semibold text-gray-900">{value}</div>
    </div>
  </div>
);

const LeadsTable: React.FC<LeadTableProps> = ({ 
  data, 
  companyId,
  userId,
  loading = false,
  onRefresh,
  refreshTrigger = 0,
  paginationInfo,
  onPaginationChange
}) => {
  const navigate = useNavigate();
  const { hasAccess } = useUserPermission();
  const { loginResponse } = useApplicationContext();
  const [pageSize, setPageSize] = useState(paginationInfo?.pageSize || 10);
  const [currentPage, setCurrentPage] = useState((paginationInfo?.page || 1) - 1); // DataGrid uses 0-based indexing
  const [leadsData, setLeadsData] = useState(data);
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
  
  // Dropdown options
  const [industryOptions, setIndustryOptions] = useState<any[]>([]);
  const [contractStageOptions, setContractStageOptions] = useState<any[]>([]);
  const [funnelStageOptions, setFunnelStageOptions] = useState<any[]>([]);
  const [statusOptions, setStatusOptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const hasWritePermission = hasAccess("write");
  const isSuperAdmin = hasAccess("superadmin");
  const hasDeletePermission = hasAccess("data_delete");

  // Update leadsData when data prop changes
  useEffect(() => {
    setLeadsData(data);
  }, [data]);

  // Fetch dropdown values
  useEffect(() => {
    const fetchDropdownValues = async () => {
      setIsLoading(true);
      try {
        const [contractStages, leadLabels, leadStatuses, industries] = await Promise.all([
          getContractStages({ company_id: companyId }),
          getLeadLable({ company_id: companyId }),
          getLeadStatus({ company_id: companyId }),
          getIndustries({ company_id: companyId }),
        ]);
        setContractStageOptions(contractStages.filter((stage: any) => stage.is_active === 1));
        setFunnelStageOptions(leadLabels.filter((label: any) => label.is_active === 1));
        setStatusOptions(leadStatuses.filter((status: any) => status.is_active === 1));
        setIndustryOptions(industries.filter((industry: any) => industry.is_active === 1));
      } catch (error) {
        console.error("Error fetching dropdown values:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (hasWritePermission || isSuperAdmin) {
      fetchDropdownValues();
    }
  }, [companyId, hasWritePermission, isSuperAdmin]);

  // Fetch and apply user preferences - FIXED
  const fetchAndApplyPreferences = async () => {
    if (!loginResponse?.id) return;
    
    try {
      const userPref = await getUserPrefences({
        user_id: loginResponse.id
      });

      const userPrefJson = JSON.parse(userPref.preference || '{}');
      const leadsTablePrefs = userPrefJson?.leads_table;
      
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
  }, [loginResponse?.id, refreshTrigger]);

  const handleICPChange = async (checked: boolean, record: LeadsData) => {
    try {
      await logICP({
        is_icp: checked ? 1 : 0,
        company_id: companyId,
        lead_id: record.id
      });
      toast.success('ICP status updated successfully');

      setLeadsData((prevData) =>
        prevData.map((lead) =>
          lead.id === record.id ? { ...lead, is_icp: checked ? 1 : 0 } : lead
        )
      );
    } catch (error) {
      toast.error('Failed to update ICP status');
      console.error('Error updating ICP:', error);
    }
  };

  const handleDropdownChange = async (colName: string, value: number, leadId: number) => {
    try {
      await updateInlineDropdown({
        col_name: `${colName.toLowerCase()}_id`,
        value,
        user_id: userId,
        company_id: companyId,
        lead_id: leadId,
      });

      setLeadsData(prevData =>
        prevData.map(lead => {
          if (lead.id === leadId) {
            return {
              ...lead,
              [colName]: value,
              ...(colName === 'industry' && {
                industry_name: industryOptions.find((opt: any) => opt.id === value)?.industry
              }),
              ...(colName === 'contract_stage' && {
                contract_stage_name: contractStageOptions.find((opt: any) => opt.id === value)?.stage
              }),
              ...(colName === 'status' && {
                status_name: statusOptions.find((opt: any) => opt.id === value)?.status
              }),
              ...(colName === 'lable' && {
                label_name: funnelStageOptions.find((opt: any) => opt.id === value)?.lable
              })
            };
          }
          return lead;
        })
      );
      toast.success(`${colName} updated successfully`);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      toast.error(`Failed to update ${colName}`);
      console.error(`Error updating ${colName}:`, error);
    }
  };

  const handleDelete = async (lead: LeadsData) => {
    if (window.confirm(`Are you sure you want to delete ${lead.account_name}?`)) {
      try {
        await deleteCustomer({
          user_id: userId,
          lead_id: lead.id,
          is_active: 0,
          is_deleted: 1,
          company_id: companyId,
        });

        setLeadsData(prevData => prevData.filter(l => l.id !== lead.id));
        toast.success('Lead deleted successfully');

        if (onRefresh) {
          onRefresh();
        }
      } catch (error) {
        console.error('Error deleting lead:', error);
        toast.error('Failed to delete lead');
      }
    }
  };

  const handleViewDetails = (id: number) => {
    navigate(`/sales/account/${id}`);
  };

  const handlePaginationModelChange = (model: { page: number; pageSize: number }) => {
    const newPage = model.page + 1; // Convert to 1-based indexing for API
    const newPageSize = model.pageSize;
    
    setPageSize(newPageSize);
    setCurrentPage(model.page);
    
    if (onPaginationChange) {
      onPaginationChange(newPage, newPageSize);
    }
  };

  const columns: GridColDef<LeadsData>[] = useMemo(() => [
    {
      field: 'account_name',
      headerName: 'Company',
      width: 250,
      renderCell: (params) => {
        const firstChar = (params.value || '').trim().charAt(0).toUpperCase() || '?';
        const displayName = (params.value && params.value.length > 30)
          ? params.value.slice(0, 27) + '...'
          : params.value;

        return (
          <div
            onClick={() => handleViewDetails(params.row.id)}
            className="flex items-center space-x-3 cursor-pointer hover:text-blue-600 transition-colors"
            title={params.value}
          >
            <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
              {firstChar}
            </div>
            <span className="font-medium truncate">
              {displayName}
            </span>
          </div>
        );
      },
      sortable: false,
    },
    {
      field: 'contact_name',
      headerName: 'Contact Name',
      width: 150,
      sortable: false,
    },
    {
      field: 'email',
      headerName: 'Email',
      width: 200,
      sortable: false,
    },
    {
      field: 'linkedin',
      headerName: 'LinkedIn',
      width: 150,
      sortable: false,
    },
    {
      field: 'website',
      headerName: 'Website',
      width: 150,
      sortable: false,
    },
    {
      field: 'city',
      headerName: 'City',
      width: 110,
      sortable: false,
    },
    {
      field: 'state',
      headerName: 'State',
      width: 110,
      sortable: false,
    },
    {
      field: 'country',
      headerName: 'Country',
      width: 110,
      sortable: false,
    },
    {
      field: 'industry',
      headerName: 'Industry',
      width: 170,
      renderCell: (params) => {
        const industryId = params.row.industry_id || 
          industryOptions.find((opt: any) => opt.industry === params.value)?.id;
        
        return (
          <div className="flex justify-center w-full items-center mt-2">
            <Select
              disabled={!(hasWritePermission || isSuperAdmin)}
              value={industryId?.toString() || ''}
              onValueChange={(value) => handleDropdownChange("industry", Number(value), params.row.id)}
            >
              <SelectTrigger className="w-full h-8">
                <SelectValue placeholder="Select Industry" />
              </SelectTrigger>
              <SelectContent>
                {industryOptions.map((option: any) => (
                  <SelectItem key={option.id} value={option.id.toString()}>
                    {option.industry}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      },
      sortable: false,
    },
    {
      field: 'lead_owner',
      headerName: 'Lead Owner',
      width: 130,
      sortable: false,
    },
    {
      field: 'product_name',
      headerName: 'Product Name',
      width: 150,
      sortable: false,
    },
    {
      field: 'contract_stage',
      headerName: 'Contract Stage',
      width: 180,
      renderCell: (params) => {
        const contractStageId = params.row.contract_stage_id || 
          contractStageOptions.find((opt: any) => opt.stage === params.value)?.id;
        
        return (
          <div className="flex justify-center w-full items-center mt-2">
          <Select
            disabled={!(hasWritePermission || isSuperAdmin)}
            value={contractStageId?.toString() || ''}
            onValueChange={(value) => handleDropdownChange("contract_stage", Number(value), params.row.id)}
          >
            <SelectTrigger className="w-full h-8">
              <SelectValue placeholder="Select Stage" />
            </SelectTrigger>
            <SelectContent>
              {contractStageOptions.map((option: any) => (
                <SelectItem key={option.id} value={option.id.toString()}>
                  {option.stage}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>
        );
      },
      sortable: false,
    },
    {
      field: 'proposed_arr',
      headerName: 'Proposed ARR',
      width: 130,
      type: 'number',
      sortable: false,
    },
    {
      field: 'contract_arr',
      headerName: 'Contract ARR',
      width: 130,
      type: 'number',
      sortable: false,
    },
    {
      field: 'lead_source',
      headerName: 'Lead Source',
      width: 120,
      sortable: false,
    },
    {
      field: 'is_icp',
      headerName: 'ICP',
      width: 80,
      renderCell: (params) => (
        <Switch
          disabled={!(hasWritePermission || isSuperAdmin)}
          checked={!!params.value}
          onCheckedChange={(checked) => handleICPChange(checked, params.row)}
          onClick={(e) => e.stopPropagation()}
        />
      ),
      sortable: false,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 170,
      renderCell: (params) => {
        const statusId = params.row.status_id || 
          statusOptions.find((opt: any) => opt.status === params.value)?.id;
        
        return (
          <div className="flex justify-center w-full items-center mt-2">
          <Select
            disabled={!(hasWritePermission || isSuperAdmin)}
            value={statusId?.toString() || ''}
            onValueChange={(value) => handleDropdownChange("status", Number(value), params.row.id)}
          >
            <SelectTrigger className="w-full h-8">
              <SelectValue placeholder="Select Status" />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((option: any) => (
                <SelectItem key={option.id} value={option.id.toString()}>
                  {option.status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>
        );
      },
      sortable: false,
    },
    {
      field: 'lable',
      headerName: 'Label',
      width: 150,
      renderCell: (params) => {
        const labelId = params.row.lable_id || 
          funnelStageOptions.find((opt: any) => opt.lable === params.value)?.id;
        
        return (
          <div className="flex justify-center w-full items-center mt-2">
          <Select
            disabled={!(hasWritePermission || isSuperAdmin)}
            value={labelId?.toString() || ''}
            onValueChange={(value) => handleDropdownChange("lable", Number(value), params.row.id)}
          >
            <SelectTrigger className="w-full h-8">
              <SelectValue placeholder="Select Label" />
            </SelectTrigger>
            <SelectContent>
              {funnelStageOptions.map((option: any) => (
                <SelectItem key={option.id} value={option.id.toString()}>
                  {option.lable}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>
        );
      },
      sortable: false,
    },
    {
      field: 'created_by',
      headerName: 'Created By',
      width: 130,
      sortable: false,
    },
    {
      field: 'updated_by',
      headerName: 'Updated By',
      width: 130,
      sortable: false,
    },
    {
      field: 'created_at',
      headerName: 'Created At',
      width: 130,
      sortable: true,
    },
    {
      field: 'updated_at',
      headerName: 'Updated At',
      width: 130,
      sortable: true,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
      renderCell: (params) => (
        <div className="flex items-center gap-2">
          {(isSuperAdmin || hasDeletePermission) && (
            <Button
              variant="destructive"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                handleDelete(params.row);
              }}
              className="h-7 w-7 p-0"
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          )}
        </div>
      ),
      sortable: false,
    }
  ], [navigate, industryOptions, contractStageOptions, funnelStageOptions, statusOptions, hasWritePermission, isSuperAdmin, hasDeletePermission]);

  // Calculate statistics
  const stats = useMemo(() => {
    const totalLeads = leadsData.length;
    const totalARR = leadsData.reduce((sum, lead) => sum + (Number(lead.proposed_arr) || 0), 0);
    const icpLeads = leadsData.filter(lead => lead.is_icp).length;
    const totalWon = leadsData.filter(lead => lead.status?.toLowerCase().includes('won')).length;
    
    return { totalLeads, totalARR, icpLeads, totalWon };
  }, [leadsData]);

  return (
    <div className="">
      {/* Stats Card Row */}
      <div className="grid grid-cols-4 gap-4 mb-2">
        <StatsCard
          icon={<Users />}
          label="Total Leads"
          value={stats.totalLeads}
          color="#1976d2"
        />
        <StatsCard
          icon={<DollarSign />}
          label="Total Proposed ARR"
          value={stats.totalARR.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
          color="#388e3c"
        />
        <StatsCard
          icon={<Star />}
          label="ICP Leads"
          value={stats.icpLeads}
          color="#fbc02d"
        />
        <StatsCard
          icon={<CheckCircle />}
          label="Total Won"
          value={stats.totalWon}
          color="#0288d1"
        />
      </div>

      <Box sx={{ height: pageSize === 10 ? 650 : 'auto', width: '100%' }}>
        <DataGrid
          rows={leadsData}
          columns={columns}
          loading={loading || isLoading}
          pagination
          paginationMode="server"
          rowCount={paginationInfo?.total || 0}
          paginationModel={{ page: currentPage, pageSize: pageSize }}
          pageSizeOptions={[10, 25, 50, 100]}
          onPaginationModelChange={handlePaginationModelChange}
          checkboxSelection={false}
          disableRowSelectionOnClick
          columnVisibilityModel={columnVisibilityModel}
          slots={{
            noRowsOverlay: () => (
              <Box
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: '#6b7280',
                }}
              >
                <p style={{ fontSize: '1.125rem', fontWeight: 500, margin: 0 }}>
                  No leads found
                </p>
                <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', margin: 0 }}>
                  Try adjusting your filters or check back later
                </p>
              </Box>
            ),
          }}
        />
      </Box>
    </div>
  );
};

export default LeadsTable;