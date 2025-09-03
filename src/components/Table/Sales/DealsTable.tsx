import * as React from 'react';
import { useEffect, useState, useMemo } from 'react';
import { DealsData, LeadsData } from '@/types';
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
import { Trash2, Lock } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DealsTableProps {
  data: DealsData[];
  loading?: boolean;
  companyId: number;
  userId: number;
  onRefresh?: () => void;
  refreshTrigger?: number;
}

const DealsTable: React.FC<DealsTableProps> = ({ 
  data, 
  companyId,
  userId,
  loading = false,
  onRefresh,
  refreshTrigger = 0
}) => {
  const navigate = useNavigate();
  const { hasAccess } = useUserPermission();
  const { loginResponse } = useApplicationContext();
  const [pageSize, setPageSize] = useState(10);
  const [dealsData, setDealsData] = useState(data);
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

  console.log(dealsData);

  // Update leadsData when data prop changes
  useEffect(() => {
    setDealsData(data);
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

  // Fetch and apply user preferences
  const fetchAndApplyPreferences = async () => {
    if (!loginResponse?.id) return;
    
    try {
      const userPref = await getUserPrefences({
        user_id: loginResponse.id
      });

      const userPrefJson = JSON.parse(userPref.preference || '{}');
      const dealsTablePrefs = userPrefJson?.deals_table;
      
      let columnModel = dealsTablePrefs?.columnVisibilityModel;
      
      if (columnModel && typeof columnModel === 'object' && columnModel.columnVisibilityModel) {
        columnModel = columnModel.columnVisibilityModel;
      }
      
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
    if (record.sent_to_ob === 1) return;
    
    try {
      await logICP({
        is_icp: checked ? 1 : 0,
        company_id: companyId,
        lead_id: record.id
      });
      toast.success('ICP status updated successfully');

      setDealsData((prevData) =>
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
    const lead = dealsData.find(d => d.id === leadId);
    if (lead?.sent_to_ob === 1) return;
    
    try {
      await updateInlineDropdown({
        col_name: `${colName.toLowerCase()}_id`,
        value,
        user_id: userId,
        company_id: companyId,
        lead_id: leadId,
      });

      setDealsData(prevData =>
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
    if (lead.sent_to_ob === 1) return;
    
    if (window.confirm(`Are you sure you want to delete ${lead.account_name}?`)) {
      try {
        await deleteCustomer({
          user_id: userId,
          lead_id: lead.id,
          is_active: 0,
          is_deleted: 1,
          company_id: companyId,
        });

        setDealsData(prevData => prevData.filter(l => l.id !== lead.id));
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

  const columns: GridColDef<DealsData>[] = useMemo(() => [
    {
      field: 'account_name',
      headerName: 'Company',
      width: 250,
      renderCell: (params) => {
        const firstChar = (params.value || '').trim().charAt(0).toUpperCase() || '?';
        const displayName = (params.value && params.value.length > 30)
          ? params.value.slice(0, 27) + '...'
          : params.value;

        const content = (
          <div
            onClick={() => handleViewDetails(params.row.id)}
            className={`mt-1 flex items-center space-x-2 cursor-pointer group transition-all duration-300 ease-in-out hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 p-2 -m-2 border border-transparent ${
              params.row.sent_to_ob === 1 
                ? 'bg-gradient-to-r from-gray-50 to-gray-100 border-gray-200 rounded-lg opacity-80' 
                : ''
            }`}
            title={params.value}
          >
            <div className="relative flex-shrink-0">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm transition-all duration-300 ease-in-out ${
                params.row.sent_to_ob === 1 
                  ? 'bg-gradient-to-br from-gray-200 to-gray-300 text-gray-600 shadow-sm' 
                  : 'bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-600 text-white group-hover:scale-105 group-hover:from-blue-600 group-hover:to-indigo-700'
              }`}>
                {firstChar}
              </div>
              {params.row.sent_to_ob === 1 && (
                <div className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 bg-gradient-to-br from-gray-300 to-gray-400 rounded-full border-2 border-white shadow-md">
                  <Lock className="h-2 w-2 text-gray-600" />
                </div>
              )}
            </div>
            <div className="flex flex-col min-w-0 flex-1 overflow-hidden">
              <span className={`font-bold text-sm truncate transition-all duration-300 ease-in-out ${
                params.row.sent_to_ob === 1 
                  ? 'text-gray-600' 
                  : 'text-gray-900 group-hover:text-blue-700 group-hover:translate-x-0.5'
              }`}>
                {displayName}
              </span>
            </div>
          </div>
        );

        return params.row.sent_to_ob === 1 ? (
          <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
            {content}
            </TooltipTrigger>
            <TooltipContent>This account is transferred to onboarding</TooltipContent>
          </Tooltip>
          </TooltipProvider>
        ) : content;
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
              disabled={!(hasWritePermission || isSuperAdmin) || params.row.sent_to_ob === 1}
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
            disabled={!(hasWritePermission || isSuperAdmin) || params.row.sent_to_ob === 1}
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
          disabled={!(hasWritePermission || isSuperAdmin) || params.row.sent_to_ob === 1}
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
            disabled={!(hasWritePermission || isSuperAdmin) || params.row.sent_to_ob === 1}
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
            disabled={!(hasWritePermission || isSuperAdmin) || params.row.sent_to_ob === 1}
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
          {(isSuperAdmin || hasDeletePermission) && !params.row.sent_to_ob && (
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

  return (
    <div className="">
      <Box sx={{ height: pageSize === 10 ? 650 : 'auto', width: '100%' }}>
        <DataGrid
          rows={dealsData}
          columns={columns}
          loading={loading || isLoading}
          initialState={{
            pagination: {
              paginationModel: {
                pageSize: pageSize,
              },
            },
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          onPaginationModelChange={(model) => setPageSize(model.pageSize)}
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

export default DealsTable;
