import React, { useState } from 'react';
import { DataGrid, GridColDef } from '@mui/x-data-grid';
import Box from '@mui/material/Box';

interface Manager {
  id: number;
  first_name: string;
  last_name: string;
  username: string;
  email: string;
  company_id: number;
}

interface SalesManagerTableProps {
  manager: Manager[];
  loading: boolean;
  roleId: number;
  companyId: number;
  userId: number;
}

const SalesManagerTable = ({ manager, loading, roleId, companyId, userId }: SalesManagerTableProps) => {
  const [pageSize, setPageSize] = useState(10);

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
      field: 'first_name', 
      headerName: 'First Name',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <div className="font-medium">{params.value}</div>
      )
    },
    { 
      field: 'last_name', 
      headerName: 'Last Name',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <div className="font-medium">{params.value}</div>
      )
    },
    { 
      field: 'email', 
      headerName: 'Email',
      flex: 1.5,
      minWidth: 200,
      renderCell: (params) => (
        <div className="text-gray-600">{params.value}</div>
      )
    },
    {
      field: 'username',
      headerName: 'Username',
      flex: 1,
      minWidth: 150,
      renderCell: (params) => (
        <div className="text-gray-600">{params.value}</div>
      )
    }
  ];

  return (
    <Box sx={{ height: pageSize === 10 ? 650 : 'auto', width: '100%' }}>
      <DataGrid
        rows={manager}
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
                No managers found
              </p>
              <p style={{ fontSize: '0.875rem', marginTop: '0.25rem', margin: 0 }}>
                Try adjusting your filters or check back later
              </p>
            </Box>
          ),
        }}
      />
    </Box>
  );
}

export default SalesManagerTable