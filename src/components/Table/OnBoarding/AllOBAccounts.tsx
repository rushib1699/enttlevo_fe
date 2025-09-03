import * as React from 'react';
import { useEffect, useState, useMemo } from 'react';
import { CompaniesListType } from '@/types';
import Box from '@mui/material/Box';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import { useNavigate } from 'react-router-dom';
import { useApplicationContext } from '@/hooks/useApplicationContext';
import { getUserPrefences } from "@/api";
import { DollarSign, CheckCircle, Star, Users } from 'lucide-react';

interface AllOBAccountsProps {
  data: CompaniesListType[];
  loading?: boolean;
  refreshTrigger?: number;
}

const StatsCard = ({ icon, label, value, color = "#1976d2" }: 
  { icon: React.ReactNode; label: string; value: string | number; color?: string; }) => (
  <div className="bg-[#fffaf5] rounded-lg p-4 border border-gray-200 transition-all duration-200">
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

const AllOBAccounts: React.FC<AllOBAccountsProps> = ({ 
  data, 
  loading = false,
  refreshTrigger = 0
}) => {
  const navigate = useNavigate();
  const { loginResponse } = useApplicationContext();
  const [pageSize, setPageSize] = useState(10);
  const [accountsData, setAccountsData] = useState(data);
  const [columnVisibilityModel, setColumnVisibilityModel] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    setAccountsData(data);
  }, [data]);

  const fetchAndApplyPreferences = async () => {
    if (!loginResponse?.id) return;
    
    try {
      const userPref = await getUserPrefences({
        user_id: loginResponse.id
      });

      const userPrefJson = JSON.parse(userPref.preference || '{}');
      const onboardingAccountsTablePrefs = userPrefJson?.onboarding_accounts_table;
      
      let columnModel = onboardingAccountsTablePrefs?.columnVisibilityModel;
      
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

  useEffect(() => {
    fetchAndApplyPreferences();
  }, [loginResponse?.id, refreshTrigger]);

  const handleViewDetails = (id: number) => {
    navigate(`/onboarding/account/${id}`);
  };

  const columns: GridColDef[] = useMemo(() => [
    {
      field: 'name',
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
      field: 'support_email',
      headerName: 'Support Email',
      width: 200,
      sortable: false,
    },
    {
      field: 'contract_value',
      headerName: 'Contract Value',
      width: 150,
      type: 'number',
      sortable: false,
    },
    {
      field: 'arr',
      headerName: 'ARR',
      width: 130,
      type: 'number',
      sortable: false,
    },
    {
      field: 'mrr',
      headerName: 'MRR',
      width: 130,
      type: 'number',
      sortable: false,
    },
    {
      field: 'am',
      headerName: 'Account Manager',
      width: 150,
      sortable: false,
    },
    {
      field: 'om',
      headerName: 'Operations Manager',
      width: 150,
      sortable: false,
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      sortable: false,
    },
    {
      field: 'contract_type',
      headerName: 'Contract Type',
      width: 130,
      sortable: false,
    },
    {
      field: 'timezone',
      headerName: 'Timezone',
      width: 110,
      sortable: false,
    }
  ], [navigate]);

  const stats = useMemo(() => {
    const totalAccounts = accountsData.length;
    const totalARR = accountsData.reduce((sum, account) => sum + (Number(account.arr) || 0), 0);
    const liveAccounts = accountsData.filter(account => account.status === 'Live').length;
    const onboardingAccounts = accountsData.filter(account => account.status === 'Onboarding').length;
    
    return { totalAccounts, totalARR, liveAccounts, onboardingAccounts };
  }, [accountsData]);

  return (
    <div className="">
      <div className="grid grid-cols-4 gap-4 mb-2">
        <StatsCard
          icon={<Users />}
          label="Total Accounts"
          value={stats.totalAccounts}
          color="#1976d2"
        />
        <StatsCard
          icon={<DollarSign />}
          label="Total ARR"
          value={stats.totalARR.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 })}
          color="#388e3c"
        />
        <StatsCard
          icon={<Star />}
          label="Live Accounts"
          value={stats.liveAccounts}
          color="#fbc02d"
        />
        <StatsCard
          icon={<CheckCircle />}
          label="Onboarding"
          value={stats.onboardingAccounts}
          color="#0288d1"
        />
      </div>

      <Box sx={{ height: pageSize === 10 ? 650 : 'auto', width: '100%' }}>
        <DataGrid
          rows={accountsData}
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
                  No accounts found
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

export default AllOBAccounts;